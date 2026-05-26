import {
  getAccount,
  listAccounts,
  listAddresses,
  listPointLedger,
  listTransactionHistory,
} from '../services/accountService'
import { listBooks } from '../services/bookService'
import { listComplaints } from '../services/complaintService'
import { listDeliveries } from '../services/deliveryService'
import { listTransactions } from '../services/transactionService'
import type {
  Account,
  AccountAddress,
  Book,
  BookTransaction,
  Complaint,
  Delivery,
  PointLedger,
  TransactionHistory,
} from '../types/domain'

export async function loadApplicationData(userId: string) {
  const [
    accountResult,
    accountsResult,
    addressesResult,
    booksResult,
    transactionsResult,
    deliveriesResult,
    complaintsResult,
    ledgerResult,
    historyResult,
  ] = await Promise.all([
    getAccount(userId),
    listAccounts(),
    listAddresses(userId),
    listBooks(),
    listTransactions(),
    listDeliveries(),
    listComplaints(),
    listPointLedger(),
    listTransactionHistory(),
  ])

  const results = [
    accountResult,
    accountsResult,
    addressesResult,
    booksResult,
    transactionsResult,
    deliveriesResult,
    complaintsResult,
    ledgerResult,
    historyResult,
  ]
  const firstError = results.find((result) => result.error)?.error

  if (firstError) {
    throw firstError
  }

  return {
    account: accountResult.data as Account,
    accounts: (accountsResult.data || []) as Account[],
    addresses: (addressesResult.data || []) as AccountAddress[],
    books: (booksResult.data || []) as Book[],
    transactions: (transactionsResult.data || []) as BookTransaction[],
    deliveries: (deliveriesResult.data || []) as Delivery[],
    complaints: (complaintsResult.data || []) as Complaint[],
    ledger: (ledgerResult.data || []) as PointLedger[],
    history: (historyResult.data || []) as TransactionHistory[],
  }
}
