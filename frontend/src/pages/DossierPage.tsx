import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  ArrowLeft,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { investigationApi } from '../services/investigationApi';
import { documentApi } from '../services/documentApi';
import { findingApi } from '../services/findingApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const DossierPage: React.FC = () => {
  const { investigationId } = useParams<{ investigationId: string }>();

  const { data: investigation } = useQuery({
    queryKey: ['investigation', investigationId],
    queryFn: () => investigationApi.getById(investigationId!),
    enabled: !!investigationId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['investigation-documents', investigationId],
    queryFn: () => documentApi.listByInvestigation(investigationId!),
    enabled: !!investigationId,
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['investigation-findings', investigationId],
    queryFn: () => findingApi.listByInvestigation(investigationId!),
    enabled: !!investigationId,
  });

  if (!investigation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-secondary-text">Compiling Evidentiary Dossier...</span>
      </div>
    );
  }

  const downloadUrl = findingApi.getReportDownloadUrl(investigationId!);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link to={`/investigations/${investigationId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Workspace
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-primary-text">
              Official Investigation Dossier
            </h2>
            <p className="text-sm text-secondary-text mt-1 font-medium">
              Cryptographically bound forensic audit report with human review attestations and evidence references.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            <Button variant="primary" size="md">
              <Download className="w-4 h-4 mr-1.5" />
              Download Dossier (PDF)
            </Button>
          </a>
        </div>
      </div>

      {/* Official Court / Audit Ready Dossier Paper Canvas */}
      <div className="bg-surface border border-border text-primary-text rounded-[10px] shadow-2xl p-8 space-y-8 print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b-2 border-accent pb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-accent font-extrabold">
                DOCUFORENSICS AI &bull; INVESTIGATIVE DOSSIER
              </p>
              <h1 className="text-3xl font-extrabold text-primary-text tracking-tight mt-1.5">
                {investigation.title}
              </h1>
            </div>
            <div className="text-right">
              <Badge variant="info" size="md">
                {investigation.status}
              </Badge>
              <div className="font-mono text-xs text-secondary-text mt-1.5 font-bold">
                Case: {investigation.case_ref || investigation._id}
              </div>
            </div>
          </div>
          <div className="font-mono text-xs text-secondary-text mt-2 font-medium">
            Audit Generated: {new Date().toUTCString()} &bull; Ingested Files: {documents.length} Assets
          </div>
        </div>

        {/* Executive Summary Metrics Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary-bg border border-border rounded-[8px] p-5 text-center font-mono">
          <div>
            <div className="text-xs font-bold text-secondary-text uppercase">Documents Examined</div>
            <div className="text-2xl font-black text-primary-text mt-1">{documents.length}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-secondary-text uppercase">Total Findings</div>
            <div className="text-2xl font-black text-primary-text mt-1">{findings.length}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-secondary-text uppercase">Critical Discrepancies</div>
            <div className="text-2xl font-black text-status-critical mt-1">
              {findings.filter((f) => f.severity === 'critical').length}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-secondary-text uppercase">Examiner Confirmed</div>
            <div className="text-2xl font-black text-status-success mt-1">
              {findings.filter((f) => f.review_status === 'confirmed').length}
            </div>
          </div>
        </div>

        {/* 1. Evidence Manifest Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent border-b border-border pb-1.5">
            1. Evidentiary Document Manifest & Cryptographic Digests
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-elevated text-secondary-text uppercase font-mono text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-3">Filename</th>
                  <th className="py-3 px-3">Predicted Class</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">SHA-256 Digest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs text-primary-text">
                {documents.map((d) => (
                  <tr key={d._id} className="hover:bg-surface-elevated/40">
                    <td className="py-3 px-3 font-sans font-bold text-primary-text truncate max-w-[200px]">
                      {d.original_filename}
                    </td>
                    <td className="py-3 px-3 uppercase text-xs text-secondary-text font-semibold">
                      {d.classification?.predicted_type || 'Unknown'}
                    </td>
                    <td className="py-3 px-3 text-secondary-text font-medium">{(d.file_size / 1024).toFixed(1)} KB</td>
                    <td className="py-3 px-3 text-accent font-bold truncate max-w-[260px]" title={d.sha256_hash}>
                      {d.sha256_hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Forensic Findings Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent border-b border-border pb-1.5">
            2. Evidentiary Findings & Discrepancies
          </h3>
          {findings.length === 0 ? (
            <p className="text-xs text-secondary-text italic font-mono font-medium">
              No anomalies or inconsistencies identified across the examined document set.
            </p>
          ) : (
            <div className="space-y-3">
              {findings.map((f, i) => (
                <div key={f._id} className="p-4 bg-secondary-bg border border-border rounded-[8px] text-xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-accent font-extrabold">#{i + 1}</span>
                      <span className="font-bold text-sm text-primary-text">{f.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                      <Badge
                        variant={f.review_status === 'confirmed' ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {f.review_status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-secondary-text leading-relaxed text-xs font-medium">{f.explanation}</p>
                  {f.reviewer_notes && (
                    <div className="text-xs font-mono text-status-success bg-status-success/15 border border-status-success/40 p-2 rounded mt-1 font-bold">
                      Examiner Attestation Note: "{f.reviewer_notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Methodology & Verification Disclaimer */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
            3. Verification Disclaimer & Human Review Attestation
          </h3>
          <p className="text-xs text-secondary-text leading-relaxed font-medium">
            This investigation dossier was compiled by DocuForensics AI through deterministic normalization, PyMuPDF vector inspection, OpenCV metadata screening, and OCR tokenization. Findings represent algorithmic observations and contextual inconsistencies; they do not constitute judicial proof of forgery or fraud. Human examiner attestation and primary banking verification remain mandatory.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            <div className="border-t border-border pt-2 text-center text-xs font-mono text-secondary-text font-bold">
              Lead Examiner Printed Name
            </div>
            <div className="border-t border-border pt-2 text-center text-xs font-mono text-secondary-text font-bold">
              Official Signature & Stamp
            </div>
            <div className="border-t border-border pt-2 text-center text-xs font-mono text-secondary-text font-bold">
              Attestation Date / Timestamp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
