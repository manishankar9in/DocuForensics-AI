export interface PageDimension {
  page: number;
  width_pts: number;
  height_pts: number;
}

export interface ExtractedField {
  key: string;
  raw_value: string;
  normalized_value?: any;
  confidence: number;
  page: number;
  bbox?: [number, number, number, number]; // [x0, y0, x1, y1] normalized 0.0-1.0
  source_type: string;
}

export interface OCRBlock {
  text: string;
  confidence: number;
  page: number;
  bbox: [number, number, number, number];
}

export interface ClassificationResult {
  predicted_type: string;
  confidence: number;
  rule_basis: string;
}

export interface DocumentItem {
  _id: string;
  investigation_id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  sha256_hash: string;
  page_count: number;
  page_dimensions: PageDimension[];
  classification: ClassificationResult;
  extracted_fields: Record<string, ExtractedField>;
  ocr_summary: {
    engine?: string;
    avg_confidence?: number;
    low_confidence_blocks?: number;
  };
  processing_status: 'queued' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface DocumentFieldsResponse {
  document_id: string;
  fields: Record<string, ExtractedField>;
  raw_ocr_blocks: OCRBlock[];
}

