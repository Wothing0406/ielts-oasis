# Hệ Thống Đặc Tả Bộ Kỹ Năng AI Học Tiếng Anh Toàn Diện (AI Skills Specification)

> **Phiên bản:** 2.0.0 (Production Academic Edition)  
> **Mục tiêu:** Định nghĩa kiến trúc kỹ thuật và đặc tả bộ 5 công cụ chuẩn AI Function Calling / Agent Tools phục vụ toàn diện hệ sinh thái **IELTS Oasis** (Website, Arcade Games, Discord Bot và Chrome Extension).

---

## 1. Tổng Quan Kiến Trúc Bộ Kỹ Năng (Architecture Overview)

Hệ thống AI Skills được thiết kế theo kiến trúc hướng module (modular architecture), cho phép AI Agent tự động phát hiện ngữ cảnh học tập và kích hoạt (invoke) các skill phù hợp.

Hệ thống tối ưu hóa độ trễ phản hồi (Sub-second latency với Gemini 3.1 Flash Lite), đảm bảo tính chính xác học thuật theo tiêu chuẩn **Cambridge IELTS Band 8.5+** và khung tham chiếu **CEFR (A1–C2)**.

### Bảng Ánh Xạ Kỹ Năng Vào Toàn Bộ Hệ Thống & Arcade Games

| Skill Identifier | Kỹ Năng Mục Tiêu | Ứng Dụng Trên Web & Extension | Ứng Dụng Trong Arcade Games & Discord Bot |
| :--- | :--- | :--- | :--- |
| `evaluate_speech_pronunciation` | **Phát Âm & Ngữ Điệu** (Pronunciation) | **MatchaSpeak** (Shadowing), Extension Voice Practice | **Tea Talk Reflex Game** (Chấm độ chuẩn xác âm thanh, phát hiện nuốt âm) |
| `correct_writing_and_grammar` | **Viết & Ngữ Pháp** (Writing & Grammar) | **Writing Sanctuary**, Extension Quick Check | **Grammar Pop Game** & Discord Bot (Sửa câu, giải thích ngữ pháp Band 8.0+) |
| `generate_vocabulary_context` | **Từ Vựng Chuyên Sâu** (Vocabulary Context) | **Vocabulary Lab**, **MatchaScroll** (Đọc báo trích từ) | **Wordle Matcha Game** (Gợi ý Collocation học thuật mà không lộ đáp án) |
| `drive_conversation_reflex` | **Phản Xạ Hội Thoại** (Speaking Reflex) | Phản xạ IELTS Speaking Part 1/2/3 | **Tea Talk Reflex Game** & **Discord Bot Chat** (Ghi nhận lỗi ngầm - Shadow Error Logging) |
| `generate_spaced_repetition_review` | **Ôn Tập & Củng Cố** (Review Engine) | **VocabularyQuiz**, Flashcards SRS 5 cấp độ | **Arcade Quiz Game** & Bot `/tuvan`, `/dailyplan` (Sinh bài tập trúng điểm yếu) |

---

## 2. Đặc Tả Chi Tiết Từng Kỹ Năng (Skill Specifications)

---

### 2.1. Skill: `evaluate_speech_pronunciation`

- **Mục tiêu:** Nhận diện và đánh giá độ chính xác của phát âm, ngữ điệu và tính trôi chảy dựa trên câu mẫu đối chiếu.
- **Tiêu chuẩn học thuật:**
  - Nhận diện lỗi ngữ âm điển hình của người Việt (Vietnamese L1 transfer): nuốt âm đuôi (`/s/, /z/, /t/, /d/, /k/, /g/, /v/, /f/`), nhầm lẫn giữa `/ʃ/` và `/s/`, `/tʃ/` và `/s/`, độ dài nguyên âm (`/i:/` vs `/ɪ/`), và ngữ điệu bằng phẳng.
  - Phân tích nối âm (Liaison & Connected speech: phụ âm nối nguyên âm).

#### Input Schema (`application/json`)

```json
{
  "type": "object",
  "properties": {
    "reference_text": {
      "type": "string",
      "description": "Đoạn văn bản chuẩn mà người học cần phát âm"
    },
    "audio_base64": {
      "type": "string",
      "description": "Dữ liệu âm thanh người học ghi âm dạng base64"
    },
    "mime_type": {
      "type": "string",
      "description": "Định dạng audio (audio/webm, audio/wav, audio/mpeg...)"
    }
  },
  "required": ["reference_text", "audio_base64"]
}
```

#### Output Schema (`application/json`)

```json
{
  "overall_score": 85,
  "wpm": 135,
  "detected_text": "text spoken by learner",
  "words": [
    {
      "word": "environment",
      "status": "correct",
      "ipa": "/ɪnˈvaɪ.rən.mənt/",
      "tip": "Trọng âm rơi vào âm tiết 2, phát âm chuẩn xác."
    },
    {
      "word": "impacts",
      "status": "warning",
      "ipa": "/ˈɪm.pækts/",
      "tip": "Lưu ý bật rõ cụm phụ âm cuối /kts/."
    }
  ],
  "phonetic_feedback": {
    "ending_sounds": "Tốt, cần chú ý phụ âm kép.",
    "linking_sounds": "Đã nối âm mượt mà ở cụm 'an environmental'.",
    "intonation": "Ngữ điệu tự nhiên, có điểm nhấn ở các từ khóa nội dung."
  }
}
```

---

### 2.2. Skill: `correct_writing_and_grammar`

- **Mục tiêu:** Soát lỗi ngữ pháp, cải thiện diễn đạt theo 4 tiêu chuẩn chấm thi **Cambridge IELTS Band 8.5+** và phân loại theo khung **CEFR (A1–C2)**.
- **Tiêu chuẩn học thuật:**
  - **Task Response (TR):** Độ chặt chẽ trong luận điểm, trả lời trọng tâm.
  - **Coherence & Cohesion (CC):** Mạch lạc, liên kết câu/đoạn, phương tiện liên kết tự nhiên.
  - **Lexical Resource (LR):** Đa dạng từ vựng, Collocations học thuật C1/C2, loại bỏ từ sáo rỗng.
  - **Grammatical Range & Accuracy (GRA):** Cấu trúc câu phức, câu điều kiện, mệnh đề phân từ, đảo ngữ, độ chính xác của thì.

#### Input Schema (`application/json`)

```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "Toàn bộ bài viết luận hoặc câu văn của học viên"
    },
    "task_type": {
      "type": "string",
      "enum": ["sentence", "task1", "task2"],
      "default": "sentence"
    },
    "target_band": {
      "type": "number",
      "default": 8.0
    }
  },
  "required": ["content"]
}
```

#### Output Schema (`application/json`)

```json
{
  "band_score": 7.5,
  "cefr_level": "C1",
  "criteria": {
    "task_achievement": 7.5,
    "coherence_cohesion": 7.0,
    "lexical_resource": 8.0,
    "grammatical_accuracy": 7.5
  },
  "strengths": ["Từ vựng học thuật phong phú, sử dụng tốt các từ nối chỉ nguyên nhân."],
  "weaknesses": ["Một số câu ghép còn rườm rà, cần tránh lặp cấu trúc chủ ngữ giả."],
  "sentence_corrections": [
    {
      "original": "People is thinking that pollution is bad.",
      "corrected": "Many individuals contend that pollution poses severe threats to public health.",
      "reason": "Lỗi chia động từ số nhiều ('people are') và nâng cấp diễn đạt từ Band 5.0 lên Band 8.0 với collocation 'pose severe threats to'.",
      "cefr_upgrade": "C1"
    }
  ],
  "band_8_rephrase": "Đoạn văn viết lại mẫu hoàn chỉnh đạt tiêu chuẩn Band 8.5+."
}
```

---

### 2.3. Skill: `generate_vocabulary_context`

- **Mục tiêu:** Khai thác chuyên sâu từ vựng, cung cấp Collocations học thuật, họ từ (Word Family), định dạng Flashcard chuẩn SRS và mẹo ghi nhớ logic.
- **Ứng dụng Games:** Sinh manh mối thông minh cho **Wordle Matcha** (mô tả ngữ nghĩa, ngữ cảnh, từ loại mà không để lộ từ).

#### Input Schema (`application/json`)

```json
{
  "type": "object",
  "properties": {
    "word": {
      "type": "string",
      "description": "Từ vựng tiếng Anh hoặc tiếng Việt cần khai thác"
    },
    "context_sentence": {
      "type": "string",
      "description": "Ngữ cảnh xuất hiện ban đầu (nếu có)"
    },
    "for_game_hint": {
      "type": "boolean",
      "default": false,
      "description": "Nếu là gợi ý Wordle: không tiết lộ từ gốc"
    }
  },
  "required": ["word"]
}
```

#### Output Schema (`application/json`)

```json
{
  "word": "mitigate",
  "phonetic": "/ˈmɪt.ɪ.ɡeɪt/",
  "part_of_speech": "verb",
  "cefr_level": "C1",
  "definition_vi": "Làm dịu bớt, giảm nhẹ mức độ nghiêm trọng",
  "definition_en": "To make something less harmful, unpleasant, or bad",
  "academic_collocations": [
    "mitigate the environmental impact",
    "mitigate risks and threats",
    "mitigate climate change consequences"
  ],
  "word_family": {
    "noun": "mitigation",
    "adjective": "mitigating / mitigative",
    "verb": "mitigate"
  },
  "cambridge_example": "Effective government policies are essential to mitigate the effects of global warming.",
  "vietnamese_memory_hook": "Tưởng tượng 'Mít' bị 'ghét' nên phải làm dịu tình hình bớt căng thẳng.",
  "game_hint": "A 5-letter academic verb meaning to lessen the damage of an issue."
}
```

---

### 2.4. Skill: `drive_conversation_reflex`

- **Mục tiêu:** Nhập vai Giám khảo khảo thí Cambridge (IELTS Examiner), tương tác duy trì phản xạ hội thoại Speaking Part 1/2/3, đồng thời thực hiện **Ghi nhận lỗi ngầm (Shadow Error Logging)** để không làm đứt mạch tư duy của học viên.
- **Ứng dụng Games:** Điều phối lượt phản xạ cho trò chơi **Tea Talk Reflex** (hỏi nhanh - phản xạ tức thì - đánh giá WPM và độ ngập ngừng).

#### Input Schema (`application/json`)

```json
{
  "type": "object",
  "properties": {
    "messages": {
      "type": "array",
      "description": "Lịch sử hội thoại nhiều lượt giữa học viên và AI"
    },
    "current_topic": {
      "type": "string",
      "description": "Chủ đề Speaking (ví dụ: Work, Environment, Technology...)"
    },
    "target_band": {
      "type": "number",
      "default": 7.5
    }
  },
  "required": ["messages"]
}
```

#### Output Schema (`application/json`)

```json
{
  "examiner_reply": "That's an interesting perspective on remote working. Do you believe it diminishes interpersonal collaboration in the long run?",
  "shadow_errors_logged": [
    {
      "learner_utterance": "I think it make people lazy",
      "identified_flaw": "Subject-verb agreement & basic vocabulary",
      "band_8_alternative": "I suspect it might inadvertently foster a sedentary and isolated lifestyle."
    }
  ],
  "reflex_stats": {
    "response_pace": "Natural",
    "recommended_focus": "Mở rộng ý bằng nguyên nhân - kết quả thay vì câu đơn."
  }
}
```

---

### 2.5. Skill: `generate_spaced_repetition_review`

- **Mục tiêu:** Tự động tổng hợp các lỗ hổng kiến thức từ Database học viên (từ vựng có `mastery_level < 3`, các lỗi sai trong `WritingLog`) để sinh bộ câu hỏi ôn tập ngắt quãng (Spaced Repetition Review Engine).
- **Ứng dụng Games:** Sinh câu hỏi trắc nghiệm / điền từ cho **Arcade Quiz Game** và **Grammar Pop**.

#### Input Schema (`application/json`)

```json
{
  "type": "object",
  "properties": {
    "weak_words": {
      "type": "array",
      "description": "Danh sách các từ vựng học viên hay sai hoặc có Mastery thấp"
    },
    "weak_grammar_points": {
      "type": "array",
      "description": "Danh sách các điểm ngữ pháp cần củng cố"
    },
    "count": {
      "type": "number",
      "default": 3
    }
  }
}
```

#### Output Schema (`application/json`)

```json
{
  "quiz_items": [
    {
      "id": 1,
      "type": "collocation_cloze",
      "question": "Governments must implement strict regulations to ________ the detrimental impacts of urbanization.",
      "options": ["mitigate", "deteriorate", "accelerate", "resemble"],
      "correct_answer": "mitigate",
      "explanation": "'Mitigate the impacts' là cụm collocation C1 mang nghĩa giảm thiểu tác động tiêu cực.",
      "target_word": "mitigate"
    },
    {
      "id": 2,
      "type": "error_identification",
      "question": "Despite he worked diligently, he failed to achieve his desired band score.",
      "options": ["Despite he worked", "diligently", "failed to achieve", "desired"],
      "correct_answer": "Despite he worked",
      "explanation": "Sau 'Despite' phải là danh từ hoặc V-ing, không đi cùng mệnh đề. Sửa thành 'Despite working diligently' hoặc 'Although he worked'.",
      "target_grammar": "Conjunction vs Preposition"
    }
  ]
}
```

---

## 3. Kiến Trúc Tích Hợp Đa Nền Tảng (Multi-Platform Integration)

```
                       ┌─────────────────────────────────────────┐
                       │           IELTS OASIS CLIENTS           │
                       │  - Next.js Web (Writing / MatchaSpeak)  │
                       │  - Arcade Games (Tea Talk / Wordle)     │
                       │  - Discord Bot (/tuvan /dailyplan)      │
                       │  - Chrome Extension (Sidepanel / OCR)   │
                       └────────────────────┬────────────────────┘
                                            │ HTTP / WebSocket
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │          FASTAPI BACKEND CORE           │
                       │  Routes: /speaking, /writing, /wordle   │
                       └────────────────────┬────────────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │          AI SERVICE LAYER               │
                       │  [AIService Class with 5 AI Skills]     │
                       │  - evaluate_speech_pronunciation        │
                       │  - correct_writing_and_grammar          │
                       │  - generate_vocabulary_context          │
                       │  - drive_conversation_reflex            │
                       │  - generate_spaced_repetition_review    │
                       └────────────────────┬────────────────────┘
                                            │ Function Calling & REST
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │         GOOGLE GEMINI API ENGINE        │
                       │  - Primary: gemini-3.1-flash-lite       │
                       │  - Sub-second Latency (< 1.5s)          │
                       │  - Multi-turn Academic Tutor System     │
                       └─────────────────────────────────────────┘
```
