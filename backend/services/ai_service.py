import os
import json
import httpx
import base64
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

class AIService:
    def __init__(self):
        # Google Gemini API via OpenAI compatibility
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.client = AsyncOpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=self.gemini_api_key if self.gemini_api_key else "dummy-key",
        )
        
        # Primary models via Gemini API
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
        except:
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

    async def refine_vocabulary(self, word: str):
        prompt = f"""
        Provide IELTS learning details for the input: "{word}"
        If the input is in Vietnamese, translate it to an English IELTS vocabulary word and use it as the "word" field, with the input as the "meaning".
        If the input is in English, keep it as the "word" and provide the Vietnamese translation as the "meaning".
        Return ONLY valid JSON with exactly these fields:
        {{
            "word": "The English word",
            "meaning": "Vietnamese translation",
            "phonetic": "IPA pronunciation",
            "example": "A useful example sentence for IELTS in English",
            "synonyms": ["synonym1", "synonym2"],
            "collocations": ["collocation1", "collocation2"],
            "topic": "The topic of this word (e.g. Environment, Technology, Health, etc.)",
            "memory_hook": "A short, memorable explanation or trick in Vietnamese to remember this word."
        }}
        """
        try:
            # 1. Try 9router
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}],
                # Removed response_format to ensure compatibility with all models
            )
            content = response.choices[0].message.content
            return json.loads(self._clean_json(content))
        except Exception as e:
            print(f"9router refine_vocabulary failed: {e}")
            
        return {
            "word": word, "meaning": word, "phonetic": "/.../", 
            "example": "", "synonyms": [], "collocations": [], "topic": "General", "memory_hook": ""
        }

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

    async def get_advice(self, prompt: str):
        try:
            response = await self.client.chat.completions.create(
                model=self.primary_text_model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Gemini get_advice failed: {e}")
        return "Hiện tại tôi đang bận cập nhật dữ liệu. Bạn cứ tiếp tục học từ vựng nhé!"

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
        Tạo 5 câu hỏi trắc nghiệm ngữ pháp tiếng Anh trình độ IELTS.
        Yêu cầu trả về DUY NHẤT một định dạng mảng JSON chứa các câu hỏi, không thêm bất kỳ văn bản nào khác. Mỗi câu hỏi phải là một đối tượng JSON có các trường chính xác như sau:
        [
            {
                "question": "Câu tiếng Anh có chỗ trống chứa ____...",
                "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
                "correct_answer": "Đáp án đúng chính xác (phải khớp hoàn toàn với một trong các phần tử trong options)",
                "explanation": "Giải thích chi tiết bằng tiếng Việt lý do chọn đáp án này và điểm ngữ pháp tương ứng."
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
            return json.loads(cleaned)
        except Exception as e:
            print(f"Gemini generate_grammar_questions failed: {e}")
            
        # Fallback dummy questions
        return [
            {
                "question": "If I ______ more time, I would study IELTS every day.",
                "options": ["have", "had", "will have", "would have"],
                "correct_answer": "had",
                "explanation": "Đây là câu điều kiện loại 2 (diễn tả giả định không có thật ở hiện tại). Mệnh đề If dùng thì quá khứ đơn (had)."
            },
            {
                "question": "The government is trying to encourage the use of ______ energy.",
                "options": ["renew", "renewable", "renewed", "renewal"],
                "correct_answer": "renewable",
                "explanation": "Chúng ta cần một tính từ đứng trước danh từ 'energy' để bổ nghĩa cho nó. 'Renewable energy' nghĩa là năng lượng tái tạo."
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
            except:
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
        Học viên muốn học IELTS trong ngày hôm nay với chủ đề: "{topic}".
        Hãy tạo một lộ trình học siêu tốc "Matcha Daily List" bao gồm:
        1. 10 từ vựng cốt lõi.
        2. Một bài nghe ngắn gọn (tóm tắt ý tưởng hoặc link/podcast idea).
        3. Một câu hỏi Writing Task 2.
        4. Một đoạn Reading ngắn (khoảng 100 chữ).
        
        Trả về DUY NHẤT định dạng JSON có cấu trúc sau, KHÔNG giải thích thêm:
        {{
            "topic": "{topic}",
            "vocabulary": [
                {{"word": "Từ", "meaning": "Nghĩa tiếng Việt", "phonetic": "Phiên âm"}}
            ],
            "listening": {{"title": "Tiêu đề bài nghe", "description": "Mô tả..."}},
            "writing": {{"prompt": "Đề bài Writing Task 2"}},
            "reading": {{"text": "Đoạn văn reading ngắn", "questions": ["Câu hỏi 1", "Câu hỏi 2"]}}
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
                {{"word": "từ", "meaning": "nghĩa"}}
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

ai_service = AIService()


