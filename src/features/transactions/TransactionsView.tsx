import { useState } from 'react'
import { ArrowRightLeft, ChevronRight, Search } from 'lucide-react'
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

  // Bộ lọc của Admin
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const isAdmin = account?.role === 'admin'

  const givenTransactions = transactions.filter(
    (t) => t.owner_account_id === account?.id
  )
  const borrowedTransactions = transactions.filter(
    (t) => t.borrower_account_id === account?.id
  )

  // Tìm kiếm & lọc cho Admin
  const adminFilteredTransactions = transactions.filter((t) => {
    if (!isAdmin) return false

    const ownerName = accountMap.get(t.owner_account_id)?.full_name || ''
    const borrowerName = accountMap.get(t.borrower_account_id)?.full_name || ''
    const bookTitle = bookMap.get(t.book_id)?.title || ''

    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookTitle.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || t.transaction_type === typeFilter
    const matchesMethod = methodFilter === 'all' || t.delivery_method === methodFilter
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter

    return matchesSearch && matchesType && matchesMethod && matchesStatus
  })

  // Tìm kiếm & lọc cho Thành viên
  const memberFilteredTransactions = (activeTab === 'given' ? givenTransactions : borrowedTransactions).filter((t) => {
    if (isAdmin) return false

    const ownerName = accountMap.get(t.owner_account_id)?.full_name || ''
    const borrowerName = accountMap.get(t.borrower_account_id)?.full_name || ''
    const bookTitle = bookMap.get(t.book_id)?.title || ''

    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookTitle.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || t.transaction_type === typeFilter
    const matchesMethod = methodFilter === 'all' || t.delivery_method === methodFilter
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter

    return matchesSearch && matchesType && matchesMethod && matchesStatus
  })

  if (transactions.length === 0) {
    return <EmptyState icon={ArrowRightLeft} text="Chưa có giao dịch." />
  }

  const selectedTransaction = selectedTransactionId
    ? transactions.find((t) => t.id === selectedTransactionId)
    : null

  return (
    <>
      <section className="transactions-container">
        {isAdmin ? (
          /* PHẦN HIỂN THỊ CỦA ADMIN */
          <>
            {/* Bộ lọc & Tìm kiếm Admin */}
            <div className="admin-filters-bar">
              <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã GD, Tên chủ sách, Tên người mượn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              <div className="filters-group">
                <div className="filter-item">
                  <label>Loại GD:</label>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="borrow">Mượn sách</option>
                    <option value="exchange">Trao đổi</option>
                  </select>
                </div>

                <div className="filter-item">
                  <label>Giao nhận:</label>
                  <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="self_pickup">Tự giao nhận</option>
                    <option value="volunteer">Nhờ người giao</option>
                  </select>
                </div>

                <div className="filter-item">
                  <label>Trạng thái:</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="requested">Chờ duyệt</option>
                    <option value="accepted">Đã chấp nhận</option>
                    <option value="delivered">Chờ nhận</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="return_requested">Chờ hoàn trả</option>
                    <option value="returned">Đã trả sách</option>
                    <option value="rejected">Đã từ chối</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bảng giao dịch của Admin hiển thị đầy đủ thông tin yêu cầu */}
            <div className="transactions-table-container">
              {adminFilteredTransactions.length === 0 ? (
                <EmptyState icon={ArrowRightLeft} text="Không tìm thấy giao dịch nào khớp với bộ lọc tìm kiếm." />
              ) : (
                <div className="table-wrapper">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Mã giao dịch</th>
                        <th>Chủ sở hữu (Chủ sách)</th>
                        <th>Người nhận (Người mượn)</th>
                        <th>Loại giao dịch</th>
                        <th>Giao nhận</th>
                        <th>Trạng thái</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminFilteredTransactions.map((transaction) => {
                        const owner = accountMap.get(transaction.owner_account_id)
                        const borrower = accountMap.get(transaction.borrower_account_id)

                        return (
                          <tr key={transaction.id} className="transaction-row">
                            <td className="cell-id">
                              <code className="transaction-id">{transaction.id}</code>
                            </td>
                            <td className="cell-name">{owner?.full_name || 'Chủ sách'}</td>
                            <td className="cell-name">{borrower?.full_name || 'Người nhận'}</td>
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
                                onClick={() => setSelectedTransactionId(transaction.id)}
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
              )}
            </div>
          </>
        ) : (
          /* PHẦN HIỂN THỊ CỦA THÀNH VIÊN THƯỜNG */
          <>
            <div className="transactions-tabs">
              <button
                className={`tab-button ${activeTab === 'given' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('given')
                  // Reset search & filters khi đổi tab để trải nghiệm mượt mà
                  setSearchTerm('')
                  setTypeFilter('all')
                  setMethodFilter('all')
                  setStatusFilter('all')
                }}
              >
                <span className="tab-label">Đơn sách cho mượn</span>
                <span className="tab-count">{givenTransactions.length}</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'borrowed' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('borrowed')
                  // Reset search & filters khi đổi tab để trải nghiệm mượt mà
                  setSearchTerm('')
                  setTypeFilter('all')
                  setMethodFilter('all')
                  setStatusFilter('all')
                }}
              >
                <span className="tab-label">Đơn sách tôi mượn</span>
                <span className="tab-count">{borrowedTransactions.length}</span>
              </button>
            </div>

            {/* Bộ lọc tìm kiếm cho Thành viên (dưới thanh Tabs) */}
            <div className="admin-filters-bar" style={{ marginTop: '1rem' }}>
              <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã GD, Tên đối tác, Tên sách..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              <div className="filters-group">
                <div className="filter-item">
                  <label>Loại GD:</label>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="borrow">Mượn sách</option>
                    <option value="exchange">Trao đổi</option>
                  </select>
                </div>

                <div className="filter-item">
                  <label>Giao nhận:</label>
                  <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="self_pickup">Tự giao nhận</option>
                    <option value="volunteer">Nhờ người giao</option>
                  </select>
                </div>

                <div className="filter-item">
                  <label>Trạng thái:</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="requested">Chờ duyệt</option>
                    <option value="accepted">Đã chấp nhận</option>
                    <option value="delivered">Chờ nhận</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="return_requested">Chờ hoàn trả</option>
                    <option value="returned">Đã trả sách</option>
                    <option value="rejected">Đã từ chối</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="transactions-table-container">
              {memberFilteredTransactions.length === 0 ? (
                <EmptyState icon={ArrowRightLeft} text="Không tìm thấy giao dịch nào khớp với bộ lọc tìm kiếm." />
              ) : (
                <TransactionTable
                  transactions={memberFilteredTransactions}
                  accountMap={accountMap}
                  tab={activeTab}
                  onSelectTransaction={setSelectedTransactionId}
                />
              )}
            </div>
          </>
        )}
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
