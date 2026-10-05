# 🔍 TrustLens - Digital Trust & Safety Assistant

> *"Before you click. Before you pay. Before you believe."*

TrustLens is a MERN stack web application designed to help users (especially senior citizens and users with lower digital literacy) evaluate suspicious messages, links, and screenshots before falling victim to scams or financial fraud.

---

## 🏗️ Architecture Overview

The project is intentionally divided into clean, decoupled layers:

```
trustlens/
├── backend/            # Express.js REST API & Rule-Based Detection Engine
│   ├── config/         # Database and server configuration
│   ├── controllers/    # Request handlers (processes inputs and sends responses)
│   ├── engine/         # Rule engine (dictionaries, scam rules, risk scorer)
│   ├── services/       # Analysis orchestration and specialized analyzers
│   │   └── ai/         # Gemini adapter, prompts, validation, and fallback
│   ├── middlewares/    # Request pre-processors and error handling
│   ├── models/         # MongoDB schemas (User, Analysis reports)
│   ├── routes/         # Express endpoint definitions
│   ├── utils/          # General helper functions
│   ├── .env.example    # Environment variables template
│   ├── package.json    # Backend dependencies & scripts
│   └── server.js       # Main server entry file
│
├── frontend/           # React User Interface
│   ├── public/         # HTML template and static assets
│   ├── src/
│   │   ├── assets/     # Images, icons, and logos
│   │   ├── components/ # Reusable UI pieces (Navbar, buttons, cards)
│   │   ├── context/    # Global state (user login, Senior Mode, language)
│   │   ├── pages/      # Full-screen pages (Home, History, etc.)
│   │   ├── services/   # Functions that communicate with the backend
│   │   ├── styles/     # CSS styles
│   │   ├── App.jsx     # Root React component
│   │   └── index.js    # React DOM mounting entry point
│   ├── .env.example    # Frontend environment template
│   └── package.json    # Frontend dependencies & scripts
│
└── README.md           # Project documentation and guide
```

## Gemini AI Explanation and Media Analysis

TrustLens always runs its deterministic analyzer and risk scorer first. The backend then calls Gemini through the existing AI provider adapter. Gemini can explain rule findings, extract text claims, summarize supplied or safely retrieved article content, inspect screenshot images, and analyze supported public YouTube videos or uploaded video files. The AI result is stored separately from the deterministic score, risk level, and rule findings; it cannot change those fields.

Copy `backend/.env.example` to `backend/.env`, then configure:

```env
AI_PROVIDER=gemini
AI_API_KEY=your_Gemini_API_key
AI_MODEL=your_supported_Gemini_model
```

Keep the key only in the backend `.env`; never add it to a `VITE_*` variable or frontend code. `AI_API_URL` can normally stay blank. Requests time out after `AI_TIMEOUT_MS` (default 120 seconds); Files API video processing is bounded by `GEMINI_FILE_PROCESSING_TIMEOUT_MS` (default 5 minutes). Uploaded video files are temporarily stored and removed after processing, with a 500 MB upload limit.

Small screenshot images are sent from the browser to the backend and then to Gemini with extracted text. YouTube URLs are sent to Gemini as video inputs. Instagram content is not fetched; the AI can only explain the caption or text supplied by the user and reports that limitation. Article URL retrieval is restricted to public HTTPS IPv4 hosts, pins the resolved address, rejects redirects and private/reserved hosts, and caps the downloaded response.

If the key/model is absent, Gemini is unreachable, media processing fails, or output fails validation, TrustLens returns the deterministic report with `aiAnalysis.mode = "fallback"`. Textual AI evidence must match supplied/retrieved text or deterministic findings. Visual and audio statements are explicitly marked as AI interpretations, not confirmed facts. AI-generated safety suggestions are secondary to the deterministic incident-response advice.

---

## 🚀 How to Run the Project (For Beginners)

### 1. Prerequisites
- **Node.js** (v18 or higher installed on your computer)
- **MongoDB** (installed locally or a free MongoDB Atlas connection string)

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *Your backend will run on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   *Your frontend will automatically open in your browser at `http://localhost:3000`.*
"# trustlens" 
