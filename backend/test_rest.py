import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test():
    key = os.getenv("GEMINI_API_KEY", "")
    model = os.getenv("PRIMARY_TEXT_MODEL", "gemini-3.1-flash-lite")
    print(f"Key preview: {key[:15]}... Length: {len(key)}")
    print(f"Model: {model}")
    
    payload = {
        "contents": [{"parts": [{"text": "Say hello"}]}]
    }

    # Test 1: URL query parameter ?key=
    print("\n--- Test 1: Query Param ?key= ---")
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload)
            print("Status Code:", res.status_code)
            print("Response:", res.text[:200])
    except Exception as e:
        print("Failed:", e)

    # Test 2: Bearer Header
    print("\n--- Test 2: Bearer Header ---")
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        headers = {"Authorization": f"Bearer {key}"}
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=payload)
            print("Status Code:", res.status_code)
            print("Response:", res.text[:200])
    except Exception as e:
        print("Failed:", e)

if __name__ == "__main__":
    asyncio.run(test())
