# 🌴 IELTS Oasis: Adaptive English Learning Platform & Proactive Multi-Agent Ecosystem

![IELTS Oasis Banner](./ielts_oasis_clean_2d_matcha.png)

[![Google Kaggle Competition](https://img.shields.io/badge/Google%20Kaggle-Vibe%20Coding%20Course-blue.svg)](https://www.kaggle.com/competitions/5-day-ai-agents-intensive-vibecoding-course-with-google)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%203.1%20Flash%20Lite-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Ready-green.svg)](#)

---

## 🔗 Live Demo & Links
* **Web Application URL:** [https://ieltsoasis.site](https://ieltsoasis.site)
* **Kaggle Submission:** [Kaggle Competition Overview](https://www.kaggle.com/competitions/5-day-ai-agents-intensive-vibecoding-course-with-google/overview)

---

## 🌟 The Core Concept
Traditional language learning platforms suffer from low user retention. **IELTS Oasis** is a smart, dual-interface (Interactive Next.js Dashboard + Proactive Discord Bot) ecosystem designed to turn passive vocabulary accumulation into active learning habits.

By pairing a feature-rich web platform with an automated Discord tutor, IELTS Oasis checks user knowledge, diagnoses levels, structures custom daily schedules, and enforces daily learning prompts—orchestrated **100% using Google's Gemini models (`gemini-3.1-flash-lite`)**.

---

## 🤖 The Multi-Agent Ecosystem

IELTS Oasis operates a network of autonomous agents acting collaboratively across the Next.js Web Dashboard and the Discord Bot:

```mermaid
graph TD
    %% User Interfaces
    Web[Next.js Web Dashboard]
    Bot[Discord Bot Interface]

    %% Matcha Lens Ingestion Flow
    Web -->|1a. Upload Image| CV[YOLOv8 & Gemini Vision]
    CV -->|2. Detect & Crop| Crop[Crop Coordinator]
    Crop -->|3. Vocab Refinement| Refine[Gemini Vocabulary Enrichment]
    Refine -->|4. Generate TTS & Unsplash| TTS[TTS & Unsplash Service]
    TTS -->|5. Save to Library| DB[(MySQL Database)]

    %% Matcha Scroll Ingestion Flow
    Web -->|1b. Upload PDF/DOCX/Image| Scroll[Matcha Scroll Extractor]
    Scroll -->|2. Extract Text / Vision Scan| ScrollRefine[Gemini Document Enrichment]
    ScrollRefine -->|3. Batch Generate TTS| TTS
    ScrollRefine -->|4. Save all/individual to Library| DB

    %% Writing Sanctuary Flow
    Web -->|6. Write Essay| Essay[Writing Sanctuary Canvas]
    Essay -->|7. Grade Essay| Grade[Gemini Essay Grader]
    Essay -->|8. Highlight Text| Rephrase[Gemini Rephrase API]
    Grade -->|9. Save Log| DB
    Essay -->|10. Send to| Radio[Matcha Radio Listening Lab]
    Essay -->|11. Send to| Book[Matcha Book Reading Lab]

    %% Reading & Listening Flow
    Web -->|12. YT URL / Custom Text| Radio
    Radio -->|13. Generate Quiz & TTS| GeminiQuiz[Gemini MCQ/Dictation Generator]
    Web -->|14. Highlight Reader| Book
    Book -->|15. Highlight Word| Translate[Gemini Quick Translate API]

    %% Daily Planner & Quizzes
    Web -->|16. Select Topic| Planner[Daily Planner Agent]
    Planner -->|17. Generate Lesson plan| DB
    Web -->|18. Review Flashcard| Quiz[Matcha Quiz: Vocab/AI Grammar]

    %% Community Interactions
    Web -->|19. Post Vocabulary/Essay| Feed[Oasis Community Feed]
    Feed -->|20. Like & Comment| DB
    Feed -->|21. Convert to Lesson| Book

    %% Discord Bot Commands & Reminders
    Bot -->|22. Slash /tuvan| BotAdvisor[Active Level Advisor Agent]
    BotAdvisor -->|23. Interview & Test| BotAdvisor
    BotAdvisor -->|24. Evaluate & Schedule| DB
    Bot -->|25. Slash /xinnghi| BotAbsence[Absence Grading Agent]
    BotAbsence -->|26. Evaluate Reason| DB
    Bot -->|27. Reply / Mention| BotChat[Context-Aware Conversational Tutor]
    
    %% Scheduler Job
    DB -->|28. Read Schedule| Cron[APScheduler Cron Job]
    Cron -->|29. Push DM Reminders| Bot

    %% Matcha Game Center Flow
    Web -->|30. Play Game| Wordle[Wordle Matcha Game]
    Wordle -->|31. AI Generates Secret Word & Hint| Refine
    Wordle -->|32. Update Leaderboard & Level| DB
```

---

## ⚡ Main Features

### 1. 📷 Matcha Lens (Multimodal Vocabulary Ingestion)
* **Visual Detection:** Integrates a dual detection system. It first attempts to utilize a local **YOLOv8** model for quick physical object mapping. If no bounding boxes are detected, it seamlessly falls back to **Gemini Vision** to identify 5 to 8 distinct physical objects.
* **Floating Bounding Boxes:** Directly overlay interactive bounding boxes on the uploaded image inside the Next.js UI.
* **Vocabulary Enrichment:** When saving a detected word, Gemini refines it to generate IPA phonetics, Vietnamese meanings, IELTS academic contextual example sentences, synonyms, and **mnemonics Vietnamese memory hooks** to simplify retention.
* **TTS Integration:** Automatically generates Text-to-Speech (TTS) pronunciation audio files for new words and stores them locally.
* **Unsplash Media Binding:** Binds relevant Unsplash images to the card if no picture is present.

### 2. ✍️ Writing Sanctuary (IELTS Essay Evaluator)
* **Strict IELTS Examiner:** Grades essays based on the 4 official IELTS criteria: *Task Achievement, Coherence & Cohesion, Lexical Resource,* and *Grammatical Range & Accuracy*.
* **Detailed Corrections:** Highlights original mistakes, provides correct academic forms, and gives thorough grammatical explanations in Vietnamese.
* **AI Rephraser:** Allows users to highlight any phrase in their essay to receive 3 alternative academic/natural rewrites, which can be applied directly with one click.
* **Timing & Drafts:** Includes built-in timed modes (Task 1: 20 mins, Task 2: 40 mins) and draft saving.
* **Seamless Cross-Lab Redirection:** Users can send their essay to *Matcha Radio* to listen to their own text, or to *Matcha Book* to generate reading comprehension questions from it.

### 3. 🎧 Matcha Radio (Listening Practice Lab)
* **YouTube Quiz Generator:** Scrapes transcripts from any YouTube URL and generates Multiple-Choice or gap-fill Dictation tests based on video content.
* **Interactive Player:** Custom analog radio retro tuner dial and spinning vinyl disc animations.
* **Bookmarks & Notes:** Allows users to save notes at custom audio timestamps and jump back/forth easily.
* **Fuzzy Grading:** Utilizes Levenshtein distance calculations to allow minor spelling differences (up to 2 character variations) and pluralizations.

### 4. 📖 Matcha Book (Reading Comprehension Lab)
* **Passage generator:** Generates IELTS Reading tests (MCQs and Fill-in-the-blanks) from custom texts or shared community posts.
* **Click-to-Translate:** Features a highlight overlay where selecting any word or phrase up to 50 characters displays an instant translation popup powered by Gemini.

### 5. 📚 Vocabulary Lab & Quizzes
* **Matcha Scroll (Document & Image Vocabulary Extractor):** Drag & Drop documents (.pdf, .docx) or screenshots of vocabulary sheets into a cozy wooden tray. The system infuses the content (Matcha Brewing loading animation) and automatically extracts 5 to 15 advanced IELTS vocabularies, mapping context-specific definitions, phonetics, example sentences from the text, Vietnamese memory hooks, and synonyms.
* **Save All / Batch Import:** Save all extracted vocabulary cards locally or share them to the community feed with one click, without blocking the interface.
* **Interactive Flashcards & Topic Filters:** Smart flashcard sliding interface supporting swipe gestures and topic filters (All, Environment, Tech, Health, Education, Economy) to review specific decks.
* **SRS reviews:** Track review counts using Spaced Repetition to prompt users when review dates are due.
* **Multi-Mode Quiz:** Supports Vocabulary ABCD/Spelling quizzes and dynamically generated AI Grammar quizzes with detailed explanations.

### 6. 📅 Daily Planner & Community Hub
* **Matcha Daily List:** Generates customized roadmaps containing 10 vocabularies, a listening summary task, a Writing Task 2 prompt, and a reading passage based on a selected topic.
* **Oasis Community:** A shared public feed where students post their graded essays and vocabularies. Users can like, comment, filter by topic, and convert other community posts into custom listening or reading tests.
* **Notification Hub:** Real-time user notifications showing likes, comments, and review due counts.

### 7. 🎮 Matcha Game Center (Learning Game Hub)
* **Wordle Matcha:** A beautiful Matcha-themed 5-letter word guessing game.
* **Gemini AI Integration:** Dynamically generates IELTS-based secret words and clues that increase in difficulty as levels advance.
* **State Persistence:** Automatically saves game progress to the database, allowing players to resume their active level upon return.
* **Scoring & Leveling Mechanics:** Points scale with level progression, featuring bonuses for quick guesses (under 30s) and minimal guess counts. If a player fails to guess within 6 attempts, their level resets to 1 and accumulated points reset to 0.
* **Leaderboard:** A dual-tab leaderboard showcasing the Top 10 weekly server high scores alongside personal bests, and highlights the all-time highest level record holder.

### 8. 🔒 Security & User Experience Enhancements
* **Instagram-style Username Validation:** Constraints guest usernames to lowercase letters, numbers, underscores, and dots (3-20 characters), preventing illegal characters and malformed names.
* **Passwordless Guest Account Recovery:** Recognizes existing guest usernames during login, restoring their database profile and preventing data loss when logging back in.
* **IP-based Login Audit:** Detects and records client IP addresses (`last_ip`) for audit and persistence logging.
* **Auto-Logout Check:** Monitors API requests; any expired or invalid session token instantly triggers safe client-side logging out.

---

## 🤖 Discord Bot Features

The proactive Discord tutor acts as the scheduling arm of the Oasis ecosystem:
* **/tuvan Command:** Conducts an interactive level diagnostic interview. The bot poses evaluation questions generated by Gemini, assesses the student's level, and schedules daily study reminders.
* **/xinnghi Command:** Allows students to request a 1-day absence. Gemini evaluates the validity of the reason in under 50 words and temporarily deactivates study notifications for that day.
* **/dailyplan Command:** Instantly generates a study roadmap with 5 target vocabularies for the selected topic.
* **/myprogress Command:** Retrieves the user's current SRS vocabulary progress directly from the MySQL database.
* **Schedule Checker Job:** Runs every minute (Vietnam timezone UTC+7) to send active learning reminder DMs to users.
* **Generative Thread Replies:** Supports natural context-aware conversations by remembering the history of the last 6 messages.

---

## 🏗️ Project Architecture & Structure

```
ielts-oasis/
├── backend/                  # FastAPI Backend & Discord Bot
│   ├── services/
│   │   ├── ai_service.py     # Gemini API integration wrapper (OpenAI compatibility endpoint)
│   │   └── tts_service.py    # Text-to-Speech audio generation
│   ├── bot.py                # Python Discord Bot & Scheduler
│   ├── main.py               # FastAPI App endpoints & YOLOv8 integration
│   ├── models.py             # Database schemas (MySQL via SQLAlchemy)
│   ├── schemas.py            # Pydantic schemas
│   ├── database.py           # DB connection helper
│   └── auth_routes.py        # Discord OAuth2 & Guest login
├── frontend/                 # Next.js Web Dashboard
│   ├── app/                  # Pages & routes
│   └── components/           # Interactive UI elements
│       ├── DailyPlanner.tsx  # Matcha Daily Plan view
│       ├── VocabularyLab.tsx # Smart interactive flashcards
│       ├── MatchaLens.tsx    # Yolov8 / Gemini Multimodal camera scanner
│       ├── MatchaRadio.tsx   # YouTube & manual audio listening lab
│       ├── MatchaBook.tsx    # Passage reader with Click-to-Translate
│       ├── WritingSanctuary.tsx # Timed essay canvas & AI rephraser
│       └── CommunityFeed.tsx # Community feed with likes & comments
└── docker-compose.yml        # Orchestrator configurations
```

---

## 🛠️ Step-by-Step Deployment Guide

> [!IMPORTANT]
> To configure Discord Login and Bot interactions, you need a Discord Application from the [Discord Developer Portal](https://discord.com/developers/applications).

### Step 1: Discord Configuration
1. Create a new Discord Application.
2. In the **OAuth2** tab, add your redirect URI: `https://<YOUR_CUSTOM_DOMAIN>/auth/callback` (or `http://localhost:3000/auth/callback` for local runs).
3. Under the **Bot** tab, enable **Message Content Intent** (required for the bot to read messages on channel replies/mentions).

### Step 2: Environment Setup
Create a `.env` file in the root folder of the project:
```env
# AI Keys
GEMINI_API_KEY=your_gemini_api_key

# Discord OAuth Configuration
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://your-custom-domain.com/auth/callback
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_server_id

# JWT configuration
JWT_SECRET=super-secret-key-change-me-123456

# Model Settings
PRIMARY_TEXT_MODEL=gemini-3.1-flash-lite
PRIMARY_VISION_MODEL=gemini-3.1-flash-lite

# Cloudflare Tunnel Token
CLOUDFLARE_TUNNEL_TOKEN=your_cloudflare_tunnel_token
```

### Step 3: Run with Docker Compose
Run the following command to spin up the MySQL database, FastAPI backend, Discord Bot, Next.js web application, and the Cloudflare Tunnel:
```bash
docker compose up -d --build
```

### Step 4: Verification
* Open your browser and navigate to `https://your-custom-domain.com`.
* Log in as a Guest or using Discord.
* Try `/tuvan` inside your Discord server to begin the adaptive scheduling onboarding!