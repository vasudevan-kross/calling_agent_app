export interface ApiError {
  detail: string
}

export interface ImportResult {
  filename: string
  total_records: number
  successful: number
  failed: number
  skipped: number
  errors: Array<{
    data: Record<string, unknown>
    error: string
  }>
}
