"""
Hybrid NLP & Regex Entity Extraction Engine
===========================================
Combines spaCy NER (en_core_web_sm) with domain-specific Indian context
regex patterns for high-precision, explainable entity recognition.
"""

from typing import List, Dict, Any
import spacy
from dataclasses import dataclass, asdict
from app.nlp.patterns import (
    BANK_ACCOUNT_PATTERN,
    PHONE_PATTERN,
    VEHICLE_PATTERN,
    CASE_REF_PATTERN,
    normalize_phone,
    normalize_vehicle,
)


@dataclass
class ExtractedEntityResult:
    entity_type: str
    raw_value: str
    normalized_value: str
    confidence: float
    char_start: int
    char_end: int
    context_snippet: str
    extraction_method: str
    attributes: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class NLPEntityExtractor:
    """Hybrid entity extractor utilizing spaCy and Indian-context regexes."""

    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            self.nlp = spacy.blank("en")
            if "sentencizer" not in self.nlp.pipe_names:
                self.nlp.add_pipe("sentencizer")

    def _extract_context_snippet(self, text: str, start: int, end: int, window: int = 45) -> str:
        snippet_start = max(0, start - window)
        snippet_end = min(len(text), end + window)
        snippet = text[snippet_start:snippet_end].replace("\n", " ").strip()
        if snippet_start > 0:
            snippet = f"...{snippet}"
        if snippet_end < len(text):
            snippet = f"{snippet}..."
        return snippet

    def extract_all(self, raw_text: str) -> List[ExtractedEntityResult]:
        """Extracts structured and unstructured entities from text with explainable spans."""
        if not raw_text or not raw_text.strip():
            return []

        results: List[ExtractedEntityResult] = []
        occupied_spans: List[tuple[int, int]] = []

        def is_overlapping(start: int, end: int) -> bool:
            for s, e in occupied_spans:
                if max(start, s) < min(end, e):
                    return True
            return False

        # --- 1. Structured Regex Extractions ---

        # 1a. Bank Accounts (High priority to avoid 12-digit number getting claimed by 10-digit phone regex)
        for match in BANK_ACCOUNT_PATTERN.finditer(raw_text):
            raw_val = match.group(1) or match.group(0)
            raw_val = raw_val.strip()
            start, end = match.span()
            if len(raw_val) >= 9 and not is_overlapping(start, end):
                norm_val = raw_val
                occupied_spans.append((start, end))
                results.append(
                    ExtractedEntityResult(
                        entity_type="BankAccount",
                        raw_value=raw_val,
                        normalized_value=norm_val,
                        confidence=0.95,
                        char_start=start,
                        char_end=end,
                        context_snippet=self._extract_context_snippet(raw_text, start, end),
                        extraction_method="regex_pattern",
                        attributes={"is_masked_sensitive": True},
                    )
                )

        # 1b. Vehicles
        for match in VEHICLE_PATTERN.finditer(raw_text):
            raw_val = match.group(0).strip()
            start, end = match.span()
            if not is_overlapping(start, end):
                norm_val = normalize_vehicle(raw_val)
                occupied_spans.append((start, end))
                results.append(
                    ExtractedEntityResult(
                        entity_type="Vehicle",
                        raw_value=raw_val,
                        normalized_value=norm_val,
                        confidence=0.94,
                        char_start=start,
                        char_end=end,
                        context_snippet=self._extract_context_snippet(raw_text, start, end),
                        extraction_method="regex_pattern",
                        attributes={"is_masked_sensitive": False},
                    )
                )

        # 1c. Phone numbers
        for match in PHONE_PATTERN.finditer(raw_text):
            raw_val = match.group(0).strip()
            start, end = match.span()
            if not is_overlapping(start, end):
                norm_val = normalize_phone(raw_val)
                occupied_spans.append((start, end))
                results.append(
                    ExtractedEntityResult(
                        entity_type="Phone",
                        raw_value=raw_val,
                        normalized_value=norm_val,
                        confidence=0.96,
                        char_start=start,
                        char_end=end,
                        context_snippet=self._extract_context_snippet(raw_text, start, end),
                        extraction_method="regex_pattern",
                        attributes={"is_masked_sensitive": True},
                    )
                )

        # 1d. Case / FIR References
        for match in CASE_REF_PATTERN.finditer(raw_text):
            raw_val = (match.group(1) or match.group(2) or match.group(0)).strip()
            start, end = match.span()
            if not is_overlapping(start, end):
                occupied_spans.append((start, end))
                results.append(
                    ExtractedEntityResult(
                        entity_type="Case",
                        raw_value=raw_val,
                        normalized_value=raw_val.upper(),
                        confidence=0.98,
                        char_start=start,
                        char_end=end,
                        context_snippet=self._extract_context_snippet(raw_text, start, end),
                        extraction_method="regex_pattern",
                        attributes={},
                    )
                )

        # --- 2. spaCy Semantic NER Extractions ---
        doc = self.nlp(raw_text)
        label_map = {
            "PERSON": "Person",
            "ORG": "Organisation",
            "GPE": "Location",
            "LOC": "Location",
            "FAC": "Location",
            "DATE": "Date",
        }

        for ent in doc.ents:
            if ent.label_ in label_map:
                start, end = ent.start_char, ent.end_char
                if not is_overlapping(start, end):
                    raw_val = ent.text.strip()
                    if len(raw_val) < 2 or raw_val.isdigit():
                        continue

                    e_type = label_map[ent.label_]
                    norm_val = " ".join(raw_val.split())
                    if e_type == "Person":
                        norm_val = norm_val.title()

                    occupied_spans.append((start, end))
                    results.append(
                        ExtractedEntityResult(
                            entity_type=e_type,
                            raw_value=raw_val,
                            normalized_value=norm_val,
                            confidence=0.86,
                            char_start=start,
                            char_end=end,
                            context_snippet=self._extract_context_snippet(raw_text, start, end),
                            extraction_method="spacy_ner",
                            attributes={"ner_label": ent.label_},
                        )
                    )

        results.sort(key=lambda r: r.char_start)
        return results


nlp_extractor = NLPEntityExtractor()
