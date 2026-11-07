import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Save,
} from 'lucide-react';
import { findingApi } from '../services/findingApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const FindingsPage: React.FC = () => {
  const { investigationId } = useParams<{ investigationId: string }>();
  const queryClient = useQueryClient();

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);

  const { data: findings = [], isLoading } = useQuery({
    queryKey: ['investigation-findings-list', investigationId],
    queryFn: () => findingApi.listByInvestigation(investigationId!),
    enabled: !!investigationId,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      findingId,
      status,
      notes,
    }: {
      findingId: string;
      status: string;
      notes?: string;
    }) => findingApi.updateReview(findingId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigation-findings-list', investigationId] });
      queryClient.invalidateQueries({ queryKey: ['investigation', investigationId] });
      setEditingNotesId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-secondary-text">Loading Findings Registry...</span>
      </div>
    );
  }

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && f.review_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q) ||
        f.finding_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
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
              Evidentiary Findings & Attestation Registry
            </h2>
            <p className="text-sm text-secondary-text mt-1 font-medium">
              Review flagged contextual inconsistencies, visual metadata editor traces, and cross-document variances.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-surface border border-border rounded-[10px] p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-primary-text text-xs uppercase font-bold">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-secondary-bg border border-border rounded-[8px] px-3 py-1.5 text-xs text-primary-text font-bold focus:outline-none focus:border-accent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-primary-text text-xs uppercase font-bold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-secondary-bg border border-border rounded-[8px] px-3 py-1.5 text-xs text-primary-text font-bold focus:outline-none focus:border-accent"
            >
              <option value="all">All Categories</option>
              <option value="contextual">Contextual Inconsistency</option>
              <option value="visual">Visual / Metadata</option>
              <option value="extraction_uncertainty">Extraction Uncertainty</option>
            </select>
          </div>

          {/* Review Status */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-primary-text text-xs uppercase font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-secondary-bg border border-border rounded-[8px] px-3 py-1.5 text-xs text-primary-text font-bold focus:outline-none focus:border-accent"
            >
              <option value="all">All Statuses</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="confirmed">Confirmed</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-secondary-text absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings..."
            className="pl-9 pr-3 py-1.5 bg-secondary-bg border border-border rounded-[8px] text-xs text-primary-text placeholder-muted-text focus:outline-none focus:border-accent w-64 font-medium"
          />
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="bg-surface border border-border rounded-[10px] p-12 text-center text-xs text-secondary-text font-mono font-medium">
            No evidentiary findings match the current filter parameters.
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isEditing = editingNotesId === finding._id;
            const currentNote = activeNotes[finding._id] ?? (finding.reviewer_notes || '');

            return (
              <div
                key={finding._id}
                className="bg-surface border border-border rounded-[10px] p-5 shadow-sm space-y-4 hover:border-accent/40 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge
                      variant={
                        finding.severity === 'critical'
                          ? 'critical'
                          : finding.severity === 'warning'
                          ? 'warning'
                          : 'info'
                      }
                      size="md"
                    >
                      {finding.severity}
                    </Badge>
                    <span className="font-extrabold text-base text-primary-text">{finding.title}</span>
                    <Badge variant="neutral" size="sm">
                      {finding.category.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-secondary-text font-semibold">
                      Method: {finding.detection_method}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-xs text-secondary-text leading-relaxed whitespace-pre-line font-medium">
                  {finding.explanation}
                </p>

                {/* Evidence Links */}
                {finding.evidence && finding.evidence.length > 0 && (
                  <div className="space-y-2 bg-secondary-bg p-3.5 rounded-[8px] border border-border">
                    <p className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
                      Ground Truth Evidence Coordinates & References
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {finding.evidence.map((ev, idx) => (
                        <Link
                          key={idx}
                          to={`/investigations/${investigationId}/documents/${ev.document_id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-mono text-accent bg-surface px-3 py-1 rounded-[6px] border border-border hover:border-accent font-bold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>
                            {ev.filename} (Page {ev.page}) &bull; Value: {ev.value_observed}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investigator Review Panel */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-primary-text uppercase tracking-wider">
                      Examiner Decision:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          reviewMutation.mutate({
                            findingId: finding._id,
                            status: 'confirmed',
                            notes: currentNote,
                          })
                        }
                        className={`px-3 py-1.5 text-xs rounded-[6px] border transition-colors flex items-center gap-1.5 font-bold ${
                          finding.review_status === 'confirmed'
                            ? 'bg-status-success/20 text-status-success border-status-success'
                            : 'bg-secondary-bg text-secondary-text border-border hover:border-status-success hover:text-status-success'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm Finding
                      </button>

                      <button
                        onClick={() =>
                          reviewMutation.mutate({
                            findingId: finding._id,
                            status: 'dismissed',
                            notes: currentNote,
                          })
                        }
                        className={`px-3 py-1.5 text-xs rounded-[6px] border transition-colors flex items-center gap-1.5 font-bold ${
                          finding.review_status === 'dismissed'
                            ? 'bg-secondary-bg text-muted-text border-muted-text'
                            : 'bg-secondary-bg text-secondary-text border-border hover:border-muted-text hover:text-primary-text'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Dismiss
                      </button>

                      <button
                        onClick={() =>
                          reviewMutation.mutate({
                            findingId: finding._id,
                            status: 'unreviewed',
                            notes: currentNote,
                          })
                        }
                        className={`px-3 py-1.5 text-xs rounded-[6px] border transition-colors flex items-center gap-1.5 font-bold ${
                          finding.review_status === 'unreviewed'
                            ? 'bg-status-warning/20 text-status-warning border-status-warning'
                            : 'bg-secondary-bg text-secondary-text border-border hover:border-status-warning hover:text-status-warning'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Notes Toggle */}
                  <button
                    onClick={() => setEditingNotesId(isEditing ? null : finding._id)}
                    className="text-xs font-mono text-accent hover:text-accent-hover flex items-center gap-1 font-bold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {finding.reviewer_notes ? 'Edit Attestation Notes' : 'Add Case Notes'}
                  </button>
                </div>

                {/* Notes Input Drawer */}
                {isEditing && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <label className="block text-xs font-mono font-bold text-secondary-text uppercase">
                      Investigator Attestation & Legal Note:
                    </label>
                    <textarea
                      value={currentNote}
                      onChange={(e) =>
                        setActiveNotes((prev) => ({ ...prev, [finding._id]: e.target.value }))
                      }
                      placeholder="Record forensic rationale, legal significance, or cross-interview corroboration..."
                      rows={3}
                      className="w-full p-2.5 bg-secondary-bg border border-border rounded-[8px] text-xs text-primary-text placeholder-muted-text focus:outline-none focus:border-accent font-sans"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingNotesId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          reviewMutation.mutate({
                            findingId: finding._id,
                            status: finding.review_status,
                            notes: currentNote,
                          })
                        }
                        isLoading={reviewMutation.isPending}
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Save Review
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
