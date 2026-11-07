import io
import os
from pathlib import Path
from typing import List, Tuple, Dict, Any
from PIL import Image
import pytesseract
from pytesseract import Output
from app.config import settings
from app.schemas.document_schema import OCRBlock

class OCRService:
    def __init__(self):
        # Configure tesseract binary path if exists
        cmd_path = Path(settings.TESSERACT_CMD)
        if cmd_path.exists():
            pytesseract.pytesseract.tesseract_cmd = str(cmd_path)

    def is_engine_available(self) -> bool:
        cmd_path = Path(settings.TESSERACT_CMD)
        return cmd_path.exists()

    def run_ocr_on_image_bytes(self, image_bytes: bytes, page_number: int = 1) -> Tuple[str, List[OCRBlock], float]:
        """
        Runs Tesseract OCR on raw image bytes.
        Returns: (full_text, list_of_ocr_blocks_with_normalized_bboxes, avg_confidence)
        """
        if not self.is_engine_available():
            return "", [], 0.0

        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.size
        if width == 0 or height == 0:
            return "", [], 0.0

        try:
            data = pytesseract.image_to_data(image, output_type=Output.DICT)
            words = []
            blocks: List[OCRBlock] = []
            confidences = []

            n_boxes = len(data['text'])
            for i in range(n_boxes):
                text = data['text'][i].strip()
                conf_val = float(data['conf'][i])
                if not text or conf_val < 0:
                    continue

                left = float(data['left'][i])
                top = float(data['top'][i])
                w = float(data['width'][i])
                h = float(data['height'][i])

                # Convert to normalized 0.0 - 1.0 bbox
                x0 = max(0.0, min(1.0, left / width))
                y0 = max(0.0, min(1.0, top / height))
                x1 = max(0.0, min(1.0, (left + w) / width))
                y1 = max(0.0, min(1.0, (top + h) / height))

                confidence = conf_val / 100.0
                words.append(text)
                confidences.append(confidence)

                blocks.append(OCRBlock(
                    text=text,
                    confidence=confidence,
                    page=page_number,
                    bbox=[x0, y0, x1, y1]
                ))

            full_text = " ".join(words)
            avg_conf = (sum(confidences) / len(confidences)) * 100.0 if confidences else 100.0
            return full_text, blocks, round(avg_conf, 1)

        except Exception as e:
            # If tesseract executable not found or failed, return empty blocks and low confidence
            return "", [], 0.0

ocr_service = OCRService()
