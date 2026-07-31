import os
import asyncio
import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

async def test():
    key = os.getenv("GEMINI_API_KEY", "")
    model = os.getenv("PRIMARY_TEXT_MODEL", "gemini-3.1-flash-lite")
    print(f"Key preview: {key[:15]}... Length: {len(key)}")
    print(f"Model: {model}")
    
    # Test OpenAI compatibility
    print("\n--- Testing OpenAI SDK (Text) ---")
    try:
        client = AsyncOpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=key if key else "dummy-key",
        )
        res = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=10
        )
        print("OpenAI SDK Success:", res.choices[0].message.content)
    except Exception as e:
        print("OpenAI SDK Failed:", e)

if __name__ == "__main__":
    asyncio.run(test())
