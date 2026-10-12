# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""Isolated RFC 8017 RSASSA-PKCS1-v1_5 SHA-256 feasibility probe.

This probe intentionally has no trust policy or admission behavior. It tests
the exact RSA verification primitive using only Python integer arithmetic and
hashlib, before any production contract relies on it.
"""

import hashlib
from genlayer import *


SHA256_DIGEST_INFO_PREFIX = bytes.fromhex("3031300d060960864801650304020105000420")
MIN_RSA_BITS = 2048
MAX_RSA_BITS = 4096
PUBLIC_EXPONENT = 65537


def _decode_hex(value: str) -> bytes:
    if not value or len(value) % 2 != 0:
        return b""
    try:
        return bytes.fromhex(value)
    except Exception:
        return b""


def verify_rsa_sha256(message: bytes, signature_hex: str,
                      modulus_hex: str, exponent_hex: str) -> bool:
    """Verify strict EMSA-PKCS1-v1_5 encoding as specified in RFC 8017."""
    modulus_bytes = _decode_hex(modulus_hex)
    signature = _decode_hex(signature_hex)
    exponent_bytes = _decode_hex(exponent_hex)
    if not modulus_bytes or not signature or not exponent_bytes:
        return False
    if len(modulus_bytes) > MAX_RSA_BITS // 8 or len(modulus_bytes) < MIN_RSA_BITS // 8:
        return False

    modulus = int.from_bytes(modulus_bytes, "big")
    exponent = int.from_bytes(exponent_bytes, "big")
    if modulus.bit_length() < MIN_RSA_BITS or modulus.bit_length() > MAX_RSA_BITS:
        return False
    if exponent != PUBLIC_EXPONENT or modulus % 2 == 0:
        return False

    encoded_length = (modulus.bit_length() + 7) // 8
    if len(signature) != encoded_length:
        return False
    signature_value = int.from_bytes(signature, "big")
    if signature_value >= modulus:
        return False

    digest_info = SHA256_DIGEST_INFO_PREFIX + hashlib.sha256(message).digest()
    padding_length = encoded_length - len(digest_info) - 3
    if padding_length < 8:
        return False
    expected = b"\x00\x01" + (b"\xff" * padding_length) + b"\x00" + digest_info
    actual_value = pow(signature_value, exponent, modulus)
    actual = actual_value.to_bytes(encoded_length, "big")
    return actual == expected


class RsaSignatureProbe(gl.Contract):
    def __init__(self):
        pass

    @gl.public.view
    def verify(self, message: str, signature_hex: str,
               modulus_hex: str, exponent_hex: str) -> bool:
        return verify_rsa_sha256(message.encode("utf-8"), signature_hex,
                                 modulus_hex, exponent_hex)
