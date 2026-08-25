import pytest
from app.nlp.extractor import nlp_extractor


def test_nlp_extraction_entities():
    sample_text = (
        "Complainant states Priya Verma called from mobile +91-98765-43210 "
        "instructing transfers to bank account A/C 987654321098. "
        "Suspect vehicle DL-01-AB-1234 driven by Vikram Singh was observed in New Delhi near Connaught Place."
    )

    results = nlp_extractor.extract_all(sample_text)
    assert len(results) >= 4

    types = [r.entity_type for r in results]
    assert "Phone" in types
    assert "Vehicle" in types
    assert "BankAccount" in types
    assert "Person" in types

    # Check vehicle normalized correctly
    veh = next(r for r in results if r.entity_type == "Vehicle")
    assert veh.normalized_value == "DL-01-AB-1234"
    assert veh.confidence >= 0.90
    assert veh.context_snippet != ""

    # Check phone normalized correctly
    phone = next(r for r in results if r.entity_type == "Phone")
    assert phone.normalized_value == "+91-98765-43210"
    assert phone.attributes["is_masked_sensitive"] is True
