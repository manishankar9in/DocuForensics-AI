export interface InvestigationStats {
  total_documents: number;
  total_findings: number;
  unreviewed_findings: number;
  critical_findings: number;
  warning_findings: number;
}

export interface Investigation {
  _id: string;
  title: string;
  case_ref?: string;
  description?: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  document_ids: string[];
  stats: InvestigationStats;
  created_at: string;
  updated_at: string;
}

export interface InvestigationListResponse {
  items: Investigation[];
  total: number;
  skip: number;
  limit: number;
}

