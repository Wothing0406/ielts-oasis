import json
import os
import random
import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger("oxford_dataset_service")

class OxfordDatasetService:
    _instance: Optional["OxfordDatasetService"] = None

    def __init__(self):
        self.words: List[Dict[str, Any]] = []
        self.by_word: Dict[str, List[Dict[str, Any]]] = {}
        self.by_level: Dict[str, List[Dict[str, Any]]] = {
            "A1": [], "A2": [], "B1": [], "B2": [], "C1": []
        }
        self.five_letter_by_level: Dict[str, List[Dict[str, Any]]] = {
            "A1": [], "A2": [], "B1": [], "B2": [], "C1": []
        }
        self._load_dataset()

    @classmethod
    def get_instance(cls) -> "OxfordDatasetService":
        if cls._instance is None:
            cls._instance = OxfordDatasetService()
        return cls._instance

    def _load_dataset(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(current_dir, "oxford_5000_cefr.json")

        if not os.path.exists(json_path):
            logger.warning(f"Oxford dataset file not found at {json_path}")
            return

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                self.words = json.load(f)

            for entry in self.words:
                w_lower = entry.get("word", "").lower()
                lvl = entry.get("level", "B1").upper()

                if w_lower not in self.by_word:
                    self.by_word[w_lower] = []
                self.by_word[w_lower].append(entry)

                if lvl in self.by_level:
                    self.by_level[lvl].append(entry)

                # 5-letter alpha words for Wordle & Arcade Games
                if len(w_lower) == 5 and w_lower.isalpha():
                    if lvl in self.five_letter_by_level:
                        self.five_letter_by_level[lvl].append(entry)

            total_5 = sum(len(v) for v in self.five_letter_by_level.values())
            logger.info(f"Loaded {len(self.words)} Oxford CEFR words ({total_5} 5-letter words) into memory.")
        except Exception as e:
            logger.error(f"Failed to load Oxford dataset: {e}")

    def get_word_details(self, word: str) -> Optional[Dict[str, Any]]:
        """Lấy chi tiết mục từ theo từ khóa O(1)"""
        w_lower = word.strip().lower()
        entries = self.by_word.get(w_lower)
        if entries:
            return entries[0]
        return None

    def get_wordle_word(self, level: int) -> Dict[str, str]:
        """
        Sinh từ khóa Wordle 5 chữ cái phân tầng độ khó theo chuẩn CEFR:
        - Level 1-5: A1/A2 (Quen thuộc, dễ đoán)
        - Level 6-15: B1/B2 (Học thuật IELTS phổ thông)
        - Level 16+: C1 (Nâng cao, chuyên sâu)
        Hoạt động hoàn toàn In-Memory: 0 token AI, phản hồi < 1ms.
        """
        if level <= 5:
            candidates = self.five_letter_by_level["A1"] + self.five_letter_by_level["A2"]
            tier_name = "Cơ bản A1-A2"
        elif level <= 15:
            candidates = self.five_letter_by_level["B1"] + self.five_letter_by_level["B2"]
            tier_name = "Học thuật B1-B2"
        else:
            candidates = self.five_letter_by_level["C1"]
            if not candidates:
                candidates = self.five_letter_by_level["B2"]
            tier_name = "Chuyên sâu C1"

        if not candidates:
            # Fallback nếu thiếu candidate
            candidates = [w for sub in self.five_letter_by_level.values() for w in sub]

        chosen = random.choice(candidates)
        raw_word = chosen["word"].upper()
        meaning = chosen.get("meaning", "").strip()
        pos = chosen.get("type", "từ")

        # Tạo manh mối thông minh không để lộ từ gốc
        # Ẩn từ khóa nếu nghĩa có chứa từ đó
        clean_meaning = meaning
        if raw_word.lower() in clean_meaning.lower():
            clean_meaning = clean_meaning.lower().replace(raw_word.lower(), "___")

        # Cắt ngắn nghĩa hiển thị gợi ý
        short_meaning = clean_meaning.split(";")[0].strip()
        if len(short_meaning) > 80:
            short_meaning = short_meaning[:77] + "..."

        hint_text = f"Một {pos} ({tier_name}) có nghĩa là: '{short_meaning}'."

        return {
            "word": raw_word,
            "theme": chosen.get("topic", f"IELTS {tier_name}"),
            "hint": hint_text,
            "level": chosen.get("level", "B1")
        }

    def get_wordle_dataset_hint(self, secret_word: str, guesses: List[str]) -> str:
        """
        Tạo manh mối nâng cao cho Wordle từ dataset mà không gọi AI:
        - Cấp độ CEFR, từ loại, nguyên âm, và ngữ nghĩa ẩn dụ
        """
        secret_lower = secret_word.lower()
        entry = self.get_word_details(secret_lower)

        vowels = [c for c in secret_lower if c in "aeiou"]
        vowel_count = len(vowels)

        clues = []
        if entry:
            pos = entry.get("type", "từ vựng")
            lvl = entry.get("level", "B2")
            meaning = entry.get("meaning", "").split(";")[0].strip()
            # Che từ khóa nếu có trong nghĩa
            meaning = meaning.lower().replace(secret_lower, "[...]")
            clues.append(f"Từ loại: {pos} (chuẩn CEFR {lvl}).")
            clues.append(f"Ý nghĩa học thuật khái quát: '{meaning}'.")

        clues.append(f"Từ này chứa {vowel_count} nguyên âm.")
        clues.append(f"Ký tự kết thúc của từ là '{secret_word[-1].upper()}'.")

        return " 💡 Manh mối: " + " ".join(clues)

    def query_curated_vocab(
        self,
        level: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Tra cứu và phân trang kho từ vựng Oxford 5000 CEFR cho người dùng
        """
        filtered = self.words

        if level and level.upper() != "ALL":
            lvl_upper = level.upper()
            filtered = [w for w in filtered if w.get("level") == lvl_upper]

        if search:
            q = search.strip().lower()
            filtered = [
                w for w in filtered
                if q in w.get("word", "").lower() or q in w.get("meaning", "").lower()
            ]

        total = len(filtered)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        items = filtered[start_idx:end_idx]

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
            "items": items
        }

oxford_dataset_service = OxfordDatasetService.get_instance()
