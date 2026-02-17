-- AI Calling Application Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    google_place_id VARCHAR(255),
    source VARCHAR(50) DEFAULT 'manual',
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for leads table
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_google_place_id ON public.leads(google_place_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- =====================================================
-- CALLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    provider_call_id VARCHAR(255),
    direction VARCHAR(20) DEFAULT 'outbound',
    status VARCHAR(50) DEFAULT 'initiated',
    purpose TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    transcript JSONB DEFAULT '[]'::jsonb,
    recording_url TEXT,
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    cost DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for calls table
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON public.calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_provider ON public.calls(provider);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_provider_call_id ON public.calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for leads table
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for calls table
DROP TRIGGER IF EXISTS update_calls_updated_at ON public.calls;
CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON public.calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AGENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vapi_assistant_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    system_prompt TEXT NOT NULL,
    first_message TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_category ON public.agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON public.agents(created_at);

DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS (optional - uncomment if you want to use Supabase auth)
-- ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create policies (example - adjust based on your auth needs)
-- CREATE POLICY "Enable all access for authenticated users" ON public.leads
--     FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable all access for authenticated users" ON public.calls
--     FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment to insert sample lead
/*
INSERT INTO public.leads (name, business_name, phone, email, address, city, state, country, source, status)
VALUES
    ('John Doe', 'Doe Dental Clinic', '+1234567890', 'john@doedental.com', '123 Main St', 'New York', 'NY', 'USA', 'manual', 'active');
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify tables were created successfully
-- SELECT * FROM public.leads LIMIT 5;
-- SELECT * FROM public.calls LIMIT 5;
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
