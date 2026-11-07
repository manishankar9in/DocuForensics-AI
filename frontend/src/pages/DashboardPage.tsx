import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Plus,
  ArrowRight,
  FolderOpen,
  Cpu,
  Database,
  ShieldCheck,
  Activity,
  FolderArchive,
} from 'lucide-react';
import { investigationApi } from '../services/investigationApi';
import { healthApi } from '../services/healthApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const DashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['investigations-dashboard'],
    queryFn: () => investigationApi.list(0, 10),
  });

  const { data: health } = useQuery({
    queryKey: ['system-health-dashboard'],
    queryFn: healthApi.getHealth,
  });

  const investigations = data?.items || [];

  const totalCases = data?.total || 0;
  const totalDocs = investigations.reduce((acc, inv) => acc + (inv.stats?.total_documents || 0), 0);
  const totalOpenFindings = investigations.reduce(
    (acc, inv) => acc + (inv.stats?.unreviewed_findings || 0),
    0
  );
  const totalConfirmed = investigations.reduce(
    (acc, inv) => acc + (inv.stats?.critical_findings || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243247] pb-6">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight text-[#F1F5F9]">
            Dashboard
          </h2>
          <p className="text-sm text-[#A7B4C7] mt-1">
            Overview of active investigations and system activity
          </p>
        </div>
        <Link to="/investigations/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            New Investigation
          </Button>
        </Link>
      </div>

      {/* 4 Statistic Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Investigations */}
        <div className="bg-[#121B29] border border-[#243247] rounded-[10px] p-6 shadow-card">
          <div className="flex items-center justify-between mb-3 text-[#A7B4C7]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">
              Investigations
            </span>
            <FolderArchive className="w-4 h-4 text-[#20B8A6]" />
          </div>
          <div className="text-3xl font-semibold font-mono text-[#F1F5F9]">
            {isLoading ? <span className="text-[#4B5A70] animate-pulse">--</span> : totalCases}
          </div>
          <div className="text-xs text-[#718096] mt-2">Active forensic cases</div>
        </div>

        {/* Card 2: Documents */}
        <div className="bg-[#121B29] border border-[#243247] rounded-[10px] p-6 shadow-card">
          <div className="flex items-center justify-between mb-3 text-[#A7B4C7]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">
              Documents
            </span>
            <FileSearch className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-3xl font-semibold font-mono text-[#F1F5F9]">
            {isLoading ? <span className="text-[#4B5A70] animate-pulse">--</span> : totalDocs}
          </div>
          <div className="text-xs text-[#718096] mt-2">Ingested PDF & image assets</div>
        </div>

        {/* Card 3: Open Findings */}
        <div className="bg-[#121B29] border border-[#243247] rounded-[10px] p-6 shadow-card">
          <div className="flex items-center justify-between mb-3 text-[#A7B4C7]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">
              Open Findings
            </span>
            <AlertOctagon className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-3xl font-semibold font-mono text-[#F59E0B]">
            {isLoading ? <span className="text-[#4B5A70] animate-pulse">--</span> : totalOpenFindings}
          </div>
          <div className="text-xs text-[#718096] mt-2">Awaiting examiner attestation</div>
        </div>

        {/* Card 4: Confirmed */}
        <div className="bg-[#121B29] border border-[#243247] rounded-[10px] p-6 shadow-card">
          <div className="flex items-center justify-between mb-3 text-[#A7B4C7]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">
              Confirmed
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div className="text-3xl font-semibold font-mono text-[#F1F5F9]">
            {isLoading ? <span className="text-[#4B5A70] animate-pulse">--</span> : totalConfirmed}
          </div>
          <div className="text-xs text-[#718096] mt-2">Verified discrepancies</div>
        </div>
      </div>

      {/* System Telemetry Row */}
      <div className="bg-[#121B29] border border-[#243247] rounded-[10px] p-5 shadow-card">
        <div className="flex items-center justify-between mb-4 border-b border-[#243247] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#20B8A6]" />
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#F1F5F9]">
              Subsystem Verification
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#22C55E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-[8px] bg-[#0D1420] border border-[#243247] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#A7B4C7]">
              <Database className="w-3.5 h-3.5 text-[#20B8A6]" />
              <span>Database Store</span>
            </div>
            <Badge variant="success" size="sm" dot>
              {health?.database?.mode === 'mongodb' ? 'MongoDB Atlas' : 'Local Store'}
            </Badge>
          </div>

          <div className="p-3 rounded-[8px] bg-[#0D1420] border border-[#243247] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#A7B4C7]">
              <Cpu className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>OCR Pipeline</span>
            </div>
            <Badge variant={health?.ocr?.available ? 'success' : 'info'} size="sm" dot>
              {health?.ocr?.available ? 'Tesseract Engine' : 'PyMuPDF Native'}
            </Badge>
          </div>

          <div className="p-3 rounded-[8px] bg-[#0D1420] border border-[#243247] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#A7B4C7]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>File Integrity</span>
            </div>
            <Badge variant="neutral" size="sm">
              SHA-256 Vault
            </Badge>
          </div>
        </div>
      </div>

      {/* Recent Investigations Table */}
      <div className="bg-[#121B29] border border-[#243247] rounded-[10px] shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#243247] flex items-center justify-between bg-[#172235]">
          <h3 className="text-sm font-semibold text-[#F1F5F9]">
            Recent Investigations
          </h3>
          <Link
            to="/investigations"
            className="text-xs font-medium text-[#20B8A6] hover:underline flex items-center gap-1"
          >
            View all investigations
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-[#A7B4C7]">
            <span className="w-5 h-5 border-2 border-[#20B8A6] border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p>Querying repository records...</p>
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-[#718096] mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-[#F1F5F9]">0 investigations logged</h4>
            <p className="text-xs text-[#A7B4C7] mt-1 mb-4 max-w-sm mx-auto">
              No investigations yet. Create your first investigation to begin document analysis.
            </p>
            <Link to="/investigations/new">
              <Button variant="secondary" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Investigation
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#172235] border-b border-[#243247] text-[#A7B4C7] uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">Investigation Title & Case Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Documents</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243247] text-[#F1F5F9]">
                {investigations.map((inv) => (
                  <tr key={inv._id} className="hover:bg-[#172235] transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-medium text-[#F1F5F9]">{inv.title}</div>
                      <div className="font-mono text-[11px] text-[#A7B4C7]">
                        {inv.case_ref || inv._id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          inv.status === 'completed'
                            ? 'success'
                            : inv.status === 'processing'
                            ? 'info'
                            : 'neutral'
                        }
                        size="sm"
                        dot
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#A7B4C7]">
                      {inv.stats?.total_documents || inv.document_ids.length}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.stats?.critical_findings > 0 ? (
                        <span className="font-semibold text-[#EF4444] font-mono text-xs">
                          {inv.stats.critical_findings} Critical
                        </span>
                      ) : inv.stats?.warning_findings > 0 ? (
                        <span className="text-[#F59E0B] font-mono text-xs font-semibold">
                          {inv.stats.warning_findings} Warnings
                        </span>
                      ) : (
                        <span className="text-[#22C55E] font-mono text-xs">Clear</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#A7B4C7] font-mono text-xs">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link to={`/investigations/${inv._id}`}>
                        <Button variant="outline" size="sm">
                          Open Case
                          <ArrowRight className="w-3.5 h-3.5 ml-1 text-[#A7B4C7]" />
                        </Button>
                      </Link>
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
