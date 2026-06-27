# Qualifyr — AI-Powered B2B Software Advisor

Qualifyr is an intelligent, consultative B2B software qualification and advisory platform. It evaluates buyer requirements through dynamic, natural conversations, matches needs to real-world software solutions via live search grounding, and estimates immediate ROI. It also includes an interactive Document Q&A agent for analyzing vendor sheets, pricing grids, and project briefs in real time.

---

## 🚀 Key Features

*   **Interactive BANT Qualification:** Converses naturally with buyers to extract qualification parameters (Budget, Authority, Need, and Timeline) without rigid forms.
*   **Google Search Grounding:** Powered by Gemini's native `googleSearch` tool to dynamically query and find 2-3 real, currently available platforms matching the buyer's criteria.
*   **Multimodal Document Q&A:** Allows users to upload business documents (RFP briefs, pricing PDFs, text reports) and queries them instantly using Gemini's long-context inline data window.
*   **Real-Time ROI Estimator:** Translates hours wasted and hourly labor costs into localized problem cost metrics, net tool savings, and payback periods.
*   **Source Verification:** Automatically extracts live grounding sources and generates clickable, authenticated reference links to verify vendor information.
*   **Robust Backup Engine:** Gracefully falls back to a high-performance pre-trained knowledge base if live search quotas or API connections are interrupted.

---

## 🛠️ Tech Stack

### Frontend
*   **React 19** & **TypeScript** (Robust component modeling)
*   **Vite** (Next-gen frontend toolchain)
*   **Tailwind CSS 4** (Modern utility-first styling)
*   **Motion** (Premium, fluid UI micro-interactions)
*   **Lucide React** (Clean developer iconography)

### Backend
*   **Express.js** (HTTP API router and static file hosting)
*   **Node.js** with **`tsx`** (TypeScript execution environment)

### AI & LLM Engine
*   **Google Gemini 2.5 Flash**
*   **`@google/genai`** SDK (v2.4.0)
*   **Gemini Google Search Grounding** (`tools: [{ googleSearch: {} }]`)
*   **In-context Document QA** (`inlineData` Base64 parser)

---

## ⚙️ Local Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   Google Gemini API Key (obtained from Google AI Studio)

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/ShaliniCSE07/Qualifyr_SalesBot.git
    cd Qualifyr_SalesBot
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application will launch on [http://localhost:3001](http://localhost:3001).

5.  **Build for Production:**
    ```bash
    npm run build
    npm start
    ```
