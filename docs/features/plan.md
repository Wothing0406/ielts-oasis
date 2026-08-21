# Technical Implementation Plan: Matcha Oasis Chrome Extension (Manifest V3)

This plan outlines the architecture, step-by-step implementation phases, and test cases for building the **Matcha Oasis Extension** supporting the IELTS Oasis ecosystem.

---

## 1. Core Objectives & System Scope

1.  **Mascot 2D Pixel Widget:** Floating green Matcha cat mascot with transparent background (like Bongo Cat). Shows custom state animations (idle, reading, alert).
2.  **Adaptive Vocab Reminders:** Every 30 minutes, Mascot prompts a vocabulary review card (synced with user's active database).
3.  **Context-Aware Silence:** Disable popups when browsing `https://ieltsoasis.site/` and replace with a cheering/motivational mascot widget.
4.  **Multimodal OCR Screen Scanner:** Screenshot selector using a draggable canvas to extract words (OCR) and sync them directly to the user's Vocabulary Lab.
5.  **Side Panel Academic Assistant:** Shortcuts (Highlight + hotkey) triggering an AI Chatbot utilizing the active Gemini model for writing suggestions and definition lookups.
6.  **Web download button:** A button on the website dashboard offering an installer zip and installation guidelines.

---

## 2. Technical Architecture & File Directory Structure

We will structure the Chrome Extension using Chrome Manifest V3:

```text
matcha-oasis-extension/
├── manifest.json              # Extension metadata and permissions
├── background/
│   └── service_worker.js      # Alarms, Context Menu, API sync worker
├── content_scripts/
│   ├── pet_overlay.js         # Mascot DOM injection, float and animation loop
│   ├── pet_overlay.css        # Styles for pixel art mascot, dialog bubble
│   ├── ocr_selector.js        # Draggable screenshot capture overlay
│   └── text_highlighter.js    # Highlight event capture and sidepanel triggers
├── popup/
│   ├── popup.html             # Toolbar popup panel for quick auth and switches
│   ├── popup.js               # Auth check and toggles state persistence
│   └── popup.css              # Matcha styling palette
├── sidepanel/
│   ├── assistant.html         # Sidebar chat interface with vocabulary cards
│   ├── assistant.js           # Slash commands controller and chat handler
│   └── assistant.css          # IELTS Oasis UI design
└── assets/
    ├── icons/                 # Toolbar and system icons (16x16, 48x48, 128x128)
    └── mascot/                # Mascot state assets (idle, reading, cheer)
```

---

## 3. Step-by-Step Implementation Sequence

### Phase 1: Chrome Extension Setup & Authentication
*   **Task 1.1:** Write the base `manifest.json` declaring Manifest V3, permissions (`activeTab`, `storage`, `alarms`, `sidePanel`), and worker files.
*   **Task 1.2:** Implement the Toolbar `popup.html` and `popup.js` verifying JWT token authentication synced with `ieltsoasis.site` cookie/local storage.

### Phase 2: Mascot UI Overlay & Adaptive Silence
*   **Task 2.1:** Inject the floating Mascot canvas via `pet_overlay.js` with responsive drag controls and idle animations.
*   **Task 2.2:** Set up a Chrome alarm (30-minute default interval) in `service_worker.js` displaying vocabulary popups.
*   **Task 2.3:** Add URL matching logic: If tab URL matches `https://ieltsoasis.site/*`, deactivate active alarms and switch mascot sprite to "Cheering/Supportive Mode".

### Phase 3: Screen OCR Capture Scanner
*   **Task 3.1:** Implement the draggable screenshot selector overlay `ocr_selector.js`.
*   **Task 3.2:** Send cropped image data to the backend Vision API (`/matcha-lens/scan` or direct Vision SDK) to extract target word, definition, and IPA.
*   **Task 3.3:** Create a quick-save confirmation bubble to sync the vocabulary directly to the user's database.

### Phase 4: Side Panel AI Assistant & Highlights
*   **Task 4.1:** Build `sidepanel/assistant.html` referencing the official Gemini API for academic explanations and essay suggestions.
*   **Task 4.2:** Implement text selection event handler in `text_highlighter.js` with custom slash commands (`/define`, `/rephrase`).

### Phase 5: Web Installer Dashboard integration
*   **Task 5.1:** Add "Download Mascot Extension" button inside Next.js dashboard Settings with a modal showing visual developer-mode loading instructions.

---

## 4. Comprehensive Test Cases

| Test Case ID | Test Target | Action | Expected Result |
|---|---|---|---|
| **TC-001** | Auth Sync | Log in on `ieltsoasis.site` and open extension popup | Extension displays user's name and synchronizes the active JWT token. |
| **TC-002** | 30m Alarm | Set Alarm interval to 1 minute for testing | Mascot pops up a card containing 1 vocab word from user's DB. |
| **TC-003** | Silence Mode | Navigate to `https://ieltsoasis.site` | Regular notifications stop. Mascot switches state to "Supportive mascot". |
| **TC-004** | OCR Capture | Drag-select text on an image or PDF | Image is successfully scanned and word + definition are extracted. |
| **TC-005** | AI Assistant | Select text, right-click and choose "Explain with Matcha AI" | Chrome Side Panel opens, rendering detailed definitions from Gemini. |
