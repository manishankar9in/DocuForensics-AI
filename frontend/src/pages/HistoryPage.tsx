import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2, ArrowRight, FolderArchive } from 'lucide-react';
import { investigationApi } from '../services/investigationApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const HistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['investigations-history', statusFilter],
    queryFn: () => investigationApi.list(0, 100, statusFilter === 'all' ? undefined : statusFilter),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => investigationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigations-history'] });
      queryClient.invalidateQueries({ queryKey: ['investigations-dashboard'] });
    },
  });

  const items = data?.items || [];
  const filtered = items.filter((inv) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      inv.title.toLowerCase().includes(q) ||
      (inv.case_ref && inv.case_ref.toLowerCase().includes(q)) ||
      inv._id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderArchive className="w-5 h-5 text-accent" />
            <h2 className="text-2xl font-extrabold tracking-tight text-primary-text">
              Investigation Case Archive
            </h2>
          </div>
          <p className="text-sm text-secondary-text font-medium">
            Search, reopen, or inspect past digital forensics cases, audit trails, and compiled dossiers.
          </p>
        </div>
        <Link to="/investigations/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            New Investigation
          </Button>
        </Link>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-surface border border-border rounded-[10px] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-secondary-text absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by case title, reference, or ID..."
            className="w-full pl-9 pr-3 py-2 bg-secondary-bg border border-border rounded-[8px] text-xs text-primary-text placeholder-muted-text focus:outline-none focus:border-accent font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-primary-text font-mono text-xs uppercase font-bold">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary-bg border border-border rounded-[8px] px-3 py-1.5 text-xs text-primary-text focus:outline-none focus:border-accent font-mono font-bold"
          >
            <option value="all">All States</option>
            <option value="draft">Draft</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Case Archive Table */}
      <div className="bg-surface border border-border rounded-[10px] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-2">
            <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-secondary-text">Retrieving case files...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-secondary-text font-mono font-medium">
            No matching investigations identified in archive.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated border-b border-border text-secondary-text uppercase font-mono text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-5">Case Title & Reference</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assets</th>
                  <th className="py-3.5 px-4">Anomalies</th>
                  <th className="py-3.5 px-4">Ingestion Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-primary-text">
                {filtered.map((inv) => (
                  <tr key={inv._id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-primary-text text-sm">{inv.title}</div>
                      <div className="font-mono text-xs text-secondary-text mt-0.5">
                        {inv.case_ref || inv._id}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          inv.status === 'completed'
                            ? 'success'
                            : inv.status === 'processing'
                            ? 'info'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 font-mono text-secondary-text font-semibold">
                      {inv.stats?.total_documents || inv.document_ids.length} Files
                    </td>
                    <td className="py-4 px-4">
                      {inv.stats?.critical_findings > 0 ? (
                        <span className="font-bold text-status-critical font-mono text-xs bg-status-critical/15 border border-status-critical/40 px-2 py-0.5 rounded">
                          {inv.stats.critical_findings} Critical
                        </span>
                      ) : (
                        <span className="text-secondary-text font-mono font-semibold">
                          {inv.stats?.total_findings || 0} Total
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-secondary-text text-xs">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-right flex items-center justify-end gap-2">
                      <Link to={`/investigations/${inv._id}`}>
                        <Button variant="outline" size="sm">
                          Workspace
                          <ArrowRight className="w-3.5 h-3.5 ml-1 text-secondary-text" />
                        </Button>
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Permanently delete case "${inv.title}" and its evidence manifest?`)) {
                            deleteMutation.mutate(inv._id);
                          }
                        }}
                        className="p-2 text-secondary-text hover:text-status-critical rounded-[6px] hover:bg-surface-elevated transition-colors"
                        title="Delete case record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
