import pytest
from app.services.normalization_service import normalization_service

def test_normalize_names():
    assert normalization_service.normalize_name("Apex Logistics LLC") == "APEX LOGISTICS"
    assert normalization_service.normalize_name("  Apex   Logistics, Inc. ") == "APEX LOGISTICS"
    assert normalization_service.normalize_name("Global Tech Corp") == "GLOBAL TECH"

def test_parse_amounts():
    amt, cur = normalization_service.parse_amount("$14,500.00")
    assert amt == 14500.0
    assert cur == "USD"

    amt, cur = normalization_service.parse_amount("€ 2,450.75")
    assert amt == 2450.75
    assert cur == "EUR"

    amt, cur = normalization_service.parse_amount("invalid")
    assert amt is None

def test_parse_dates():
    assert normalization_service.parse_date("2026-11-02") == "2026-11-02"
    assert normalization_service.parse_date("02/11/2026") == "2026-11-02"
    assert normalization_service.parse_date("November 2, 2026") == "2026-11-02"

