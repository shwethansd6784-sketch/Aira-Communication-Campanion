# 🌟 Aira – AI Female Communication Companion

> A responsive, full-stack web application designed to help users master English communication through realistic conversations with **Aira**, a supportive female virtual AI companion.

---

## 🚀 Quick Start Guide (How to Run)

The application consists of two parts: the **Backend API** (Node.js + Express) and the **Frontend Web App** (React + Vite).

### 1. Start the Backend Server
```bash
# Open a terminal in the project root:
cd backend
npm install
npm start
```
The backend server will run at: **`http://localhost:3001`**

### 2. Start the Frontend Application
```bash
# Open a second terminal in the project root:
cd frontend
npm install
npm run dev
```
The frontend web application will run at: **`http://localhost:5173`**

Open **[http://localhost:5173](http://localhost:5173)** in your browser (Google Chrome or Microsoft Edge recommended for voice features).

---

## 🔑 AI Brain Configuration (Optional Free Gemini API Key)

Aira works right out of the box with built-in intelligent fallback responses even without an API key! To unlock dynamic Google Gemini generative AI:

1. Get a free API key from **[Google AI Studio](https://aistudio.google.com/)** (15 requests/minute free).
2. Open `backend/.env` and paste your key:
   ```env
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Restart the backend server (`npm start`).

---

## 🎯 Key Features

### 1. 👩‍💼 Female 3D/2D Animated Virtual Avatar
- Expressive SVG character with animated lip synchronization during speech.
- Natural eye blinking and idle floating animations.
- Dynamic expressions matching conversation context (Speaking, Thinking, Neutral, Encouraging).
- Free, lightweight, and works offline without paid third-party avatar subscriptions (e.g., HeyGen).

### 2. 🎭 5 Realistic Conversation Situations
- **🎓 College Conversation**: Introducing yourself, talking to classmates, asking lecturers questions, discussing assignments.
- **💼 Job Interview**: HR questions, strengths & weaknesses, project walkthroughs, behavioral questions, and organic follow-ups.
- **🗣️ Group Discussion**: Opening statements, polite agreement/disagreement, supporting arguments with examples, concluding discussions.
- **🎤 Public Speaking**: Opening hooks, structural transitions, illustrative examples, audience interaction, concluding with impact.
- **☀️ Everyday English**: Casual chats, cafes & ordering, shopping, asking directions, meeting new people.

### 3. 📚 3 Learning Modes
- **Mode 1: Learn**: Comprehensive phrase banks, vocabulary lists with pronunciation audio, sample dialogues, and pro tips.
- **Mode 2: Practice**: Interactive back-and-forth conversation with real-time hints and gentle feedback.
- **Mode 3: Challenge**: Realistic mock simulation testing spontaneity and depth without hints.

### 4. 🎚️ 3 Difficulty Levels
- **Beginner**: Simpler sentences, more patience, guided suggestions.
- **Intermediate**: Natural conversational and professional vocabulary with structured follow-ups.
- **Advanced**: Nuanced reasoning, higher expectations for depth, and challenging follow-ups.

### 5. 🎯 Smart Answer Evaluation (Section 7)
- Click **"📊 Smart Evaluation & Suggestions"** under any answer to receive:
  - **What you did well (Strengths)**
  - **What information was missing**
  - **Weak or awkward phrasing**
  - **Why suggested improvements help**
  - **Better sample answer in simple, natural English (with voice playback)**
  - **Honest scores** across Relevance, Grammar, Vocabulary, and Completeness.
- **Interactive Action Controls**:
  - `🔄 Try Answering Again`: Resets the attempt so you can practice speaking in your own words.
  - `⭐ Show Better Answer`: Reveals the model answer with audio pronunciation.
  - `❓ Why Is My Answer Weak?`: Explains why certain details matter to listeners.
  - `💡 I'm Stuck`: Instant hints, useful phrases, and sentence starters.

### 6. 🎙️ Live Voice Interaction & Replay
- Speak into your microphone using the browser's built-in **Web Speech Recognition**.
- Hear Aira speak using a natural female voice via **Web Speech Synthesis**.
- **Voice Interruption**: Click the mic or tap the button while Aira is speaking to interrupt her naturally.
- **Voice Replay**: Every Aira message has a `🔊 Replay Voice` button to hear it again at any time.
- **Live Captions**: Real-time speech recognition preview for user and synchronized captions for Aira.
- **Text Chat Fallback**: Type your answers if you are in a noisy environment or without a microphone.

### 7. 📊 Progress Tracking Dashboard
- Powered by a local SQLite database (`backend/db/aira.db`).
- Tracks sessions, practice minutes, message volume, and average skill scores.
- Situation-wise performance breakdowns and weekly activity charts.
- Permanent storage that persists across browser restarts.

### 8. 📖 Personal Vocabulary Notebook
- Save unfamiliar words encountered during conversations with definitions and examples.
- Search words or practice pronunciation with the built-in speaker button.

---

## 📁 Project Architecture

```
Aira-Communication Campanion/
├── backend/
│   ├── db/
│   │   ├── database.js          # SQLite schema & initialization (better-sqlite3)
│   │   └── aira.db              # Local SQLite database file
│   ├── routes/
│   │   ├── ai.js                # Gemini chat, evaluation & learn curriculum
│   │   ├── progress.js          # Session tracking & dashboard analytics
│   │   ├── vocabulary.js        # Personal vocabulary notebook endpoints
│   │   └── goals.js             # Daily learning goals
│   ├── .env                     # Server environment variables & API key
│   ├── .env.example             # Example environment file
│   ├── package.json             # Backend dependencies
│   └── server.js                # Express app entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Avatar/
│   │   │   │   ├── AiraAvatar.jsx   # 3D/2D Animated Avatar component
│   │   │   │   └── Avatar.css       # Lip-sync, blinking & glow animations
│   │   │   └── UI/
│   │   │       └── Navigation.jsx   # Top navigation bar
│   │   ├── hooks/
│   │   │   ├── useSpeech.js     # Web Speech API (STT & TTS)
│   │   │   └── useAira.js       # Conversation logic & session coordination
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Situation, mode & difficulty selector
│   │   │   ├── Conversation.jsx # Video-call screen with live voice & smart evaluation
│   │   │   ├── Learn.jsx        # Pre-practice study curriculum
│   │   │   ├── Dashboard.jsx    # Progress analytics & skill charts
│   │   │   ├── Vocabulary.jsx   # Vocabulary notebook
│   │   │   └── Settings.jsx     # Audio settings, privacy & server status
│   │   ├── store/
│   │   │   └── appStore.js      # Global state management (Zustand)
│   │   ├── utils/
│   │   │   ├── api.js           # Frontend-to-backend API client
│   │   │   └── aiPrompts.js     # Situational openers & prompt templates
│   │   ├── App.jsx              # React router setup
│   │   ├── index.css            # Modern glassmorphism UI styles
│   │   └── main.jsx             # React entry point
│   ├── index.html               # HTML wrapper
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite dev configuration
└── README.md                    # Project documentation
```

---

## 🔒 Privacy & Safety
- **Zero audio storage**: Your microphone audio is processed in real time by the browser engine and is never stored on disk.
- **Local persistence**: Your progress, vocabulary, and transcripts are stored in your own local SQLite database on your computer.
- **Secure API credentials**: The Gemini API key remains strictly on the backend server and is never exposed to frontend browser code.
