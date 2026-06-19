# IELTS Oasis: AI-Powered English Learning & Adaptive Study Agent

Welcome to **IELTS Oasis**, an adaptive, dual-interface (Next.js Dashboard + Discord Bot) English learning assistant designed specifically for IELTS preparation. This project was developed as part of Google's Kaggle Competition: **"5-Day AI Agents Intensive Vibe Coding Course with Google"**.

---

## 🌟 The Core Idea
Learning a new language is hard, but staying consistent is harder. **IELTS Oasis** bridges this gap by combining an **interactive web dashboard** (for active learning, flashcards, image object detection, and community sharing) with a **proactive Discord Bot tutor** (for diagnostic level testing, custom daily plans, context-aware Q&A, and strict study scheduling). 

The platform is powered **100% by Google's Gemini models (`gemini-3.1-flash-lite`)** to orchestrate intelligence across both interfaces.

---

## 🏗️ Project Architecture & Structure

The codebase is split into two primary components, running fully containerized inside **Docker**:

```
ielts-oasis/
├── backend/                  # FastAPI Web Server & Discord Bot
│   ├── services/
│   │   ├── ai_service.py     # Gemini API integration wrapper
│   │   └── tts_service.py    # Text-to-Speech audio generation
│   ├── bot.py                # Python Discord Bot & Scheduler
│   ├── main.py               # FastAPI App endpoints
│   ├── models.py             # SQLAlchemy schemas (MySQL)
│   ├── database.py           # DB connection helper
│   └── auth_routes.py        # Discord OAuth2 & Guest login
├── frontend/                 # Next.js Web Dashboard
│   ├── app/                  # Next.js pages & routes
│   └── components/           # Interactive UI elements
│       ├── CommunityFeed.tsx # Community vocabulary library
│       ├── DailyPlanner.tsx  # Matcha Daily Plan view
│       └── Flashcard.tsx     # Smart interactive flashcards
└── docker-compose.yml        # Orchestration configurations
```

---

## 🤖 Agentic Workflows

IELTS Oasis implements four key agentic workflows that leverage Gemini's multimodal and reasoning capabilities:

### 1. The Vocabulary Ingestion & Enrichment Agent
When a user adds a word manually or detects it in an image (via client-side Matcha Lens):
* **Refinement Loop:** An agent parses the word, determines the translation (EN-VI or VI-EN), and calls Gemini to generate rich educational metadata (phonetics, IELTS-oriented contextual examples, synonyms, collocations, and a **mnemonics memory hook** in Vietnamese).
* **Media Acquisition:** Automatically searches and binds relevant image assets from Unsplash and triggers a TTS (Text-to-Speech) pipeline to output high-quality pronunciation audio.

### 2. The Smart Community Distribution Agent
Prevents feed spamming while promoting crowd-sourced learning:
* **Source Validation:** When a word is added via AI/manual inputs, this agent inspects the global feed. If the word is unique, it tags it as `is_global = True` to share it with all users.
* **Deduplication:** If a user copies a word from the community feed to their personal flashcards, the agent marks it as `source = "Oasis Community"`, setting `is_global = False` to prevent duplicate global entries.

### 3. The Active Level Diagnostic & Advisory Agent (`/tuvan`)
Guides users through an IELTS onboarding flow on Discord:
* **Interactive Interview:** Initiated by `/tuvan`, the bot asks the user for their availability and current IELTS level.
* **Diagnostic Test:** The agent dynamically creates a personalized IELTS writing/grammar question based on the user's input.
* **Structured Evaluation:** Once the user replies directly to the question, the agent evaluates the response using Gemini's **Structured Output (JSON mode)**. It extracts:
  - An evaluation score and feedback explanation.
  - Estimated IELTS level.
  - Recommended topic focus and best study time.
* **Schedule Persistence:** Saves the study schedule in the DB and configures `APScheduler` to trigger daily strict push notifications.

### 4. Context-Aware Conversational Tutor
* **Targeted Replied Context:** When a user replies directly to a specific Discord bot message (using Discord's reply function), the bot fetches the parent message and passes the prompt to Gemini to reply exactly in that thread's context (e.g., continuing a grammar quiz or explaining a specific tip).
* **History fallback:** When tagged generally, it pulls the channel's recent 6 messages to preserve flow without manual state passing.

---

## ⚡ Project Strengths & Highlights

* **100% Gemini Powered:** Leverages the speed and accuracy of `gemini-3.1-flash-lite` for text parsing, JSON formatting, and conversational Q&A.
* **Stateless & Context-Aware Discord Flow:** By matching parent message content on Discord replies, the bot behaves statefully (tracking steps, following up on specific questions) while remaining completely stateless in code.
* **Integrated Learning Loop:** Vocabulary generated on the web is synced to the Discord bot (visible via `/myprogress`), and schedule preferences determined by the bot on Discord directly configure the web app's notification behavior.
* **Privacy Focused:** Removed forced Discord guild joining and replaced it with clean Discord OAuth scope requests, allowing guests to use the platform as anonymous users with local session storage.

---

## 🚀 How to Run Locally

1. Create a `.env` file in the root folder with the following variables:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_REDIRECT_URI=your_redirect_uri
   DISCORD_BOT_TOKEN=your_discord_bot_token
   DISCORD_GUILD_ID=your_discord_guild_id
   NGROK_AUTHTOKEN=your_ngrok_authtoken
   NGROK_DOMAIN=your_ngrok_domain
   ```
2. Start the services:
   ```bash
   docker-compose up -d --build
   ```
3. Access the web dashboard via `http://localhost:3000` or your Ngrok public tunnel.