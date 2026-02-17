# Quick Start Guide

## 🚀 Running the Application

### Option 1: Using Batch Files (Recommended)

Simply **double-click** on:
- `start-app.bat` - Starts both frontend and backend
- `stop-app.bat` - Stops all servers

### Option 2: Manual Start

#### Start Backend:
```bash
cd backend
python -m app.main
```

#### Start Frontend:
```bash
cd frontend
npm run dev
```

---

## 📍 Access Points

Once running, access the application at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## ⚙️ First Time Setup

### 1. Configure Backend Environment
Edit `backend/.env` and add your API keys:

```env
# Required
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_key

# Choose one voice provider
ACTIVE_VOICE_PROVIDER=vapi  # or 'retell'

# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key
VAPI_PHONE_NUMBER=your_vapi_phone_number_id

# OR Retell Configuration
RETELL_API_KEY=your_retell_api_key
RETELL_AGENT_ID=your_retell_agent_id

# Optional but recommended
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 2. Create Database Tables

Run this SQL in your Supabase SQL Editor:

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

### 3. Configure Frontend (Optional)
Edit `frontend/.env.local` if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🎯 Using the Application

### 1. Dashboard
- View stats and recent activity
- Quick access to all features

### 2. Manage Leads
- **Manual**: Click "Add Lead" button
- **Google Maps**: Go to Search page, find businesses
- **Import**: Upload Excel/CSV/PDF/Word files

### 3. Make AI Calls
1. Navigate to Leads page
2. Click "AI Call" on any lead
3. Enter call purpose
4. Click "Start Call"
5. View progress in Call History

### 4. Search Businesses
1. Go to Search page
2. Enter query (e.g., "Dentists in New York")
3. Click results to add as leads

### 5. Import Leads
1. Go to Import page
2. Drag & drop or select file
3. Click "Upload"
4. View imported leads in Leads page

---

## 🔧 Troubleshooting

### Backend won't start
- Check Python is installed: `python --version`
- Verify virtual environment is activated
- Check if port 8000 is available

### Frontend won't start
- Check Node.js is installed: `node --version`
- Run `npm install` in frontend folder
- Check if port 3000 is available

### Database errors
- Verify Supabase credentials in `.env`
- Ensure tables are created
- Check Supabase project is active

### API calls failing
- Verify API keys are correct
- Check backend is running
- Review logs in terminal

---

## 📚 Additional Resources

- Full documentation: See `README.md`
- API documentation: http://localhost:8000/docs
- Project specification: See `claude.md`

---

## 🆘 Getting Help

If you encounter issues:
1. Check the terminal logs for errors
2. Verify all environment variables are set
3. Ensure database tables are created
4. Check API keys are valid

---

**Happy Calling!** 🎉
