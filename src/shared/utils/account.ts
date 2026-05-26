import type { BookTransaction } from '../../types/domain'

export function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function accountsFromTransactions(transactions: BookTransaction[], currentAccountId?: string) {
  return Array.from(
    new Set(
      transactions.flatMap((transaction) => [transaction.owner_account_id, transaction.borrower_account_id]),
    ),
  ).filter((id) => id !== currentAccountId)
}
