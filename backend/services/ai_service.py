import os
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
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
            )
            content = response.choices[0].message.content
            cleaned = self._clean_json(content, expect_list=True)
            items = json.loads(cleaned)
            return self._normalize_extracted_vocab_list(items)
        except Exception as e:
            print(f"extract_scroll_vocabulary_from_text failed: {e}")
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
            items = json.loads(cleaned)
            return self._normalize_extracted_vocab_list(items)
        except Exception as e:
            print(f"extract_scroll_vocabulary_from_image failed: {e}")
        return []

    async def analyze_writing(self, text: str):
        prompt = f"""
        Bạn là một giám khảo IELTS cực kỳ khắt khe (Strict IELTS Examiner). Hãy chấm điểm và phân tích bài viết sau: "{text}"
        
        Yêu cầu nghiêm ngặt:
        1. Chấm điểm Band Score (từ 0.0 đến 9.0) chung và chi tiết 4 tiêu chí.
        2. Đưa ra danh sách các ưu điểm (strengths) và nhược điểm (weaknesses) chi tiết.
        3. Bắt lỗi chính tả và ngữ pháp cực kỳ chi tiết. Với mỗi lỗi, giải thích rõ lý do bằng tiếng Việt.
        
        Trả về DUY NHẤT định dạng JSON:
        {{
            "band_score": 5.0,
            "criteria": {{
                "task_achievement": 5.0,
                "coherence": 5.0,
                "lexical_resource": 5.0,
                "grammar": 5.0
            }},
            "strengths": ["Ưu điểm 1", "Ưu điểm 2"],
            "weaknesses": ["Nhược điểm 1", "Nhược điểm 2"],
            "corrections": [
                {{"original": "từ bị sai", "corrected": "từ đã sửa", "reason": "Lý do sai"}}
            ]
        }}
        """
        try:
            # 1. Try 9router
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
            )
            content = response.choices[0].message.content
            return json.loads(self._clean_json(content))
        except Exception as e:
            print(f"9router analyze_writing failed: {e}")

        return {
            "band_score": "N/A", 
            "strengths": [],
            "weaknesses": ["Lỗi xử lý ngôn ngữ hoặc mạng bị chậm. Vui lòng thử lại."], 
            "corrections": []
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

        # Detect if latest user message is a simple greeting
        latest_user_content = ""
        if isinstance(messages, str):
            latest_user_content = messages
        elif isinstance(messages, list):
            for m in reversed(messages):
                if isinstance(m, dict) and m.get("role") in ["user", None]:
                    latest_user_content = m.get("content", "")
                    break
                elif isinstance(m, str):
                    latest_user_content = m
                    break

        clean_latest = latest_user_content.lower().strip().strip("!.,?~")
        greetings = ["chào", "xin chào", "hi", "hello", "halo", "chào bạn", "chào cậu", "chào thầy", "mát cha", "matcha", "hey", "chao"]
        is_greeting = clean_latest in greetings or any(clean_latest == g or clean_latest.startswith(g + " ") for g in greetings if len(clean_latest) < 25)

        student_note = ""
        if student_context and not is_greeting:
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
                    + "\n(Lưu ý: Chỉ dùng để định hướng khi học viên hỏi xin lộ trình hoặc cần tư vấn. TUYỆT ĐỐI KHÔNG tự tiện lôi các thông số này ra bắt bẻ/nhắc nhở khi học viên hỏi những câu thông thường)."
                )

        master_system_instruction = f"""
Bạn là Mát Cha AI Eo (Mascot chú gấu học thuật) - Huấn luyện viên & Gia sư IELTS thân thiện, tận tâm tại IELTS Oasis.
Xưng hô tự nhiên: 'Mát Cha' hoặc 'mình/tớ' với 'bạn/cậu'. Giữ phong thái nhẹ nhàng, tích cực, vui vẻ, lịch sự và truyền cảm hứng học tập 😊.

[QUY TẮC BẮT BUỘC 1: KHI HỌC VIÊN CHÀO HỎI (HI, HELLO, CHÀO BẠN, XIN CHÀO, CHÀO CẬU...)]:
- Nếu tin nhắn của học viên là câu chào hỏi:
  + HÃY CHÀO LẠI THÂN THIỆN, ẤM ÁP, NGẮN GỌN (CHỈ 1 ĐẾN 2 CÂU).
  + Câu chào mẫu chuẩn: "Chào bạn! Rất vui được gặp lại bạn. Mình là IELTS Oasis (Mát Cha AI Eo) đây. Hôm nay mình có thể giúp gì cho quá trình luyện thi IELTS của bạn không? 😊"
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

[QUY TẮC BẮT BUỘC 4: TÍNH NĂNG WEB & TƯ VẤN LỘ TRÌNH]:
- Bạn nắm rõ các tính năng của IELTS Oasis: Vocabulary Lab (học SRS 5 cấp độ), Writing Sanctuary (luyện viết áp lực thời gian, chấm band tự động), MatchaSpeak (Sandbox phát âm & Shadowing), MatchaScroll (đọc báo trích từ vựng), Listening (chép chính tả), Wordle Matcha.
- NGUYÊN TẮC: CHỈ tư vấn, giới thiệu hoặc hướng dẫn các tính năng trên KHI học viên hỏi về cách học, hỏi tính năng web hoặc hỏi xin lộ trình ("tư vấn cho mình", "mình nên học gì tiếp theo").
- Trong các câu trò chuyện hoặc giải đáp từ vựng/ngữ pháp thông thường: CẤM chèn văn mẫu quảng cáo, cấm mời gọi vào web.

[QUY TẮC BẮT BUỘC 5: HỌC THUẬT VÀ KHÔNG BA PHẢI]:
- Nếu học viên đưa ra kiến thức sai (ngữ pháp, từ vựng, thông tin sai): Lịch sự, nhẹ nhàng chỉ ra lỗi sai và giải thích cách dùng chuẩn Band 8.0+, không a dua đồng thuận với cái sai.
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
        Verify the pronunciation of each word in the reference text in exact sequence.
        The speaker is a Vietnamese student studying English. Listen carefully to their pronunciation.
        
        CRITICAL NOISE, SILENCE & LANGUAGE RULES:
        - If the audio is silent, consists only of static noise, heavy breathing, or unintelligible mumbling, mark ALL words as "incorrect" and set the "tip" of the first word to "Không phát hiện giọng nói hoặc âm thanh không rõ ràng. Vui lòng nói to rõ hơn!".
        - If the user is speaking Vietnamese (Tiếng Việt) instead of English (e.g. speaking Vietnamese words like "xin chào", "đọc thế này à", or translating), detect this immediately. Mark ALL words as "incorrect" and set the "tip" of the first word to "Tớ nghe hình như cậu đang nói tiếng Việt? Hãy phát âm câu tiếng Anh nhé! 🐻".
        
        PRONUNCIATION EVALUATION RULES:
        If the audio is valid English speech, analyze each word:
          - "correct": Good pronunciation matching native speech.
          - "warning": Minor mistake. Pay close attention to typical Vietnamese student pitfalls:
            * Dropping ending sounds (e.g., omitting final consonants like /s/, /z/, /t/, /d/, /k/, /g/, /v/, /f/).
            * Confusing consonant sounds (e.g., pronouncing /ʃ/ as /s/, or /tʃ/ as /s/).
            * Flat/monotone intonation or wrong word stress (e.g., flat pitch, not stressing keywords).
            * Vowel length confusion (e.g., confusing long /i:/ with short /ɪ/).
          - "incorrect": Completely mispronounced, omitted, or wrong word.
        
        Return ONLY a JSON array of objects, one for each word in the reference text in exact order:
        [
          {{
            "word": "word",
            "status": "correct" | "warning" | "incorrect",
            "ipa": "accurate IPA pronunciation of the word",
            "tip": "Short tip in Vietnamese (e.g. 'Bật âm đuôi /t/', 'Nhớ bật hơi âm cuối /s/', 'Chu môi phát âm /sh/', 'Nhấn trọng âm ở âm tiết 2')"
          }}
        ]
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
            return json.loads(cleaned)
        except Exception as e:
            print(f"evaluate_pronunciation failed: {e}")
            words = reference_text.split()
            # Mark the first word as incorrect to show the error message in the tip, others correct
            return [
                {
                    "word": w,
                    "status": "incorrect" if i == 0 else "correct",
                    "ipa": "⚠️" if i == 0 else "",
                    "tip": f"Không thể chấm điểm âm thanh (Lỗi: {str(e)}). Vui lòng thử nói to rõ hơn hoặc kiểm tra Micro!" if i == 0 else ""
                }
                for i, w in enumerate(words)
            ]

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
        You are a friendly, witty IELTS Coach named Matcha Bear.
        The speaker is a Vietnamese student studying English. Analyze their spoken audio response to your question: "{question}".
        
        CRITICAL NOISE, SILENCE & LANGUAGE AUDIT RULES:
        - If the audio is silent, consists only of background static/noise, or heavy breathing, set "transcript" to "No speech detected", "filler_words_count" to 0, "filler_words_found": [], "feedback" to "I couldn't hear you clearly, please speak up! 🐻", and "witty_reply" to "I couldn't hear you clearly, could you repeat that? 🐻", "next_question" to the current question: "{question}".
        - If the speaker speaks Vietnamese instead of English, detect this. Set "transcript" to "Spoke in Vietnamese", "filler_words_count" to 0, "filler_words_found": [], "feedback" to "It seems you are speaking Vietnamese! Please respond in English so I can help you practice. 🐻", "witty_reply" to "I caught some Vietnamese! Please answer in English so I can understand you. 😉 🐻", "next_question" to the current question: "{question}".
        
        If valid English speech is detected, evaluate their speaking reflex:
        1. Count the number of filler words used. Pay attention to both English fillers ("um", "uh", "ah", "like", "well") and typical Vietnamese fillers.
        2. Identify grammatical errors or pronunciation warnings typical for Vietnamese learners (e.g. dropping ending sounds /s/, /t/, /d/, flat tone).
        3. Formulate a witty, cozy, and humorous reply in English to what they said.
        4. Ask a natural follow-up question in English related to the conversation to continue the game.
        
        Return ONLY a JSON object with this structure:
        {{
            "transcript": "Transcribed text of what the user said in English...",
            "filler_words_count": 3,
            "filler_words_found": ["um", "like", "ờ"],
            "feedback": "Encouraging feedback in English/Vietnamese focusing on flow, suggesting fillers like 'Well, actually...', 'To be honest...' instead of silent pauses or 'um/ah'",
            "witty_reply": "Matcha Bear's funny/warm reply in English...",
            "next_question": "Next natural conversation follow-up question in English..."
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
            return json.loads(cleaned)
        except Exception as e:
            print(f"evaluate_speaking_reflex failed: {e}")
            return {
                "transcript": "Could not transcribe speech.",
                "filler_words_count": 0,
                "filler_words_found": [],
                "feedback": f"Connection error: {str(e)}",
                "witty_reply": "I couldn't hear you clearly, could you repeat that? 🐻",
                "next_question": "Let's try another topic. What is your favorite season?"
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

ai_service = AIService()


