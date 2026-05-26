import type { DeliveryMethod, TransactionType } from '../types/domain'
import { supabase } from './supabaseClient'

export async function listTransactions() {
  return supabase.from('book_transactions').select('*').order('created_at', { ascending: false })
}

export async function createTransactionRequest({
  bookId,
  transactionType,
  deliveryMethod,
  returnDueAt,
  dropoffLocation,
}: {
  bookId: string
  transactionType: TransactionType
  deliveryMethod: DeliveryMethod
  returnDueAt: string
  dropoffLocation: string
}) {
  return supabase.rpc('create_transaction_request', {
    p_book_id: bookId,
    p_transaction_type: transactionType,
    p_delivery_method: deliveryMethod,
    p_return_due_at: transactionType === 'borrow' && returnDueAt ? new Date(returnDueAt).toISOString() : null,
    p_pickup_location: null,
    p_dropoff_location: dropoffLocation.trim() || null,
  })
}

export async function respondTransaction(transactionId: string, accept: boolean) {
  return supabase.rpc('respond_transaction', {
    p_transaction_id: transactionId,
    p_accept: accept,
    p_note: accept ? 'Chủ sách chấp nhận trên giao diện web' : 'Chủ sách từ chối trên giao diện web',
  })
}

export async function confirmTransaction(transactionId: string) {
  return supabase.rpc('confirm_transaction', {
    p_transaction_id: transactionId,
  })
}

export async function requestBookReturn({
  transactionId,
  deliveryMethod,
  pickupLocation,
}: {
  transactionId: string
  deliveryMethod: DeliveryMethod
  pickupLocation: string
}) {
  return supabase.rpc('request_book_return', {
    p_transaction_id: transactionId,
    p_delivery_method: deliveryMethod,
    p_pickup_location: deliveryMethod === 'volunteer' ? pickupLocation.trim() || null : null,
    p_dropoff_location: null,
  })
}

export async function markBookReturned(transactionId: string) {
  return supabase.rpc('mark_book_returned', {
    p_transaction_id: transactionId,
  })
}
