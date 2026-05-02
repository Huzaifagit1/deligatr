export interface Pdf {
  id: string
  name: string
  storage_path: string
  tracking_id: string
  campaign_name: string | null
  created_at: string
  open_count?: number
  human_count?: number
  bot_count?: number
}

export interface TrackingEvent {
  id: string
  tracking_id: string
  pdf_name: string
  campaign_name: string | null
  opened_at: string
  ip: string | null
  city: string | null
  country: string | null
  device: string | null
  browser: string | null
  os: string | null
  screen_width: number | null
  screen_height: number | null
  timezone: string | null
  language: string | null
  is_bot: boolean
  event_file_path: string | null
}

export interface TrackPayload {
  trackingId: string
  userAgent: string
  screenWidth: number
  screenHeight: number
  timezone: string
  language: string
  cookieEnabled: boolean
  canvasPassed: boolean
  platform: string
}

export interface EventJson {
  event_id: string
  tracking_id: string
  pdf_name: string
  campaign_name: string | null
  opened_at: string
  ip: string | null
  location: {
    city: string | null
    country: string | null
  }
  device: {
    user_agent: string
    browser: string | null
    os: string | null
    platform: string
    screen_width: number
    screen_height: number
  }
  browser_signals: {
    timezone: string
    language: string
    cookie_enabled: boolean
    canvas_passed: boolean
  }
  is_bot: boolean
}
