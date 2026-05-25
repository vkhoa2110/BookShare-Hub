export type AccountRole = 'member' | 'volunteer' | 'admin'
export type BookCondition = 'new' | 'good' | 'used' | 'worn'
export type BookStatus =
  | 'available'
  | 'negotiating'
  | 'exchanged'
  | 'borrowed'
  | 'returned'
  | 'hidden'
export type TransactionType = 'exchange' | 'borrow'
export type DeliveryMethod = 'self_pickup' | 'volunteer'
export type TransactionStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'delivered'
  | 'completed'
  | 'return_requested'
  | 'returned'
export type DeliveryStatus = 'open' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled'
export type DeliveryType = 'outbound' | 'return'
export type ComplaintStatus = 'open' | 'reviewing' | 'resolved' | 'rejected'

export type Account = {
  id: string
  full_name: string
  phone_number: string | null
  email_address: string
  points: number
  status: boolean
  role: AccountRole
  created_at: string
  updated_at: string
}

export type AccountAddress = {
  id: string
  account_id: string
  label: string
  address_text: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type Book = {
  id: string
  owner_account_id: string
  title: string
  category: string
  author: string
  publication_year: number | null
  condition: BookCondition
  pickup_location: string
  cover_image_url: string | null
  status: BookStatus
  created_at: string
  updated_at: string
}

export type BookTransaction = {
  id: string
  book_id: string
  owner_account_id: string
  borrower_account_id: string
  transaction_type: TransactionType
  delivery_method: DeliveryMethod
  status: TransactionStatus
  pickup_location: string | null
  dropoff_location: string | null
  borrow_date: string | null
  return_due_at: string | null
  actual_return_date_at: string | null
  owner_confirmed_at: string | null
  borrower_confirmed_at: string | null
  points_applied_at: string | null
  created_at: string
  updated_at: string
}

export type TransactionHistory = {
  id: string
  transaction_id: string
  status_updated_to: TransactionStatus | string
  updated_by_account_id: string | null
  updated_at: string
  note: string | null
}

export type Delivery = {
  id: string
  transaction_id: string
  delivery_type: DeliveryType
  volunteer_account_id: string | null
  accepted_at: string | null
  delivered_at: string | null
  pickup_location: string
  dropoff_location: string
  status: DeliveryStatus
  points_applied_at: string | null
  created_at: string
  updated_at: string
}

export type Complaint = {
  id: string
  transaction_id: string | null
  complainant_account_id: string
  reported_account_id: string | null
  handled_by_account_id: string | null
  complaint_details: string
  status: ComplaintStatus
  outcome: string | null
  created_at: string
  updated_at: string
}

export type PointLedger = {
  id: string
  account_id: string
  transaction_id: string | null
  delivery_id: string | null
  delta: number
  balance_after: number
  reason: string
  created_at: string
}
