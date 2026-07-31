import asyncio
from services.ai_service import ai_service

async def main():
    print("--- Test Sentence (Easy) ---")
    s = await ai_service.generate_speaking_sentence("easy")
    print("Sentence:", s)
    
    print("\n--- Test Cuecard (Medium) ---")
    c = await ai_service.generate_speaking_cuecard("medium")
    print("Cuecard:", c)
    
    print("\n--- Test Guide ---")
    g = await ai_service.generate_pronunciation_guide("The weather is nice.")
    print("Guide:", g)

if __name__ == "__main__":
    asyncio.run(main())
