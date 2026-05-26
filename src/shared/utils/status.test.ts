import { describe, expect, it } from 'vitest'
import { getDeliveryParticipantBlockReason, statusTone } from './status'
import type { BookTransaction } from '../../types/domain'

const transaction: BookTransaction = {
  id: 'transaction-1',
  book_id: 'book-1',
  owner_account_id: 'owner-1',
  borrower_account_id: 'borrower-1',
  transaction_type: 'borrow',
  delivery_method: 'volunteer',
  status: 'requested',
  pickup_location: null,
  dropoff_location: null,
  borrow_date: null,
  return_due_at: null,
  actual_return_date_at: null,
  owner_confirmed_at: null,
  borrower_confirmed_at: null,
  points_applied_at: null,
  created_at: '',
  updated_at: '',
}

describe('status utilities', () => {
  it('maps known statuses to visual tones', () => {
    expect(statusTone('available')).toBe('good')
    expect(statusTone('requested')).toBe('waiting')
    expect(statusTone('hidden')).toBe('muted')
  })

  it('blocks transaction participants from taking delivery jobs', () => {
    expect(getDeliveryParticipantBlockReason(transaction, 'owner-1')).toBeTruthy()
    expect(getDeliveryParticipantBlockReason(transaction, 'volunteer-1')).toBeNull()
  })
})
