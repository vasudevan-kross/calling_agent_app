# Project Specification: AI Calling Application (Outbound Context)

## 1. Executive Summary
We are building a **Next.js** (Frontend) and **FastAPI** (Backend) application that enables users to:
1.  **Search & Enrich**: Find businesses via Google Maps (Places API) and import leads from files (PDF/Excel/Word).
2.  **Call**: Initiate phone calls to these leads.
3.  **AI Voice Agent**: Use an AI agent (switching seamlessly between **Vapi.ai** and **Retell AI**) to perform "Cold Calls" with a specific user-defined purpose.
4.  **Manage**: View call logs, transcripts, and recordings in a premium dashboard.

## 2. Core Philosophy
*   **Aesthetics**: The UI must be **Premium**, using modern design principles (Glassmorphism, vibrant palettes, smooth animations). No generic Bootstrap-like looks.
*   **Flexibility**: The system uses an **Adapter Pattern** for the Voice Layer, allowing us to swap between Vapi and Retell AI via configuration.
*   **Simplicity**: The flow is streamlined for *Outbound* calling.

---

## 3. Technology Stack

### Frontend
*   **Framework**: Next.js 15 (App Router).
*   **Language**: TypeScript.
*   **Styling**: TailwindCSS (v4 if available, or v3 with best practices).
*   **Icons**: Lucide React.
*   **State Management**: React Query (TanStack Query) for async ops.

### Backend
*   **Framework**: Python FastAPI.
*   **Reasoning**: Python is superior for file parsing (Pandas/PyPDF) and handling complex adapter logic for AI providers.
*   **Database**: Supabase (PostgreSQL).

### AI & Telephony
*   **Primary Providers**: Vapi.ai / Retell AI.
*   **Switching Logic**: Implemented in Python via a `VoiceProvider` Abstract Base Class.
*   **Maps**: Google Maps Places API (New) for Autocomplete and Place Details.

---

## 4. detailed Feature Requirements

### Phase 1: Planning & Design (Completed)

### Phase 2: Project Setup
*   [x] Initialize Next.js Frontend.
*   [ ] Initialize FastAPI Backend.
*   [ ] Docker/Env configuration (optional).

### Phase 3: Search & Data Management
1.  **Google Maps Search**:
    *   User types "Dentists in New York".
    *   App fetches list from Google Places API.
    *   App displays results with Name, Address, Phone, Rating.
    *   User can "Add to Leads".
2.  **File Import**:
    *   Drag-and-drop: `.xlsx`, `.csv`, `.docx`, `.pdf`.
    *   Backend parses text/tables to extract Contact Info.
3.  **Lead Management**:
    *   Supabase Table: `leads`.
    *   Grid view of all leads.

### Phase 4: Telephony & AI Integration (The "Switch")
1.  **Direct Call**:
    *   Simple `tel:` link or browser-based click-to-dial (Phase 4b).
2.  **AI Cold Call**:
    *   **User Action**: Clicks "AI Call" button on a lead.
    *   **Configuration**: Selects/Types "Purpose" (e.g., "Inquire about X").
    *   **Backend Logic**: 
        *   Checks `ACTIVE_VOICE_PROVIDER` (Vapi or Retell).
        *   Calls `provider.start_call(to_number, prompt_context)`.
    *   **Feedback**: UI shows "Calling..." -> "In Progress" -> "Completed".
3.  **Webhooks**:
    *   Unified `POST /webhooks/voice` endpoint.
    *   Normalizes events (Call Started, Transcript, Call Ended) from both Vapi and Retell into a common format.

### Phase 5: Transcripts & History
*   Store recording URL and full transcript in Supabase (`calls` table).
*   UI: "History" tab showing timelines of calls.
*   Clicking a call expands to show the chat/voice transcript.

### Phase 6: Verification & Polish
*   Loading states (Skeletons).
*   Toast notifications for success/failure.
*   Dark Mode default.

---

## 5. Development Guidelines
*   **Strict Typing**: No `any` in TypeScript. Pydantic models in Python.
*   **Env Variables**: Never hardcode API keys. Use `.env`.
*   **Error Handling**: Graceful failures (e.g., "Could not reach Vapi, switching to backup" - optional future).

## 6. Directory Structure
```
/
├── frontend/         # Next.js
│   ├── src/components/
│   ├── src/app/
│   └── ...
├── backend/          # FastAPI
│   ├── app/
│   │   ├── adapters/ # Vapi/Retell adapters
│   │   ├── routers/
│   │   └── main.py
│   └── venv/
├── claude.md         # This file
└── README.md
```
