import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { investigationApi } from '../services/investigationApi';
import { documentApi } from '../services/documentApi';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTS = ['pdf', 'png', 'jpg', 'jpeg'];

export const NewInvestigationPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [caseRef, setCaseRef] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateAndAddFiles = (newFiles: File[]) => {
    setErrorMessage(null);
    const valid: File[] = [];

    for (const file of newFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTS.includes(ext)) {
        setErrorMessage(`File '${file.name}' has unsupported format .${ext}. Only PDF, PNG, and JPEG are supported.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`File '${file.name}' exceeds the 25MB intake limit.`);
        continue;
      }
      if (selectedFiles.some((f) => f.name === file.name && f.size === file.size)) {
        continue;
      }
      valid.push(file);
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide an investigation title.');
      return;
    }
    if (selectedFiles.length === 0) {
      setErrorMessage('Please stage at least one document to investigate.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // 1. Create Investigation Case
      const inv = await investigationApi.create({
        title: title.trim(),
        case_ref: caseRef.trim() || undefined,
        description: description.trim() || undefined,
      });

      // 2. Upload Documents
      await documentApi.upload(inv._id, selectedFiles);

      // 3. Trigger Forensic Pipeline
      await investigationApi.triggerAnalysis(inv._id);

      // 4. Navigate to live investigation workspace
      navigate(`/investigations/${inv._id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Intake failed. Please verify the backend service connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#243247] pb-6">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight text-[#F1F5F9]">
            New Investigation
          </h2>
          <p className="text-sm text-[#A7B4C7] mt-1">
            Create an investigation session and ingest related documents for cross-document forensic analysis
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Cancel
        </Button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-950/40 border border-[#EF4444]/40 rounded-[10px] flex items-start gap-3 text-xs text-[#EF4444]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identification */}
        <div className="bg-[#121B29] border border-[#243247] rounded-[10px] p-6 shadow-card space-y-4">
          <div className="border-b border-[#243247] pb-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A7B4C7]">
              1. Case Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#F1F5F9] mb-1.5">
                Investigation Title <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Subcontractor Invoice vs Bank Slip Audit"
                className="w-full text-sm px-3.5 py-2.5 rounded-[8px] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#F1F5F9] mb-1.5">
                Case Reference ID (Optional)
              </label>
              <input
                type="text"
                value={caseRef}
                onChange={(e) => setCaseRef(e.target.value)}
                placeholder="e.g. CASE-2026-0881"
                className="w-full text-sm px-3.5 py-2.5 rounded-[8px] font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F1F5F9] mb-1.5">
              Investigation Scope / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contextual details, suspicious indicators, or audit purpose..."
              className="w-full text-sm px-3.5 py-2.5 rounded-[8px] resize-none transition-colors"
            />
          </div>
        </div>

        {/* Section 2: Large Professional Upload Panel */}
        <div className="bg-[#121B29] border border-[#243247] rounded-[10px] p-6 shadow-card space-y-4">
          <div className="border-b border-[#243247] pb-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A7B4C7]">
              2. Document Intake
            </h3>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#243247] hover:border-[#20B8A6] bg-[#0D1420] transition-colors rounded-[10px] p-10 text-center cursor-pointer select-none"
          >
            <UploadCloud className="w-10 h-10 text-[#20B8A6] mx-auto mb-3" />
            <h4 className="text-base font-semibold text-[#F1F5F9]">
              Upload Documents
            </h4>
            <p className="text-xs text-[#A7B4C7] mt-1.5">
              Drag & drop files here or <span className="text-[#20B8A6] font-medium underline">Browse Files</span>
            </p>
            <p className="text-[11px] font-mono text-[#718096] mt-2">
              PDF • PNG • JPG (Max 25MB per file)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Staged Documents Table */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[#A7B4C7] font-semibold uppercase">
                  Staged Documents ({selectedFiles.length})
                </span>
                <span className="font-mono text-[#718096]">
                  Total: {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <div className="border border-[#243247] rounded-[8px] bg-[#0D1420] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#172235] border-b border-[#243247] text-[#A7B4C7] font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Document</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Size</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#243247] text-[#F1F5F9]">
                    {selectedFiles.map((file, idx) => (
                      <tr key={idx} className="hover:bg-[#172235] transition-colors">
                        <td className="py-3 px-4 font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#20B8A6] shrink-0" />
                          <span className="truncate max-w-[320px]" title={file.name}>
                            {file.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#A7B4C7] uppercase">
                          {file.name.split('.').pop()}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#A7B4C7] text-right">
                          {(file.size / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="accent" size="sm">
                            Ready
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="p-1 text-[#718096] hover:text-[#EF4444] transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Create Investigation
          </Button>
        </div>
      </form>
    </div>
  );
};
