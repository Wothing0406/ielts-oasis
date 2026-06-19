# 🌴 IELTS Oasis: Adaptive English Learning Platform & Proactive Multi-Agent Ecosystem

[![Google Kaggle Competition](https://img.shields.io/badge/Google%20Kaggle-Vibe%20Coding%20Course-blue.svg)](https://www.kaggle.com/competitions/5-day-ai-agents-intensive-vibecoding-course-with-google)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%203.1%20Flash%20Lite-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Ready-green.svg)](#)

---

## 🔗 Live Demo & Links
* **Web Application URL:** [https://drudge-amount-charting.ngrok-free.dev](https://drudge-amount-charting.ngrok-free.dev)
* **Kaggle Submission:** [Kaggle Competition Overview](https://www.kaggle.com/competitions/5-day-ai-agents-intensive-vibecoding-course-with-google/overview)

---

## 🌟 The Core Concept
Traditional language learning platforms suffer from low user retention. **IELTS Oasis** is a smart, dual-interface (Interactive Next.js Dashboard + Proactive Discord Bot) ecosystem designed to turn passive vocabulary accumulation into active learning habits.

By pairing a feature-rich web platform with an automated Discord tutor, IELTS Oasis checks user knowledge, diagnoses levels, structures custom daily schedules, and enforces daily learning prompts—orchestrated **100% using Google's Gemini models (`gemini-3.1-flash-lite`)**.

---

## 🤖 The Multi-Agent Ecosystem

IELTS Oasis operates a network of autonomous agents acting on behalf of the user:

```mermaid
graph TD
    User([User Interface]) -->|Upload Image| ML[Matcha Lens CV Agent]
    User -->|Submit Essay| WG[IELTS Essay Grading Agent]
    User -->|Submit YouTube Link| LQ[YouTube Listening Quiz Agent]
    User -->|Slash /tuvan| DA[Active Diagnostic Advisor Agent]
    
    ML -->|Detect & Crop| IE[Vocab Ingestion & Enrichment Agent]
    IE -->|Validate Unique| CE[Community Share Agent]
    CE -->|Publish| DB[(MySQL Database)]
    
    WG -->|Evaluate Criteria| DB
    LQ -->|Generate Gaps/MCQ| DB
    DA -->|Evaluate & Schedule| DB
```

### 1. Matcha Lens: Computer Vision + Multimodal Ingestion Agent
* **Visual Detection:** Integrates YOLOv8 object detection in the backend. When a user uploads a photo of their surroundings, the CV agent locates distinct items.
* **Multimodal Extraction:** Crops coordinates, maps target bounding boxes, and passes the crops to Gemini to extract translations, IPA phonetics, IELTS-oriented contextual examples, and mnemonics memory hooks.
* **Media Binding:** Binds relevant Unsplash imagery and initiates a Text-to-Speech (TTS) pipeline to save audio clips directly.

### 2. IELTS Essay Grading Agent (Writing Lab)
* **Strict Evaluation:** Acts as a strict examiner, breaking down user-submitted essays based on the 4 official IELTS criteria: *Task Achievement, Coherence & Cohesion, Lexical Resource,* and *Grammatical Range & Accuracy*.
* **Granular Corrections:** Isolates exact grammar and spelling mistakes, highlights the original vs. corrected string, and explains the rationale in Vietnamese.

### 3. YouTube Listening Quiz Generator (Listening Lab)
* **Dynamic Scraper:** Accepts a YouTube video URL, extracts subtitles dynamically, and tests suitability for listening comprehension.
* **Interactive Assessment:** Generates customized multiple-choice tests or dictation fill-in-the-gap exercises using the transcript data, giving users real-time playback testing capability.

### 4. Active Level Diagnostic & Advisor Agent (`/tuvan` Discord Flow)
* **Interactive Interview:** Bot interviews the user in Discord regarding their study availability and current vocabulary/IELTS status.
* **Diagnostic Test:** Formulates a tailored IELTS level assessment question based on the user's initial responses.
* **Structured JSON Extraction:** Once the user replies directly to the question (using Discord's reply function), the advisor evaluates the answer using Gemini's **Structured Output (JSON mode)** to determine the IELTS band, topic focus, and optimal daily study times.
* **APScheduler Integration:** Automatically registers a cron-like schedule triggers to push gắt gao (strict) daily notifications.

### 5. Context-Aware Conversational Tutor
* **Targeted Thread Continuation:** Reads parent message contents when a user replies directly to a bot message. Allows users to continue specific grammar quizzes, clarify tips, or answer exercises seamlessly without code state-tracking.

---

## 🏗️ Project Architecture & Structure

```
ielts-oasis/
├── backend/                  # FastAPI Backend & Discord Bot
│   ├── services/
│   │   ├── ai_service.py     # Gemini API integration wrapper
│   │   └── tts_service.py    # Text-to-Speech audio generation
│   ├── bot.py                # Python Discord Bot & Scheduler
│   ├── main.py               # FastAPI App endpoints
│   ├── models.py             # Database schemas (MySQL)
│   ├── database.py           # DB connection helper
│   └── auth_routes.py        # Discord OAuth2 & Guest login
├── frontend/                 # Next.js Web Dashboard
│   ├── app/                  # Pages & routes
│   └── components/           # Interactive UI elements
│       ├── CommunityFeed.tsx # Community vocabulary feed
│       ├── DailyPlanner.tsx  # Matcha Daily Plan view
│       └── Flashcard.tsx     # Smart interactive flashcards
└── docker-compose.yml        # Orchestrator configurations
```

---

## 🛠️ Step-by-Step Deployment Guide

> [!IMPORTANT]
> To configure Discord Login and Bot interactions, you need a Discord Application from the [Discord Developer Portal](https://discord.com/developers/applications).

### Step 1: Discord Configuration
1. Create a new Discord Application.
2. In the **OAuth2** tab, add your redirect URI: `https://<YOUR_NGROK_DOMAIN>/auth/callback` (or `http://localhost:3000/auth/callback` for local runs).
3. Under the **Bot** tab, enable **Message Content Intent** (required for the bot to read messages on channel replies/mentions).

### Step 2: Environment Setup
Create a `.env` file in the root folder of the project:
```env
# AI Keys
GEMINI_API_KEY=your_gemini_api_key

# Discord OAuth Configuration
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://your-domain.ngrok-free.dev/auth/callback
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_server_id

# JWT configuration
JWT_SECRET=super-secret-key-change-me-123456

# Model Settings
PRIMARY_TEXT_MODEL=gemini-3.1-flash-lite
PRIMARY_VISION_MODEL=gemini-3.1-flash-lite

# Ngrok Public Tunneling
NGROK_AUTHTOKEN=your_ngrok_authtoken
NGROK_DOMAIN=your-domain.ngrok-free.dev
```

### Step 3: Run with Docker Compose
Run the following command to spin up the MySQL database, FastAPI backend, Discord Bot, Next.js web application, and the Ngrok public tunnel:
```bash
docker-compose up -d --build
```

### Step 4: Verification
* Open your browser and navigate to `https://your-domain.ngrok-free.dev`.
* Log in as a Guest or using Discord.
* Try `/tuvan` inside your Discord server to begin the adaptive scheduling onboarding!

---

## ⚡ Key Strengths & Tech Highlights
* **Dual Interface Sync:** Synchronizes data between Discord interaction logs and web flashcard vault states reactively.
* **Stateless Persistence:** Maintains bot turn-taking states purely by inspecting Discord thread message reference properties, eliminating caching memory leaks.
* **100% Lightweight:** Relies purely on the cost-efficient `gemini-3.1-flash-lite` model for multimodal tasks.
* **Local Guest Access:** Users can access 90% of features anonymously without login credentials via client-side state fallbacks.