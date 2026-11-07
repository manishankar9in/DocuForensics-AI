import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  AlertTriangle,
  Scale,
  Download,
  Eye,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { investigationApi } from '../services/investigationApi';
import { documentApi } from '../services/documentApi';
import { findingApi } from '../services/findingApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const WorkspacePage: React.FC = () => {
  const { investigationId } = useParams<{ investigationId: string }>();
  const queryClient = useQueryClient();

  // 1. Fetch Investigation Record
  const { data: investigation } = useQuery({
    queryKey: ['investigation', investigationId],
    queryFn: () => investigationApi.getById(investigationId!),
    enabled: !!investigationId,
    refetchInterval: (query) => {
      return query.state.data?.status === 'processing' ? 2000 : false;
    },
  });

  // 2. Fetch Ingested Documents
  const { data: documents = [] } = useQuery({
    queryKey: ['investigation-documents', investigationId],
    queryFn: () => documentApi.listByInvestigation(investigationId!),
    enabled: !!investigationId,
    refetchInterval: (query) => {
      const anyPending = query.state.data?.some(
        (d) => d.processing_status === 'queued' || d.processing_status === 'processing'
      );
      return anyPending ? 2000 : false;
    },
  });

  // 3. Fetch Findings Registry
  const { data: findings = [] } = useQuery({
    queryKey: ['investigation-findings', investigationId],
    queryFn: () => findingApi.listByInvestigation(investigationId!),
    enabled: !!investigationId,
  });

  // Re-run Investigation Analysis
  const analyzeMutation = useMutation({
    mutationFn: () => investigationApi.triggerAnalysis(investigationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigation', investigationId] });
      queryClient.invalidateQueries({ queryKey: ['investigation-documents', investigationId] });
      queryClient.invalidateQueries({ queryKey: ['investigation-findings', investigationId] });
    },
  });

  if (!investigation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-secondary-text">Loading Case Manifest...</span>
      </div>
    );
  }

  const isProcessing =
    investigation.status === 'processing' ||
    documents.some((d) => d.processing_status === 'queued' || d.processing_status === 'processing');

  const critCount = findings.filter((f) => f.severity === 'critical').length;
  const warnCount = findings.filter((f) => f.severity === 'warning').length;
  const infoCount = findings.filter((f) => f.severity === 'info').length;
  const confirmedCount = findings.filter((f) => f.review_status === 'confirmed').length;
  const dismissedCount = findings.filter((f) => f.review_status === 'dismissed').length;
  const unreviewedCount = findings.filter((f) => f.review_status === 'unreviewed').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Investigation Command Header */}
      <div className="bg-surface border border-border rounded-[10px] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                variant={
                  investigation.status === 'completed'
                    ? 'success'
                    : isProcessing
                    ? 'info'
                    : 'neutral'
                }
                size="md"
              >
                {investigation.status}
              </Badge>
              {investigation.case_ref && (
                <span className="font-mono text-xs text-primary-text bg-secondary-bg px-2.5 py-0.5 rounded border border-border font-bold">
                  {investigation.case_ref}
                </span>
              )}
              <span className="font-mono text-xs text-secondary-text font-semibold">
                ID: {investigation._id}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-primary-text">
              {investigation.title}
            </h2>
            {investigation.description && (
              <p className="text-sm text-secondary-text mt-1 max-w-2xl leading-relaxed font-medium">
                {investigation.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs font-mono text-secondary-text mt-2 font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent" />
                Ingested: {new Date(investigation.created_at).toLocaleString()}
              </span>
              <span>&bull;</span>
              <span>{documents.length} Forensic Assets</span>
            </div>
          </div>

          {/* Quick Actions Navigation Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyzeMutation.mutate()}
              isLoading={analyzeMutation.isPending || isProcessing}
              title="Re-run Cross-Reconciliation Analysis"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Re-Analyze
            </Button>
            <Link to={`/investigations/${investigationId}/compare`}>
              <Button variant="outline" size="sm">
                <Scale className="w-3.5 h-3.5 mr-1 text-accent" />
                Cross-Compare
              </Button>
            </Link>
            <Link to={`/investigations/${investigationId}/findings`}>
              <Button variant="outline" size="sm">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-status-warning" />
                Findings ({findings.length})
              </Button>
            </Link>
            <Link to={`/investigations/${investigationId}/report`}>
              <Button variant="primary" size="sm">
                <Download className="w-4 h-4 mr-1.5" />
                Official Dossier
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Processing Pipeline Bar */}
        {isProcessing && (
          <div className="mt-4 p-4 bg-accent/10 border border-accent/40 rounded-[8px] flex items-center justify-between text-xs text-accent font-medium">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
              <span>
                Forensic pipeline active: rasterizing pages, running OCR tokenization, and cross-reconciling entity amounts...
              </span>
            </div>
            <span className="font-mono text-xs uppercase font-extrabold text-accent">Processing</span>
          </div>
        )}
      </div>

      {/* Evidentiary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface border border-border rounded-[10px] p-4 text-center">
          <div className="text-xs font-mono text-secondary-text uppercase font-bold">Critical</div>
          <div className="text-2xl font-black font-mono text-status-critical mt-1">{critCount}</div>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-4 text-center">
          <div className="text-xs font-mono text-secondary-text uppercase font-bold">Warnings</div>
          <div className="text-2xl font-black font-mono text-status-warning mt-1">{warnCount}</div>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-4 text-center">
          <div className="text-xs font-mono text-secondary-text uppercase font-bold">Info Signals</div>
          <div className="text-2xl font-black font-mono text-status-info mt-1">{infoCount}</div>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-4 text-center">
          <div className="text-xs font-mono text-secondary-text uppercase font-bold">Confirmed</div>
          <div className="text-2xl font-black font-mono text-status-success mt-1">{confirmedCount}</div>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-4 text-center">
          <div className="text-xs font-mono text-secondary-text uppercase font-bold">Dismissed</div>
          <div className="text-2xl font-black font-mono text-muted-text mt-1">{dismissedCount}</div>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-4 text-center">
          <div className="text-xs font-mono text-secondary-text uppercase font-bold">Unreviewed</div>
          <div className="text-2xl font-black font-mono text-status-warning mt-1">{unreviewedCount}</div>
        </div>
      </div>

      {/* Documents Manifest Section */}
      <div className="bg-surface border border-border rounded-[10px] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-elevated">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary-text">
              Ingested Document Manifest ({documents.length})
            </h3>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-xs text-secondary-text font-mono">
            No evidence documents staged for this investigation.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {documents.map((doc) => {
              const docFindingsCount = findings.filter((f) =>
                f.source_documents.includes(doc._id)
              ).length;

              return (
                <div
                  key={doc._id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded bg-accent/15 border border-accent/40 flex items-center justify-center text-accent shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm text-primary-text truncate">
                          {doc.original_filename}
                        </span>
                        <Badge variant="info" size="sm">
                          {doc.classification?.predicted_type || 'Document'}
                        </Badge>
                        {docFindingsCount > 0 && (
                          <span className="font-mono text-xs text-status-warning bg-status-warning/15 border border-status-warning/40 px-2 py-0.5 rounded font-bold">
                            {docFindingsCount} linked findings
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-secondary-text mt-1.5 font-medium">
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                        <span>&bull;</span>
                        <span>{doc.page_count} Page(s)</span>
                        <span>&bull;</span>
                        <span className="truncate max-w-[240px]" title={doc.sha256_hash}>
                          SHA: {doc.sha256_hash.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <Badge
                      variant={
                        doc.processing_status === 'completed'
                          ? 'success'
                          : doc.processing_status === 'processing'
                          ? 'info'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {doc.processing_status}
                    </Badge>

                    <Link to={`/investigations/${investigationId}/documents/${doc._id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-3.5 h-3.5 mr-1 text-accent" />
                        Two-Panel Viewer
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Findings Quick Registry Preview */}
      <div className="bg-surface border border-border rounded-[10px] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-elevated">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary-text">
              High-Priority Inconsistencies & Forensic Observations
            </h3>
          </div>
          <Link
            to={`/investigations/${investigationId}/findings`}
            className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
          >
            Full Findings Registry ({findings.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {findings.length === 0 ? (
          <div className="p-8 text-center text-xs text-secondary-text font-mono">
            {isProcessing
              ? 'Analyzing document contents...'
              : 'No anomalies or discrepancies detected across documents.'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {findings.slice(0, 4).map((f) => (
              <div key={f._id} className="p-5 hover:bg-surface-elevated/40 transition-colors">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
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
                    <span className="text-sm font-bold text-primary-text">{f.title}</span>
                  </div>
                  <Badge
                    variant={f.review_status === 'unreviewed' ? 'neutral' : 'success'}
                    size="sm"
                  >
                    {f.review_status}
                  </Badge>
                </div>
                <p className="text-xs text-secondary-text leading-relaxed line-clamp-2 font-medium">
                  {f.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
