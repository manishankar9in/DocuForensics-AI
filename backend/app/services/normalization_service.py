import re
from typing import Optional, Tuple, Any
from datetime import datetime

class NormalizationService:
    def normalize_text(self, text: Optional[str]) -> str:
        if not text:
            return ""
        return " ".join(text.strip().split())

    def normalize_name(self, name: Optional[str]) -> str:
        """
        Normalizes company or individual names for comparison:
        e.g., 'Apex Logistics LLC' -> 'APEX LOGISTICS'
        """
        if not name:
            return ""
        cleaned = re.sub(r"[^\w\s]", "", name).strip().upper()
        # Remove common corporate suffix abbreviations for entity matching
        suffixes = [r"\bLLC\b", r"\bINC\b", r"\bLTD\b", r"\bCORP\b", r"\bCORPORATION\b", r"\bCO\b"]
        for s in suffixes:
            cleaned = re.sub(s, "", cleaned).strip()
        return " ".join(cleaned.split())

    def normalize_id(self, id_str: Optional[str]) -> str:
        """
        Normalizes document reference numbers, invoice numbers, or IDs:
        e.g., ' INV - 8891 ' -> 'INV-8891'
        """
        if not id_str:
            return ""
        return re.sub(r"\s+", "", id_str).strip().upper()

    def parse_amount(self, amount_str: Optional[str]) -> Tuple[Optional[float], Optional[str]]:
        """
        Extracts numerical amount and currency:
        e.g., '$14,500.00' -> (14500.0, 'USD')
        '€ 2,400.50' -> (2400.5, 'EUR')
        """
        if not amount_str:
            return None, None

        currency = "USD"
        if "€" in amount_str or "EUR" in amount_str.upper():
            currency = "EUR"
        elif "£" in amount_str or "GBP" in amount_str.upper():
            currency = "GBP"
        elif "₹" in amount_str or "INR" in amount_str.upper():
            currency = "INR"

        # Extract numerical portion
        cleaned = re.sub(r"[^\d.]", "", amount_str.replace(",", ""))
        try:
            val = float(cleaned)
            return round(val, 2), currency
        except ValueError:
            return None, None

    def parse_date(self, date_str: Optional[str]) -> Optional[str]:
        """
        Parses common date representations into ISO 8601 'YYYY-MM-DD'.
        """
        if not date_str:
            return None

        clean = re.sub(r"[^\w\s/,-]", "", date_str).strip()
        # Normalize commas with space
        clean = re.sub(r",\s*", ", ", clean)

        formats = [
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%d-%m-%Y",
            "%m-%d-%Y",
            "%B %d, %Y",
            "%B %d %Y",
            "%b %d, %Y",
            "%b %d %Y",
            "%d %B %Y",
            "%d %b %Y",
            "%Y/%m/%d"
        ]

        for fmt in formats:
            try:
                dt = datetime.strptime(clean, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue

        # Fallback regex for YYYY-MM-DD
        m = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", clean)
        if m:
            y, mth, d = m.groups()
            return f"{y}-{int(mth):02d}-{int(d):02d}"

        return None

normalization_service = NormalizationService()
