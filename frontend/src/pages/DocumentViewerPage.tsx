import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  ScanText,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { documentApi } from '../services/documentApi';
import { findingApi } from '../services/findingApi';
import { DocumentViewerCanvas, BoundingBoxHighlight } from '../components/viewer/DocumentViewerCanvas';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const DocumentViewerPage: React.FC = () => {
  const { investigationId, documentId } = useParams<{
    investigationId: string;
    documentId: string;
  }>();

  const [activeTab, setActiveTab] = useState<'fields' | 'ocr' | 'findings'>('fields');
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<number>(1);

  // 1. Ingested Document Metadata
  const { data: document, isLoading: docLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentApi.getById(documentId!),
    enabled: !!documentId,
  });

  // 2. Structured Fields & Raw OCR Token Blocks
  const { data: fieldsData } = useQuery({
    queryKey: ['document-fields', documentId],
    queryFn: () => documentApi.getFields(documentId!),
    enabled: !!documentId,
  });

  // 3. Case Findings
  const { data: caseFindings = [] } = useQuery({
    queryKey: ['investigation-findings', investigationId],
    queryFn: () => findingApi.listByInvestigation(investigationId!),
    enabled: !!investigationId,
  });

  const docFindings = caseFindings.filter((f) =>
    f.source_documents.includes(documentId!)
  );

  if (docLoading || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-secondary-text">Loading Document Viewer...</span>
      </div>
    );
  }

  const fields = fieldsData?.fields || document.extracted_fields || {};
  const ocrBlocks = fieldsData?.raw_ocr_blocks || [];

  const canvasHighlights: BoundingBoxHighlight[] = [];

  // Add field highlights
  Object.entries(fields).forEach(([key, field]) => {
    if (field.bbox && (field.page || 1) === activePage) {
      canvasHighlights.push({
        bbox: field.bbox as [number, number, number, number],
        label: key.replace(/_/g, ' ').toUpperCase(),
        isTarget: selectedFieldKey === key,
        severity: 'info',
      });
    }
  });

  // Add finding evidence highlights
  docFindings.forEach((f) => {
    if (f.evidence) {
      f.evidence.forEach((ev) => {
        if (ev.document_id === documentId && ev.page === activePage && ev.bbox) {
          canvasHighlights.push({
            bbox: ev.bbox as [number, number, number, number],
            label: `ANOMALY: ${f.title.slice(0, 24)}`,
            isTarget: selectedFindingId === f._id,
            severity: f.severity === 'critical' ? 'critical' : f.severity === 'warning' ? 'warning' : 'info',
          });
        }
      });
    }
  });

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-3">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between shrink-0 bg-surface border border-border rounded-[10px] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to={`/investigations/${investigationId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Workspace
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-primary-text truncate max-w-md">
                {document.original_filename}
              </h2>
              <Badge variant="info" size="sm">
                {document.classification?.predicted_type || 'Generic Document'}
              </Badge>
            </div>
            <div className="font-mono text-xs text-secondary-text mt-0.5">
              SHA: {document.sha256_hash.slice(0, 24)}... &bull; {document.page_count} Page(s) &bull;{' '}
              {(document.file_size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-secondary-text font-mono text-xs hidden sm:inline font-semibold">Basis:</span>
          <span className="font-mono text-xs bg-secondary-bg text-primary-text px-2.5 py-1 rounded border border-border font-bold">
            {document.classification?.rule_basis || 'Pattern Matching'}
          </span>
        </div>
      </div>

      {/* Split-Screen Forensic Station */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Panel: High-Resolution Canvas with Overlays (7 cols) */}
        <div className="lg:col-span-7 h-full min-h-[400px]">
          <DocumentViewerCanvas
            documentId={documentId!}
            totalPages={document.page_count}
            currentPage={activePage}
            activeHighlights={canvasHighlights}
            onPageChange={(p) => setActivePage(p)}
          />
        </div>

        {/* Right Panel: Forensic Intelligence & Field Inspector (5 cols) */}
        <div className="lg:col-span-5 h-full flex flex-col bg-surface border border-border rounded-[10px] shadow-sm overflow-hidden">
          {/* Tab Selection */}
          <div className="flex border-b border-border bg-surface-elevated shrink-0">
            <button
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'fields'
                  ? 'border-accent text-accent bg-surface'
                  : 'border-transparent text-secondary-text hover:text-primary-text'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Fields ({Object.keys(fields).length})
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`flex-1 py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'ocr'
                  ? 'border-accent text-accent bg-surface'
                  : 'border-transparent text-secondary-text hover:text-primary-text'
              }`}
            >
              <ScanText className="w-3.5 h-3.5" />
              OCR Tokens
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`flex-1 py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'findings'
                  ? 'border-accent text-accent bg-surface'
                  : 'border-transparent text-secondary-text hover:text-primary-text'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />
              Findings ({docFindings.length})
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Tab 1: Extracted Fields */}
            {activeTab === 'fields' && (
              <div className="space-y-3">
                <p className="text-xs font-mono text-secondary-text font-medium">
                  Click any field to jump to its page and highlight coordinates:
                </p>

                {Object.keys(fields).length === 0 ? (
                  <div className="p-8 text-center text-xs text-secondary-text font-mono">
                    No structured fields detected in document vector text.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {Object.entries(fields).map(([key, field]) => {
                      const isSelected = selectedFieldKey === key;
                      return (
                        <div
                          key={key}
                          onClick={() => {
                            setSelectedFieldKey(key);
                            setSelectedFindingId(null);
                            if (field.page) setActivePage(field.page);
                          }}
                          className={`p-3.5 rounded-[8px] border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-accent bg-accent/15 shadow-sm'
                              : 'border-border bg-secondary-bg hover:border-accent/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono font-bold text-accent uppercase tracking-wider text-xs">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {field.bbox && (
                                <span className="font-mono text-xs text-accent bg-accent/20 border border-accent/40 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                  <Target className="w-3 h-3" />
                                  P.{field.page || 1}
                                </span>
                              )}
                              <Badge variant="success" size="sm">
                                {(field.confidence * 100).toFixed(0)}% Conf
                              </Badge>
                            </div>
                          </div>

                          <div className="font-mono text-sm font-bold text-primary-text mb-1">
                            {field.raw_value}
                          </div>

                          {field.normalized_value !== undefined &&
                            field.normalized_value !== null &&
                            String(field.normalized_value) !== field.raw_value && (
                              <div className="text-xs text-secondary-text font-mono font-semibold">
                                Standardized: <span className="text-accent font-bold">{String(field.normalized_value)}</span>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Raw OCR Tokens */}
            {activeTab === 'ocr' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-secondary-text pb-2 border-b border-border font-bold">
                  <span>Engine: {document.ocr_summary?.engine || 'Tesseract / PyMuPDF'}</span>
                  <span>Avg Conf: {document.ocr_summary?.avg_confidence || 100}%</span>
                </div>

                {ocrBlocks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-secondary-text font-mono">
                    No token-level OCR bounding boxes extracted.
                  </div>
                ) : (
                  <div className="divide-y divide-border border border-border rounded-[8px] max-h-[500px] overflow-y-auto bg-secondary-bg">
                    {ocrBlocks.map((blk, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 text-xs flex items-center justify-between hover:bg-surface-elevated/40 transition-colors"
                      >
                        <span className="font-mono text-primary-text font-semibold">{blk.text}</span>
                        <div className="flex items-center gap-2 font-mono text-xs text-secondary-text">
                          <span>p.{blk.page}</span>
                          <span className={blk.confidence < 0.75 ? 'text-status-critical font-bold' : 'text-status-success font-bold'}>
                            {(blk.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Document-Linked Findings */}
            {activeTab === 'findings' && (
              <div className="space-y-3">
                {docFindings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-secondary-text font-mono">
                    No evidentiary anomalies specifically isolated to this document.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {docFindings.map((f) => (
                      <div
                        key={f._id}
                        onClick={() => {
                          setSelectedFindingId(f._id);
                          setSelectedFieldKey(null);
                          const targetEv = f.evidence?.find((e) => e.document_id === documentId);
                          if (targetEv && targetEv.page) {
                            setActivePage(targetEv.page);
                          }
                        }}
                        className={`p-3.5 rounded-[8px] text-xs space-y-2 cursor-pointer transition-all border ${
                          selectedFindingId === f._id
                            ? 'border-status-critical bg-status-critical/15 shadow-sm'
                            : 'border-border bg-secondary-bg hover:border-accent/50'
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <Badge
                            variant={
                              f.severity === 'critical'
                                ? 'critical'
                                : f.severity === 'warning'
                                ? 'warning'
                                : 'info'
                            }
                            size="sm"
                          >
                            {f.severity}
                          </Badge>
                          <Badge variant="neutral" size="sm">
                            {f.review_status}
                          </Badge>
                        </div>
                        <div className="font-bold text-sm text-primary-text">{f.title}</div>
                        <p className="text-secondary-text text-xs leading-relaxed font-medium">
                          {f.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
