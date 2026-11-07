import re
from typing import Dict, Any
from app.schemas.document_schema import ClassificationResult

class ClassificationService:
    PATTERNS = {
        "invoice": {
            "keywords": [r"\binvoice\b", r"\bbill to\b", r"\bdue date\b", r"\btotal due\b", r"\bsubtotal\b", r"\binvoice no\b"],
            "weight": 1.0
        },
        "bank_statement": {
            "keywords": [r"\bbank\b", r"\bstatement\b", r"\bdeposit\b", r"\bwithdrawal\b", r"\baccount (?:number|no)\b", r"\bcurrent balance\b"],
            "weight": 1.0
        },
        "identity_document": {
            "keywords": [r"\bpassport\b", r"\bdriver'?s license\b", r"\bidentity card\b", r"\bdate of birth\b", r"\bdob\b", r"\bnationality\b"],
            "weight": 1.0
        },
        "contract": {
            "keywords": [r"\bagreement\b", r"\bterms and conditions\b", r"\bparty of the\b", r"\bhereby agree\b", r"\bsignature\b"],
            "weight": 0.9
        }
    }

    def classify_text(self, text: str) -> ClassificationResult:
        if not text:
            return ClassificationResult(predicted_type="unknown", confidence=0.0, rule_basis="Empty document text")

        text_lower = text.lower()
        scores: Dict[str, int] = {}
        matched_rules: Dict[str, list] = {}

        for doc_type, info in self.PATTERNS.items():
            matches = []
            for kw in info["keywords"]:
                if re.search(kw, text_lower):
                    matches.append(kw.replace(r"\b", ""))
            scores[doc_type] = len(matches)
            matched_rules[doc_type] = matches

        best_type = max(scores, key=scores.get)
        max_score = scores[best_type]

        if max_score == 0:
            return ClassificationResult(
                predicted_type="general_document",
                confidence=0.5,
                rule_basis="No strong type-specific keywords matched; categorized as generic document"
            )

        confidence = min(0.98, 0.5 + (max_score * 0.12))
        return ClassificationResult(
            predicted_type=best_type,
            confidence=round(confidence, 2),
            rule_basis=f"Matched keywords: {', '.join(matched_rules[best_type])}"
        )

classification_service = ClassificationService()

