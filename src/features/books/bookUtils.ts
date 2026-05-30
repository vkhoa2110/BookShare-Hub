import type { Account, Book } from '../../types/domain'
import type { OwnershipFilter } from '../../types/forms'

export function normalizeBookSearchText(value: string | number | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

export function filterBooks({
  books,
  account,
  searchTerm,
  categoryFilter,
  statusFilter,
  ownershipFilter,
}: {
  books: Book[]
  account: Account | null
  searchTerm: string
  categoryFilter: string
  statusFilter: string
  ownershipFilter: OwnershipFilter
}) {
  const normalizedSearch = normalizeBookSearchText(searchTerm.trim())

  return books.filter((book) => {
    const isVisible = book.status !== 'hidden' || book.owner_account_id === account?.id
    const matchSearch =
      !normalizedSearch ||
      [book.title, book.author, book.category, book.pickup_location, book.publication_year].some((value) =>
        normalizeBookSearchText(value).includes(normalizedSearch),
      )
    const matchCategory = categoryFilter === 'all' || book.category === categoryFilter
    const matchStatus = statusFilter === 'all' || book.status === statusFilter
    const matchOwnership =
      ownershipFilter === 'all' ||
      (ownershipFilter === 'available' && book.status === 'available') ||
      (ownershipFilter === 'mine' && book.owner_account_id === account?.id)

    return isVisible && matchSearch && matchCategory && matchStatus && matchOwnership
  })
}
