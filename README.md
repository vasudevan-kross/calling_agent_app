# AI Calling Application

A full-stack application for AI-powered cold calling with lead management, built with Next.js 15 and FastAPI.

## Features

- **Lead Management**: Import and manage business contacts from Google Maps or files (PDF/Excel/Word)
- **AI Cold Calling**: Initiate AI-powered calls using Vapi.ai or Retell AI
- **Provider Flexibility**: Seamlessly switch between voice providers using the adapter pattern
- **Call History**: View transcripts, recordings, and call analytics
- **Premium UI**: Modern glassmorphism design with dark mode

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: TailwindCSS with glassmorphism
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Framework**: FastAPI (Python)
- **Validation**: Pydantic v2
- **Database**: Supabase (PostgreSQL)
- **Voice Providers**: Vapi.ai / Retell AI (Adapter Pattern)
- **Maps**: Google Places API (New)

## Project Structure

```
calling_app/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and API client
│   │   ├── types/           # TypeScript definitions
│   │   └── styles/          # Global styles
│   └── package.json
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── adapters/        # Voice provider adapters
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # Pydantic models
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Supabase connection
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── .env
│
├── claude.md                 # Project specification
└── README.md                 # This file
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Supabase account
- Vapi.ai or Retell AI account
- Google Maps API key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment** (if not already created):
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in your API keys:
     - Supabase credentials
     - Voice provider keys (Vapi or Retell)
     - Google Maps API key

6. **Create Supabase tables**:
   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Leads table
   CREATE TABLE leads (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR(255) NOT NULL,
       business_name VARCHAR(255),
       phone VARCHAR(50) NOT NULL,
       email VARCHAR(255),
       address TEXT,
       city VARCHAR(100),
       state VARCHAR(100),
       country VARCHAR(100),
       postal_code VARCHAR(20),
       rating DECIMAL(2,1),
       google_place_id VARCHAR(255),
       source VARCHAR(50) DEFAULT 'manual',
       metadata JSONB,
       tags TEXT[],
       notes TEXT,
       status VARCHAR(50) DEFAULT 'active',
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Calls table
   CREATE TABLE calls (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
       provider VARCHAR(20) NOT NULL,
       provider_call_id VARCHAR(255),
       direction VARCHAR(20) DEFAULT 'outbound',
       status VARCHAR(50) DEFAULT 'initiated',
       purpose TEXT,
       start_time TIMESTAMP WITH TIME ZONE,
       end_time TIMESTAMP WITH TIME ZONE,
       duration_seconds INTEGER,
       transcript JSONB,
       recording_url TEXT,
       summary TEXT,
       metadata JSONB,
       cost DECIMAL(10,4),
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Indexes for performance
   CREATE INDEX idx_leads_phone ON leads(phone);
   CREATE INDEX idx_leads_status ON leads(status);
   CREATE INDEX idx_calls_lead_id ON calls(lead_id);
   CREATE INDEX idx_calls_status ON calls(status);
   ```

7. **Start the backend server**:
   ```bash
   python -m app.main
   ```

   The API will be available at `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/health`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env.local`
   - Set `NEXT_PUBLIC_API_URL=http://localhost:8000`
   - Add Supabase credentials if using Supabase directly from frontend

4. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Voice Provider Configuration

### Using Vapi.ai
1. Set in `.env`:
   ```
   ACTIVE_VOICE_PROVIDER=vapi
   VAPI_API_KEY=your_key
   VAPI_PHONE_NUMBER=your_phone_number_id
   ```

### Using Retell AI
1. Set in `.env`:
   ```
   ACTIVE_VOICE_PROVIDER=retell
   RETELL_API_KEY=your_key
   RETELL_AGENT_ID=your_agent_id
   ```

### Switching Providers
Simply change the `ACTIVE_VOICE_PROVIDER` value and restart the backend. The adapter pattern handles the rest!

## Development Status

### ✅ Completed
- Project structure and configuration
- Backend core architecture (FastAPI, Pydantic, Supabase)
- Voice provider adapter pattern (Vapi + Retell)
- Frontend foundation (Next.js, TailwindCSS, TypeScript)
- Environment configuration
- Database schema design

### 🚧 In Progress / To Do
- API routers (leads, calls, search, webhooks)
- Service layer (business logic)
- File parser service (PDF/Excel/Word)
- Frontend TypeScript types
- API client layer
- React Query hooks
- UI components (glassmorphism design)
- Feature pages (Dashboard, Leads, Search, History)

## API Endpoints (Planned)

### Leads
- `GET /api/leads` - List leads with filtering
- `GET /api/leads/{id}` - Get lead details
- `POST /api/leads` - Create lead
- `PUT /api/leads/{id}` - Update lead
- `DELETE /api/leads/{id}` - Delete lead

### Calls
- `POST /api/calls/initiate` - Start AI call
- `GET /api/calls/{id}` - Get call details
- `GET /api/calls/lead/{lead_id}` - Get lead's call history
- `POST /api/calls/{id}/end` - End active call

### Search
- `GET /api/search/places` - Search Google Maps
- `GET /api/search/places/{place_id}` - Get place details

### Import
- `POST /api/import/file` - Import leads from file

### Webhooks
- `POST /webhooks/voice` - Unified webhook endpoint
- `POST /webhooks/vapi` - Vapi-specific webhook
- `POST /webhooks/retell` - Retell-specific webhook

## Architecture Highlights

### Adapter Pattern
The voice provider adapter pattern (`backend/app/adapters/`) allows:
- Seamless switching between providers
- Unified interface for all voice operations
- Easy addition of new providers
- Provider-specific optimizations

### Type Safety
- Frontend: Strict TypeScript (no `any` types)
- Backend: Pydantic validation on all models
- Shared data contracts between FE/BE

### Premium UI Design
- Glassmorphism effects
- Dark mode by default
- Smooth animations
- Modern gradient text
- Responsive design

## Contributing

This is a private project. Please refer to the project specification in `claude.md` for detailed requirements and guidelines.

## License

Proprietary - All rights reserved

## Support

For issues or questions, please refer to the project documentation or contact the development team.
