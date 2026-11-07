export interface EvidenceReference {
  document_id: string;
  filename: string;
  page: number;
  field_name: string;
  value_observed: string;
  bbox?: [number, number, number, number];
}

export interface Finding {
  _id: string;
  investigation_id: string;
  category: 'contextual' | 'visual' | 'extraction_uncertainty';
  finding_type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  explanation: string;
  source_documents: string[];
  evidence: EvidenceReference[];
  detection_method: string;
  confidence_score: number;
  review_status: 'unreviewed' | 'confirmed' | 'dismissed' | 'reviewed';
  reviewer_notes?: string;
  created_at: string;
}

export interface ComparisonEntry {
  field_name: string;
  field_label: string;
  values_by_doc: Record<string, string | null>;
  normalized_values: Record<string, any>;
  is_match: boolean;
  discrepancy_explanation?: string;
  evidence_refs: EvidenceReference[];
}

export interface CrossDocumentComparisonResponse {
  investigation_id: string;
  document_ids: string[];
  document_names: Record<string, string>;
  comparisons: ComparisonEntry[];
}

