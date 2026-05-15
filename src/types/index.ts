export type UserRole = 'shipper' | 'carrier' | 'broker'

export type OrderType = 'grain' | 'machinery' | 'general'

export type OrderStatus =
  | 'draft'
  | 'published'
  | 'quoted'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'

export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export type TripStatus = 'scheduled' | 'in_transit' | 'delivered' | 'disputed'

export type KycStatus =
  | 'not_started'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'expired'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  cuit?: string
  rating_avg: number
  rating_count: number
  trips_completed: number
  has_basic_info: boolean
  has_kyc_approved: boolean
  has_payment_method: boolean
  has_profile_photo: boolean
  has_phone_verified: boolean
  has_vehicle: boolean
  has_zone: boolean
  onboarding_completed_at?: string
  created_at: string
}

export interface Order {
  id: string
  shipper_id: string
  order_type: OrderType
  status: OrderStatus
  origin_address: string
  origin_lat: number
  origin_lng: number
  destination_address: string
  destination_lat: number
  destination_lng: number
  pickup_date: string
  delivery_date?: string
  estimated_km?: number
  notes?: string
  created_at: string
}

export interface Quote {
  id: string
  order_id: string
  vehicle_id: string
  fix_price?: number
  price_per_km?: number
  total_price: number
  currency: string
  status: QuoteStatus
  created_at: string
  responded_at?: string
}

export interface Trip {
  id: string
  order_id: string
  quote_id: string
  vehicle_id: string
  driver_id?: string
  status: TripStatus
  proof_url?: string
  started_at?: string
  delivered_at?: string
  created_at: string
}

export interface Vehicle {
  id: string
  owner_id: string
  plate: string
  type: string
  max_weight_ton: number
  volume_m3?: number
  is_available: boolean
  has_gps: boolean
  created_at: string
}
