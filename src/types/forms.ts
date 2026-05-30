import type { BookCondition, DeliveryMethod, TransactionType } from './domain'

export type View =
  | 'dashboard'
  | 'books'
  | 'transactions'
  | 'deliveries'
  | 'complaints'
  | 'profile'
  | 'profile-info'
  | 'profile-addresses'
  | 'profile-books'
  | 'profile-points'
  | 'profile-history'
  | 'admin'
export type Notice = { type: 'success' | 'error' | 'info'; text: string } | null
export type AuthMode = 'signin' | 'signup'
export type OwnershipFilter = 'all' | 'available' | 'mine'

export type AddressForm = {
  label: string
  address_text: string
  is_default: boolean
}

export type BookForm = {
  title: string
  category: string
  author: string
  publication_year: string
  condition: BookCondition
  address_id: string
  pickup_location: string
  cover_image_url: string | null
  cover_file: File | null
}

export type RequestForm = {
  transaction_type: TransactionType
  delivery_method: DeliveryMethod
  return_due_at: string
  address_id: string
  pickup_location: string
  dropoff_location: string
}

export type ReturnForm = {
  delivery_method: DeliveryMethod
  address_id: string
  pickup_location: string
  dropoff_location: string
}

export type ComplaintForm = {
  transaction_id: string
  reported_account_id: string
  complaint_details: string
}

export type ProfileForm = {
  full_name: string
  phone_number: string
}

export type AuthForm = {
  full_name: string
  phone_number: string
  email: string
  password: string
}
