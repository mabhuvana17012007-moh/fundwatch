import hashlib
from typing import Union

def calculate_sha256(data: Union[bytes, str]) -> str:
    """
    Calculate the SHA-256 cryptographic hash of binary data or string.
    
    IMPORTANT SYSTEM INTEGRITY NOTE:
    A SHA-256 hash mathematically detects any subsequent tampering or bit-level 
    modification of the stored evidence file. It does not by itself prove 
    photographic authenticity or ground truth, but provides non-repudiation 
    of file preservation.
    """
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()

def verify_file_integrity(expected_hash: str, data: Union[bytes, str]) -> bool:
    """
    Verifies if provided file matches the expected stored SHA-256 hash.
    """
    computed_hash = calculate_sha256(data)
    return computed_hash.lower() == expected_hash.lower()
