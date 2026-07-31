import os
import asyncio
import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

async def test():
    key = os.getenv("GEMINI_API_KEY", "")
    print(f"Key preview: {key[:15]}... Length: {len(key)}")
    
    # Test OpenAI compatibility
    print("\n--- Testing OpenAI SDK (Text) ---")
    try:
        client = AsyncOpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=key if key else "dummy-key",
        )
        res = await client.chat.completions.create(
            model="gemini-1.5-flash",
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=10
        )
        print("OpenAI SDK Success:", res.choices[0].message.content)
    except Exception as e:
        print("OpenAI SDK Failed:", e)

    # Test REST with ?key=
    print("\n--- Testing REST with ?key= ---")
    url_key = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "Say hello"}]}]}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url_key, json=payload)
            print(f"REST ?key= Status: {res.status_code}")
            print("REST ?key= Response:", res.text[:200])
    except Exception as e:
        print("REST ?key= Failed:", e)

    # Test REST with Bearer Token
    print("\n--- Testing REST with Bearer Token ---")
    url_bearer = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {"Authorization": f"Bearer {key}"}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url_bearer, headers=headers, json=payload)
            print(f"REST Bearer Status: {res.status_code}")
            print("REST Bearer Response:", res.text[:200])
    except Exception as e:
        print("REST Bearer Failed:", e)

if __name__ == "__main__":
    asyncio.run(test())
