import type { TransactionType } from '../../types/domain'

export const pointRule: Record<TransactionType, number> = {
  exchange: 10,
  borrow: 5,
}

export const demoAccounts = [
  { label: 'Quản trị', email: 'admin@booksharehub.com', password: 'Bookshare123!' },
  { label: 'Thành viên', email: 'hung@booksharehub.com', password: 'Bookshare123!' },
  { label: 'Người giao', email: 'lan@booksharehub.com', password: 'Bookshare123!' },
]

export const customAddressId = 'custom'
export const bookCoverBucket = 'book-covers'
export const bookCoverAspectRatio = 3 / 4
export const bookCoverMaxWidth = 900
