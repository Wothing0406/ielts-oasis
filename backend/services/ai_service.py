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
        prompt = "Identify 3 main objects. Return JSON array: [{\"word\": \"...\", \"meaning\": \"...\", \"phonetic\": \"...\", \"box\": [ymin, xmin, ymax, xmax]}]"
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            res = await model.generate_content_async([prompt, image])
            return json.loads(self._clean_json(res.text))
        except: pass
        try:
            buffered = BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            res = await self._call_ollama("List 3 objects: word, meaning, phonetic. JSON.", model=self.vision_model, images=[img_str])
            if res:
                items = json.loads(self._clean_json(res))
                for i, item in enumerate(items):
                    if "box" not in item: item["box"] = [0.2 + i*0.2, 0.2 + i*0.2, 0.4 + i*0.2, 0.4 + i*0.2]
                return items
        except: pass
        return []

    async def refine_vocabulary(self, word: str):
        prompt = f"IELTS details for '{word}'. JSON: {{\"word\": \"{word}\", \"meaning\": \"VN\", \"phonetic\": \"IPA\", \"example\": \"...\"}}"
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
        You are a strict IELTS Writing Examiner. Analyze the following essay: "{text}"
        
        CRITICAL GRADING RULES:
        1. If the text is too short (e.g., under 50 words), give a very low band score (1.0-3.0) and be blunt about the lack of content.
        2. Point out EVERY single mistake: Spelling, Grammar, Punctuation.
        3. Use the 4 official IELTS criteria: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
        
        Return ONLY a JSON object with this exact structure:
        {{
            "band_score": "float (e.g. 5.5)",
            "feedback": "Overall strict critique (Vietnamese)",
            "suggestions": ["List of 3 specific improvements (Vietnamese)"],
            "corrections": [
                {{"original": "mistake", "corrected": "fix", "reason": "why (Vietnamese)"}}
            ]
        }}
        """
        # Try multiple models in case one is not available in the user's region/key
        models_to_try = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
        last_error = ""
        
        for model_name in models_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                res = await model.generate_content_async(prompt)
                return json.loads(self._clean_json(res.text))
            except Exception as e:
                last_error = str(e)
                print(f"Model {model_name} failed: {e}")
                continue
        
        # If all fail
        return {
            "band_score": "Error", 
            "feedback": f"Lỗi kết nối AI: {last_error}. Hãy kiểm tra API Key hoặc phiên bản thư viện.", 
            "suggestions": ["Thử lại sau vài phút"],
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
