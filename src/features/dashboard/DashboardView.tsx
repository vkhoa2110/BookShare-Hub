import {
  ArrowRightLeft,
  BookOpen,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  History,
  Truck,
} from 'lucide-react'
import {
  deliveryStatusLabels,
  transactionStatusLabels,
  transactionTypeLabels,
} from '../../shared/constants/labels'
import { BookLine, EmptyState, LedgerLine, PanelHeader, StatCard, StatusPill } from '../../shared/components'
import { getTransactionActionText } from '../../shared/utils/status'
import type { Account, Book, BookTransaction, Delivery, PointLedger } from '../../types/domain'
import type { View } from '../../types/forms'

export function DashboardView({
  account,
  books,
  transactions,
  deliveries,
  ledger,
  accountMap,
  bookMap,
  setActiveView,
}: {
  account: Account | null
  books: Book[]
  transactions: BookTransaction[]
  deliveries: Delivery[]
  ledger: PointLedger[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  setActiveView: (view: View) => void
}) {
  const ownedBooks = books.filter((book) => book.owner_account_id === account?.id)
  const availableBooks = books.filter((book) => book.status === 'available')
  const waitingForMe = transactions.filter((transaction) => {
    if (!account) {
      return false
    }

    const isOwner = transaction.owner_account_id === account.id
    const isBorrower = transaction.borrower_account_id === account.id

    return (
      (isOwner && transaction.status === 'requested') ||
      (isOwner && transaction.status === 'return_requested') ||
      (isBorrower && transaction.delivery_method === 'self_pickup' && transaction.status === 'accepted') ||
      (isBorrower && transaction.delivery_method === 'volunteer' && transaction.status === 'delivered')
    )
  })

  return (
    <div className="view-stack">
      <section className="stats-grid">
        <StatCard icon={CircleDollarSign} label="Điểm hiện tại" value={account?.points ?? 0} tone="green" />
        <StatCard icon={BookOpen} label="Sách của tôi" value={ownedBooks.length} tone="blue" />
        <StatCard icon={ArrowRightLeft} label="Giao dịch mở" value={transactions.length} tone="amber" />
        <StatCard icon={Truck} label="Đơn giao mở" value={deliveries.length} tone="neutral" />
      </section>

      <section className="process-band">
        {[
          ['1.0', 'Người dùng & điểm'],
          ['2.0', 'Kho sách'],
          ['3.0', 'Giao dịch'],
          ['4.0', 'Vận chuyển'],
          ['5.0', 'Khiếu nại'],
        ].map(([code, label]) => (
          <div className="process-step" key={code}>
            <span>{code}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </section>

      <div className="two-column">
        <section className="tool-panel">
          <PanelHeader
            icon={Clock3}
            title="Cần xử lý"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('transactions')}>
                Mở giao dịch <ChevronRight size={16} />
              </button>
            }
          />
          <div className="work-queue">
            {waitingForMe.slice(0, 4).map((transaction) => (
              <div className="queue-item" key={transaction.id}>
                <div>
                  <strong>{bookMap.get(transaction.book_id)?.title || 'Sách'}</strong>
                  <span>{getTransactionActionText(transaction, account?.id)}</span>
                </div>
                <StatusPill status={transaction.status}>
                  {transactionStatusLabels[transaction.status]}
                </StatusPill>
              </div>
            ))}
            {waitingForMe.length === 0 && <EmptyState icon={Clock3} text="Không có việc cần xử lý ngay." />}
          </div>
        </section>

        <section className="tool-panel">
          <PanelHeader
            icon={BookOpen}
            title="Sách đang có sẵn"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('books')}>
                Mở kho <ChevronRight size={16} />
              </button>
            }
          />
          <div className="compact-list">
            {availableBooks.slice(0, 5).map((book) => (
              <BookLine key={book.id} book={book} owner={accountMap.get(book.owner_account_id)} />
            ))}
            {availableBooks.length === 0 && <EmptyState icon={BookOpen} text="Chưa có sách khả dụng." />}
          </div>
        </section>
      </div>

      <div className="two-column">
        <section className="tool-panel">
          <PanelHeader
            icon={Truck}
            title="Đơn giao đang mở"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('deliveries')}>
                Nhận đơn <ChevronRight size={16} />
              </button>
            }
          />
          <div className="compact-list">
            {deliveries.slice(0, 5).map((delivery) => (
              <div className="list-line" key={delivery.id}>
                <div>
                  <strong>{delivery.pickup_location}</strong>
                  <span>{delivery.dropoff_location}</span>
                </div>
                <StatusPill status={delivery.status}>{deliveryStatusLabels[delivery.status]}</StatusPill>
              </div>
            ))}
            {deliveries.length === 0 && <EmptyState icon={Truck} text="Chưa có đơn giao đang mở." />}
          </div>
        </section>

        <section className="tool-panel">
          <PanelHeader
            icon={History}
            title="Biến động điểm"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('profile')}>
                Lịch sử <ChevronRight size={16} />
              </button>
            }
          />
          <div className="compact-list">
            {ledger.slice(0, 5).map((item) => (
              <LedgerLine key={item.id} item={item} />
            ))}
            {ledger.length === 0 && <EmptyState icon={History} text="Chưa có lịch sử điểm." />}
          </div>
        </section>
      </div>

      <section className="tool-panel">
        <PanelHeader icon={ArrowRightLeft} title="Giao dịch gần đây" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sách</th>
                <th>Đối tác</th>
                <th>Loại</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 6).map((transaction) => {
                const partnerId =
                  transaction.owner_account_id === account?.id
                    ? transaction.borrower_account_id
                    : transaction.owner_account_id
                return (
                  <tr key={transaction.id}>
                    <td>{bookMap.get(transaction.book_id)?.title || 'Sách đã xóa'}</td>
                    <td>{accountMap.get(partnerId)?.full_name || 'Thành viên'}</td>
                    <td>{transactionTypeLabels[transaction.transaction_type]}</td>
                    <td>
                      <StatusPill status={transaction.status}>
                        {transactionStatusLabels[transaction.status]}
                      </StatusPill>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
