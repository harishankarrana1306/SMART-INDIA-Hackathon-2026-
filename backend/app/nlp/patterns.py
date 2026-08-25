"""
Regex and Pattern Rules for Indian Context Entity Extraction
============================================================
Handles Indian Phone Numbers, Vehicles, Bank Accounts/IFSC,
and Case / FIR Numbers.
"""

import re
from typing import Pattern

# 1. Bank Account Numbers & Context (9-18 digits preceded by A/C, Account, Acc, etc.)
BANK_ACCOUNT_PATTERN: Pattern = re.compile(
    r"(?:A\/C|Account|Acc|A\/c|Acct)\s*(?:No\.?|Number)?\s*[:\-]?\s*([0-9]{9,18})\b|"
    r"\b([0-9]{11,18})\b(?=.*(?:bank|transferred|branch|ifsc|wire))",
    re.IGNORECASE,
)

# 2. Indian Phone Numbers with strict word boundaries and 10 digit constraint
PHONE_PATTERN: Pattern = re.compile(
    r"(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b|"
    r"(?:\+91[\-\s]?)?\b[6-9]\d{9}\b|"
    r"\b0[6-9]\d{9}\b"
)

# 3. Indian Vehicle Registration (e.g. DL-01-AB-1234, DL01AB1234, HR-26-DQ-5544, MH 12 CD 9988)
VEHICLE_PATTERN: Pattern = re.compile(
    r"\b([A-Z]{2}[\-\s]?[0-9]{1,2}[\-\s]?[A-Z]{1,3}[\-\s]?[0-9]{4})\b",
    re.IGNORECASE,
)

# 4. Indian Financial System Code (IFSC) (e.g. SBIN0001234, HDFC0004567, ICIC0008910)
IFSC_PATTERN: Pattern = re.compile(
    r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
    re.IGNORECASE,
)

# 5. Case Reference Patterns (FIC-CASE-XXXX, FIR No. 123/2026)
CASE_REF_PATTERN: Pattern = re.compile(
    r"\b(FIC-CASE-[0-9]{4})\b|"
    r"\b(FIR\s*No\.?\s*[0-9]+(?:\/[0-9]{2,4})?)\b",
    re.IGNORECASE,
)


def normalize_phone(raw: str) -> str:
    """Normalizes phone string to standard +91-XXXXXXXXXX format."""
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    if len(digits) == 10:
        return f"+91-{digits[:5]}-{digits[5:]}"
    return raw.strip()


def normalize_vehicle(raw: str) -> str:
    """Normalizes vehicle license plate to uppercase standard format (e.g. DL-01-AB-1234)."""
    cleaned = re.sub(r"[\s\-]", "", raw).upper()
    match = re.match(r"^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$", cleaned)
    if match:
        state, rto, series, number = match.groups()
        return f"{state}-{rto.zfill(2)}-{series}-{number}"
    return raw.strip().upper()
