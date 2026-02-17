export type AgentCategory = 'inquiry' | 'booking' | 'order_status' | 'support' | 'follow_up' | 'sales' | 'general'
export type AgentLanguage = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu' | 'es' | 'fr' | 'ar'

export interface Agent {
  id: string
  vapi_assistant_id: string
  name: string
  category: AgentCategory
  language: AgentLanguage
  system_prompt: string
  first_message: string
  description?: string
  created_at: string
  updated_at: string
}

export interface AgentVoice {
  provider: string
  voiceId: string
}

export interface AgentTranscriber {
  provider: string
  language: string
  model?: string
}

export interface AgentModel {
  provider: string
  model: string
}

export interface AgentCreate {
  name: string
  category: AgentCategory
  language: AgentLanguage
  system_prompt: string
  first_message: string
  description?: string
  /** User-selected voice — if omitted the API falls back to the language default */
  voice?: AgentVoice
  /** User-selected transcriber — if omitted the API falls back to the language default */
  transcriber?: AgentTranscriber
  /** User-selected LLM — if omitted the API falls back to gemini-2.0-flash-lite */
  llm?: AgentModel
}
