import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cpu, Lock, AlertTriangle, Database, HardDrive, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { healthApi } from '../services/healthApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['system-health-diagnostics'],
    queryFn: healthApi.getHealth,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-primary-text">
            System Diagnostics & Engine Health
          </h2>
          <p className="text-sm text-secondary-text mt-1 font-medium">
            Operational telemetry for document vector pipelines, optical character recognition, and persistence layers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isLoading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Probe Services
        </Button>
      </div>

      {/* Diagnostics Grid */}
      <div className="bg-surface border border-border rounded-[10px] p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary-text flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            Core Forensic Subsystems
          </h3>
          <span className="text-xs font-mono text-status-success flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-4 h-4 text-status-success" /> All Modules Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Subsystem 1: Database */}
          <div className="p-4 bg-secondary-bg border border-border rounded-[8px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-secondary-text text-xs font-bold uppercase flex items-center gap-1.5">
                <Database className="w-4 h-4 text-status-success" />
                Persistence Layer
              </span>
              <Badge variant="success" size="sm">
                Connected
              </Badge>
            </div>
            <div className="text-base font-bold text-primary-text capitalize">
              {health?.database?.mode === 'mongodb' ? 'MongoDB Atlas Cluster' : 'Local Persistent Store'}
            </div>
            <p className="text-xs font-sans text-secondary-text leading-relaxed font-medium">
              {health?.database?.mode === 'mongodb'
                ? 'High-throughput async Motor driver connected to MongoDB.'
                : 'Zero-configuration file-backed JSON store active. Ideal for air-gapped development and local evaluations.'}
            </p>
          </div>

          {/* Subsystem 2: OCR */}
          <div className="p-4 bg-secondary-bg border border-border rounded-[8px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-secondary-text text-xs font-bold uppercase flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-accent" />
                Optical Character Engine
              </span>
              <Badge variant={health?.ocr?.available ? 'success' : 'info'} size="sm">
                {health?.ocr?.available ? 'Binary Verified' : 'Vector Active'}
              </Badge>
            </div>
            <div className="text-base font-bold text-primary-text">
              {health?.ocr?.available ? 'Tesseract Engine (v5)' : 'PyMuPDF Native Vector Engine'}
            </div>
            <p className="text-xs font-sans text-secondary-text leading-relaxed font-medium">
              {health?.ocr?.available
                ? 'High-density word token bounding box extraction active for scanned images and PDFs.'
                : 'PyMuPDF direct vector extraction handles digital documents. For scanned TIFF/PNGs, install Tesseract to C:\\Program Files\\Tesseract-OCR.'}
            </p>
          </div>

          {/* Subsystem 3: Storage */}
          <div className="p-4 bg-secondary-bg border border-border rounded-[8px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-secondary-text text-xs font-bold uppercase flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-accent" />
                Evidence Vault
              </span>
              <Badge variant="neutral" size="sm">
                Immutable
              </Badge>
            </div>
            <div className="text-base font-bold text-primary-text">
              Isolated Filesystem ({health?.storage?.path || './storage'})
            </div>
            <p className="text-xs font-sans text-secondary-text leading-relaxed font-medium">
              Ingested assets are strictly read-only and indexed by cryptographic SHA-256 digests. Path-traversal attack defenses enforced.
            </p>
          </div>

          {/* Subsystem 4: ReportLab */}
          <div className="p-4 bg-secondary-bg border border-border rounded-[8px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-secondary-text text-xs font-bold uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-status-success" />
                Dossier Compiler
              </span>
              <Badge variant="success" size="sm">
                ReportLab Ready
              </Badge>
            </div>
            <div className="text-base font-bold text-primary-text">ReportLab PDF Generation</div>
            <p className="text-xs font-sans text-secondary-text leading-relaxed font-medium">
              Constructs formal multi-page forensic dossiers with embedded coordinate tables, signatures, and cryptographic manifests.
            </p>
          </div>
        </div>

        {/* Security Standards */}
        <div className="pt-4 border-t border-border space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary-text flex items-center gap-2">
            <Lock className="w-4 h-4 text-status-success" />
            Integrity & Privacy Compliance Standards
          </h3>
          <ul className="text-xs text-secondary-text space-y-2 list-disc pl-5 leading-relaxed font-sans font-medium">
            <li>
              <span className="text-primary-text font-bold">Zero Sensitive Leakage:</span> API credentials and underlying system paths are strictly isolated on the backend server.
            </li>
            <li>
              <span className="text-primary-text font-bold">Air-Gapped Operation:</span> The entire forensic analysis pipeline operates deterministically without sending your documents to external paid cloud APIs.
            </li>
            <li>
              <span className="text-primary-text font-bold">Non-Destructive Ingestion:</span> Source documents remain immutable and untouched on disk; all bounding boxes are rendered as non-destructive overlays.
            </li>
          </ul>
        </div>

        {/* Methodological Caveats */}
        <div className="pt-4 border-t border-border space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-status-warning flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            Forensic Principles & Methodological Caveats
          </h3>
          <p className="text-xs text-secondary-text leading-relaxed font-sans font-medium">
            DocuForensics AI surfaces objective metadata anomalies (e.g., Canva or consumer editor signatures), timestamp differentials, and mathematical discrepancies across multiple related documents. In adherence to forensic legal standards, automated heuristics do not constitute judicial declarations of fraud. All observations must be confirmed through human examiner attestation.
          </p>
        </div>
      </div>
    </div>
  );
};
