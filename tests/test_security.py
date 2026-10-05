import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token, is_college_email


def test_hash_and_verify_password():
    password = "MySecret@123"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)


def test_create_and_decode_access_token():
    data = {"sub": "user-uuid-123"}
    token = create_access_token(data)
    payload = decode_token(token)
    assert payload["sub"] == "user-uuid-123"
    assert payload["type"] == "access"


def test_is_college_email():
    assert is_college_email("student@sctce.ac.in")
    assert is_college_email("abcd@college.ac.in")
    assert is_college_email("amal@sctce.ac.in")
    assert is_college_email("student@college.edu")
    assert is_college_email("john@university.edu")
    assert is_college_email("alice@cs.college.edu")
    assert not is_college_email("user@gmail.com")
    assert not is_college_email("user@company.com")
