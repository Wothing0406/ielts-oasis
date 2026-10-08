# -*- coding: utf-8 -*-
import os
import re
import json
import httpx
import base64
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
from openai import AsyncOpenAI
from datetime import datetime, timezone, timedelta

load_dotenv()

def get_current_realtime_context() -> dict:
    """Lấy thông tin ngày giờ thực tế theo múi giờ Việt Nam (GMT+7)"""
    vn_tz = timezone(timedelta(hours=7))
    now = datetime.now(vn_tz)
    weekday_names = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
    weekday_str = weekday_names[now.weekday()]
    return {
        "now": now,
        "year": now.year,
        "date_str": now.strftime("%d/%m/%Y"),
        "time_str": now.strftime("%H:%M:%S"),
        "weekday": weekday_str,
        "full_text": f"{weekday_str}, ngày {now.day:02d} tháng {now.month:02d} năm {now.year}, lúc {now.strftime('%H:%M')} (Giờ Việt Nam GMT+7)"
    }

class AIService:
    def __init__(self):
        # API Keys pool: Support GEMINI_API_KEY, GEMINI_API_KEY_BACKUP, or GEMINI_API_KEYS (comma separated)
        raw_keys = os.getenv("GEMINI_API_KEYS", "")
        keys_list = [k.strip() for k in raw_keys.split(",") if k.strip()]
        if not keys_list:
            primary = os.getenv("GEMINI_API_KEY", "").strip()
            if primary: keys_list.append(primary)
            backup = os.getenv("GEMINI_API_KEY_BACKUP", "").strip()
            if backup and backup not in keys_list: keys_list.append(backup)

        self.api_keys = keys_list if keys_list else ["dummy-key"]
        self.gemini_api_key = self.api_keys[0]
        
        self.client = AsyncOpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=self.gemini_api_key,
            max_retries=0,
            timeout=15.0
        )
        
        # Primary models via Gemini API
        # TUTOR_MODEL: high-IQ reasoning for Chatbot / Tutor (Gemini 3.8 Flash)
        # PRIMARY_TEXT_MODEL: economical model for bulk tasks (OCR, Wordle, simple translations)
        self.tutor_model = os.getenv("TUTOR_MODEL", "gemini-3.1-flash-lite")
        self.primary_text_model = os.getenv("PRIMARY_TEXT_MODEL", "gemini-3.1-flash-lite")
        self.primary_vision_model = os.getenv("PRIMARY_VISION_MODEL", "gemini-3.1-flash-lite")
        
        # Load wordle keywords
        current_dir = os.path.dirname(os.path.abspath(__file__))
        keywords_path = os.path.join(current_dir, "wordle_keywords.json")
        try:
            with open(keywords_path, "r", encoding="utf-8") as f:
                self.wordle_keywords = json.load(f)
        except Exception as e:
            print(f"Failed to load wordle_keywords.json: {e}")
            self.wordle_keywords = ["WATER", "OASIS", "GREEN", "STUDY", "CLONE", "FOCUS", "TRAIN", "LEMON", "SMILE", "BASIC"]
        


    def _clean_json(self, text: str, expect_list=False):
        try:
            text = text.strip()
            if "```json" in text: text = text.split("```json")[1].split("```")[0]
            elif "```" in text: text = text.split("```")[1].split("```")[0]
            return text.strip()
        except Exception:
            return "[]" if expect_list else "{}"

    async def detect_all_objects(self, image: Image.Image):
        prompt = """
You are an IELTS vocabulary assistant. Look at this image carefully and identify ALL visible distinct objects.
Return ONLY a JSON array (no markdown, no explanation) of 5 to 8 objects with these exact fields:
- word: English word (noun, e.g. "Chair", "Bag", "Phone")
- meaning: Vietnamese translation
- phonetic: IPA pronunciation (e.g. "/tʃeər/")
- box: [xmin, ymin, xmax, ymax] as float from 0.0 to 1.0 indicating where the object is in the image

Return ONLY the JSON array. Example:
[{"word": "Chair", "meaning": "Cái ghế", "phonetic": "/tʃeər/", "box": [0.1, 0.2, 0.4, 0.8]},
 {"word": "Table", "meaning": "Cái bàn", "phonetic": "/ˈteɪ.bəl/", "box": [0.0, 0.5, 0.9, 1.0]}]
"""
        
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
            
        try:
            # 1. Try 9router (OpenAI SDK)
            response = await self.client.chat.completions.create(
                model=self.primary_vision_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_str}"}}
                        ]
                    }
                ],
                # Not forcing JSON mode for vision model to avoid errors if provider doesn't support it
                # We will parse it manually
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content, expect_list=True)
            data = json.loads(cleaned)
            # If it's returning a dict wrapping the array, extract it
            if isinstance(data, dict):
                for k, v in data.items():
                    if isinstance(v, list): return v
            if isinstance(data, list):
                return data
            return []
        except Exception as e:
            print(f"9router detect_all_objects failed: {e}")
        return []

    async def ocr_extract_vocabulary(self, image: Image.Image):
        prompt = """
You are an IELTS vocabulary tutor. Carefully analyze the text and conversations in this image (which can be in English, Vietnamese, or mixed English-Vietnamese):
1. Perform OCR to read all the visible text/conversation.
2. Identify 3 to 6 key, interesting, or useful concepts, words, or phrases in the text (either English words/phrases, or Vietnamese words/phrases).
3. **QUY TẮC BẮT BUỘC**: Trường 'word' phải luôn luôn là **từ đơn (Single Word)** hoặc **cụm từ ngắn/collocation/phrasal verb thông dụng** có thể học được (Ví dụ: "bedtime", "occupied", "hang out"). 
   **TUYỆT ĐỐI KHÔNG** lấy nguyên cả câu dài, không lấy cả đoạn hội thoại hay câu hoàn chỉnh (như "giờ ngủ ne" hoặc "it's bedtime now") chèn vào trường 'word'.
4. For each identified item:
   - If the item is in English:
     - word: The clean English word/phrase (e.g. "occupied", no (n)/(v))
     - meaning: Short, concise, natural Vietnamese definition (1-5 words, e.g. "bận rộn"). TUYỆT ĐỐI KHÔNG để nhãn từ loại như (n), (v), (adj) vào meaning.
     - phonetic: IPA pronunciation (e.g. "/ˈɒk.jə.paɪd/")
     - example: The exact sentence or context from the image text where it was used
     - synonyms: 2 to 4 English synonyms (e.g. ["busy", "engaged"])
   - If the item is in Vietnamese (e.g. "giờ ngủ", "bận rộn", "đi chơi"):
     - word: The corresponding natural English translation/equivalent word or phrase (e.g. "bedtime", "occupied", "hang out") so the user can learn how to say it in English!
     - meaning: The original Vietnamese concept/phrase from the text (e.g. "giờ ngủ", no (n)/(v))
     - phonetic: IPA pronunciation of the English word (e.g. "/ˈbed.taɪm/")
     - example: An English example sentence using the English word, mentioning the original context (e.g. "It's bedtime now. (Tương ứng ngữ cảnh: giờ ngủ)")
     - synonyms: 2 to 4 English synonyms
   - topic: The main theme/category of the text (e.g. "Daily Life", "Work", "Social")
   - memory_hook: A short Vietnamese mnemonic tip to remember this English word

Return ONLY a valid JSON array of objects with these exact fields:
[{"word": "...", "meaning": "...", "phonetic": "...", "example": "...", "synonyms": ["..."], "topic": "...", "memory_hook": "..."}]
Do not include any markdown format blocks, explanations, or notes outside the JSON array.
"""
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
            
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_vision_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_str}"}}
                        ]
                    }
                ],
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content, expect_list=True)
            data = json.loads(cleaned)
            if isinstance(data, dict):
                for k, v in data.items():
                    if isinstance(v, list):
                        data = v
                        break
            if isinstance(data, list):
                import re
                for item in data:
                    if isinstance(item, dict) and item.get("meaning"):
                        item["meaning"] = re.sub(r'^\s*\((?:n|v|adj|adv|prep|conj|pron|phr|idiom|slang)[^)]*\)\s*', '', str(item["meaning"]), flags=re.IGNORECASE).strip()
                return data
            return []
        except Exception as e:
            print(f"ocr_extract_vocabulary failed: {e}")
        return []

    def _query_offline_dictionary(self, word: str):
        import sqlite3
        import re
        db_path = os.path.join(os.path.dirname(__file__), 'dictionary.db')
        if not os.path.exists(db_path):
            return None
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            word_clean = word.strip().lower()
            cursor.execute("SELECT id, word FROM words WHERE word = ? AND lang_code = 'en' LIMIT 1", (word_clean,))
            row = cursor.fetchone()
            if not row:
                conn.close()
                return None
            
            word_id, word_text = row
            
            # Definitions
            cursor.execute("""
                SELECT d.definition, d.pos, wd.example 
                FROM word_definitions wd 
                JOIN definitions d ON wd.definition_id = d.id 
                WHERE wd.word_id = ?
            """, (word_id,))
            defs = cursor.fetchall()
            
            # Pronunciations
            cursor.execute("SELECT ipa FROM pronunciations WHERE word_id = ?", (word_id,))
            ipas = cursor.fetchall()
            
            # Synonyms
            cursor.execute("SELECT related_word FROM word_relations WHERE word_id = ? AND relation_type = 's' LIMIT 5", (word_id,))
            syns = [r[0] for r in cursor.fetchall() if r[0] and r[0].strip()]
            
            conn.close()
            
            if not defs:
                return None
                
            # Take only the first definition, strip out POS labels and trailing punctuation
            raw_def = defs[0][0] if defs[0] else ""
            clean_def = re.sub(r'^\s*\(.*?\)\s*', '', raw_def)
            clean_def = clean_def.split(';')[0].strip().rstrip('.,;')
            meaning = clean_def if clean_def else raw_def
            
            phonetic = ipas[0][0] if ipas else "/.../"
            example_text = next((r[2] for r in defs if r[2]), f"It is important to understand the concept of {word_clean} in academic IELTS contexts.")
            
            return {
                "word": word_clean,
                "meaning": meaning,
                "phonetic": phonetic,
                "example": example_text,
                "synonyms": syns,
                "collocations": [f"use {word_clean}", f"concept of {word_clean}"],
                "topic": "Academic General",
                "memory_hook": f"Ghi nhớ từ '{word_clean}' với nghĩa: {meaning[:50]}"
            }
        except Exception as e:
            print(f"Offline dictionary lookup failed: {e}")
            return None

    async def refine_vocabulary(self, word: str):
        # 1. Primary: Use Gemini AI for accurate, natural IELTS learning details
        prompt = f"""
        Provide IELTS learning details for the input: "{word}"
        If the input is in Vietnamese, translate it to a corresponding high-yield English IELTS vocabulary word and use it as the "word" field, with the input as the "meaning".
        If the input is in English, keep it as the "word" and provide the Vietnamese translation as the "meaning".

        CRITICAL REQUIREMENTS FOR "meaning":
        - Short, concise, accurate Vietnamese definition matching Google Translate (translate.google.com.vn) and Oxford/Cambridge IELTS standard (strictly 1 to 3 words, e.g. "Tuổi trẻ" for youth, "Thành lập, sáng lập" for found, "Thu nhận, đạt được" for acquire).
        - TUYỆT ĐỐI KHÔNG để nhãn từ loại như (n), (v), (adj), (adv), (N), (V) vào trường "meaning" hoặc "word".
        - TUYỆT ĐỐI KHÔNG giải thích dài dòng hay viết thành một đoạn văn/câu hoàn chỉnh.
        - Nếu từ có nhiều nghĩa khác nhau tùy theo từ loại trong ngữ cảnh IELTS, chọn nghĩa học thuật phổ biến nhất và biểu đạt ngắn gọn (phân cách bằng dấu phẩy hoặc chấm phẩy nếu có 2 nghĩa súc tích).

        CRITICAL REQUIREMENTS FOR "synonyms":
        - Provide 2 to 4 high-quality English synonyms (e.g. ["adolescence", "young people", "early years"]). DO NOT return an empty list.

        Return ONLY valid JSON with exactly these fields:
        {{
            "word": "The clean English word without POS labels",
            "meaning": "Short concise Vietnamese translation (1-3 words, e.g. Tuổi trẻ)",
            "phonetic": "IPA pronunciation",
            "example": "A natural IELTS example sentence in English",
            "synonyms": ["synonym1", "synonym2", "synonym3"],
            "collocations": ["collocation1", "collocation2"],
            "topic": "The topic of this word (e.g. Environment, Technology, Health, Education, Society, etc.)",
            "memory_hook": "A short, memorable trick or story in Vietnamese to remember this word."
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
            )
            content = response.choices[0].message.content
            parsed = json.loads(self._clean_json(content))
            if parsed and parsed.get("meaning"):
                import re
                # Ensure no stray (n), (v), (adj) leaked into meaning or word
                parsed["word"] = re.sub(r'\s*\((?:n|v|adj|adv|prep|conj|pron|phr|idiom|slang)[^)]*\)\s*', '', str(parsed["word"]), flags=re.IGNORECASE).strip()
                parsed["meaning"] = re.sub(r'\s*\((?:n|v|adj|adv|prep|conj|pron|phr|idiom|slang)[^)]*\)\s*', '', str(parsed["meaning"]), flags=re.IGNORECASE).strip()
                parsed["meaning"] = re.sub(r'^(?:n|v|adj|adv|prep|conj|pron)\s*[:.\-]\s*', '', parsed["meaning"], flags=re.IGNORECASE).strip()
                parsed["meaning"] = parsed["meaning"].strip(" -:;,")
                return parsed
        except Exception as e:
            print(f"Gemini refine_vocabulary failed: {e}")

        # 2. Emergency fallback: local offline dictionary
        offline_res = self._query_offline_dictionary(word)
        if offline_res:
            return offline_res
            
        return {
            "word": word, "meaning": word, "phonetic": "/.../", 
            "example": "", "synonyms": [], "collocations": [], "topic": "General", "memory_hook": ""
        }

    def _normalize_extracted_vocab_list(self, items: list):
        if not isinstance(items, list):
            return []
        normalized = []
        pos_regex = re.compile(r'\s*\(((?:n|v|adj|adv|prep|conj|pron|phr|idiom|slang)[^)]*)\)', re.IGNORECASE)
        for item in items:
            if not isinstance(item, dict) or not item.get("word"):
                continue
            raw_word = str(item.get("word", "")).strip()
            meaning = str(item.get("meaning", "")).strip()

            # Clean POS tags completely from word (e.g. "found (v)" -> "found")
            clean_word = pos_regex.sub('', raw_word).strip()
            clean_word = re.sub(r'[\/\\()\[\]]', '', clean_word).strip()

            # Clean POS tags completely from meaning (no "(v) thành lập", just "thành lập")
            clean_meaning = pos_regex.sub('', meaning).strip()
            clean_meaning = re.sub(r'^(?:n|v|adj|adv|prep|conj|pron)\s*[:.\-]\s*', '', clean_meaning, flags=re.IGNORECASE).strip()
            clean_meaning = clean_meaning.strip(" -:;,")

            item["word"] = clean_word
            item["meaning"] = clean_meaning

            normalized.append(item)
        return normalized

    async def extract_scroll_vocabulary_from_text(self, text: str):
        prompt = f"""
        You are an expert OCR & Vocabulary Extraction Assistant.
        Analyze this text document and extract ALL English vocabulary words, phrases, or idioms listed.
        
        CRITICAL MANDATORY INSTRUCTIONS:
        1. EXTRACT ALL WORDS: Extract EVERY SINGLE vocabulary entry present in the text from the very first line to the end.
        2. CLEAN WORD FIELD: In the "word" field, put ONLY the clean English word/phrase without part-of-speech labels (DO NOT put "(n)", "(v)", "(adj)", etc. in the word field). Example: "found", not "found (v)".
        3. CONCISE VIETNAMESE MEANING (NO POS TAGS): In the "meaning" field, provide ONLY the concise Vietnamese translation (1-3 words, matching Google Translate / Oxford IELTS standard, e.g. "thành lập, sáng lập" or "tuổi trẻ"). TUYỆT ĐỐI KHÔNG để nhãn từ loại như (n), (v), (adj) vào meaning.
        4. DETAILS: Provide IPA phonetic symbols, a clear English example sentence, a memorable Vietnamese memory hook, 2-4 English synonyms, and the topic category.

        Input text:
        "{text}"

        Return ONLY a valid JSON array of objects with exactly this structure (no markdown fences, no other text):
        [
          {{
            "word": "Clean English word without (n), (v), etc.",
            "phonetic": "/.../",
            "meaning": "Concise Vietnamese meaning (1-3 words, no POS tags)",
            "example": "Context sentence in English",
            "memory_hook": "Vietnamese memory hook",
            "synonyms": ["synonym1", "synonym2"],
            "topic": "Topic category"
          }}
        ]
        """
        models_to_try = [self.primary_text_model, "gemini-3.1-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"]
        seen_models = []
        for m in models_to_try:
            if m and m not in seen_models:
                seen_models.append(m)

        for model_name in seen_models:
            for key in self.api_keys:
                try:
                    client = self._get_client_for_key(key)
                    response = await client.chat.completions.create(
                        model=model_name,
                        messages=[{"role": "user", "content": prompt}],
                        timeout=45.0
                    )
                    content = response.choices[0].message.content
                    cleaned = self._clean_json(content, expect_list=True)
                    items = json.loads(cleaned)
                    result = self._normalize_extracted_vocab_list(items)
                    if result:
                        return result
                except Exception as e:
                    print(f"extract_scroll_vocabulary_from_text failed with model {model_name} and key {key[:8]}...: {e}")
                    continue
        return []

    async def extract_scroll_vocabulary_from_image(self, image: Image.Image):
        prompt = """
        You are an expert OCR & Vocabulary Extraction Assistant.
        Analyze this vocabulary document/table image thoroughly.
        
        CRITICAL MANDATORY INSTRUCTIONS:
        1. EXTRACT ALL WORDS: Identify and extract EVERY SINGLE English vocabulary word, term, or phrase listed in the image from top to bottom.
        2. CLEAN WORD FIELD: In the "word" field, put ONLY the clean English headword/phrase without part-of-speech labels (DO NOT put "(n)", "(v)", "(adj)", "(adv)", etc. in the word field). Example: if text says "found (v)" or "achievement (n)", the "word" must be "found" or "achievement".
        3. CONCISE VIETNAMESE MEANING (NO POS TAGS): In the "meaning" field, provide ONLY the concise Vietnamese translation (1-3 words, matching Google Translate / Oxford IELTS standard, e.g. "thành lập, sáng lập" or "tuổi trẻ"). TUYỆT ĐỐI KHÔNG để nhãn từ loại như (n), (v), (adj) vào meaning.
        4. ACCURATE IPA & DETAILS: Extract or provide accurate IPA phonetic symbols, an English example sentence, a memorable Vietnamese memory hook, 2-4 English synonyms, and an appropriate topic category.

        Return ONLY a valid JSON array of objects with exactly this structure (no markdown fences, no other text):
        [
          {
            "word": "Clean English word without (n), (v), etc.",
            "phonetic": "/.../",
            "meaning": "Concise Vietnamese meaning (1-3 words, no POS tags)",
            "example": "Example sentence in English",
            "memory_hook": "Vietnamese memory hook",
            "synonyms": ["synonym1", "synonym2"],
            "topic": "Topic category"
          }
        ]
        """
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
            
        models_to_try = [self.primary_vision_model, "gemini-3.1-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"]
        seen_models = []
        for m in models_to_try:
            if m and m not in seen_models:
                seen_models.append(m)

        for model_name in seen_models:
            for key in self.api_keys:
                try:
                    client = self._get_client_for_key(key)
                    response = await client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_str}"}}
                                ]
                            }
                        ],
                        timeout=45.0
                    )
                    content = response.choices[0].message.content
                    cleaned = self._clean_json(content, expect_list=True)
                    items = json.loads(cleaned)
                    result = self._normalize_extracted_vocab_list(items)
                    if result:
                        return result
                except Exception as e:
                    print(f"extract_scroll_vocabulary_from_image failed with model {model_name} and key {key[:8]}...: {e}")
                    continue
        return []

    async def correct_writing_and_grammar(self, text: str, task_type: str = "sentence", target_band: float = 8.0):
        """
        Skill: correct_writing_and_grammar
        Khảo thí IELTS 4 tiêu chí chuẩn Cambridge (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy)
        kết hợp đánh giá CEFR (A1-C2) và bản viết lại mẫu Band 8.5+.
        """
        prompt = f"""
        Bạn là Chuyên gia Khảo thí IELTS Quốc tế Cambridge Band 9.0.
        Hãy phân tích, chấm điểm và sửa lỗi bài viết sau: "{text}"
        Loại bài: {task_type}. Band điểm mục tiêu: {target_band}.
        
        YÊU CẦU ĐÁNH GIÁ HỌC THUẬT:
        1. Chấm Band Score (từ 0.0 đến 9.0) tổng quan và chi tiết 4 tiêu chí chuẩn Cambridge.
        2. Xác định cấp độ CEFR tương đương (A2, B1, B2, C1, C2).
        3. Phân tích điểm mạnh (strengths) và điểm yếu học thuật (weaknesses).
        4. Bắt lỗi ngữ pháp, chính tả, lỗi dùng từ sáo rỗng. Với mỗi lỗi, giải thích chi tiết ngữ pháp bằng tiếng Việt và đề xuất cách sửa Band 8.0+.
        5. Cung cấp một bản viết lại hoàn chỉnh đạt chuẩn Band 8.5+ (band_8_rephrase).
        
        Trả về DUY NHẤT định dạng JSON:
        {{
            "band_score": 7.5,
            "cefr_level": "C1",
            "criteria": {{
                "task_achievement": 7.5,
                "task_response": 7.5,
                "coherence": 7.5,
                "lexical_resource": 8.0,
                "grammar": 7.5
            }},
            "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
            "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
            "corrections": [
                {{
                    "original": "cụm từ/câu bị sai",
                    "corrected": "cụm từ/câu đã sửa chuẩn Band 8+",
                    "reason": "Giải thích chi tiết lỗi ngữ pháp hoặc diễn đạt bằng tiếng Việt",
                    "cefr_upgrade": "C1"
                }}
            ],
            "band_8_rephrase": "Đoạn văn hoàn chỉnh viết lại xuất sắc theo phong cách học thuật Cambridge."
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                timeout=25.0
            )
            content = response.choices[0].message.content
            return json.loads(self._clean_json(content))
        except Exception as e:
            print(f"correct_writing_and_grammar failed: {e}")
            return {
                "band_score": 6.0,
                "cefr_level": "B2",
                "criteria": {
                    "task_achievement": 6.0,
                    "task_response": 6.0,
                    "coherence": 6.0,
                    "lexical_resource": 6.0,
                    "grammar": 6.0
                },
                "strengths": ["Bài viết có ý tưởng rõ ràng."],
                "weaknesses": [f"Lỗi xử lý AI: {str(e)}"],
                "corrections": [],
                "band_8_rephrase": text
            }

    async def analyze_writing(self, text: str):
        """Alias tương thích ngược cho WritingSanctuary trên Web"""
        return await self.correct_writing_and_grammar(text)

    async def generate_vocabulary_context(self, word: str, context_sentence: str = "", target_band: float = 7.5, for_game_hint: bool = False):
        """
        Skill: generate_vocabulary_context
        Khai thác chuyên sâu từ vựng: Collocations, Word Family, CEFR level, ví dụ Cambridge,
        mẹo nhớ logic và gợi ý đố chữ cho game Wordle Matcha.
        """
        prompt = f"""
        Bạn là Chuyên gia Từ điển học và Từ vựng IELTS Cambridge.
        Hãy phân tích và khai thác chuyên sâu từ vựng: "{word}".
        Band điểm mục tiêu: {target_band}.
        Ngữ cảnh ban đầu (nếu có): "{context_sentence}".
        Chế độ gợi ý Game Wordle: {for_game_hint} (Nếu True: TUYỆT ĐỐI KHÔNG để lộ từ gốc trong trường 'game_hint', hãy mô tả ẩn dụ ngữ nghĩa, từ loại và cấu trúc chữ cái).

        Yêu cầu chi tiết:
        1. 'word': Từ vựng chuẩn.
        2. 'phonetic': Phiên âm quốc tế IPA chính xác.
        3. 'part_of_speech': Từ loại (noun, verb, adjective, adverb...).
        4. 'cefr_level': Khung CEFR (B1, B2, C1, C2).
        5. 'definition_vi': Định nghĩa tiếng Việt ngắn gọn, học thuật (không kèm nhãn từ loại).
        6. 'definition_en': Định nghĩa tiếng Anh chuẩn từ điển Oxford/Cambridge.
        7. 'academic_collocations': 3 đến 5 cụm Collocations học thuật C1/C2 thông dụng.
        8. 'word_family': Các từ liên quan (noun, verb, adjective, adverb).
        9. 'cambridge_example': Câu ví dụ học thuật đạt chuẩn bài thi IELTS.
        10. 'vietnamese_memory_hook': Mẹo ghi nhớ thú vị, logic hoặc gốc từ Latinh/Hy Lạp.
        11. 'game_hint': Manh mối gợi ý đố chữ bằng tiếng Việt hấp dẫn cho game Wordle (gồm clue và scramble_or_pattern).

        Trả về DUY NHẤT định dạng JSON:
        {{
            "word": "{word}",
            "phonetic": "/.../",
            "part_of_speech": "...",
            "cefr_level": "...",
            "definition_vi": "...",
            "definition_en": "...",
            "academic_collocations": ["...", "..."],
            "word_family": {{"noun": "...", "verb": "...", "adjective": "...", "adverb": "..."}},
            "cambridge_example": "...",
            "vietnamese_memory_hook": "...",
            "game_hint": {{"clue": "...", "scramble_or_pattern": "..."}}
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                timeout=15.0
            )
            data = json.loads(self._clean_json(response.choices[0].message.content.strip()))
            # Aliasing for versatile client consumption
            colls = data.get("academic_collocations") or data.get("collocations") or []
            data["collocations"] = colls
            data["academic_collocations"] = colls
            ex = data.get("cambridge_example") or data.get("cambridge_exemplar") or ""
            data["cambridge_example"] = ex
            data["cambridge_exemplar"] = ex
            if isinstance(data.get("game_hint"), str):
                data["game_hint"] = {"clue": data["game_hint"], "scramble_or_pattern": f"{len(word)} ký tự"}
            return data
        except Exception as e:
            print(f"generate_vocabulary_context failed: {e}")
            return {
                "word": word,
                "phonetic": "",
                "part_of_speech": "noun",
                "cefr_level": "B2",
                "definition_vi": "Từ vựng IELTS học thuật",
                "definition_en": "Academic IELTS term",
                "academic_collocations": [f"academic {word}", f"effective {word}"],
                "collocations": [f"academic {word}", f"effective {word}"],
                "word_family": {},
                "cambridge_example": f"Understanding '{word}' enhances academic communication.",
                "cambridge_exemplar": f"Understanding '{word}' enhances academic communication.",
                "vietnamese_memory_hook": "Đặt câu thực tế để ghi nhớ sâu.",
                "game_hint": {"clue": "Một từ vựng học thuật quan trọng trong bài thi IELTS.", "scramble_or_pattern": f"{len(word)} ký tự"}
            }

    async def get_encouragement(self):
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": "Chào học sinh IELTS ngắn gọn, dễ thương tiếng Việt."}]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Gemini get_encouragement failed: {e}")
        return "Chào mừng bạn đến với Oasis! 🌴"

    def _get_client_for_key(self, api_key: str):
        return AsyncOpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=api_key if api_key else "dummy-key",
            max_retries=0,
            timeout=12.0
        )

    async def get_advice(self, prompt: str):
        """Hàm lấy phản hồi ngắn hoặc lời khuyên với ngữ cảnh thời gian thực hiện tại"""
        time_ctx = get_current_realtime_context()
        realtime_str = time_ctx["full_text"]
        system_prefix = (
            f"Bạn là Mát Cha AI Eo - Gia sư IELTS thân thiện, chuẩn mực tại IELTS Oasis. "
            f"Thời gian hiện tại ngầm định: {realtime_str}, năm {time_ctx['year']}. "
            f"CHỈ trả lời về ngày tháng khi người học trực tiếp hỏi. "
            f"Hãy trả lời ngắn gọn, chính xác, sắc bén, đúng trọng tâm câu hỏi. "
            f"TUYỆT ĐỐI KHÔNG tự ý chèn quảng cáo tính năng website (MatchaSpeak, Vocabulary Lab...) trừ khi người học hỏi đến."
        )
        
        models_to_try = ["gemini-3.1-flash-lite", self.tutor_model, self.primary_text_model]
        seen_models = []
        for m in models_to_try:
            if m and m not in seen_models: seen_models.append(m)

        for model_name in seen_models:
            for key in self.api_keys:
                try:
                    client = self._get_client_for_key(key)
                    response = await client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": system_prefix},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.7,
                        max_tokens=600,
                        timeout=12.0
                    )
                    return response.choices[0].message.content.strip()
                except Exception as e:
                    print(f"Gemini get_advice failed with model {model_name} and key {key[:8]}...: {e}")
                    continue
        return "Hiện tại hệ thống Mát Cha AI Eo đang bận xử lý dữ liệu. Bạn hãy thử lại sau ít giây nhé!"

    async def chat_tutor(self, messages: list, student_context: dict = None) -> str:
        """
        Bộ não Chatbot Gia sư IELTS Mát Cha AI Eo (Dành cho Discord Bot & Extension Sidepanel):
        - Tốc độ phản hồi cực nhanh, ngắn gọn, súc tích, đi thẳng vào trọng tâm.
        - Chào hỏi thân thiện, tự nhiên (1-2 câu), tuyệt đối không lên lớp hay cằn nhằn.
        - Nhận thức thời gian thực ngầm định (Năm 2026, GMT+7), chỉ trả lời ngày tháng khi được hỏi.
        - Không tự ý spam quảng cáo / nịnh bợ hay lôi số liệu học viên ra khi chưa được hỏi.
        - Chuẩn mực học thuật Cambridge IELTS Band 8.0+.
        """
        time_ctx = get_current_realtime_context()
        realtime_info = time_ctx["full_text"]

        student_note = ""
        if student_context:
            name = student_context.get("name") or student_context.get("username")
            vocab_count = student_context.get("vocab_count")
            mastery_count = student_context.get("mastery_count")
            recent_band = student_context.get("recent_band")
            target_band = student_context.get("target_band")
            schedule_topic = student_context.get("schedule_topic")
            
            parts = []
            if name: parts.append(f"Tên học viên: {name}")
            if recent_band: parts.append(f"Band điểm Writing gần nhất: {recent_band}")
            if target_band: parts.append(f"Mục tiêu: {target_band}")
            if vocab_count is not None: parts.append(f"Kho từ vựng: {vocab_count} từ ({mastery_count or 0} từ đạt Mastery 5)")
            if schedule_topic: parts.append(f"Chủ đề lộ trình học hiện tại: {schedule_topic}")
            if parts:
                student_note = (
                    "\n[THÔNG TIN HỒ SƠ HỌC VIÊN (CHỈ DÙNG ĐỂ TƯ VẤN KHI ĐƯỢC HỎI)]:\n"
                    + "\n".join(f"- {p}" for p in parts)
                    + "\n(Lưu ý: Chỉ dùng để định hướng khi học viên hỏi xin lộ trình hoặc cần tư vấn. TUYỆT ĐỐI KHÔNG tự tiện lôi các thông số này ra nhắc nhở/bắt bẻ khi học viên chỉ chào hỏi hoặc hỏi những câu thông thường)."
                )

        master_system_instruction = f"""
Bạn là Mát Cha AI Eo (Mascot chú gấu học thuật) - Huấn luyện viên & Gia sư IELTS thân thiện, tận tâm tại IELTS Oasis.
Xưng hô tự nhiên: 'Mát Cha' hoặc 'mình/tớ' với 'bạn/cậu'. Giữ phong thái nhẹ nhàng, tích cực, vui vẻ, lịch sự và truyền cảm hứng học tập \U0001f60a.

[QUY TẮC BẮT BUỘC 1: TỰ ĐỘNG HIỂU NGỮ CẢNH KHI HỌC VIÊN CHÀO HỎI / MỞ ĐẦU HỘI THOẠI]:
- Hãy tự động nhận diện theo ngữ cảnh tự nhiên: Bất cứ khi nào tin nhắn cuối cùng của học viên là lời chào hỏi hoặc mở đầu (ví dụ: Chào bạn, Chào cậu, Hi, Hello, Alo, Good morning, Chào thầy...):
  + Hãy xem đây là một lượt chào đón mở đầu buổi gặp gỡ.
  + Chào lại thật thân thiện, ấm áp, ngắn gọn (đúng 1 đến 2 câu).
  + Câu chào mẫu chuẩn: "Chào bạn! Rất vui được gặp lại bạn. Mình là IELTS Oasis (Mát Cha AI Eo) đây. Hôm nay mình có thể giúp gì cho quá trình luyện thi IELTS của bạn không? \U0001f60a"
  + BẤT KỂ trong lịch sử trò chuyện phía trước có nội dung gì, TUYỆT ĐỐI KHÔNG lôi các tranh luận cũ, lỗi sai hay câu chuyện dở dang trước đó ra nói tiếp nếu học viên chưa nhắc đến.
  + TUYỆT ĐỐI KHÔNG tự động nói ra ngày tháng hay giờ giấc.
  + TUYỆT ĐỐI KHÔNG lên lớp, không bắt bẻ, không cằn nhằn "không lãng phí thời gian", không tự tiện giao bài tập hay bắt ép học viên học bài ngay khi họ chỉ vừa mới chào hỏi.

[QUY TẮC BẮT BUỘC 2: TRẢ LỜI NGẮN GỌN, SÚC TÍCH, ĐI THẲNG TRỌNG TÂM (CONCISE & FOCUSED)]:
- LUÔN ĐI THẲNG VÀO TRỌNG TÂM CÂU HỎI. Không mở bài lan man, không viết dài dòng lê thê.
- Độ dài lý tưởng cho câu trả lời thông thường: từ 2 - 4 câu (hoặc 1 đoạn ngắn, có thể gạch 2-3 đầu dòng rõ ràng nếu giải thích cấu trúc/từ vựng).
- Trừ khi học viên yêu cầu viết bài luận mẫu hoàn chỉnh (Task 1 / Task 2) hoặc phân tích chuyên sâu, còn lại TUYỆT ĐỐI KHÔNG viết tràn lan dài dòng.
- Kiến thức đưa ra (từ vựng, collocation, ngữ pháp) phải chuẩn xác theo tiêu chuẩn khảo thí Cambridge IELTS Band 7.5 - 8.5+.

[QUY TẮC BẮT BUỘC 3: THỜI GIAN THỰC (CHỈ NÓI KHI ĐƯỢC HỎI)]:
- Thời gian hiện tại trong hệ thống: {realtime_info}, Năm {time_ctx['year']}.
- CHỈ trả lời về ngày, tháng, năm, giờ giấc KHI học viên trực tiếp hỏi (ví dụ: "Hôm nay ngày mấy?", "Bây giờ là năm nào?", "Mấy giờ rồi?").
- Khi được hỏi thời gian: Trả lời ngắn gọn, tự nhiên (Ví dụ: "Hôm nay là {realtime_info} bạn nhé!").
- TUYỆT ĐỐI KHÔNG tự động chèn ngày tháng vào câu chào hỏi hay câu trả lời khác.
- TUYỆT ĐỐI KHÔNG nói về việc "thiết lập lại đồng hồ hệ thống", không phân bua giải thích về lỗi thời gian.

[QUY TẮC BẮT BUỘC 4: TÍNH NĂNG WEB, ARCADE GAMES & 5 BỘ KỸ NĂNG HỌC THUẬT]:
- Bạn nắm rõ hệ sinh thái học thuật IELTS Oasis:
  + Nền tảng web: Vocabulary Lab (học SRS 5 cấp độ), Writing Sanctuary (luyện viết áp lực thời gian, chấm band tự động), MatchaSpeak (Sandbox phát âm & Shadowing), MatchaScroll (đọc báo trích từ vựng), Listening (chép chính tả).
  + Arcade Games: Tea Talk Reflex (/games/speak - luyện phản xạ nói không filler words), Wordle Matcha (/games/wordle - giải đố từ vựng 5 chữ cái), Grammar Pop (/games/quiz - thử thách ngữ pháp cấp tốc).
  + 5 kỹ năng học thuật lõi (Academic Skills Suite):
    1. evaluate_speech_pronunciation: Đo độ chính xác phát âm, ngữ điệu, bẫy âm L1 người Việt (/s/, /t/, /d/, ending sounds).
    2. correct_writing_and_grammar: Chấm IELTS Writing 4 tiêu chí Cambridge, định danh lỗi theo CEFR và nâng cấp câu lên Band 8.5+.
    3. generate_vocabulary_context: Collocations học thuật tự nhiên, Word Family, ví dụ chuẩn Oxford/Cambridge và gợi ý Wordle.
    4. drive_conversation_reflex: Dẫn dắt phản xạ hội thoại Speaking, ghi nhận shadow errors và gợi ý từ nối cao cấp.
    5. generate_spaced_repetition_review: Bộ câu hỏi ôn tập lặp lại ngắt quãng thích ứng (Collocation cloze, Error ID, Definition match).
- NGUYÊN TẮC: CHỈ tư vấn, giới thiệu hoặc hướng dẫn các tính năng/game trên KHI học viên hỏi về cách học, hỏi tính năng web hoặc hỏi xin lộ trình ("tư vấn cho mình", "mình nên học gì tiếp theo").
- Khi học viên gửi bài viết cần sửa, gửi câu cần phân tích hoặc hỏi sâu về từ vựng/ngữ pháp/phát âm, hãy phát huy toàn bộ chiều sâu của 5 kỹ năng học thuật trên để đưa ra lời giải thích sắc bén, chuẩn Cambridge Band 8.5+.
- Trong các câu trò chuyện hoặc giải đáp từ vựng/ngữ pháp thông thường: CẤM chèn văn mẫu quảng cáo, cấm mời gọi vào web khi không được hỏi.

[QUY TẮC BẮT BUỘC 5: HỌC THUẬT VÀ KHÔNG BA PHẢI]:
- Nếu học viên đưa ra kiến thức sai (ngữ pháp, từ vựng, thông tin sai): Lịch sự, nhẹ nhàng chỉ ra lỗi sai và giải thích cách dùng chuẩn Band 8.5+, không a dua đồng thuận với cái sai.
- Nếu học viên nói chuyện phiếm quá đà đi lệch mục tiêu học tập: Khéo léo và vui vẻ kéo học viên trở lại bài học.
{student_note}
"""

        # Format multi-turn messages
        formatted_messages = [{"role": "system", "content": master_system_instruction.strip()}]
        if isinstance(messages, str):
            formatted_messages.append({"role": "user", "content": messages})
        elif isinstance(messages, list):
            for m in messages:
                if isinstance(m, dict) and "content" in m:
                    role = m.get("role", "user")
                    # Map standard roles
                    if role in ["assistant", "ai", "bot", "model"]:
                        role = "assistant"
                    elif role != "system":
                        role = "user"
                    formatted_messages.append({"role": role, "content": str(m["content"])})
                elif isinstance(m, str):
                    formatted_messages.append({"role": "user", "content": m})

        # Model hierarchy: prioritize gemini-3.1-flash-lite for ultra-fast sub-second response
        models_to_try = ["gemini-3.1-flash-lite", self.tutor_model, self.primary_text_model]
        seen_models = []
        for m in models_to_try:
            if m and m not in seen_models: seen_models.append(m)

        for model_name in seen_models:
            for key in self.api_keys:
                try:
                    client = self._get_client_for_key(key)
                    response = await client.chat.completions.create(
                        model=model_name,
                        messages=formatted_messages,
                        temperature=0.7,
                        max_tokens=600,
                        timeout=12.0
                    )
                    content = response.choices[0].message.content
                    if content and content.strip():
                        return content.strip()
                except Exception as e:
                    print(f"Chat tutor error with {model_name} (key {key[:8]}...): {e}")
                    continue

        return "Mát Cha đang gặp chút gián đoạn kết nối máy chủ AI. Cậu hãy đợi một chút rồi gửi lại tin nhắn nhé! 🍵"

    async def search_unsplash_image(self, word: str):
        import re
        try:
            async with httpx.AsyncClient() as client:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
                # Fetch Unsplash search results page
                url = f"https://unsplash.com/s/photos/{word.replace(' ', '-')}"
                r = await client.get(url, headers=headers, timeout=10.0)
                if r.status_code == 200:
                    # Find all Unsplash photo URLs
                    urls = re.findall(r'https://images.unsplash.com/photo-[^?"]+', r.text)
                    if urls:
                        # Return first photo URL with sizing parameters
                        return urls[0] + "?auto=format&fit=crop&w=400&q=80"
        except Exception as e:
            print(f"Failed to fetch Unsplash image for {word}: {e}")
        return None

    async def get_rephrase_suggestions(self, full_text: str, selected_phrase: str):
        prompt = f"""
        Bạn là chuyên gia IELTS. Trong bài luận sau:
        "{full_text}"
        
        Người học đã chọn cụm từ: "{selected_phrase}"
        
        Hãy đưa ra 3 cách viết lại (rephrase) cụm từ này để nâng cao điểm IELTS (giúp tự nhiên hơn, ngữ pháp tốt hơn hoặc từ vựng học thuật hơn).
        Trả về DUY NHẤT một mảng JSON chứa 3 chuỗi gợi ý, không có giải thích hay markdown code blocks ngoài mảng JSON này.
        
        Ví dụ: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
        """
        try:
            # 1. Try Gemini
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Gemini rephrase failed: {e}")
            
        return [f"{selected_phrase} (better alternative)", f"improved {selected_phrase}", f"academic {selected_phrase}"]

    async def generate_grammar_questions(self):
        prompt = """
        Tạo 5 câu hỏi ngữ pháp tiếng Anh trình độ IELTS để ôn tập.
        Yêu cầu trả về DUY NHẤT một mảng JSON chứa các câu hỏi, không thêm bất kỳ văn bản nào khác.
        Mỗi câu hỏi có thể là trắc nghiệm hoặc có thể dùng để điền từ, có các trường:
        [
            {
                "question": "Câu tiếng Anh có chỗ trống chứa ____...",
                "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
                "correct_answer": "Đáp án đúng chính xác (phải khớp hoàn toàn với một trong các phần tử trong options)",
                "explanation": "Giải thích chi tiết bằng tiếng Việt lý do chọn đáp án này, điểm ngữ pháp và cấu trúc câu tương ứng."
            }
        ]
        """
        try:
            # 1. Try Gemini
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content)
            raw_questions = json.loads(cleaned)
            
            # Normalize fields for both extension and web (choices/options, answer/correct_answer)
            normalized = []
            for q in raw_questions:
                opts = q.get("options") or q.get("choices") or []
                ans = q.get("correct_answer") or q.get("answer") or (opts[0] if opts else "")
                expl = q.get("explanation") or "Điểm ngữ pháp quan trọng trong bài thi IELTS."
                normalized.append({
                    "question": q.get("question", ""),
                    "options": opts,
                    "choices": opts,
                    "correct_answer": ans,
                    "answer": ans,
                    "explanation": expl
                })
            return normalized
        except Exception as e:
            print(f"Gemini generate_grammar_questions failed: {e}")
            
        # Fallback dummy questions (normalized)
        return [
            {
                "question": "If I ______ more time, I would study IELTS every day.",
                "options": ["have", "had", "will have", "would have"],
                "choices": ["have", "had", "will have", "would have"],
                "correct_answer": "had",
                "answer": "had",
                "explanation": "Đây là câu điều kiện loại 2 (diễn tả giả định không có thật ở hiện tại). Mệnh đề If dùng thì quá khứ đơn (had)."
            },
            {
                "question": "The government is trying to encourage the use of ______ energy.",
                "options": ["renew", "renewable", "renewed", "renewal"],
                "choices": ["renew", "renewable", "renewed", "renewal"],
                "correct_answer": "renewable",
                "answer": "renewable",
                "explanation": "Chúng ta cần một tính từ đứng trước danh từ 'energy' để bổ nghĩa cho nó. 'Renewable energy' nghĩa là năng lượng tái tạo."
            },
            {
                "question": "Hardly ______ the station when the train began to leave.",
                "options": ["had I reached", "I had reached", "did I reach", "I reached"],
                "choices": ["had I reached", "I had reached", "did I reach", "I reached"],
                "correct_answer": "had I reached",
                "answer": "had I reached",
                "explanation": "Cấu trúc đảo ngữ với 'Hardly... when...': Hardly + had + S + V3/ed + when + S + V2/ed."
            },
            {
                "question": "She suggested that he ______ more academic vocabulary in his essay.",
                "options": ["use", "used", "uses", "using"],
                "choices": ["use", "used", "uses", "using"],
                "correct_answer": "use",
                "answer": "use",
                "explanation": "Cấu trúc giả định (Subjunctive): S + suggest + that + S + (should) + V nguyên thể (use)."
            },
            {
                "question": "Neither the teacher nor the students ______ satisfied with the exam results.",
                "options": ["were", "was", "is", "are being"],
                "choices": ["were", "was", "is", "are being"],
                "correct_answer": "were",
                "answer": "were",
                "explanation": "Quy tắc hòa hợp chủ ngữ - vị ngữ: 'Neither... nor...' thì động từ chia theo chủ ngữ gần nó nhất (the students số nhiều -> were)."
            }
        ]

    async def generate_youtube_listening(self, youtube_url: str, mode: str = "quiz"):
        from youtube_transcript_api import YouTubeTranscriptApi
        import urllib.parse as urlparse

        try:
            # Extract video ID
            parsed_url = urlparse.urlparse(youtube_url)
            video_id = ""
            if parsed_url.hostname == 'youtu.be':
                video_id = parsed_url.path[1:]
            elif parsed_url.hostname in ('www.youtube.com', 'youtube.com'):
                if parsed_url.path == '/watch':
                    video_id = urlparse.parse_qs(parsed_url.query)['v'][0]
                elif parsed_url.path.startswith('/embed/'):
                    video_id = parsed_url.path.split('/')[2]
                elif parsed_url.path.startswith('/v/'):
                    video_id = parsed_url.path.split('/')[2]
                    
            if not video_id:
                return {"error": "Invalid YouTube URL"}

            # Get transcript
            from youtube_transcript_api import YouTubeTranscriptApi
            try:
                api = YouTubeTranscriptApi()
                transcript_list = api.fetch(video_id, languages=['en', 'en-US', 'en-GB'])
            except Exception:
                # Fallback to list
                api = YouTubeTranscriptApi()
                transcript_list = api.list(video_id).find_transcript(['en', 'en-US', 'en-GB']).fetch()
                
            transcript_text = " ".join([t.get('text', '') if isinstance(t, dict) else getattr(t, 'text', '') for t in transcript_list])
            
            if len(transcript_text) < 100:
                return {"is_suitable": False, "reason": "Phụ đề quá ngắn, không đủ để tạo bài kiểm tra."}
            
            if mode == "dictation":
                prompt = f"""
                Đây là phần transcript (phụ đề) của một video YouTube tiếng Anh:
                "{transcript_text}"
                
                Hãy trích xuất nguyên văn khoảng 3-5 câu liên tiếp quan trọng nhất từ đoạn trên.
                Sau đó đục lỗ (tạo chỗ trống) ở những từ vựng/cụm từ quan trọng (khoảng 3-5 chỗ trống) để người dùng luyện nghe điền từ.
                Mỗi chỗ trống thay bằng chuỗi "_______".
                
                Trả về DUY NHẤT một đối tượng JSON với cấu trúc sau:
                {{
                    "is_suitable": true,
                    "reason": "Lý do",
                    "questions": [
                        {{
                            "id": 1,
                            "type": "fill_in_the_blank",
                            "text": "Câu văn tiếng Anh có chứa _______ ở vị trí từ bị thiếu.",
                            "answer": "từ_cần_điền"
                        }}
                    ]
                }}
                """
            else:
                prompt = f"""
                Đây là phần transcript (phụ đề) của một video YouTube tiếng Anh:
                "{transcript_text}"
                
                Hãy tạo 3 câu hỏi trắc nghiệm (Multiple Choice) kiểm tra mức độ hiểu bài.
                
                Trả về DUY NHẤT một đối tượng JSON với cấu trúc sau:
                {{
                    "is_suitable": true,
                    "reason": "Lý do",
                    "questions": [
                        {{
                            "id": 1,
                            "type": "multiple_choice",
                            "question": "Câu hỏi tiếng Anh...",
                            "options": ["A", "B", "C", "D"],
                            "correctAnswer": "Đáp án đúng (phải khớp hoàn toàn 1 trong 4 options)",
                            "explanation": "Giải thích tiếng Việt"
                        }}
                    ]
                }}
                """
            
            try:
                # Call Gemini
                response = await self.client.chat.completions.create(
                    model=self.primary_text_model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content
                cleaned = self._clean_json(content)
                return json.loads(cleaned)
            except Exception as e:
                print(f"Gemini youtube listening failed: {e}")
            
            return {"error": "Gemini failed to generate listening questions."}

        except Exception as e:
            print(f"YouTube transcript/AI failed: {e}")
            return {"error": str(e), "is_suitable": False, "reason": "Không thể lấy phụ đề tiếng Anh tự động từ video này."}

    async def generate_daily_plan(self, topic: str):
        prompt = f"""
        GUARDRAIL RULE: You are an exclusive IELTS Academic Assistant for IELTS Oasis.
        FIRST, check if the input topic "{topic}" is related to education, science, technology, environment, society, culture, work, health, or general English/IELTS learning.
        If the input topic is inappropriate, malicious, or completely unrelated to learning (e.g. hacking, violence, off-topic requests):
        Return JSON: {{"error": "Off-topic request. Please enter a valid IELTS study topic (e.g. Environment, Education, Artificial Intelligence).", "is_off_topic": true}}

        Otherwise, generate a COMPLETE, high-quality IELTS study package ("Matcha Daily Plan") for "{topic}" containing:
        1. "vocabulary": 10 essential IELTS academic words with English word, Vietnamese meaning, IPA phonetic, English example sentence, 1-2 synonyms, and a short Vietnamese memory hook.
        2. "listening": A FULL authentic IELTS Listening dialogue/monologue transcript (150-250 words with Speaker A & Speaker B), a descriptive title, full audio_script text, and 3 comprehension questions.
        3. "reading": A FULL authentic IELTS Reading academic passage (200-300 words), a descriptive title, full text, and 3 comprehension questions.
        4. "writing": An official IELTS Writing Task 2 essay question related to "{topic}" with key argument points.

        Return ONLY a valid JSON object with this exact structure (no markdown fences, no other text):
        {{
            "topic": "{topic}",
            "vocabulary": [
                {{
                    "word": "English word",
                    "meaning": "Nghĩa tiếng Việt",
                    "phonetic": "/.../",
                    "example": "Useful academic example sentence",
                    "synonyms": ["synonym1", "synonym2"],
                    "memory_hook": "Mẹo nhớ bằng tiếng Việt"
                }}
            ],
            "listening": {{
                "title": "IELTS Listening: Topic Title",
                "description": "Dialogue between Speaker A and Speaker B regarding...",
                "audio_script": "Speaker A: Welcome to today's discussion... \\nSpeaker B: Thank you...",
                "questions": ["Question 1 text?", "Question 2 text?", "Question 3 text?"]
            }},
            "writing": {{
                "prompt": "Official IELTS Writing Task 2 Essay Question...",
                "key_points": ["Key Point 1", "Key Point 2"]
            }},
            "reading": {{
                "title": "IELTS Reading: Academic Passage Title",
                "text": "Full 200-300 word academic reading passage text...",
                "questions": ["Question 1 text?", "Question 2 text?", "Question 3 text?"]
            }}
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Daily Plan failed: {e}")
            return {"error": str(e)}

    async def generate_lesson_from_writing(self, text: str):
        prompt = f"""
        Dưới đây là một bài luận (Writing) của học viên:
        "{text}"
        
        Hãy biến nó thành một bài Đọc hiểu / Nghe hiểu (Reading/Listening Comprehension).
        1. Trích xuất 3 từ vựng nổi bật từ bài viết.
        2. Tạo 3 câu hỏi trắc nghiệm liên quan đến nội dung bài viết.
        
        Trả về DUY NHẤT một đối tượng JSON với cấu trúc:
        {{
            "vocabulary": [
                {{
                    "word": "từ tiếng Anh",
                    "meaning": "nghĩa tiếng Việt",
                    "phonetic": "phiên âm IPA",
                    "example": "câu ví dụ tiếng Anh có chứa từ này để học IELTS",
                    "synonyms": ["đồng nghĩa 1", "đồng nghĩa 2"],
                    "memory_hook": "mẹo nhớ từ bằng tiếng Việt ngắn gọn"
                }}
            ],
            "questions": [
                {{
                    "id": 1,
                    "question": "Câu hỏi...",
                    "options": ["A", "B", "C", "D"],
                    "correctAnswer": "Đáp án đúng (khớp hoàn toàn với option)",
                    "explanation": "Giải thích ngắn gọn"
                }}
            ]
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Generate lesson failed: {e}")
            return {"error": str(e)}

    async def generate_reading_questions(self, text: str):
        prompt = f"""
        Dưới đây là một đoạn văn bản tiếng Anh:
        "{text}"
        
        Hãy đóng vai là một giám khảo IELTS chuyên nghiệp. Hãy đọc hiểu đoạn văn bản trên và sinh ra 4 câu hỏi kiểm tra đọc hiểu.
        - 2 câu hỏi dạng trắc nghiệm (Multiple Choice)
        - 2 câu hỏi dạng điền từ vào chỗ trống (Fill in the blank)
        
        Trả về DUY NHẤT một đối tượng JSON với cấu trúc:
        {{
            "title": "IELTS Reading Practice",
            "content": "Trích xuất hoặc tóm tắt đoạn văn bản gốc (giữ nguyên tiếng Anh)",
            "questions": [
                {{
                    "id": 1,
                    "type": "multiple_choice",
                    "text": "Câu hỏi...",
                    "options": ["A", "B", "C", "D"],
                    "answer": "Đáp án đúng (khớp hoàn toàn 1 option)"
                }},
                {{
                    "id": 2,
                    "type": "fill_in_the_blank",
                    "text": "Câu chứa chỗ trống cần điền _______.",
                    "answer": "Từ cần điền (1-3 từ)"
                }}
            ]
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Generate reading questions failed: {e}")
            return {"error": str(e)}
    async def generate_listening_from_text(self, text: str, mode: str = "paragraph"):
        if mode == "conversation":
            prompt = f"""
            Bạn là một giám khảo IELTS. Dưới đây là một đoạn hội thoại tiếng Anh:
            "{text}"
            
            Hãy sinh ra từ 10 đến 20 câu hỏi trắc nghiệm (Multiple Choice) kiểm tra kỹ năng nghe hiểu (Listening Comprehension) dựa trên nội dung hội thoại này.
            Các câu hỏi phải có độ khó TĂNG DẦN (từ dễ đến khó).
            
            Trả về DUY NHẤT một định dạng JSON:
            {{
                "title": "IELTS Listening - Conversation",
                "context": "Mô tả ngắn gọn về ngữ cảnh của đoạn hội thoại bằng tiếng Anh",
                "questions": [
                    {{
                        "id": 1,
                        "type": "multiple_choice",
                        "text": "Câu hỏi...",
                        "options": ["A", "B", "C", "D"],
                        "answer": "Đáp án đúng (khớp hoàn toàn với 1 trong 4 option)"
                    }}
                ]
            }}
            """
        else:
            prompt = f"""
            Bạn là một giám khảo IELTS. Dưới đây là một đoạn văn bản tiếng Anh:
            "{text}"
            
            Hãy sinh ra khoảng 5-10 câu hỏi kiểm tra kỹ năng nghe hiểu (Listening Comprehension) dựa trên nội dung này.
            - Bao gồm câu trắc nghiệm (Multiple Choice)
            - Bao gồm câu điền từ (Fill in the blank)
            
            Trả về DUY NHẤT một định dạng JSON:
            {{
                "title": "IELTS Listening - Monologue",
                "context": "Mô tả ngắn gọn về ngữ cảnh của đoạn văn bằng tiếng Anh",
                "questions": [
                    {{
                        "id": 1,
                        "type": "multiple_choice",
                        "text": "Câu hỏi...",
                        "options": ["A", "B", "C", "D"],
                        "answer": "Đáp án đúng (khớp hoàn toàn với option)"
                    }},
                    {{
                        "id": 2,
                        "type": "fill_in_the_blank",
                        "text": "Câu chứa chỗ trống cần điền _______.",
                        "answer": "Từ cần điền (1-3 từ)"
                    }}
                ]
            }}
            """
            
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Gemini text listening failed: {e}")
            
        return {"error": "AI could not generate questions."}

    async def get_json_advice(self, prompt: str):
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            return json.loads(self._clean_json(content))
        except Exception as e:
            print(f"Gemini get_json_advice failed: {e}")
        return {}

    async def generate_wordle_word(self, level: int):
        # 1. Ưu tiên lấy từ vựng chuẩn Oxford 5000 CEFR (phản hồi tức thì < 1ms, 0 token AI)
        try:
            try:
                from services.oxford_dataset_service import oxford_dataset_service
            except ImportError:
                from oxford_dataset_service import oxford_dataset_service
            return oxford_dataset_service.get_wordle_word(level)
        except Exception as ex:
            print(f"OxfordDatasetService Wordle generation fallback to Gemini: {ex}")

        import random
        # Sample 40 words from our SQL keyword database
        sample_size = min(40, len(self.wordle_keywords))
        sample_words = random.sample(self.wordle_keywords, sample_size)
        sample_words_str = ", ".join(sample_words)
        
        prompt = f"""
        Bạn là giám khảo IELTS chuyên nghiệp thiết kế trò chơi Wordle Matcha cho học viên.
        Nhiệm vụ của bạn là chọn ra ĐÚNG MỘT TỪ trong danh sách 40 từ sau để làm từ khóa bí mật cho Level {level}:
        [{sample_words_str}]

        Quy tắc độ khó cực kỳ quan trọng cho Level {level}:
        - Level 1-5: Từ vựng cực kỳ phổ biến, quen thuộc, cơ bản và dễ đoán (ví dụ: water, house, beach, happy). Hãy chọn một từ dễ nhất trong danh sách.
        - Level 6-15: Từ vựng IELTS mức độ trung cấp, học thuật phổ biến (ví dụ: focus, group, legal, media, trend, shift).
        - Level 16+: Từ vựng IELTS nâng cao, học thuật chuyên sâu và ít gặp hơn (ví dụ: amity, brief, vague, spark, elite). Cấp độ càng cao, từ càng học thuật và thử thách.

        Sau khi đã chọn được một từ phù hợp từ danh sách trên:
        1. Phân loại từ đó vào một chủ đề IELTS phù hợp nhất (bằng tiếng Việt, ví dụ: Môi trường, Công nghệ, Giáo dục, Y tế, Xã hội, Đời sống, Nghệ thuật, Khoa học, Kinh tế, Lịch sử, v.v.).
        2. Tạo một gợi ý (hint) bằng tiếng Việt cho từ này. 
           QUY TẮC GỢI Ý ĐẦY THỬ THÁCH (HẠN CHẾ DỄ ĐOÁN):
           - KHÔNG giải nghĩa trực tiếp từ đó (ví dụ nếu từ là CLOCK thì KHÔNG được gợi ý "thiết bị đo thời gian" hoặc "dùng để xem giờ").
           - Hãy mô tả khái niệm một cách gián tiếp, sử dụng ẩn dụ, đặt trong ngữ cảnh học thuật IELTS (ví dụ: mô tả cách nó xuất hiện trong IELTS Writing Task 2, hoặc các từ đồng nghĩa/trái nghĩa nâng cao), hoặc mô tả cách nó được sử dụng trong đời sống/khoa học/xã hội.
           - Gợi ý phải kích thích người chơi tư duy logic và suy luận để tăng tính học thuật và giải đố của game.

        Trả về định dạng JSON chính xác như sau:
        {{
            "word": "TỪ_ĐÃ_CHỌN_VIẾT_HOA",
            "theme": "Chủ đề tiếng Việt phù hợp nhất",
            "hint": "Gợi ý tiếng Việt nâng cao và đầy thử thách"
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            data = json.loads(self._clean_json(content))
            word = str(data.get("word", "")).strip().upper()
            
            # Ensure the selected word is 5 letters and is one of the sampled words (or at least valid)
            if len(word) != 5 or word not in self.wordle_keywords:
                # If Gemini returned invalid word, fallback to a random keyword from the sample
                fallback_word = random.choice(sample_words)
                data["word"] = fallback_word
                data["theme"] = data.get("theme", "Học thuật")
                data["hint"] = f"Một từ học thuật 5 chữ cái bắt đầu bằng chữ '{fallback_word[0]}'."
            else:
                data["word"] = word
            return data
        except Exception as e:
            print(f"Gemini generate_wordle_word failed: {e}")
            fallback_word = random.choice(sample_words)
            return {
                "word": fallback_word,
                "theme": "Từ vựng IELTS",
                "hint": f"Từ vựng học thuật gồm 5 chữ cái, có ký tự bắt đầu là '{fallback_word[0]}'."
            }

    async def _post_to_gemini_rest(self, model_name: str, payload: dict, timeout: float = 30.0):
        headers = {}
        if self.gemini_api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_api_key}"
        else:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=payload, timeout=timeout)
            res_json = res.json()
            if "candidates" not in res_json:
                print(f"Gemini REST Error ({res.status_code}): {res.text}")
                raise KeyError(f"Missing candidates: {res.text}")
            return res_json["candidates"][0]["content"]["parts"][0]["text"]

    async def evaluate_pronunciation(self, audio_base64: str, mime_type: str, reference_text: str):
        prompt = f"""
        Compare the user's spoken audio with the reference text: "{reference_text}".
        Verify the pronunciation of each word in the reference text in exact sequence according to Cambridge IELTS Band 8.5+ standards.
        The speaker is a Vietnamese student studying English. Listen carefully to their pronunciation.
        
        CRITICAL NOISE, SILENCE & LANGUAGE RULES:
        - If the audio is silent, consists only of static noise, heavy breathing, or unintelligible mumbling, mark ALL words as "incorrect", set overall_score to 0, wpm to 0, and set the "tip" of the first word to "Không phát hiện giọng nói hoặc âm thanh không rõ ràng. Vui lòng nói to rõ hơn!".
        - If the user is speaking Vietnamese (Tiếng Việt) instead of English, mark ALL words as "incorrect", set overall_score to 0, wpm to 0, and set the "tip" of the first word to "Tớ nghe hình như cậu đang nói tiếng Việt? Hãy phát âm câu tiếng Anh nhé! 🐻".
        
        PRONUNCIATION EVALUATION RULES (Academic Skill 1 in docs/skills.md):
        If the audio is valid English speech, analyze each word:
          - "correct": Good pronunciation matching native speech.
          - "warning": Minor mistake. Pay close attention to typical Vietnamese student pitfalls:
            * Dropping ending sounds (e.g., omitting final consonants like /s/, /z/, /t/, /d/, /k/, /g/, /v/, /f/).
            * Confusing consonant sounds (e.g., pronouncing /ʃ/ as /s/, or /tʃ/ as /s/).
            * Flat/monotone intonation or wrong word stress (e.g., flat pitch, not stressing keywords).
            * Vowel length confusion (e.g., confusing long /i:/ with short /ɪ/).
          - "incorrect": Completely mispronounced, omitted, or wrong word.
        
        Also evaluate comprehensive Phonetic Feedback:
        - ending_sounds: Nhận xét âm đuôi phụ âm (/s/, /t/, /d/, /kts/...).
        - linking_sounds: Nhận xét hiện tượng nối âm (liaisons & connected speech).
        - intonation: Nhận xét ngữ điệu, trọng âm và độ tự nhiên.
        - overall_score: Điểm tổng quát từ 0 đến 100.
        - wpm: Tốc độ phát âm (từ/phút).
        - detected_text: Câu văn AI nghe được từ người nói.

        Return ONLY a JSON object with this exact structure:
        {{
          "overall_score": 85,
          "wpm": 125,
          "detected_text": "transcribed speech from user",
          "words": [
            {{
              "word": "word",
              "status": "correct" | "warning" | "incorrect",
              "ipa": "accurate IPA pronunciation of the word",
              "tip": "Short tip in Vietnamese (e.g. 'Bật âm đuôi /t/', 'Nhớ bật hơi âm cuối /s/', 'Chu môi phát âm /sh/', 'Nhấn trọng âm ở âm tiết 2')"
            }}
          ],
          "phonetic_feedback": {{
            "ending_sounds": "Đánh giá chi tiết phụ âm cuối bằng tiếng Việt...",
            "linking_sounds": "Đánh giá chi tiết nối âm bằng tiếng Việt...",
            "intonation": "Đánh giá chi tiết ngữ điệu và trọng âm bằng tiếng Việt..."
          }}
        }}
        """
        payload = {
            "contents": [{
                "parts": [
                    {"inlineData": {"mimeType": mime_type, "data": audio_base64}},
                    {"text": prompt}
                ]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        try:
            text_content = await self._post_to_gemini_rest(self.primary_text_model, payload, timeout=30.0)
            cleaned = self._clean_json(text_content)
            data = json.loads(cleaned)
            if isinstance(data, list):
                return {
                    "overall_score": 80,
                    "wpm": 120,
                    "detected_text": reference_text,
                    "words": data,
                    "phonetic_feedback": {
                        "ending_sounds": "Phát âm tốt, chú ý bật rõ các phụ âm cuối /s/, /t/.",
                        "linking_sounds": "Đã có ý thức nối âm cơ bản.",
                        "intonation": "Ngữ điệu tự nhiên, có điểm nhấn ở từ khóa."
                    }
                }
            if "words" not in data or not isinstance(data["words"], list):
                data["words"] = []
            if "phonetic_feedback" not in data:
                data["phonetic_feedback"] = {
                    "ending_sounds": "Chú ý bật rõ âm đuôi /s/, /t/, /d/.",
                    "linking_sounds": "Cố gắng nối phụ âm với nguyên âm tiếp theo mượt mà hơn.",
                    "intonation": "Ngữ điệu tự nhiên, cần nhấn mạnh từ khóa nội dung."
                }
            if "overall_score" not in data:
                data["overall_score"] = 80
            if "wpm" not in data:
                data["wpm"] = 120
            return data
        except Exception as e:
            print(f"evaluate_pronunciation failed: {e}")
            words = reference_text.split()
            fallback_words = [
                {
                    "word": w,
                    "status": "incorrect" if i == 0 else "correct",
                    "ipa": "⚠️" if i == 0 else "",
                    "tip": f"Không thể chấm điểm âm thanh (Lỗi: {str(e)}). Vui lòng thử nói to rõ hơn hoặc kiểm tra Micro!" if i == 0 else ""
                }
                for i, w in enumerate(words)
            ]
            return {
                "overall_score": 50,
                "wpm": 0,
                "detected_text": reference_text,
                "words": fallback_words,
                "phonetic_feedback": {
                    "ending_sounds": "Không thể phân tích do lỗi kết nối âm thanh.",
                    "linking_sounds": "Chưa có dữ liệu.",
                    "intonation": "Vui lòng kiểm tra lại thiết bị thu âm."
                }
            }

    async def evaluate_speech_pronunciation(self, audio_base64: str, mime_type: str = "audio/webm", target_transcript: str = ""):
        """Alias tương thích theo đặc tả Academic Skill 1 (docs/skills.md)"""
        return await self.evaluate_pronunciation(audio_base64, mime_type, target_transcript or "")

    async def evaluate_speaking_sandbox(self, audio_base64: str, mime_type: str, cue_card_prompt: str):
        prompt = f"""
        You are an official IELTS Speaking Examiner. Evaluate the attached audio response for the IELTS Part 2 Cue Card: "{cue_card_prompt}".
        The speaker is a Vietnamese IELTS student. Listen to their spoken English response.
        
        CRITICAL NOISE & SILENCE RULES:
        - If the audio is silent, consists only of background noise, static, heavy breathing, or non-English speech, set "band_score" to 0.0, "wpm" to 0, "transcript" to "No speech detected", and set criteria.fluency to "No speech detected or audio unclear. Please check your microphone and try again!".
        
        If valid English speech is detected, evaluate based on the 4 official IELTS criteria:
        1. Fluency and Coherence
        2. Lexical Resource (Vocabulary)
        3. Grammatical Range and Accuracy
        4. Pronunciation
 
        Also estimate an overall Band Score (between 0.0 and 9.0 in increments of 0.5), count/estimate the speech word-count and Words Per Minute (WPM), list key strengths and weaknesses, extract grammar corrections, list specific mispronounced words, and write a high-end Band 8.5+ Model Answer based on the user's ideas.
 
        Return ONLY a JSON object with this exact structure:
        {{
            "band_score": 6.5,
            "transcript": "Transcription of what the user spoke...",
            "wpm": 130,
            "criteria": {{
                "fluency": "Fluency feedback...",
                "lexical": "Vocabulary feedback...",
                "grammar": "Grammar feedback...",
                "pronunciation": "Pronunciation feedback..."
            }},
            "mispronounced_words": [
                {{
                    "word": "mispronounced word",
                    "ipa": "IPA transcription of word",
                    "tip": "Short correction tip in English (e.g. 'Dropping final /s/', 'Wrong vowel stress')"
                }}
            ],
            "strengths": ["Strength point 1", "Strength point 2"],
            "weaknesses": ["Weakness point 1", "Weakness point 2"],
            "corrections": [
                {{
                    "original": "incorrect sentence spoken by user",
                    "corrected": "corrected version of the sentence",
                    "reason": "Why it is incorrect and how to fix it"
                }}
            ],
            "model_answer": "Full 150-250 word Band 8.5+ model response..."
        }}
        """
        payload = {
            "contents": [{
                "parts": [
                    {"inlineData": {"mimeType": mime_type, "data": audio_base64}},
                    {"text": prompt}
                ]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        try:
            text_content = await self._post_to_gemini_rest(self.primary_text_model, payload, timeout=45.0)
            cleaned = self._clean_json(text_content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"evaluate_speaking_sandbox failed: {e}")
            return {
                "band_score": 0.0,
                "transcript": f"Audio analysis error: {str(e)}",
                "wpm": 0,
                "criteria": {"fluency": "Please check your microphone and try again.", "lexical": "", "grammar": "", "pronunciation": ""},
                "mispronounced_words": [],
                "strengths": [],
                "weaknesses": [],
                "corrections": [],
                "model_answer": ""
            }

    async def evaluate_speaking_reflex(self, audio_base64: str, mime_type: str, question: str):
        prompt = f"""
        You are an elite Cambridge IELTS Examiner and a friendly, witty AI Coach named Matcha Bear.
        The student is answering your question: "{question}".
        Analyze their spoken English audio based on Cambridge IELTS Academic Band 8.5+ standards and Academic Skill 4 (drive_conversation_reflex) & Skill 1 (evaluate_speech_pronunciation) from docs/skills.md.
        
        CRITICAL NOISE, SILENCE & LANGUAGE AUDIT RULES:
        - If the audio is silent, consists only of background static/noise, or heavy breathing:
          set "transcript" to "No speech detected", "filler_words_count" to 0, "filler_words_found": [], "feedback" to "I couldn't hear you clearly, please speak up! 🐻", "witty_reply" to "I couldn't hear you clearly, could you repeat that? 🐻",
          "spoken_reply_and_critique" to "I couldn't hear you clearly. Could you please speak a little louder into your microphone?",
          "spoken_next_question" to f"Let's try this question again: {question}",
          "next_question" to question,
          "shadow_errors_logged" to [],
          "phonetic_feedback" to {{"ending_sounds": "No speech detected", "linking_sounds": "No speech detected", "intonation": "No speech detected"}},
          "reflex_stats" to {{"estimated_wpm": 0, "fluency_score": 0.0, "grammatical_range_score": 0.0, "response_pace": "Unclear", "recommended_focus": "Speak louder and closer to the microphone."}}.
        
        - If the speaker speaks Vietnamese instead of English:
          set "transcript" to "Spoke in Vietnamese", "filler_words_count" to 0, "filler_words_found": [], "feedback" to "It seems you are speaking Vietnamese! Please respond in English so I can help you practice. 🐻", "witty_reply" to "I caught some Vietnamese! Please answer in English so I can understand you. 😉 🐻",
          "spoken_reply_and_critique" to "I noticed you answered in Vietnamese. Please respond in English so we can practice together!",
          "spoken_next_question" to f"Here is the question again: {question}",
          "next_question" to question,
          "shadow_errors_logged" to [],
          "phonetic_feedback" to {{"ending_sounds": "Spoke in Vietnamese", "linking_sounds": "Spoke in Vietnamese", "intonation": "Spoke in Vietnamese"}},
          "reflex_stats" to {{"estimated_wpm": 0, "fluency_score": 0.0, "grammatical_range_score": 0.0, "response_pace": "Vietnamese", "recommended_focus": "Translate your ideas into English and try again."}}.
        
        If valid English speech is detected:
        1. CONVERSATIONAL REPLY (witty_reply): Formulate a friendly, engaging reply in English reacting to what the student actually shared.
        2. SPOKEN SCRIPT FOR GEMINI LIVE:
           - "spoken_reply_and_critique": The exact English text for Matcha Bear to speak ALOUD FIRST. It reacts warmly to what the student said AND gives immediate 1-2 sentence coaching critique on their reflex speed, filler words, pronunciation, or flow. MUST BE NATURAL HUMAN-LIKE SPEECH WITHOUT EMOJIS, SYMBOLS, OR MARKDOWN.
           - "spoken_next_question": The exact English text for Matcha Bear to speak ALOUD NEXT, leading smoothly into the next question (e.g. "Now, onto our next question: ..."). MUST BE NATURAL SPEECH WITHOUT EMOJIS OR MARKDOWN.
        3. SHADOW ERROR LOGGING (Academic Skill 4 in docs/skills.md): Detect subtle grammatical flaws, L1 Vietnamese language interference, or Band 4-5 basic word choices without interrupting the student's flow. Provide Band 8.5+ native alternatives:
           [{{"learner_utterance": "phrase student said", "identified_flaw": "flaw description", "band_8_alternative": "high-band alternative phrase"}}]
        4. PHONETIC FEEDBACK (Academic Skill 1 in docs/skills.md):
           - "ending_sounds": Feedback in Vietnamese on final consonants (/s/, /z/, /t/, /d/, /k/, /g/, /v/, /f/).
           - "linking_sounds": Feedback in Vietnamese on liaison & connected speech.
           - "intonation": Feedback in Vietnamese on natural pitch and emphasis.
        5. REFLEX & FLUENCY STATS:
           - "estimated_wpm": Words per minute.
           - "fluency_score": 0.0 to 9.0.
           - "grammatical_range_score": 0.0 to 9.0.
           - "response_pace": "Natural" | "Hesitant" | "Fast".
           - "recommended_focus": Short pedagogical advice in Vietnamese.
        
        Return ONLY a JSON object with this exact structure:
        {{
            "transcript": "Transcribed text of what the user said in English...",
            "filler_words_count": 2,
            "filler_words_found": ["um", "like"],
            "feedback": "Comprehensive encouraging coaching feedback in Vietnamese...",
            "witty_reply": "Matcha Bear's funny/warm reply with emoji...",
            "spoken_reply_and_critique": "Pure English text reacting to user's answer and giving critique first without emojis...",
            "spoken_next_question": "Now, here is my next question for you: ...",
            "next_question": "Next natural conversation follow-up question in English...",
            "shadow_errors_logged": [
                {{"learner_utterance": "I think it make people happy", "identified_flaw": "Subject-verb agreement & basic phrasing", "band_8_alternative": "I believe it genuinely fosters a sense of contentment"}}
            ],
            "phonetic_feedback": {{
                "ending_sounds": "Đã phát âm tốt, chú ý bật rõ âm /s/ ở số nhiều.",
                "linking_sounds": "Nối âm mượt mà ở các cụm từ nối.",
                "intonation": "Ngữ điệu tự nhiên, có điểm nhấn."
            }},
            "reflex_stats": {{
                "estimated_wpm": 120,
                "fluency_score": 7.0,
                "grammatical_range_score": 6.5,
                "response_pace": "Natural",
                "recommended_focus": "Duy trì phản xạ dưới 3 giây và mở rộng ý với nguyên nhân - kết quả."
            }}
        }}
        """
        payload = {
            "contents": [{
                "parts": [
                    {"inlineData": {"mimeType": mime_type, "data": audio_base64}},
                    {"text": prompt}
                ]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        try:
            text_content = await self._post_to_gemini_rest(self.primary_text_model, payload, timeout=35.0)
            cleaned = self._clean_json(text_content)
            data = json.loads(cleaned)
            if "shadow_errors_logged" not in data or not isinstance(data["shadow_errors_logged"], list):
                data["shadow_errors_logged"] = []
            if "phonetic_feedback" not in data:
                data["phonetic_feedback"] = {
                    "ending_sounds": "Phát âm khá tốt, lưu ý các âm đuôi /s/, /t/.",
                    "linking_sounds": "Nối âm tự nhiên.",
                    "intonation": "Ngữ điệu rõ ràng."
                }
            if "reflex_stats" not in data:
                data["reflex_stats"] = {
                    "estimated_wpm": 110,
                    "fluency_score": 7.0,
                    "grammatical_range_score": 6.5,
                    "response_pace": "Natural",
                    "recommended_focus": "Tiếp tục phát huy phản xạ tự nhiên."
                }
            if "spoken_reply_and_critique" not in data:
                data["spoken_reply_and_critique"] = data.get("witty_reply", "Great answer! Keep practicing your flow.")
            if "spoken_next_question" not in data:
                data["spoken_next_question"] = f"Now, here is my next question: {data.get('next_question', question)}"
            return data
        except Exception as e:
            print(f"evaluate_speaking_reflex failed: {e}")
            return {
                "transcript": "Could not transcribe speech.",
                "filler_words_count": 0,
                "filler_words_found": [],
                "feedback": f"Connection error: {str(e)}",
                "witty_reply": "I couldn't hear you clearly, could you repeat that? 🐻",
                "spoken_reply_and_critique": "I couldn't hear you clearly due to a connection error. Could you please repeat that?",
                "spoken_next_question": "Let's try this: What is your favorite season?",
                "next_question": "Let's try another topic. What is your favorite season?",
                "shadow_errors_logged": [],
                "phonetic_feedback": {
                    "ending_sounds": "Lỗi kết nối",
                    "linking_sounds": "Lỗi kết nối",
                    "intonation": "Lỗi kết nối"
                },
                "reflex_stats": {
                    "estimated_wpm": 0,
                    "fluency_score": 0.0,
                    "grammatical_range_score": 0.0,
                    "response_pace": "Error",
                    "recommended_focus": "Kiểm tra lại kết nối mạng và thử lại."
                }
            }

    async def generate_speaking_sentence(self, level: str):
        import random
        topics = [
            "hobbies and leisure activities", "travel and tourism", "family and relationships", 
            "education and school memories", "jobs and career aspirations", "modern technology and AI", 
            "environmental issues and nature", "food, cooking and restaurants", "sports and physical health", 
            "art, museums and design", "music and concerts", "childhood memories", 
            "shopping and fashion trends", "public transportation and cities", "future plans and goals", 
            "famous people and role models", "national culture and traditions", "daily routines", 
            "learning foreign languages", "hometown changes over time"
        ]
        random_topic = random.choice(topics)
        
        prompt = f"""
        Generate a single IELTS Speaking Shadowing sentence in English for the difficulty level: "{level}".
        The generated sentence MUST be about the topic of: "{random_topic}". Make sure it is completely unique, creative, and different from typical boilerplate examples.
        - "easy": Short, simple grammatical structure, everyday vocabulary. (e.g. "I enjoy studying English in the morning.")
        - "medium": Standard sentence structure with common academic words. (e.g. "Technology plays a significant role in modern education.")
        - "hard": Complex sentence structure, advanced lexical resources, formal IELTS style. (e.g. "Socioeconomic disparities significantly influence access to high-quality education.")
        
        Return ONLY a JSON object:
        {{
            "sentence": "The generated English sentence here"
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content.strip())
            return data.get("sentence", "Learning English daily expands your academic opportunities.")
        except Exception as e:
            print(f"generate_speaking_sentence failed: {e}")
            fallbacks = {
                "easy": "The weather is very pleasant today.",
                "medium": "Advanced digital learning platforms are transforming education.",
                "hard": "Environmental conservation requires immediate international cooperation."
            }
            return fallbacks.get(level, fallbacks["medium"])

    async def generate_speaking_cuecard(self, level: str):
        import random
        topics = [
            "a person who inspired you", "a place you visited recently", "a book or movie that touched you",
            "an important life decision", "a difficult challenge you overcame", "a technological innovation",
            "an environmental conservation effort", "a memorable school or university memory", "a custom or tradition from your country",
            "a hobby or sport you enjoy", "a job or career path you find interesting", "a city or town you would like to live in"
        ]
        random_topic = random.choice(topics)

        prompt = f"""
        Generate an IELTS Part 2 Cue Card topic and sub-prompts for the difficulty level: "{level}".
        The generated cue card MUST be related to: "{random_topic}". Make it creative and unique.
        - "easy": Simple topic (e.g. describe a favorite book, describing a school event).
        - "medium": Standard IELTS topics (e.g. describing a city, describing a technological device).
        - "hard": Complex, abstract topics (e.g. describe a law that protects the environment, describe a historical event that changed your country).
        
        Return ONLY a JSON object with this exact structure:
        {{
            "topic": "Describe...",
            "prompts": [
                "Prompt bullet 1",
                "Prompt bullet 2",
                "Prompt bullet 3",
                "Prompt bullet 4"
            ]
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content.strip())
        except Exception as e:
            print(f"generate_speaking_cuecard failed: {e}")
            return {
                "topic": "Describe a book you enjoyed reading recently.",
                "prompts": [
                    "What book it is and when you read it",
                    "What the main storyline or theme is",
                    "How it made you feel",
                    "And explain why you would recommend it to others."
                ]
            }

    async def generate_pronunciation_guide(self, sentence: str):
        prompt = f"""
        Provide a complete pronunciation and speaking guide for this English sentence:
        "{sentence}"
        
        Break it down into:
        1. "ipa_sentence": Complete IPA transcription of the sentence.
        2. "liaisons": Tips on where to connect/link words (liaison/linking sounds) in Vietnamese. (e.g. 'connect /s/ of is and /a/ of an')
        3. "stresses": Key content words to stress/emphasize during speech.
        4. "intonation": Tone tips (rising or falling at the end, pauses after clauses) in Vietnamese.
        
        Return ONLY a JSON object:
        {{
            "ipa_sentence": "...",
            "liaisons": ["Tip 1", "Tip 2"],
            "stresses": ["Word 1", "Word 2"],
            "intonation": "..."
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content.strip())
        except Exception as e:
            print(f"generate_pronunciation_guide failed: {e}")
            return {
                "ipa_sentence": "Pronunciation guide currently loading...",
                "liaisons": ["Đọc nối âm giữa các phụ âm tận cùng với nguyên âm đứng sau."],
                "stresses": ["Nhấn mạnh các từ mang nội dung chính (Danh từ, Động từ, Tính từ)."],
                "intonation": "Xuống giọng ở cuối câu khẳng định để tự nhiên hơn."
            }

    async def generate_weekly_plan(self, topic: str, study_focus: str):
        prompt = f"""
        Bạn là trợ lý IELTS học thuật xuất sắc. Hãy thiết kế lộ trình học IELTS 7 ngày (Weekly Study Plan) cho chủ đề "{topic}" và trọng tâm học tập là "{study_focus}".
        
        Quy tắc thiết kế lộ trình theo Trọng tâm học tập ("{study_focus}"):
        - Nếu là "Từ vựng": Tất cả 7 ngày tập trung chuyên sâu vào từ vựng học thuật, đọc báo học thuật MatchaScroll, chơi Quiz từ vựng. Tránh viết bài hay nói ghi âm dài.
        - Nếu là "Nói": Tập trung 7 ngày vào luyện nói Shadowing và làm cue card Sandbox nói 2 phút trên web.
        - Nếu là "Viết": Tập trung 7 ngày vào Writing Task 1 và Task 2, lên ý tưởng, viết bài luận hoàn chỉnh trên Writing Sanctuary.
        - Nếu là "Toàn diện": Phân bổ đều đặn các kỹ năng trong tuần (Thứ 2: Nói & Từ vựng, Thứ 3: Viết, Thứ 4: Nghe, Thứ 5: Đọc, Thứ 6: Ôn tập Quiz, Thứ 7: Nói Sandbox, Chủ nhật: SRS Review).

        Mỗi ngày trong tuần (từ "Monday" đến "Sunday") phải có:
        1. "topic": Chủ đề nhỏ chi tiết của ngày đó.
        2. "focus": Kỹ năng chính của ngày đó ("Từ vựng", "Nói", "Viết", "Nghe", "Đọc").
        3. "tasks": Danh sách 2-3 nhiệm vụ cụ thể cần hoàn thành.
        4. "vocabulary": Danh sách 3 từ vựng IELTS tiêu biểu của ngày đó (word, phonetic, meaning, example). Định nghĩa tiếng Việt, câu ví dụ tiếng Anh.
        5. Tùy thuộc vào "focus" của ngày đó, hãy cung cấp phần luyện tập tương ứng:
           - Nếu focus là "Nghe": Thêm đối tượng "listening" gồm (title, description, audio_script, questions).
           - Nếu focus là "Đọc": Thêm đối tượng "reading" gồm (title, text, questions).
           - Nếu focus là "Viết": Thêm đối tượng "writing" gồm (prompt, key_points).
           - Nếu focus là "Nói": Thêm đối tượng "speaking" gồm (prompt).

        Trả về DUY NHẤT một đối tượng JSON có cấu trúc như sau (không kèm ký hiệu markdown, không kèm giải thích khác):
        {{
            "Monday": {{
                "topic": "Daily Subtopic",
                "focus": "Kỹ năng của ngày",
                "tasks": ["Task 1", "Task 2"],
                "vocabulary": [
                    {{"word": "word1", "phonetic": "/.../", "meaning": "nghĩa1", "example": "ví dụ 1"}}
                ],
                "speaking": {{ "prompt": "Câu hỏi nói..." }}
            }},
            "Tuesday": {{
                ...
            }}
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content.strip())
        except Exception as e:
            print(f"generate_weekly_plan failed: {e}")
            # Fallback mock 7 days plan
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            fallback_plan = {}
            for d in days:
                fallback_plan[d] = {
                    "topic": f"Học từ vựng nâng cao chủ đề {topic}",
                    "focus": "Từ vựng",
                    "tasks": ["Ôn tập từ vựng IELTS", "Xem ví dụ minh họa"],
                    "vocabulary": [
                        {"word": "Advantageous", "phonetic": "/ˌæd.vænˈteɪ.dʒəs/", "meaning": "Có lợi, thuận lợi", "example": "A strong grasp of English is advantageous in the global job market."}
                    ]
                }
            return fallback_plan

    async def drive_conversation_reflex(self, messages: list, current_topic: str = "General", target_band: float = 7.5):
        """
        Skill: drive_conversation_reflex
        Nhập vai Giám khảo IELTS Speaking (Part 1/2/3), duy trì mạch phản xạ hội thoại
        và thực hiện Shadow Error Logging (ghi nhận lỗi ngầm không ngắt lời).
        """
        prompt = f"""
        Bạn là Chuyên gia Khảo thí IELTS Speaking Quốc tế và Huấn luyện viên phản xạ Mát Cha Bear.
        Chủ đề thảo luận hiện tại: "{current_topic}".
        Band điểm mục tiêu của học viên: {target_band}.
        
        NHIỆM VỤ ĐIỀU PHỐI PHẢN XẠ:
        1. Xem xét lượt trao đổi gần nhất của học viên.
        2. Tự nhiên đưa ra câu phản hồi ngắn, thân thiện và đặt 1 câu hỏi đào sâu (follow-up question) kích thích học viên mở rộng ý (Why, How, Can you elaborate).
        3. SHADOW ERROR LOGGING (Ghi nhận lỗi ngầm): Âm thầm phát hiện các lỗi sai ngữ pháp, lỗi dùng từ sáo rỗng (Band 4-5) hoặc dịch thô từ tiếng Việt (Vietnamese L1 transfer), và đề xuất phiên bản diễn đạt Band 8.5+.
        4. Đánh giá tốc độ và nhịp độ phản xạ (response_pace) cùng lời khuyên sư phạm ngắn gọn (recommended_focus).

        Trả về DUY NHẤT định dạng JSON:
        {{
            "examiner_reply": "Câu phản hồi tự nhiên và câu hỏi mở rộng bằng tiếng Anh...",
            "shadow_errors_logged": [
                {{
                    "learner_utterance": "cụm từ học viên nói có lỗi",
                    "identified_flaw": "mô tả ngắn lỗi ngữ pháp / từ vựng",
                    "band_8_alternative": "cách diễn đạt thay thế chuẩn Band 8.5+"
                }}
            ],
            "reflex_stats": {{
                "response_pace": "Natural",
                "recommended_focus": "Lời khuyên cải thiện phản xạ ngắn gọn bằng tiếng Việt"
            }}
        }}
        """
        formatted = [{"role": "system", "content": prompt.strip()}]
        if isinstance(messages, list):
            for m in messages:
                if isinstance(m, dict) and "content" in m:
                    r = "assistant" if m.get("role") in ["assistant", "ai", "bot"] else "user"
                    formatted.append({"role": r, "content": str(m["content"])})
                elif isinstance(m, str):
                    formatted.append({"role": "user", "content": m})
        elif isinstance(messages, str):
            formatted.append({"role": "user", "content": messages})

        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=formatted,
                response_format={"type": "json_object"},
                timeout=15.0
            )
            data = json.loads(self._clean_json(response.choices[0].message.content.strip()))
            data.setdefault("response", data.get("examiner_reply", ""))
            data.setdefault("examiner_reply", data.get("response", ""))
            data.setdefault("shadow_errors_logged", [])
            data.setdefault("connector_suggestions", ["Furthermore", "To substantiate this", "Consequently"])
            return data
        except Exception as e:
            print(f"drive_conversation_reflex failed: {e}")
            return {
                "response": "That is quite fascinating! Could you tell me more about how that impacts your daily routine?",
                "examiner_reply": "That is quite fascinating! Could you tell me more about how that impacts your daily routine?",
                "shadow_errors_logged": [],
                "connector_suggestions": ["Furthermore", "In other words", "As a result"],
                "reflex_stats": {
                    "response_pace": "Natural",
                    "recommended_focus": "Hãy tiếp tục mở rộng câu trả lời với ví dụ cụ thể."
                }
            }

    async def generate_spaced_repetition_review(self, weak_words: list = None, weak_grammar_points: list = None, count: int = 3, vocab_list: list = None, focus_area: str = "balanced", item_count: int = None):
        """
        Skill: generate_spaced_repetition_review
        Tự động sinh bộ câu hỏi ôn tập ngắt quãng (SRS Review Engine) bám sát các từ vựng
        có điểm Mastery thấp hoặc điểm ngữ pháp hay sai trong lịch sử học tập.
        Phục vụ: VocabularyQuiz, Grammar Pop Game và nhắc học Discord Bot.
        """
        if item_count:
            count = item_count
            
        extracted_words = []
        if vocab_list:
            for item in vocab_list:
                if isinstance(item, dict):
                    w = item.get("word") or item.get("term")
                    if w: extracted_words.append(w)
                elif isinstance(item, str):
                    extracted_words.append(item)
        if weak_words:
            extracted_words.extend([w for w in weak_words if isinstance(w, str)])

        words_str = ", ".join(extracted_words) if extracted_words else "mitigate, profound, facilitate, versatile, resilient"
        grammar_str = ", ".join(weak_grammar_points) if weak_grammar_points else "Subject-verb agreement, Although vs Despite, Relative clauses"
        
        prompt = f"""
        Bạn là Chuyên gia Khảo thí Thiết kế Đề thi IELTS và Hệ thống Ôn tập Ngắt quãng (SRS).
        Trọng tâm ôn tập: {focus_area}.
        Hãy tạo ra {count} câu hỏi trắc nghiệm ôn tập thích ứng (Adaptive Review Quiz) xoay quanh các điểm yếu của học viên:
        Từ vựng cần củng cố: [{words_str}]
        Điểm ngữ pháp cần rèn luyện: [{grammar_str}]

        CÁC DẠNG CÂU HỎI BẮT BUỘC TUÂN THỦ:
        1. 'collocation_cloze': Câu học thuật có CHỖ TRỐNG '________' để điền cụm từ (Collocation) chuẩn xác:
           - "question": BẮT BUỘC là câu văn học thuật IELTS hoàn chỉnh có chỗ trống '________' (ví dụ: "Researchers decided to ________ extensive clinical trials to identify effective treatments.").
           - "options": 4 lựa chọn PHẢI CÙNG TỪ LOẠI VÀ DẠNG NGỮ PHÁP (nếu đáp án là Phrasal Verb/Verb thì cả 4 đáp án đều phải là Verbs/Phrasal Verbs có nghĩa gần gũi, ví dụ: ["carry out", "conduct", "implement", "undergo"]). TUYỆT ĐỐI KHÔNG ghép các từ không liên quan như danh từ "touchscreen", "bond", "affection" vào câu hỏi cần động từ!
           - "correct_answer": Từ/cụm từ điền vào chỗ trống tự nhiên và chuẩn xác nhất theo collocation học thuật.
        2. 'error_identification': Tìm lỗi sai ngữ pháp trong câu theo format chuẩn đề thi:
           - "question": Câu văn tiếng Anh chứa lỗi sai, trong đó 4 vị trí kiểm tra BẮT BUỘC được đánh dấu rõ bằng [A], [B], [C], [D] ngay trước hoặc quanh từ đó. Ví dụ: "Despite [A] he worked [B] diligently, he failed [C] to achieve [D] his target score."
           - "options": Mảng 4 phần cần kiểm tra tương ứng với [A], [B], [C], [D] kèm cụm từ thực tế (ví dụ: ["[A] Despite", "[B] he worked", "[C] failed", "[D] his target score"]). TUYỆT ĐỐI KHÔNG chỉ trả về ["A", "B", "C", "D"] rỗng mà phải chứa cụm từ bị kiểm tra!
           - "correct_answer": Phần bị sai ngữ pháp (ví dụ: "[A] Despite").
        3. 'definition_match': Cho định nghĩa học thuật rõ ràng và 4 từ vựng CÙNG TỪ LOẠI để người học chọn từ đúng.

        Trả về DUY NHẤT định dạng JSON:
        {{
            "items": [
                {{
                    "id": "item_1",
                    "type": "collocation_cloze",
                    "question": "Governments must implement comprehensive measures to ________ the detrimental impacts of urbanization.",
                    "options": ["mitigate", "deteriorate", "accelerate", "resemble"],
                    "correct_answer": "mitigate",
                    "explanation": "'Mitigate the impacts' là collocation C1 chuẩn xác mang nghĩa giảm nhẹ tác động tiêu cực.",
                    "cambridge_explanation": "'Mitigate the impacts' là collocation C1 chuẩn xác mang nghĩa giảm nhẹ tác động tiêu cực.",
                    "target_word": "mitigate",
                    "target_concept": "mitigate"
                }},
                {{
                    "id": "item_2",
                    "type": "error_identification",
                    "question": "Despite [A] he worked [B] diligently, he failed [C] to achieve [D] his target band score.",
                    "options": ["[A] Despite", "[B] worked", "[C] failed", "[D] to achieve"],
                    "correct_answer": "[A] Despite",
                    "explanation": "Sau 'Despite' là N/V-ing, không dùng mệnh đề. Cần sửa thành 'Although' hoặc 'Despite working'.",
                    "cambridge_explanation": "Sau 'Despite' là N/V-ing, không dùng mệnh đề. Cần sửa thành 'Although' hoặc 'Despite working'.",
                    "target_word": "despite",
                    "target_concept": "Conjunction vs Preposition"
                }}
            ]
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                timeout=18.0
            )
            data = json.loads(self._clean_json(response.choices[0].message.content.strip()))
            raw_items = data.get("items") or data.get("quiz_items") or []
            normalized_items = []
            for idx, it in enumerate(raw_items, 1):
                if isinstance(it, dict):
                    # Prioritize question over generic instruction prompt
                    q_text = it.get("question") or it.get("sentence") or it.get("prompt") or ""
                    # If question is just a generic instruction like "Complete the sentence...", use prompt if prompt has the actual sentence
                    if q_text.lower().startswith("complete the sentence") and it.get("prompt") and not it.get("prompt").lower().startswith("complete the sentence"):
                        q_text = it.get("prompt")
                    
                    # Ensure collocation_cloze has a visible blank ________
                    if it.get("type") == "collocation_cloze" and "_" not in q_text and "[...]" not in q_text and "[___]" not in q_text:
                        ans = it.get("correct_answer") or it.get("target_word")
                        if ans and ans.lower() in q_text.lower():
                            import re
                            q_text = re.sub(rf'\b{re.escape(ans)}\b', '________', q_text, count=1, flags=re.IGNORECASE)
                        elif not q_text.strip().endswith("________"):
                            q_text = f"{q_text.rstrip('.')} ________."

                    exp = it.get("cambridge_explanation") or it.get("explanation") or ""
                    tgt = it.get("target_word") or it.get("target_concept") or ""
                    it["prompt"] = q_text
                    it["question"] = q_text
                    it["explanation"] = exp
                    it["cambridge_explanation"] = exp
                    it["target_word"] = tgt
                    it["target_concept"] = tgt
                    it.setdefault("id", f"item_{idx}")
                    normalized_items.append(it)
            return {
                "review_count": len(normalized_items),
                "items": normalized_items,
                "quiz_items": normalized_items
            }
        except Exception as e:
            print(f"generate_spaced_repetition_review failed: {e}")
            fallback_items = [
                {
                    "id": "item_1",
                    "type": "collocation_cloze",
                    "prompt": "Government policies should aim to [...] environmental degradation.",
                    "question": "Government policies should aim to ________ environmental degradation.",
                    "options": ["mitigate", "deteriorate", "accelerate", "resemble"],
                    "correct_answer": "mitigate",
                    "explanation": "'Mitigate' đi cùng 'degradation/impacts' nghĩa là giảm nhẹ tác động tiêu cực.",
                    "cambridge_explanation": "'Mitigate' đi cùng 'degradation/impacts' nghĩa là giảm nhẹ tác động tiêu cực.",
                    "target_word": "mitigate",
                    "target_concept": "mitigate"
                }
            ]
            return {
                "review_count": len(fallback_items),
                "items": fallback_items,
                "quiz_items": fallback_items
            }

    async def generate_grammar_from_custom_text(self, text: str, mechanics: list = None, count: int = 4):
        """
        Trích xuất cấu trúc ngữ pháp và sinh đề 4 Game Mechanics từ văn bản người dùng dán vào.
        """
        mechanics = mechanics or ["MULTIPLE_CHOICE", "GAP_FILL", "SENTENCE_SCRAMBLE", "ERROR_SPOTTING"]
        prompt = f"""
        Bạn là Chuyên gia Khảo thí Ngôn ngữ IELTS Cambridge.
        Hãy phân tích đoạn văn sau đây của người dùng và tạo ra {count} câu hỏi bài tập ngữ pháp thực chiến:
        --- ĐOẠN VĂN ---
        {text[:1200]}
        ---
        Yêu cầu bài tập phải đa dạng cơ chế trong danh sách: {mechanics}.
        Định dạng JSON trả về DUY NHẤT một mảng các đối tượng, mỗi đối tượng có định dạng:
        [
          {{
            "mechanic": "MULTIPLE_CHOICE | GAP_FILL | SENTENCE_SCRAMBLE | ERROR_SPOTTING",
            "cefr_level": "B2",
            "target_concept": "Tên chủ điểm (ví dụ: Inversion, Past Perfect, Relative Clause)",
            "prompt": "Yêu cầu bài tập",
            "content_payload": {{
                // Nếu là MULTIPLE_CHOICE:
                // "sentence_with_blank": "Câu tiếng Anh có [ _____ ]", "options": ["A", "B", "C", "D"], "correct_answer": "Đáp án đúng"
                // Nếu là GAP_FILL:
                // "sentence_with_blank": "Câu có [ _____ ]", "base_word": "từ gốc", "acceptable_answers": ["dạng đúng"]
                // Nếu là SENTENCE_SCRAMBLE:
                // "scrambled_tokens": ["token1", "token2", "token3"], "ordered_tokens": ["token1", "token2", "token3"]
                // Nếu là ERROR_SPOTTING:
                // "segments": [{{"id": "A", "text": "cụm 1"}}, {{"id": "B", "text": "cụm 2"}}, {{"id": "C", "text": "cụm 3"}}, {{"id": "D", "text": "cụm 4"}}], "error_segment_id": "A", "correction": "cụm đúng"
            }},
            "explanation": "Giải thích ngữ pháp chi tiết bằng tiếng Việt",
            "ielts_tip": "Mẹo ăn điểm GRA IELTS"
          }}
        ]
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content)
            raw_exercises = json.loads(cleaned)
            return raw_exercises
        except Exception as e:
            print(f"generate_grammar_from_custom_text error: {e}")
            # Fallback high quality exercises
            return [
                {
                    "mechanic": "MULTIPLE_CHOICE",
                    "cefr_level": "B2",
                    "target_concept": "Passive Voice with Reporting Verbs",
                    "prompt": "Chọn dạng động từ học thuật chuẩn xác:",
                    "content_payload": {
                        "sentence_with_blank": "It [ _____ ] that technological innovations accelerate productivity.",
                        "options": ["is widely believed", "widely believes", "has widely believing", "is believe"],
                        "correct_answer": "is widely believed"
                    },
                    "explanation": "Cấu trúc bị động khách quan 'It is widely believed that...' rất phổ biến trong mở bài IELTS Writing Task 2.",
                    "ielts_tip": "Dùng bị động khách quan để tránh xưng 'I/We' thể hiện quan điểm cá nhân."
                },
                {
                    "mechanic": "GAP_FILL",
                    "cefr_level": "B2",
                    "target_concept": "Past Simple Closed Timeline",
                    "prompt": "Chia dạng đúng của động từ trong ngoặc theo ngữ cảnh Task 1:",
                    "content_payload": {
                        "sentence_with_blank": "Between 2010 and 2020, solar energy output [ _____ ] dramatically.",
                        "base_word": "escalate",
                        "acceptable_answers": ["escalated"]
                    },
                    "explanation": "Khoảng thời gian 2010-2020 đã kết thúc hoàn toàn trong quá khứ nên bắt buộc dùng thì Quá khứ đơn 'escalated'.",
                    "ielts_tip": "Tránh dùng Present Perfect khi câu có năm quá khứ xác định."
                },
                {
                    "mechanic": "SENTENCE_SCRAMBLE",
                    "cefr_level": "C1",
                    "target_concept": "Inversion with Seldom / Rarely",
                    "prompt": "Sắp xếp các thẻ từ sau thành câu đảo ngữ học thuật Band 8.0+:",
                    "content_payload": {
                        "scrambled_tokens": ["Seldom", "do governments", "address", "such acute crises", "effectively."],
                        "ordered_tokens": ["Seldom", "do governments", "address", "such acute crises", "effectively."]
                    },
                    "explanation": "Khi trạng từ phủ định 'Seldom/Rarely' đứng đầu câu, trợ động từ đảo lên trước chủ ngữ: Seldom + do/does/did + S + V.",
                    "ielts_tip": "Sử dụng 1 câu đảo ngữ đúng chỗ trong Task 2 có thể kéo điểm tiêu chí GRA lên Band 8.0."
                },
                {
                    "mechanic": "ERROR_SPOTTING",
                    "cefr_level": "B2",
                    "target_concept": "Connectors: Although vs Despite",
                    "prompt": "Bấm chọn cụm từ gạch chân chứa lỗi sai ngữ pháp:",
                    "content_payload": {
                        "segments": [
                            {"id": "A", "text": "Although"},
                            {"id": "B", "text": "the rapid expansion"},
                            {"id": "C", "text": "of electric transport,"},
                            {"id": "D", "text": "fossil fuel usage persists."}
                        ],
                        "error_segment_id": "A",
                        "correction": "Despite / In spite of"
                    },
                    "explanation": "'Although' chỉ đi kèm mệnh đề (S + V). Đứng trước cụm danh từ 'the rapid expansion' bắt buộc dùng 'Despite' hoặc 'In spite of'.",
                    "ielts_tip": "Đây là lỗi sai phổ biến nhất bị trừ điểm trong tiêu chí Grammatical Range & Accuracy."
                }
            ]

    async def generate_mirror_error_exercises(self, writing_samples: list):
        """
        Trích xuất lỗi ngữ pháp từ các bài viết cũ của chính User để tạo bài tập Error Spotting cá nhân hóa.
        """
        samples_text = ""
        for idx, w in enumerate(writing_samples[:3]):
            content = w.get("content", "")[:400]
            fb = w.get("feedback", "")[:400]
            samples_text += f"\n[Bài {idx+1}] Nội dung: {content}\nNhận xét chấm: {fb}\n"

        prompt = f"""
        Bạn là Giám khảo IELTS Cambridge. Dưới đây là các đoạn văn và nhận xét chấm Writing thực tế của học viên:
        {samples_text}
        
        Hãy tìm 3 câu chứa lỗi ngữ pháp thực tế mà học viên này đã mắc phải trong bài viết.
        Chuyển đổi mỗi câu thành một bài tập ERROR_SPOTTING với 4 phân đoạn gạch chân [A], [B], [C], [D], trong đó 1 phân đoạn là lỗi sai của học viên.
        Định dạng JSON trả về DUY NHẤT một mảng:
        [
          {{
            "mechanic": "ERROR_SPOTTING",
            "cefr_level": "B2",
            "target_concept": "Tên lỗi ngữ pháp (ví dụ: Subject-Verb Agreement, Wrong Preposition, Run-on sentence)",
            "prompt": "Phát hiện lỗi ngữ pháp bạn đã từng mắc phải trong bài viết của mình:",
            "content_payload": {{
              "segments": [
                {{"id": "A", "text": "cụm 1"}},
                {{"id": "B", "text": "cụm 2"}},
                {{"id": "C", "text": "cụm lỗi sai của bạn"}},
                {{"id": "D", "text": "cụm 4"}}
              ],
              "error_segment_id": "C",
              "correction": "cụm đã sửa đúng chuẩn Band 8.5"
            }},
            "explanation": "Giải thích chi tiết tại sao cách viết cũ bị trừ điểm và cách sửa chuẩn",
            "ielts_tip": "Lời khuyên thực chiến để không lặp lại lỗi này trong phòng thi"
          }}
        ]
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"generate_mirror_error_exercises error: {e}")
            return [
                {
                    "mechanic": "ERROR_SPOTTING",
                    "cefr_level": "B2",
                    "target_concept": "Subject-Verb Agreement with Gerund Subjects",
                    "prompt": "Phát hiện lỗi ngữ pháp thường gặp trong các bài viết:",
                    "content_payload": {
                        "segments": [
                            {"id": "A", "text": "Investing in renewable energy"},
                            {"id": "B", "text": "require"},
                            {"id": "C", "text": "substantial financial capital"},
                            {"id": "D", "text": "from national governments."}
                        ],
                        "error_segment_id": "B",
                        "correction": "requires"
                    },
                    "explanation": "Chủ ngữ là danh động từ 'Investing in...' là danh từ số ít, do đó động từ chính phải chia số ít: 'requires'.",
                    "ielts_tip": "Lỗi hòa hợp chủ vị với V-ing làm chủ ngữ là lỗi trừ điểm GRA phổ biến nhất ở Band 6.0 - 6.5."
                }
            ]

    async def generate_vault_infused_exercises(self, vocab_list: list, topic_id: str = "tenses", count: int = 5):
        """
        Lồng ghép danh sách từ vựng trong Tủ từ của User vào câu hỏi ngữ pháp thực chiến
        hoặc sinh câu hỏi chuyên sâu theo từng chủ đề bài học cụ thể (Mạo từ, Rút gọn mệnh đề, 12 thì, Đảo ngữ...).
        """
        words = [v.get("word", "").strip() for v in vocab_list if v.get("word") and v.get("word").strip()][:8]
        if words:
            vocab_instruction = f"""
            YÊU CẦU ĐẶC BIỆT: Bắt buộc lồng ghép các từ vựng sau đây của học viên vào câu ngữ cảnh bài thi IELTS: [{', '.join(words)}].
            Trong mỗi câu hỏi, gán trường 'vault_word_slot' bằng từ vựng được lồng ghép.
            """
        else:
            vocab_instruction = """
            Sử dụng từ vựng học thuật chuẩn Cambridge IELTS Band 7.5+ - 8.5+ phù hợp với ngữ cảnh câu hỏi.
            """

        topic_clean = topic_id.strip() if topic_id else "tenses"

        prompt = f"""
        Bạn là Chuyên gia Khảo thí Ngôn ngữ Cambridge IELTS.
        Hãy tạo {count} câu hỏi bài tập ngữ pháp chuyên sâu thuộc chuyên đề: [{topic_clean}].
        {vocab_instruction}

        YÊU CẦU VỀ DẠNG BÀI: Phân bổ đều giữa 4 cơ chế sau:
        1. MULTIPLE_CHOICE: 
           content_payload: {{"sentence_with_blank": "câu có chỗ trống [ _____ ]", "options": ["A", "B", "C", "D"], "correct_answer": "đáp án chính xác"}}
        2. GAP_FILL:
           content_payload: {{"sentence_with_blank": "câu có chỗ trống [ _____ ]", "base_word": "từ gốc trong ngoặc", "acceptable_answers": ["đáp án 1", "đáp án 2"]}}
        3. SENTENCE_SCRAMBLE:
           content_payload: {{"scrambled_tokens": ["từ/cụm 1", "từ/cụm 2", "..."], "ordered_tokens": ["từ/cụm đúng 1", "từ/cụm đúng 2", "..."]}}
        4. ERROR_SPOTTING:
           content_payload: {{"segments": [{{"id": "A", "text": "phân đoạn 1"}}, {{"id": "B", "text": "phân đoạn 2"}}, {{"id": "C", "text": "phân đoạn 3"}}, {{"id": "D", "text": "phân đoạn 4"}}], "error_segment_id": "B", "correction": "sửa đúng"}}

        QUY TẮC CHUYÊN ĐỀ QUAN TRỌNG:
        - Nếu chuyên đề liên quan đến "Mạo từ" hoặc "articles", câu hỏi BẮT BUỘC kiểm tra cách dùng A / AN / THE / Ø (Zero Article).
        - Nếu chuyên đề liên quan đến "Rút gọn mệnh đề quan hệ" hoặc "reduced relative clauses", câu hỏi BẮT BUỘC kiểm tra V-ing (chủ động) vs V-ed/V3 (bị động).
        - Nếu chuyên đề liên quan đến "12 thì" hoặc "tenses", câu hỏi kiểm tra phân biệt thì quá khứ, hoàn thành, hoặc dự báo tương lai Task 1.
        - Nếu chuyên đề liên quan đến "Đảo ngữ" hoặc "inversion", câu hỏi kiểm tra cấu trúc Seldom, Not only, Hardly, v.v.

        Định dạng JSON trả về DUY NHẤT một JSON Array (không kèm bất kỳ văn bản giải thích nào ngoài JSON):
        [
          {{
            "mechanic": "MULTIPLE_CHOICE | GAP_FILL | SENTENCE_SCRAMBLE | ERROR_SPOTTING",
            "cefr_level": "B2",
            "target_concept": "Tên quy tắc ngữ pháp chi tiết",
            "vault_word_slot": "từ trong kho (nếu có lồng ghép)",
            "prompt": "Yêu cầu bài tập bằng tiếng Việt",
            "content_payload": {{ ... }},
            "explanation": "Giải thích ngữ pháp chi tiết bằng tiếng Việt vì sao đúng/sai",
            "ielts_tip": "Mẹo thực chiến cho bài thi IELTS Writing/Speaking"
          }}
        ]
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content, expect_list=True)
            parsed = json.loads(cleaned)
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed
        except Exception as e:
            print(f"generate_vault_infused_exercises error: {e}")

        # Topic-aware dynamic fallbacks
        topic_lower = topic_clean.lower()
        if "mạo từ" in topic_lower or "article" in topic_lower or "modifier" in topic_lower:
            return [
                {
                    "mechanic": "MULTIPLE_CHOICE",
                    "cefr_level": "B1",
                    "target_concept": "The Definite Article with Statistical Trends",
                    "vault_word_slot": words[0] if words else None,
                    "prompt": "Chọn mạo từ chính xác điền vào chỗ trống trong câu Task 1:",
                    "content_payload": {
                        "sentence_with_blank": "According to the graph, [ _____ ] proportion of households adopting renewable power grew steadily.",
                        "options": ["the", "a", "an", "Ø"],
                        "correct_answer": "the"
                    },
                    "explanation": "Cụm danh từ chỉ tỷ lệ 'proportion of...' đã được xác định cụ thể bởi ngữ cảnh nên bắt buộc dùng mạo từ 'the'.",
                    "ielts_tip": "Trong IELTS Writing Task 1, luôn dùng 'The proportion of...', 'The percentage of...'."
                },
                {
                    "mechanic": "MULTIPLE_CHOICE",
                    "cefr_level": "A2",
                    "target_concept": "Indefinite Article A vs AN with Pronunciation",
                    "vault_word_slot": words[1] if len(words) > 1 else None,
                    "prompt": "Chọn mạo từ phù hợp trước cụm từ có phát âm đặc biệt:",
                    "content_payload": {
                        "sentence_with_blank": "The implementation of clean technologies represents [ _____ ] unique opportunity for industrial transformation.",
                        "options": ["a", "an", "the", "Ø"],
                        "correct_answer": "a"
                    },
                    "explanation": "Từ 'unique' phát âm bắt đầu bằng bán phụ âm /j/ (/juːˈniːk/), do đó bắt buộc đi với mạo từ 'a', không dùng 'an'.",
                    "ielts_tip": "Dùng 'a/an' căn cứ vào phiên âm thực tế, không căn cứ vào mặt chữ cái."
                },
                {
                    "mechanic": "ERROR_SPOTTING",
                    "cefr_level": "B2",
                    "target_concept": "Zero Article with Abstract Academic Concepts",
                    "vault_word_slot": words[2] if len(words) > 2 else None,
                    "prompt": "Phát hiện phân đoạn sử dụng sai mạo từ:",
                    "content_payload": {
                        "segments": [
                            {"id": "A", "text": "Sociologists contend that"},
                            {"id": "B", "text": "the higher education"},
                            {"id": "C", "text": "serves as an engine"},
                            {"id": "D", "text": "for social progress."}
                        ],
                        "error_segment_id": "B",
                        "correction": "Ø Higher education"
                    },
                    "explanation": "'Higher education' là danh từ trừu tượng khái quát nói chung, dùng Zero Article (Ø). Không được dùng 'the'.",
                    "ielts_tip": "Tránh dùng 'the' trước các danh từ trừu tượng như education, technology, pollution trong Task 2."
                }
            ]
        elif "rút gọn" in topic_lower or "clause" in topic_lower or "relative" in topic_lower:
            return [
                {
                    "mechanic": "MULTIPLE_CHOICE",
                    "cefr_level": "B2",
                    "target_concept": "Passive Reduced Relative Clause",
                    "vault_word_slot": words[0] if words else None,
                    "prompt": "Chọn dạng rút gọn mệnh đề quan hệ chính xác:",
                    "content_payload": {
                        "sentence_with_blank": "Stringent regulations [ _____ ] by the municipal council curbed carbon emissions.",
                        "options": ["implemented", "implementing", "which implemented", "were implemented"],
                        "correct_answer": "implemented"
                    },
                    "explanation": "Rút gọn mệnh đề quan hệ dạng bị động (which were implemented) thành quá khứ phân từ 'implemented'.",
                    "ielts_tip": "Rút gọn mệnh đề quan hệ giúp câu văn súc tích, nâng tiêu chí GRA lên Band 8.0+."
                },
                {
                    "mechanic": "GAP_FILL",
                    "cefr_level": "B2",
                    "target_concept": "Active Reduced Relative Clause with V-ing",
                    "vault_word_slot": words[1] if len(words) > 1 else None,
                    "prompt": "Rút gọn mệnh đề quan hệ chủ động với động từ trong ngoặc:",
                    "content_payload": {
                        "sentence_with_blank": "The comprehensive study, [ _____ ] (highlight) persistent economic disparities, was published recently.",
                        "base_word": "highlight",
                        "acceptable_answers": ["highlighting"]
                    },
                    "explanation": "Mệnh đề chủ động 'which highlights...' được rút gọn bằng hiện tại phân từ 'highlighting'.",
                    "ielts_tip": "Sử dụng V-ing rút gọn để chèn thêm thông tin bổ sung mượt mà trong Task 2."
                },
                {
                    "mechanic": "SENTENCE_SCRAMBLE",
                    "cefr_level": "B2",
                    "target_concept": "Reduced Relative Clause Word Order",
                    "vault_word_slot": words[2] if len(words) > 2 else None,
                    "prompt": "Sắp xếp các thẻ từ thành câu hoàn chỉnh chứa mệnh đề rút gọn:",
                    "content_payload": {
                        "scrambled_tokens": ["Policies", "enacted by", "authorities", "municipal", "traffic congestion.", "reduced"],
                        "ordered_tokens": ["Policies", "enacted by", "municipal", "authorities", "reduced", "traffic congestion."]
                    },
                    "explanation": "'Policies enacted by municipal authorities...' là dạng rút gọn bị động của 'Policies which were enacted by...'.",
                    "ielts_tip": "Dạng rút gọn này giúp tránh câu văn rườm rà trong Writing Task 2."
                }
            ]
        elif "đảo ngữ" in topic_lower or "inversion" in topic_lower or "structure" in topic_lower:
            return [
                {
                    "mechanic": "SENTENCE_SCRAMBLE",
                    "cefr_level": "C1",
                    "target_concept": "Negative Inversion with Seldom",
                    "vault_word_slot": words[0] if words else None,
                    "prompt": "Sắp xếp câu đảo ngữ học thuật Band 8.0+ với trạng từ phủ định Seldom:",
                    "content_payload": {
                        "scrambled_tokens": ["Seldom", "governments", "do", "such severe crises", "address", "effectively."],
                        "ordered_tokens": ["Seldom", "do", "governments", "address", "such severe crises", "effectively."]
                    },
                    "explanation": "Khi Seldom đứng đầu câu, trợ động từ 'do' phải đảo lên trước chủ ngữ 'governments'.",
                    "ielts_tip": "Đảo ngữ Seldom / Not only giúp bài thi IELTS đạt điểm tuyệt đối về đa dạng cấu trúc câu (GRA)."
                },
                {
                    "mechanic": "MULTIPLE_CHOICE",
                    "cefr_level": "C1",
                    "target_concept": "Inversion with Not Only",
                    "vault_word_slot": words[1] if len(words) > 1 else None,
                    "prompt": "Chọn cấu trúc đảo ngữ chính xác sau cụm 'Not only':",
                    "content_payload": {
                        "sentence_with_blank": "Not only [ _____ ] emissions, but it also reduced manufacturing expenses.",
                        "options": ["did the strategy curb", "the strategy curbed", "does the strategy curbed", "curbed the strategy"],
                        "correct_answer": "did the strategy curb"
                    },
                    "explanation": "Cấu trúc đảo ngữ: Not only + trợ động từ (did) + S (the strategy) + V-inf (curb)...",
                    "ielts_tip": "Cặp liên từ đảo ngữ Not only... but also... là vũ khí ghi điểm Band 8.0+ trong Task 2."
                }
            ]
        else:
            return [
                {
                    "mechanic": "GAP_FILL",
                    "cefr_level": "B2",
                    "target_concept": "Past Simple with Closed Historical Interval",
                    "vault_word_slot": words[0] if words else "mitigate",
                    "prompt": f"Chia dạng quá khứ của từ vựng '{words[0] if words else 'mitigate'}' trong ngữ cảnh Task 1:",
                    "content_payload": {
                        "sentence_with_blank": f"Between 2012 and 2020, green technology significantly [ _____ ] industrial carbon waste.",
                        "base_word": words[0] if words else "mitigate",
                        "acceptable_answers": [f"{(words[0] if words else 'mitigate').rstrip('e')}ed"]
                    },
                    "explanation": "Mốc thời gian 2012-2020 là quá khứ đã kết thúc nên động từ phải chia thì Quá khứ đơn.",
                    "ielts_tip": "Kết hợp từ vựng học thuật với thì quá khứ chuẩn xác sẽ đẩy band GRA lên 7.5+."
                },
                {
                    "mechanic": "MULTIPLE_CHOICE",
                    "cefr_level": "B2",
                    "target_concept": "Future Academic Projections in Task 1",
                    "vault_word_slot": words[1] if len(words) > 1 else None,
                    "prompt": "Chọn cách diễn đạt dự báo khách quan chuẩn Task 1 thay cho 'will':",
                    "content_payload": {
                        "sentence_with_blank": "By 2050, the proportion of electric vehicles [ _____ ] 70%.",
                        "options": ["is projected to reach", "will reach", "reaches", "has reached"],
                        "correct_answer": "is projected to reach"
                    },
                    "explanation": "Dùng cấu trúc bị động dự báo khách quan 'is projected to reach' thay cho 'will reach' trong bài Task 1.",
                    "ielts_tip": "Tránh dùng 'will' để khẳng định số liệu tương lai trong Task 1."
                }
            ]

    async def generate_adaptive_personal_exam(
        self,
        user_profile: dict,
        topic_id: str = "all",
        dataset_type: str = "cambridge_ielts",
        count: int = 5
    ) -> list:
        """
        Sinh đề thi ngữ pháp cá nhân hóa thích ứng theo thực lực (Adaptive Testing):
        - CEFR Band: A1 - C1
        - Weak spots: Lỗi sai và chuyên đề học viên còn yếu từ UserGrammarProgress & WritingLog
        - Vault infusion: Từ vựng thực tế trong sổ từ cá nhân của học viên
        - Benchmark Dataset: Cambridge IELTS, W&I + LOCNESS (GEC), CoNLL-2014, JFLEG, MMLU
        - Phủ rộng 4 cơ chế khảo thí: MULTIPLE_CHOICE, GAP_FILL, SENTENCE_SCRAMBLE, ERROR_SPOTTING
        """
        cefr = user_profile.get("cefr_level", "B2")
        weak_areas = user_profile.get("weak_areas", [])
        weak_areas_str = ", ".join(weak_areas) if weak_areas else "Past Perfect, Definite Article 'The', Passive Voice, Subject-Verb Agreement"
        vocab_list = user_profile.get("vocab_list", [])
        words = [v.get("word", "") for v in vocab_list if v.get("word")][:8]
        words_str = ", ".join(words) if words else "mitigate, deteriorate, unprecedented, infrastructure"

        dataset_instructions = {
            "cambridge_ielts": "Format chuẩn đề thi Cambridge IELTS Academic: Ngữ cảnh Writing Task 1 (biểu đồ xu hướng, mốc thời gian), Task 2 (bình luận xã hội, giáo dục, công nghệ), và Speaking Part 2/3.",
            "wi_locness": "Format chuẩn Benchmark W&I + LOCNESS (BEA Shared Task): Tập trung vào Grammatical Error Correction (GEC), phát hiện lỗi dùng từ ngữ pháp sai, hòa hợp thì, mạo từ trong văn bản của người học.",
            "conll_2014": "Format chuẩn CoNLL-2014 GEC Benchmark: Câu văn học thuật có chứa 1 lỗi ngữ pháp tinh vi (giới từ, hình thái động từ, mạo từ) cần học viên phát hiện và sửa lại.",
            "jfleg": "Format chuẩn JFLEG (JHU Fluency-Extended): Chuyển hóa câu thô hoặc câu vụng về thành câu tự nhiên (fluency), sắp xếp lại trật tự từ hoặc dùng cấu trúc đảo ngữ/rút gọn chuẩn ngữ pháp bản xứ.",
            "mmlu": "Format chuẩn MMLU Linguistics & English Grammar: Trắc nghiệm 4 đáp án phân tích cú pháp tầng sâu, phân biệt thì dễ nhầm, danh động từ và mệnh đề quan hệ."
        }
        dataset_instruction = dataset_instructions.get(dataset_type, dataset_instructions["cambridge_ielts"])

        prompt = f"""
        Bạn là Chuyên gia Khảo thí Ngôn ngữ Cambridge IELTS & Trưởng ban Đề thi Adaptive.
        Hãy tạo {count} câu hỏi bài tập ngữ pháp cá nhân hóa thích ứng cao độ cho học viên.

        HỒ SƠ HỌC VIÊN CÁ NHÂN:
        - Trình độ CEFR mục tiêu: {cefr}
        - Chuyên đề kiểm tra: {topic_id}
        - Các điểm yếu đã ghi nhận: {weak_areas_str}
        - Danh sách từ vựng trong sổ tay học viên (BẮT BUỘC lồng ghép linh hoạt vào câu hỏi): {words_str}
        - Bộ tiêu chuẩn Dataset yêu cầu: [{dataset_type}] - {dataset_instruction}

        YÊU CẦU KỸ THUẬT VỀ ĐỀ THI:
        Mỗi câu hỏi phải thuộc MỘT trong 4 cơ chế tương tác sau (phân bổ đều):
        1. MULTIPLE_CHOICE: 
           - content_payload: {{ "sentence_with_blank": "...", "options": ["A", "B", "C", "D"], "correct_answer": "..." }}
        2. GAP_FILL:
           - content_payload: {{ "sentence_with_blank": "...", "base_word": "...", "acceptable_answers": ["answer1", "answer2"] }}
        3. SENTENCE_SCRAMBLE:
           - content_payload: {{ "scrambled_tokens": ["word1", "word2", ...], "ordered_tokens": ["correct", "sequence", ...] }}
        4. ERROR_SPOTTING:
           - content_payload: {{ "segments": [{{"id": "a", "text": "..."}}, {{"id": "b", "text": "..."}}, {{"id": "c", "text": "..."}}, {{"id": "d", "text": "..."}}], "error_segment_id": "b", "correction": "..." }}

        Định dạng trả về DUY NHẤT một JSON Array (không kèm bất kỳ văn bản markdown nào ngoài JSON):
        [
          {{
            "mechanic": "MULTIPLE_CHOICE | GAP_FILL | SENTENCE_SCRAMBLE | ERROR_SPOTTING",
            "cefr_level": "{cefr}",
            "target_concept": "Tên chủ điểm ngữ pháp cụ thể (ví dụ: Past Simple vs Past Perfect, Definite Article 'The')",
            "dataset_source": "{dataset_type}",
            "prompt": "Yêu cầu bài tập rõ ràng bằng tiếng Việt",
            "vault_word_slot": "Từ vựng cá nhân được lồng ghép (nếu có)",
            "content_payload": {{ ... }},
            "explanation": "Giải thích ngữ pháp chuyên sâu, chỉ rõ vì sao đúng/sai theo 3 dạng công thức (+, -, ?) hoặc quy tắc mạo từ",
            "ielts_tip": "Mẹo thực chiến IELTS Academic giúp tăng band GRA 7.5+"
          }}
        ]
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content, expect_list=True)
            res = json.loads(cleaned)
            if isinstance(res, list) and len(res) > 0:
                return res
        except Exception as e:
            print(f"generate_adaptive_personal_exam AI error: {e}")

        # Deterministic high-quality fallback exercises adapted to user profile
        primary_w = words[0] if words else "deteriorate"
        secondary_w = words[1] if len(words) > 1 else "mitigate"
        return [
            {
                "mechanic": "MULTIPLE_CHOICE",
                "cefr_level": cefr,
                "target_concept": "Tenses with Time Markers (Past Simple vs Present Perfect)",
                "dataset_source": dataset_type,
                "vault_word_slot": primary_w,
                "prompt": f"Chọn thì chuẩn mực của từ vựng '{primary_w}' trong bài IELTS Writing Task 1:",
                "content_payload": {
                    "sentence_with_blank": f"Between 2005 and 2020, urban air quality dramatically [ _____ ] across industrialized provinces.",
                    "options": [f"{primary_w}d" if primary_w.endswith("e") else f"{primary_w}ed", f"has {primary_w}d" if primary_w.endswith("e") else f"has {primary_w}ed", f"was {primary_w}ing", f"{primary_w}s"],
                    "correct_answer": f"{primary_w}d" if primary_w.endswith("e") else f"{primary_w}ed"
                },
                "explanation": "Khoảng thời gian 2005-2020 là mốc thời gian đóng trong quá khứ, bắt buộc dùng thì Quá khứ đơn (Past Simple).",
                "ielts_tip": "Tránh dùng Present Perfect khi có năm cụ thể trong quá khứ trong Task 1."
            },
            {
                "mechanic": "ERROR_SPOTTING",
                "cefr_level": cefr,
                "target_concept": "Articles & Academic Determiners",
                "dataset_source": dataset_type,
                "vault_word_slot": secondary_w,
                "prompt": "Xác định phần chứa lỗi ngữ pháp mạo từ trong câu học thuật sau:",
                "content_payload": {
                    "segments": [
                        {"id": "seg1", "text": "In recent decades,"},
                        {"id": "seg2", "text": f"the governments tried to {secondary_w}"},
                        {"id": "seg3", "text": "environmental degradation,"},
                        {"id": "seg4", "text": "which yielded promising results."}
                    ],
                    "error_segment_id": "seg2",
                    "correction": f"governments tried to {secondary_w}"
                },
                "explanation": "Khi nói về chính phủ các nước nói chung mà không chỉ định một quốc gia cụ thể, dùng Zero Article 'Ø governments' thay vì 'the governments'.",
                "ielts_tip": "Dùng Zero Article cho danh từ số nhiều nói chung là tiêu chuẩn ngữ pháp Band 8.0 trong Task 2."
            },
            {
                "mechanic": "GAP_FILL",
                "cefr_level": cefr,
                "target_concept": "Past Perfect with 'By the time'",
                "dataset_source": dataset_type,
                "vault_word_slot": primary_w,
                "prompt": "Chia dạng đúng của động từ trong ngoặc để hoàn thành câu so sánh Task 1:",
                "content_payload": {
                    "sentence_with_blank": "By the time the new policy came into effect in 2018, municipal waste [ _____ ] (accumulate) beyond sustainable limits.",
                    "base_word": "accumulate",
                    "acceptable_answers": ["had accumulated"]
                },
                "explanation": "Cấu trúc 'By the time + Past Simple' đi kèm mệnh đề chính ở thì Quá khứ hoàn thành (Past Perfect: had + V3).",
                "ielts_tip": "Sử dụng 'By the time' kết hợp Past Perfect là chìa khóa chứng minh năng lực ngữ pháp Band 7.5+ GRA."
            },
            {
                "mechanic": "SENTENCE_SCRAMBLE",
                "cefr_level": cefr,
                "target_concept": "Inversion with Negative Adverbs",
                "dataset_source": dataset_type,
                "vault_word_slot": secondary_w,
                "prompt": "Sắp xếp các cụm từ sau thành câu đảo ngữ học thuật hoàn chỉnh:",
                "content_payload": {
                    "scrambled_tokens": ["Rarely", "such stringent regulations", "do local authorities", f"to {secondary_w} emissions", "enforce"],
                    "ordered_tokens": ["Rarely", "do local authorities", "enforce", "such stringent regulations", f"to {secondary_w} emissions"]
                },
                "explanation": "Đảo ngữ với 'Rarely': Rarely + Trợ động từ (do) + S (local authorities) + V-inf (enforce) + O.",
                "ielts_tip": "Một câu đảo ngữ đúng vị trí trong thân bài Task 2 sẽ tạo ấn tượng mạnh mẽ với giám khảo."
            }
        ]

    async def consult_study_and_grammar_coach(
        self,
        message: str,
        user_profile: dict,
        history: list = None
    ) -> dict:
        """
        AI Chatbot & Bot Discord Cố vấn:
        - Tư vấn lịch học 7-14 ngày cá nhân hóa (Vocab SRS -> 12 Tenses / Articles -> Writing & Speaking)
        - Giải đáp tường tận lý thuyết 12 thì (3 dạng +, -, ?, dấu hiệu, stative verbs, bẫy thi) và mạo từ
        - Gợi ý video bài giảng YouTube uy tín (Oxford Online English, BBC Learning English)
        """
        cefr = user_profile.get("cefr_level", "B2")
        weak_areas = user_profile.get("weak_areas", ["12 thì cơ bản", "mạo từ"])
        goal = user_profile.get("user_goal", "IELTS 6.5 - 7.5")

        history_context = ""
        if history and isinstance(history, list):
            history_context = "\n".join([f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-5:]])

        prompt = f"""
        Bạn là Cố vấn Trưởng IELTS & Ngữ pháp Học thuật của nền tảng IELTS OASIS.
        Người học đang nhắn tin để được tư vấn lịch học, lý thuyết ngữ pháp hoặc luyện thi:

        THÔNG TIN HỌC VIÊN:
        - Trình độ hiện tại: {cefr}
        - Mục tiêu: {goal}
        - Điểm yếu cần khắc phục: {', '.join(weak_areas)}
        - Lịch sử trò chuyện gần nhất:
        {history_context}

        TIN NHẮN HIỆN TẠI CỦA HỌC VIÊN:
        "{message}"

        NHIỆM VỤ CỦA BẠN:
        1. Trả lời chi tiết, ân cần, mang tính học thuật cao và trực quan.
        2. Nếu người học hỏi về LỊCH HỌC / KẾ HOẠCH ÔN:
           - Lập ngay lộ trình 7 ngày cân bằng 3 mũi nhọn:
             * Mũi nhọn 1: Từ vựng & Spaced Repetition (SRS)
             * Mũi nhọn 2: Chuyên đề ngữ pháp (đầy đủ công thức 3 dạng +, -, ?, bẫy thi)
             * Mũi nhọn 3: Ứng dụng thực chiến Speaking & Writing Task 1/2.
        3. Nếu người học hỏi về NGỮ PHÁP (ví dụ 12 thì, mạo từ, đảo ngữ, bị động):
           - Bắt buộc giải thích RÕ RÀNG 3 dạng công thức: (+) Khẳng định, (-) Phủ định, (?) Nghi vấn.
           - Cung cấp: Dấu hiệu nhận biết, Động từ trạng thái (Stative verbs), Bẫy thường gặp, và Ví dụ Academic chuẩn IELTS Band 8.0.
        4. Gợi ý 1 video YouTube bài giảng chất lượng cao (từ Oxford Online English hoặc BBC Learning English) cùng ID video tương ứng.
        5. Đưa ra 1 bài tập thực hành nhanh (Practice drill) kèm đáp án giải thích.

        Định dạng trả về DUY NHẤT một JSON Object:
        {{
          "reply": "Nội dung phản hồi hoàn chỉnh bằng tiếng Việt, trình bày markdown sinh động, có bảng/bullet điểm rõ ràng",
          "study_plan": {{
            "duration": "7 ngày",
            "daily_focus": [
              {{"day": "Thứ 2", "skill": "Vocab SRS + Past Simple & Past Perfect", "grammar_target": "Công thức 3 dạng thì quá khứ trong Task 1", "output_task": "Viết 3 câu miêu tả biểu đồ xu hướng"}},
              {{"day": "Thứ 3", "skill": "Articles (A/An/The/Zero)", "grammar_target": "5 quy tắc mạo từ tuyệt đối trong Task 2", "output_task": "Luyện 10 câu Error Spotting mạo từ"}},
              {{"day": "Thứ 4", "skill": "Present Perfect vs Continuous", "grammar_target": "Mở bài Task 2 xu hướng xã hội", "output_task": "Viết 2 mở bài Task 2 chuẩn Band 7.5"}},
              {{"day": "Thứ 5", "skill": "Passive Voice & Impersonal Passive", "grammar_target": "It is widely believed that...", "output_task": "Viết đoạn Discussion thân bài 1"}},
              {{"day": "Thứ 6", "skill": "Conditionals & Hedging Modals", "grammar_target": "Kỹ thuật giảm tính võ đoán", "output_task": "Luyện tập Speaking Part 3"}},
              {{"day": "Thứ 7", "skill": "Relative Clauses & Reduction", "grammar_target": "Rút gọn V-ing / V-ed", "output_task": "Làm bài kiểm tra Adaptive trên Web"}},
              {{"day": "Chủ Nhật", "skill": "Full Review & SRS Refresh", "grammar_target": "Tổng ôn 12 thì & mạo từ", "output_task": "Thi thử Mock Test và đồng bộ lịch tuần mới"}}
            ]
          }},
          "recommended_video": {{
            "youtube_id": "L9AWrJnhsRI",
            "video_title": "Present Simple & Past Simple Mastery - Oxford Online English",
            "channel_name": "Oxford Online English"
          }},
          "recommended_grammar_topics": ["tenses", "articles", "sentence_structures"],
          "suggested_actions": ["Làm bài test Adaptive 5 câu ngay", "Xem video bài giảng", "Thêm từ vựng vào Tủ từ"],
          "practice_exercise": {{
            "prompt": "Câu hỏi thực chiến nhanh",
            "sentence": "By 2030, the rate of renewable adoption [ _____ ] substantially.",
            "options": ["will increase", "is projected to increase", "increases", "increased"],
            "correct_answer": "is projected to increase",
            "explanation": "Trong IELTS Writing Task 1, số liệu tương lai là dự báo khoa học, nên dùng 'is projected to + V' thay vì khẳng định bằng 'will'."
          }}
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content, expect_list=False)
            res = json.loads(cleaned)
            if isinstance(res, dict) and "reply" in res:
                return res
        except Exception as e:
            print(f"consult_study_and_grammar_coach AI error: {e}")

        # Deterministic rich fallback coach reply
        return {
            "reply": f"""### 🍵 Chào bạn! Cố vấn IELTS Oasis đã phân tích lộ trình của bạn:

Hiện tại bạn đang ở trình độ **{cefr}** với mục tiêu **{goal}**. Để tối ưu hóa điểm số Tiêu chí **GRA (Grammatical Range and Accuracy)**, bạn cần nắm vững hai trụ cột sống còn:

#### 1. Hệ Thống 12 Thì & 3 Dạng Thức (+, -, ?)
- **Dạng Khẳng định (+):** $S + V(chia)$
- **Dạng Phủ định (-):** $S + \\text{{Trợ động từ}} + not + V(nguyên\\_thể)$
- **Dạng Nghi vấn (?):** $\\text{{Trợ động từ}} + S + V(nguyên\\_thể)?$
- **Quy tắc Vàng Task 1:** Tuyệt đối dùng **Quá khứ đơn (Past Simple)** cho các mốc năm trong quá khứ và **Dự báo bị động (is projected to + V)** cho tương lai; không lạm dụng "will".
- **Động từ trạng thái (Stative verbs):** Các từ chỉ nhận thức, sở hữu (*know, believe, belong, contain*) **không chia thì tiếp diễn**.

#### 2. Mạo Từ (Articles) Từ Gốc Đến Ngọn:
- **A / An:** Đi với danh từ đếm được số ít chưa xác định. Chú ý theo **phiên âm** chứ không theo chữ viết (*an hour, a university, a European nation*).
- **The:** Bắt buộc có trước các cụm số liệu Task 1 (*the proportion of, the number of*), các danh từ duy nhất (*the environment, the internet, the government*) và so sánh nhất.
- **Zero Article (Ø):** Dùng cho danh từ số nhiều hoặc danh từ không đếm được khi phát biểu khái quát trong Task 2 (*Ø Higher education plays a pivotal role...*).

Dưới đây là lịch học 7 ngày và bài tập gợi ý để bạn bắt đầu ngay hôm nay!""",
            "study_plan": {
                "duration": "7 ngày",
                "daily_focus": [
                    {"day": "Thứ 2", "skill": "Vocab SRS + Quá khứ đơn & Quá khứ hoàn thành", "grammar_target": "Công thức 3 dạng thì quá khứ trong Task 1", "output_task": "Viết 3 câu miêu tả biểu đồ xu hướng"},
                    {"day": "Thứ 3", "skill": "Mạo từ (A / An / The / Ø)", "grammar_target": "5 quy tắc mạo từ tuyệt đối trong Task 2", "output_task": "Luyện 10 câu Error Spotting mạo từ"},
                    {"day": "Thứ 4", "skill": "Hiện tại hoàn thành & Tiếp diễn", "grammar_target": "Mở bài Task 2 xu hướng công nghệ", "output_task": "Viết 2 mở bài Task 2 chuẩn Band 7.5"},
                    {"day": "Thứ 5", "skill": "Thể Bị Động & Bị Động Khách Quan", "grammar_target": "It is widely believed that...", "output_task": "Viết đoạn Discussion thân bài 1"},
                    {"day": "Thứ 6", "skill": "Câu điều kiện & Động từ khuyết thiếu Hedging", "grammar_target": "Kỹ thuật giảm tính võ đoán", "output_task": "Luyện tập Speaking Part 3"},
                    {"day": "Thứ 7", "skill": "Mệnh đề quan hệ & Rút gọn V-ing/V-ed", "grammar_target": "Rút gọn mệnh đề câu phức", "output_task": "Làm bài kiểm tra Adaptive trên Web"},
                    {"day": "Chủ Nhật", "skill": "Tổng Ôn Toàn Diện & SRS Refresh", "grammar_target": "Tổng ôn 12 thì & mạo từ", "output_task": "Thi thử Mock Test và kiểm tra tiến độ"}
                ]
            },
            "recommended_video": {
                "youtube_id": "L9AWrJnhsRI",
                "video_title": "Present Simple & Past Simple Mastery - Oxford Online English",
                "channel_name": "Oxford Online English"
            },
            "recommended_grammar_topics": ["tenses", "articles", "sentence_structures"],
            "suggested_actions": ["Làm bài kiểm tra Adaptive 5 câu", "Xem video bài giảng lý thuyết", "Thêm từ vựng vào Tủ từ"],
            "practice_exercise": {
                "prompt": "Chọn phương án đúng nhất chuẩn văn phong Task 1:",
                "sentence": "By 2035, the proportion of electric vehicle adoption [ _____ ] to exceed 60%.",
                "options": ["is projected", "will project", "projects", "has projected"],
                "correct_answer": "is projected",
                "explanation": "Trong IELTS Writing Task 1, số liệu tương lai phải dùng cấu trúc dự báo bị động 'is projected to + V' để bảo đảm tính khách quan học thuật."
            }
        }

ai_service = AIService()


