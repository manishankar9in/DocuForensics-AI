"""Quick health check script - run with: python test_health.py"""
import httpx
import sys
import json

try:
    r = httpx.get("http://127.0.0.1:8000/api/health", timeout=5)
    print("Status:", r.status_code)
    data = r.json()
    print(json.dumps(data, indent=2))
    
    # Test root endpoint too
    r2 = httpx.get("http://127.0.0.1:8000/", timeout=5)
    print("\nRoot:", r2.status_code, r2.json())
    
    sys.exit(0)
except Exception as e:
    print("ERROR:", e)
    sys.exit(1)

