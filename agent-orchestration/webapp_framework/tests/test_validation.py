"""Tests for validation module."""
import pytest
from webapp_framework.validation.validator import Validator
from webapp_framework.validation import rules

class TestValidator:
    def test_validate_required(self):
        v = Validator()
        assert v.validate_required("value", "field") == True
        assert v.validate_required("", "field") == False
    
    def test_validate_email(self):
        v = Validator()
        assert v.validate_email("test@example.com") == True
        assert v.validate_email("invalid") == False
    
    def test_validate_min_length(self):
        v = Validator()
        assert v.validate_min_length("hello", 3) == True
        assert v.validate_min_length("hi", 5) == False
    
    def test_get_errors(self):
        v = Validator()
        v.validate_required("", "field")
        errors = v.get_errors()
        assert len(errors) > 0

class TestRules:
    def test_required(self):
        assert rules.required("value") == True
        assert rules.required("") == False
    
    def test_is_email(self):
        assert rules.is_email("test@example.com") == True
        assert rules.is_email("invalid") == False
    
    def test_is_numeric(self):
        assert rules.is_numeric("123") == True
        assert rules.is_numeric("abc") == False
    
    def test_min_length(self):
        assert rules.min_length("hello", 3) == True
        assert rules.min_length("hi", 5) == False
