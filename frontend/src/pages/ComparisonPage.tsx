import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink, HelpCircle, Scale } from 'lucide-react';
import { findingApi } from '../services/findingApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const ComparisonPage: React.FC = () => {
  const { investigationId } = useParams<{ investigationId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['investigation-comparison', investigationId],
    queryFn: () => findingApi.getComparison(investigationId!),
    enabled: !!investigationId,
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-secondary-text">Reconciling Cross-Document Entities...</span>
      </div>
    );
  }

  const { document_ids, document_names, comparisons } = data;

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
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-5 h-5 text-accent" />
              <h2 className="text-2xl font-extrabold tracking-tight text-primary-text">
                Cross-Document Reconciliation Matrix
              </h2>
            </div>
            <p className="text-sm text-secondary-text font-medium">
              Multi-document comparative analysis identifying amount variances, date collisions, and corporate identity shifts.
            </p>
          </div>
        </div>
      </div>

      {/* Deterministic Normalization Advisory Banner */}
      <div className="p-4 bg-accent/10 border border-accent/30 rounded-[8px] flex items-start gap-3.5 text-xs text-accent">
        <HelpCircle className="w-5 h-5 shrink-0 mt-0.5 text-accent" />
        <div className="leading-relaxed font-medium">
          <span className="font-bold text-primary-text uppercase tracking-wider text-[11px] block mb-0.5">
            Deterministic Forensic Standard:
          </span>
          Values are standardized into ISO dates (`YYYY-MM-DD`), numerical decimal floats, and corporate entity stems. Mismatches highlight direct arithmetic or chronological contradictions between ingested assets.
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-surface border border-border rounded-[10px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated border-b border-border text-secondary-text uppercase font-mono text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-5 w-48">Semantic Field</th>
                {document_ids.map((id) => (
                  <th key={id} className="py-3.5 px-4 min-w-[200px]">
                    <div className="truncate text-primary-text font-bold text-xs" title={document_names[id]}>
                      {document_names[id]}
                    </div>
                    <div className="font-mono text-xs text-muted-text font-medium">ID: {id.slice(0, 8)}</div>
                  </th>
                ))}
                <th className="py-3.5 px-4 w-36">Validation State</th>
                <th className="py-3.5 px-5">Evidence Coordinate Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-primary-text">
              {comparisons.length === 0 ? (
                <tr>
                  <td colSpan={document_ids.length + 3} className="py-8 text-center text-secondary-text font-mono font-medium">
                    No cross-document fields extracted to compare.
                  </td>
                </tr>
              ) : (
                comparisons.map((comp) => (
                  <tr key={comp.field_name} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-4 px-5 align-top">
                      <div className="font-bold text-primary-text text-sm">{comp.field_label}</div>
                      <div className="font-mono text-xs text-accent font-semibold">{comp.field_name}</div>
                    </td>

                    {/* Per-Document Values */}
                    {document_ids.map((id) => {
                      const rawVal = comp.values_by_doc[id];
                      const normVal = comp.normalized_values[id];

                      return (
                        <td key={id} className="py-4 px-4 align-top font-mono">
                          {rawVal ? (
                            <div>
                              <div className="text-primary-text font-bold text-sm">{rawVal}</div>
                              {normVal !== undefined && normVal !== null && String(normVal) !== rawVal && (
                                <div className="text-xs text-accent font-semibold mt-0.5">
                                  [Norm: {String(normVal)}]
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-text italic font-medium">Not identified</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Match or Mismatch Column */}
                    <td className="py-4 px-4 align-top">
                      {comp.is_match ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Match
                        </Badge>
                      ) : (
                        <Badge variant="critical" size="sm">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Mismatch
                        </Badge>
                      )}
                      {comp.discrepancy_explanation && (
                        <p className="text-xs text-status-critical mt-1 font-sans leading-tight font-semibold">
                          {comp.discrepancy_explanation}
                        </p>
                      )}
                    </td>

                    {/* Direct Evidence Navigation Links */}
                    <td className="py-4 px-5 align-top">
                      <div className="space-y-1">
                        {comp.evidence_refs.map((ev, idx) => (
                          <Link
                            key={idx}
                            to={`/investigations/${investigationId}/documents/${ev.document_id}`}
                            className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:text-accent-hover bg-secondary-bg border border-border hover:border-accent px-2 py-0.5 rounded mr-2 mb-1 font-semibold transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>P.{ev.page} ({ev.filename.slice(0, 16)})</span>
                          </Link>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
