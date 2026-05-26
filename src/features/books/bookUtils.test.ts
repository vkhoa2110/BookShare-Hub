import { describe, expect, it } from 'vitest'
import { filterBooks } from './bookUtils'
import type { Account, Book } from '../../types/domain'

const account: Account = {
  id: 'user-1',
  full_name: 'Hung',
  phone_number: null,
  email_address: 'hung@example.com',
  points: 20,
  status: true,
  role: 'member',
  created_at: '',
  updated_at: '',
}

const books: Book[] = [
  {
    id: 'book-1',
    owner_account_id: 'user-1',
    title: 'Clean Code',
    category: 'Kỹ năng',
    author: 'Robert Martin',
    publication_year: 2008,
    condition: 'good',
    pickup_location: 'CLB sách',
    cover_image_url: null,
    status: 'hidden',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'book-2',
    owner_account_id: 'user-2',
    title: 'Dế Mèn Phiêu Lưu Ký',
    category: 'Văn học',
    author: 'Tô Hoài',
    publication_year: 1941,
    condition: 'used',
    pickup_location: 'Thư viện',
    cover_image_url: null,
    status: 'available',
    created_at: '',
    updated_at: '',
  },
]

describe('filterBooks', () => {
  it('keeps hidden books visible for their owner only', () => {
    expect(
      filterBooks({
        books,
        account,
        searchTerm: '',
        categoryFilter: 'all',
        statusFilter: 'all',
        ownershipFilter: 'all',
      }).map((book) => book.id),
    ).toEqual(['book-1', 'book-2'])

    expect(
      filterBooks({
        books,
        account: null,
        searchTerm: '',
        categoryFilter: 'all',
        statusFilter: 'all',
        ownershipFilter: 'all',
      }).map((book) => book.id),
    ).toEqual(['book-2'])
  })

  it('filters by search, category, status, and ownership', () => {
    expect(
      filterBooks({
        books,
        account,
        searchTerm: 'dế mèn',
        categoryFilter: 'Văn học',
        statusFilter: 'available',
        ownershipFilter: 'available',
      }).map((book) => book.id),
    ).toEqual(['book-2'])
  })
})
