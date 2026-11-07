import re
from typing import Dict, List, Optional, Tuple
from app.schemas.document_schema import ExtractedField, OCRBlock
from app.services.normalization_service import normalization_service

class ExtractionService:
    def extract_fields(self, full_text: str, blocks: List[OCRBlock]) -> Dict[str, ExtractedField]:
        fields: Dict[str, ExtractedField] = {}

        # 1. Invoice / Document Reference Number
        inv_match = re.search(r"(?:invoice\s*(?:no|number|#)?|ref(?:erence)?\s*(?:no|#)?|doc\s*#?)[:\s]*([A-Z0-9-]{3,20})", full_text, re.IGNORECASE)
        if inv_match:
            raw_val = inv_match.group(1).strip()
            bbox, page = self._find_word_bbox(raw_val, blocks)
            fields["document_number"] = ExtractedField(
                key="document_number",
                raw_value=raw_val,
                normalized_value=normalization_service.normalize_id(raw_val),
                confidence=0.96 if bbox else 0.85,
                page=page,
                bbox=bbox,
                source_type="ocr" if bbox else "regex"
            )

        # 2. Date
        date_match = re.search(r"(?:date|issue\s*date|dated)[:\s]*([0-9]{1,4}[-/.][0-9]{1,2}[-/.][0-9]{1,4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4}|[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})", full_text, re.IGNORECASE)
        if date_match:
            raw_date = date_match.group(1).strip()
            bbox, page = self._find_word_bbox(raw_date.split()[0], blocks)
            norm_date = normalization_service.parse_date(raw_date)
            fields["date"] = ExtractedField(
                key="date",
                raw_value=raw_date,
                normalized_value=norm_date,
                confidence=0.95 if norm_date else 0.70,
                page=page,
                bbox=bbox,
                source_type="ocr" if bbox else "regex"
            )

        # 3. Total Amount
        amount_match = re.search(r"(?:total|amount\s*due|balance\s*due|grand\s*total|net\s*amount)[:\s]*([$€£₹]?\s*[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)", full_text, re.IGNORECASE)
        if amount_match:
            raw_amt = amount_match.group(1).strip()
            amt_num, currency = normalization_service.parse_amount(raw_amt)
            bbox, page = self._find_word_bbox(raw_amt.split()[-1].replace("$", "").replace("€", ""), blocks)
            fields["total_amount"] = ExtractedField(
                key="total_amount",
                raw_value=raw_amt,
                normalized_value=amt_num,
                confidence=0.98 if amt_num is not None else 0.70,
                page=page,
                bbox=bbox,
                source_type="ocr" if bbox else "regex"
            )

        # 4. Entity / Vendor Name
        vendor_match = re.search(r"(?:from|vendor|biller|company|supplier)[:\s]*([A-Za-z0-9\s.,&'-]{3,40}(?:LLC|Inc|Corp|Ltd|GmbH|Services|Solutions)?)", full_text, re.IGNORECASE)
        if vendor_match:
            raw_vendor = vendor_match.group(1).strip().split("\n")[0]
            bbox, page = self._find_word_bbox(raw_vendor.split()[0], blocks)
            fields["vendor_name"] = ExtractedField(
                key="vendor_name",
                raw_value=raw_vendor,
                normalized_value=normalization_service.normalize_name(raw_vendor),
                confidence=0.90 if bbox else 0.75,
                page=page,
                bbox=bbox,
                source_type="ocr" if bbox else "regex"
            )

        # 5. Client / Recipient Name
        client_match = re.search(r"(?:to|bill\s*to|client|customer)[:\s]*([A-Za-z0-9\s.,&'-]{3,40}(?:LLC|Inc|Corp|Ltd)?)", full_text, re.IGNORECASE)
        if client_match:
            raw_client = client_match.group(1).strip().split("\n")[0]
            bbox, page = self._find_word_bbox(raw_client.split()[0], blocks)
            fields["client_name"] = ExtractedField(
                key="client_name",
                raw_value=raw_client,
                normalized_value=normalization_service.normalize_name(raw_client),
                confidence=0.90 if bbox else 0.75,
                page=page,
                bbox=bbox,
                source_type="ocr" if bbox else "regex"
            )

        return fields

    def _find_word_bbox(self, search_word: str, blocks: List[OCRBlock]) -> Tuple[Optional[List[float]], int]:
        """
        Locates the first OCR block containing or matching the target token.
        Returns: (bbox, page_number)
        """
        if not search_word:
            return None, 1

        clean_target = re.sub(r"[^\w]", "", search_word).lower()
        if not clean_target:
            return None, 1

        for block in blocks:
            clean_block = re.sub(r"[^\w]", "", block.text).lower()
            if clean_target in clean_block or clean_block in clean_target:
                return block.bbox, block.page

        return None, 1

extraction_service = ExtractionService()
