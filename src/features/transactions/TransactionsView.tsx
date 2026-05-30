import { useState } from 'react'
import { ArrowRightLeft, ChevronRight } from 'lucide-react'
import {
  deliveryMethodLabels,
  transactionStatusLabels,
  transactionTypeLabels,
} from '../../shared/constants/labels'
import { EmptyState, StatusPill } from '../../shared/components'
import type { Account, Book, BookTransaction, Delivery } from '../../types/domain'
import { TransactionDetailDialog } from './TransactionDetailDialog'
import './transactions.css'

type TabType = 'given' | 'borrowed'

function TransactionTable({
  transactions,
  accountMap,
  tab,
  onSelectTransaction,
}: {
  transactions: BookTransaction[]
  accountMap: Map<string, Account>
  tab: TabType
  onSelectTransaction: (id: string) => void
}) {
  if (transactions.length === 0) {
    return <EmptyState icon={ArrowRightLeft} text="Chưa có giao dịch." />
  }

  return (
    <div className="table-wrapper">
      <table className="transactions-table">
        <thead>
            <tr>
            <th>Mã giao dịch</th>
            {tab === 'given' ? (
              <th>Người mượn sách</th>
            ) : (
              <th>Chủ sở hữu</th>
            )}
            <th>Loại giao dịch</th>
            <th>Giao nhận</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const owner = accountMap.get(transaction.owner_account_id)
            const borrower = accountMap.get(transaction.borrower_account_id)
            const displayName = tab === 'given' ? borrower?.full_name : owner?.full_name

            return (
              <tr key={transaction.id} className="transaction-row">
                <td className="cell-id">
                  <code className="transaction-id">{transaction.id}</code>
                </td>
                <td className="cell-name">{displayName || (tab === 'given' ? 'Người nhận' : 'Chủ sách')}</td>
                <td className="cell-type">{transactionTypeLabels[transaction.transaction_type]}</td>
                <td className="cell-method">{deliveryMethodLabels[transaction.delivery_method]}</td>
                <td className="cell-status">
                  <StatusPill status={transaction.status}>
                    {transactionStatusLabels[transaction.status]}
                  </StatusPill>
                </td>
                <td className="cell-detail">
                  <button
                    className="detail-button"
                    onClick={() => onSelectTransaction(transaction.id)}
                    title="Xem chi tiết"
                  >
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function TransactionsView({
  account,
  transactions,
  accountMap,
  bookMap,
  deliveries,
  busyKey,
  onAccept,
  onReject,
  onConfirm,
  onRequestReturn,
  onConfirmReturn,
}: {
  account: Account | null
  transactions: BookTransaction[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  deliveries: Map<string, Delivery[]>
  busyKey: string | null
  onAccept: (transaction: BookTransaction) => void
  onReject: (transaction: BookTransaction) => void
  onConfirm: (transaction: BookTransaction) => void
  onRequestReturn: (transaction: BookTransaction) => void
  onConfirmReturn: (transaction: BookTransaction) => void
}) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('given')

  // Chia giao dịch thành hai nhóm
  const givenTransactions = transactions.filter(
    (t) => t.owner_account_id === account?.id
  )
  const borrowedTransactions = transactions.filter(
    (t) => t.borrower_account_id === account?.id
  )

  const displayTransactions = activeTab === 'given' ? givenTransactions : borrowedTransactions

  if (transactions.length === 0) {
    return <EmptyState icon={ArrowRightLeft} text="Chưa có giao dịch." />
  }

  const selectedTransaction = selectedTransactionId
    ? transactions.find((t) => t.id === selectedTransactionId)
    : null

  return (
    <>
      <section className="transactions-container">
        {/* Tabs */}
        <div className="transactions-tabs">
          <button
            className={`tab-button ${activeTab === 'given' ? 'active' : ''}`}
            onClick={() => setActiveTab('given')}
          >
            <span className="tab-label">Đơn sách cho mượn</span>
            <span className="tab-count">{givenTransactions.length}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'borrowed' ? 'active' : ''}`}
            onClick={() => setActiveTab('borrowed')}
          >
            <span className="tab-label">Đơn sách tôi mượn</span>
            <span className="tab-count">{borrowedTransactions.length}</span>
          </button>
        </div>

        {/* Table */}
        <div className="transactions-table-container">
          {displayTransactions.length === 0 ? (
            <EmptyState icon={ArrowRightLeft} text={`Chưa có ${activeTab === 'given' ? 'đơn sách cho mượn' : 'đơn sách mượn'}.`} />
          ) : (
            <TransactionTable
              transactions={displayTransactions}
              accountMap={accountMap}
              tab={activeTab}
              onSelectTransaction={setSelectedTransactionId}
            />
          )}
        </div>
      </section>

      {selectedTransaction && (
        <TransactionDetailDialog
          transaction={selectedTransaction}
          book={bookMap.get(selectedTransaction.book_id)}
          owner={accountMap.get(selectedTransaction.owner_account_id)}
          borrower={accountMap.get(selectedTransaction.borrower_account_id)}
          account={account}
          deliveries={deliveries.get(selectedTransaction.id) || []}
          accountMap={accountMap}
          busyKey={busyKey}
          onClose={() => setSelectedTransactionId(null)}
          onAccept={() => {
            onAccept(selectedTransaction)
            setSelectedTransactionId(null)
          }}
          onReject={() => {
            onReject(selectedTransaction)
            setSelectedTransactionId(null)
          }}
          onConfirm={() => {
            onConfirm(selectedTransaction)
            setSelectedTransactionId(null)
          }}
          onRequestReturn={() => {
            onRequestReturn(selectedTransaction)
            setSelectedTransactionId(null)
          }}
          onConfirmReturn={() => {
            onConfirmReturn(selectedTransaction)
            setSelectedTransactionId(null)
          }}
        />
      )}
    </>
  )
}
