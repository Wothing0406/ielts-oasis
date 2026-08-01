import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test():
    key = os.getenv("GEMINI_API_KEY", "")
    print(f"Key preview: {key[:15]}... Length: {len(key)}")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        print("Status Code:", res.status_code)
        if res.status_code == 200:
            data = res.json()
            models = [m["name"] for m in data.get("models", [])]
            print("Available models:")
            for m in models:
                print(" -", m)
        else:
            print("Response:", res.text)

if __name__ == "__main__":
    asyncio.run(test())
