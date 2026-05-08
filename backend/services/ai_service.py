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
        text = text.strip()
        if "```json" in text: text = text.split("```json")[1].split("```")[0]
        elif "```" in text: text = text.split("```")[1].split("```")[0]
        return text.strip()

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
            model = genai.GenerativeModel('gemini-1.5-flash')
            res = await model.generate_content_async([prompt, image])
            return json.loads(self._clean_json(res.text))
        except: pass
        try:
            buffered = BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            res = await self._call_ollama(prompt, model=self.vision_model, images=[img_str])
            if res:
                items = json.loads(self._clean_json(res))
                for i, item in enumerate(items):
                    if "box" not in item: item["box"] = [0.2 + i*0.2, 0.2 + i*0.2, 0.4 + i*0.2, 0.4 + i*0.2]
                return items
        except: pass
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
            model = genai.GenerativeModel('gemini-1.5-flash')
            res = await model.generate_content_async(prompt)
            return json.loads(self._clean_json(res.text))
        except:
            res = await self._call_ollama(prompt)
            if res: return json.loads(self._clean_json(res))
        return {"word": word, "meaning": word, "phonetic": "/.../", "example": ""}

    async def analyze_writing(self, text: str):
        prompt = f"""
        Bạn là một giám khảo IELTS cực kỳ khắt khe (Strict IELTS Examiner). Hãy chấm điểm và phân tích bài viết sau: "{text}"
        
        Yêu cầu nghiêm ngặt:
        1. Chấm điểm Band Score (từ 0.0 đến 9.0). Đừng quá nương tay, hãy chấm đúng trình độ IELTS.
        2. Nhận xét chi tiết bằng tiếng Việt (Task Response, Coherence, Vocabulary, Grammar).
        3. Đưa ra 3 gợi ý cụ thể bằng tiếng Việt để nâng band điểm.
        4. Bắt lỗi chính tả và ngữ pháp cực kỳ chi tiết. Với mỗi lỗi, trong phần 'reason', bạn phải giải thích rõ bằng tiếng Việt theo kiểu: "Bạn lỗi chính tả ở chỗ chữ 'abc' đáng ra phải là 'xyz'" hoặc "Lỗi ngữ pháp: bạn dùng thì quá khứ ở đây là sai, phải dùng hiện tại hoàn thành vì...".
        
        Trả về DUY NHẤT định dạng JSON:
        {{
            "band_score": 5.0,
            "feedback": "Nhận xét khắt khe bằng tiếng Việt...",
            "suggestions": ["Gợi ý nâng band 1", "Gợi ý nâng band 2", "Gợi ý nâng band 3"],
            "corrections": [
                {{
                    "original": "từ_sai", 
                    "corrected": "từ_đúng", 
                    "reason": "Giải thích chi tiết lỗi sai và tại sao phải sửa như vậy bằng tiếng Việt"
                }}
            ]
        }}
        """
        
        # 1. Try Gemini first (Best quality)
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            res = await model.generate_content_async(prompt)
            return json.loads(self._clean_json(res.text))
        except Exception as e:
            print(f"Gemini failed for analysis: {e}")
            
        # 2. Fallback to Ollama Phi-3 or TinyLlama
        models = ["phi3", "tinyllama"]
        for model_name in models:
            try:
                async with httpx.AsyncClient(timeout=90.0) as client:
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
                        data = response.json()
                        return json.loads(data.get("response", "{}"))
            except Exception as e:
                print(f"Ollama {model_name} failed: {e}")

        return {
            "band_score": "N/A", 
            "feedback": "Không thể kết nối AI để chấm điểm lúc này. Vui lòng thử lại sau.", 
            "suggestions": ["Kiểm tra kết nối mạng hoặc Ollama"],
            "corrections": []
        }

    async def get_encouragement(self):
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            res = await model.generate_content_async("Chào học sinh IELTS ngắn gọn, dễ thương tiếng Việt.")
            return res.text.strip()
        except:
            return "Chào mừng bạn đến với Oasis! 🌴"

ai_service = AIService()
