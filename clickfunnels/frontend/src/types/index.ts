// User Types
export enum SubscriptionTier {
  Free = 'Free',
  Basic = 'Basic',
  Pro = 'Pro',
  Enterprise = 'Enterprise',
}

export enum UserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
  PendingVerification = 'PendingVerification',
}

export interface User {
  id: string
  email: string
  name: string
  subscription_tier: SubscriptionTier
  status: UserStatus
  email_verified: boolean
  email_verified_at: string | null
  last_login_at: string | null
  funnel_count: number
  page_count: number
  created_at: string
  updated_at: string
}

// Funnel Types
export enum FunnelType {
  Sales = 'Sales',
  LeadGeneration = 'LeadGeneration',
  Webinar = 'Webinar',
  Product = 'Product',
  Membership = 'Membership',
  Event = 'Event',
  Custom = 'Custom',
}

export enum Status {
  Draft = 'Draft',
  Published = 'Published',
  Archived = 'Archived',
}

export interface Funnel {
  id: string
  user_id: string
  name: string
  description: string | null
  slug: string
  funnel_type: FunnelType
  status: Status
  custom_domain: string | null
  ga_tracking_id: string | null
  fb_pixel_id: string | null
  smtp_integration_id: string | null
  payment_integration_id: string | null
  total_visits: number
  unique_visits: number
  total_conversions: number
  conversion_rate: number
  total_revenue: number
  pages_count: number
  published_at: string | null
  created_at: string
  updated_at: string
}

// Page Types
export enum PageType {
  Landing = 'Landing',
  Sales = 'Sales',
  Checkout = 'Checkout',
  Upsell = 'Upsell',
  Downsell = 'Downsell',
  ThankYou = 'ThankYou',
  Webinar = 'Webinar',
  Membership = 'Membership',
  Custom = 'Custom',
}

export interface Page {
  id: string
  funnel_id: string
  user_id: string
  name: string
  title: string
  slug: string
  page_type: PageType
  status: Status
  order_index: number
  total_visits: number
  unique_visits: number
  total_conversions: number
  conversion_rate: number
  is_ab_test_variant: boolean
  ab_test_group_id: string | null
  ab_test_weight: number
  published_at: string | null
  published_url: string | null
  created_at: string
  updated_at: string
}

export interface DetailedPage extends Page {
  html_content: string | null
  css_content: string | null
  js_content: string | null
  settings: Record<string, any> | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  og_title: string | null
  og_description: string | null
  og_image: string | null
}

// Request Types
export interface CreateFunnelRequest {
  name: string
  description?: string
  funnel_type: FunnelType
  slug: string
  custom_domain?: string
}

export interface UpdateFunnelRequest {
  name?: string
  description?: string
  funnel_type?: FunnelType
  status?: Status
  custom_domain?: string
  ga_tracking_id?: string
  fb_pixel_id?: string
  smtp_integration_id?: string
  payment_integration_id?: string
  settings?: Record<string, any>
  seo_metadata?: Record<string, any>
}

// Response Types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FunnelStats {
  funnel_id: string
  total_visits: number
  unique_visits: number
  total_conversions: number
  conversion_rate: number
  total_revenue: number
  currency: string
  pages_count: number
}
