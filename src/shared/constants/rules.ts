import type { TransactionType } from '../../types/domain'

export const pointRule: Record<TransactionType, number> = {
  exchange: 10,
  borrow: 5,
}

export const customAddressId = 'custom'
export const bookCoverBucket = 'book-covers'
export const bookCoverAspectRatio = 3 / 4
export const bookCoverMaxWidth = 900
