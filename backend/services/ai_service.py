import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import httpx
import asyncio
import base64
from io import BytesIO
from PIL import Image

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key and "your_" not in api_key:
    genai.configure(api_key=api_key)

class AIService:
    def __init__(self):
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
        self.text_model = "tinyllama"
        self.vision_model = "moondream"

    async def _call_ollama(self, prompt: str, model=None, images=None, is_json=True):
        try:
            payload = {"model": model or self.text_model, "prompt": prompt, "stream": False}
            if is_json: payload["format"] = "json"
            if images: payload["images"] = images
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(f"{self.ollama_host}/api/generate", json=payload)
                if response.status_code == 200: return response.json().get("response")
        except: pass
        return None

    def _clean_json(self, text: str):
        try:
            text = text.strip()
            if "```json" in text: text = text.split("```json")[1].split("```")[0]
            elif "```" in text: text = text.split("```")[1].split("```")[0]
            return text.strip()
        except:
            return "{}"

    async def detect_all_objects(self, image: Image.Image):
        prompt = """
        Identify 3 main objects in this image for an IELTS learner. 
        Return ONLY a JSON array of objects with these fields:
        - word: English word
        - meaning: Vietnamese translation
        - phonetic: IPA pronunciation
        - box: [ymin, xmin, ymax, xmax] (normalized 0-1)
        
        Example: [{"word": "Apple", "meaning": "Quả táo", "phonetic": "/ˈæp.əl/", "box": [0.1, 0.1, 0.3, 0.3]}]
        """
        try:
            buffered = BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            res = await self._call_ollama(prompt, model=self.vision_model, images=[img_str])
            if res:
                try:
                    items = json.loads(self._clean_json(res))
                    for i, item in enumerate(items):
                        if "box" not in item: item["box"] = [0.2 + i*0.2, 0.2 + i*0.2, 0.4 + i*0.2, 0.4 + i*0.2]
                    return items
                except json.JSONDecodeError:
                    print("JSON Decode Error in detect_all_objects")
        except Exception as e:
            print(f"Object detection failed: {e}")
        return []

    async def refine_vocabulary(self, word: str):
        prompt = f"""
        Provide IELTS learning details for the word: "{word}"
        Return ONLY valid JSON:
        {{
            "word": "{word}",
            "meaning": "Vietnamese translation",
            "phonetic": "IPA pronunciation",
            "example": "A useful example sentence for IELTS"
        }}
        """
        try:
            res = await self._call_ollama(prompt)
            if res: 
                return json.loads(self._clean_json(res))
        except Exception as e:
            print(f"Refine vocabulary failed: {e}")
        return {"word": word, "meaning": word, "phonetic": "/.../", "example": ""}

    async def analyze_writing(self, text: str):
        prompt = f"""
        Bạn là một giám khảo IELTS cực kỳ khắt khe (Strict IELTS Examiner). Hãy chấm điểm và phân tích bài viết sau: "{text}"
        
        Yêu cầu nghiêm ngặt:
        1. Chấm điểm Band Score (từ 0.0 đến 9.0).
        2. Nhận xét chi tiết bằng tiếng Việt (Task Response, Coherence, Vocabulary, Grammar).
        3. Đưa ra 3 gợi ý cụ thể bằng tiếng Việt để nâng band điểm.
        4. Bắt lỗi chính tả và ngữ pháp cực kỳ chi tiết. Với mỗi lỗi, trong phần 'reason', bạn phải giải thích rõ bằng tiếng Việt.
        
        Trả về DUY NHẤT định dạng JSON (thay thế các dòng chữ trong ngoặc kép bằng nội dung thật do bạn viết):
        {{
            "band_score": 5.0,
            "feedback": "Nhận xét chi tiết của bạn ở đây",
            "suggestions": ["Gợi ý 1", "Gợi ý 2", "Gợi ý 3"],
            "corrections": [
                {{"original": "từ bị sai", "corrected": "từ đã sửa", "reason": "Lý do sai"}}
            ]
        }}
        """
        
        # Chỉ dùng Ollama theo yêu cầu
        for model_name in ["tinyllama", "phi3"]:
            try:
                print(f"--- Using Ollama model: {model_name} ---")
                async with httpx.AsyncClient(timeout=180.0) as client:
                    response = await client.post(
                        f"{self.ollama_host}/api/generate",
                        json={
                            "model": model_name,
                            "prompt": prompt,
                            "stream": False,
                            "format": "json"
                        }
                    )
                    if response.status_code == 200:
                        raw_data = response.json().get("response", "{}")
                        cleaned_data = self._clean_json(raw_data)
                        try:
                            return json.loads(cleaned_data)
                        except json.JSONDecodeError:
                            print(f"JSON Decode Error with {model_name}")
            except Exception as e:
                print(f"Ollama {model_name} failed: {str(e)[:100]}...")

        return {
            "band_score": "N/A", 
            "feedback": "Lỗi xử lý ngôn ngữ hoặc mạng bị chậm. Vui lòng thử lại.", 
            "suggestions": ["Kiểm tra kết nối mạng"],
            "corrections": []
        }

    async def get_encouragement(self):
        try:
            res = await self._call_ollama("Chào học sinh IELTS ngắn gọn, dễ thương tiếng Việt.")
            if res: return res.strip()
        except:
            pass
        return "Chào mừng bạn đến với Oasis! 🌴"

ai_service = AIService()
