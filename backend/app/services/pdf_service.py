import pymupdf as fitz
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.schemas.document_schema import PageDimension, OCRBlock

class PDFService:
    def get_document_info(self, file_path: Path) -> Tuple[int, List[PageDimension], Dict[str, Any]]:
        """
        Extracts page count, page dimensions in points, and PDF metadata.
        """
        doc = fitz.open(file_path)
        page_count = len(doc)
        dimensions: List[PageDimension] = []
        for i in range(page_count):
            page = doc[i]
            rect = page.rect
            dimensions.append(PageDimension(
                page=i + 1,
                width_pts=float(rect.width),
                height_pts=float(rect.height)
            ))
        metadata = dict(doc.metadata) if doc.metadata else {}
        doc.close()
        return page_count, dimensions, metadata

    def extract_text_and_blocks(self, file_path: Path) -> Tuple[str, List[OCRBlock]]:
        """
        Extracts vector text and normalized word bounding boxes from native PDF.
        Normalized coords: 0.0 to 1.0 (x0, y0, x1, y1).
        """
        doc = fitz.open(file_path)
        full_text = []
        blocks: List[OCRBlock] = []

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            w = float(page.rect.width) or 1.0
            h = float(page.rect.height) or 1.0

            # Extract words: (x0, y0, x1, y1, "word", block_no, line_no, word_no)
            words = page.get_text("words")
            page_words = []
            for item in words:
                x0, y0, x1, y1, word = item[0], item[1], item[2], item[3], item[4]
                page_words.append(word)
                blocks.append(OCRBlock(
                    text=word,
                    confidence=1.0,  # Native vector text is 100% confident
                    page=page_num,
                    bbox=[
                        max(0.0, min(1.0, x0 / w)),
                        max(0.0, min(1.0, y0 / h)),
                        max(0.0, min(1.0, x1 / w)),
                        max(0.0, min(1.0, y1 / h))
                    ]
                ))
            full_text.append(" ".join(page_words))

        doc.close()
        return "\n\n".join(full_text), blocks

    def render_page_to_png(self, file_path: Path, page_number: int = 1, dpi: int = 150) -> bytes:
        """
        Renders a given page of a PDF into PNG image bytes at the requested DPI.
        """
        doc = fitz.open(file_path)
        if page_number < 1 or page_number > len(doc):
            page_number = 1
        page = doc[page_number - 1]
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        png_bytes = pix.tobytes("png")
        doc.close()
        return png_bytes

pdf_service = PDFService()
