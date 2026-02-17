export interface TranscriptMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CallLead {
  id: string
  name: string
  phone: string
  business_name?: string
  email?: string
}

export interface Call {
  id: string
  lead_id: string
  leads?: CallLead   // nested join from Supabase
  provider: 'vapi' | 'retell'
  provider_call_id?: string
  direction: 'outbound' | 'inbound'
  status: 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'ended'
  purpose?: string
  start_time?: string
  end_time?: string
  duration_seconds?: number
  transcript?: Array<{ role: string; content: string; timestamp?: string }>
  recording_url?: string
  summary?: string
  metadata?: Record<string, unknown>
  cost?: number
  created_at: string
  updated_at: string
}

export interface CallInitiate {
  lead_id: string
  purpose: string
  metadata?: Record<string, unknown>
}

export interface CallResponse {
  id: string
  call_id: string
  status: string
  provider: string
  message?: string
}
