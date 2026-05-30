import {
  Coins,
  BookMarked,
  BookOpen,
  Handshake,
  Truck,
  ChevronRight,
  History,
} from 'lucide-react'
import {
  bookStatusLabels,
  deliveryStatusLabels,
  transactionStatusLabels,
  transactionTypeLabels,
} from '../../shared/constants/labels'
import { EmptyState, LedgerLine, PanelHeader, StatCard, StatusPill } from '../../shared/components'
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


  return (
    <div className="view-stack">
      <section className="stats-grid">
        <div className="clickable-stat-card" onClick={() => setActiveView('profile-points')}>
          <StatCard icon={Coins} label="Điểm hiện tại" value={account?.points ?? 0} tone="amber" />
        </div>
        <div className="clickable-stat-card" onClick={() => setActiveView('profile-books')}>
          <StatCard icon={BookMarked} label="Sách của tôi" value={ownedBooks.length} tone="blue" />
        </div>
        <div className="clickable-stat-card" onClick={() => setActiveView('transactions')}>
          <StatCard icon={Handshake} label="Giao dịch mở" value={transactions.length} tone="purple" />
        </div>
        <div className="clickable-stat-card" onClick={() => setActiveView('deliveries')}>
          <StatCard icon={Truck} label="Đơn giao mở" value={deliveries.length} tone="green" />
        </div>
      </section>


      {/* KHU VỰC CÁ NHÂN & LIÊN QUAN */}
      <div className="dashboard-section-header">
        <h2>Góc cá nhân của bạn</h2>
        <p>Theo dõi hoạt động cá nhân, số dư điểm và nhật ký hoạt động giao dịch gần đây</p>
      </div>

      <div className="two-column">
        {/* Biến động điểm số */}
        <section className="tool-panel">
          <PanelHeader
            icon={History}
            title="Biến động điểm số"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('profile-points')}>
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

        {/* Nhật ký giao dịch gần đây */}
        <section className="tool-panel">
          <PanelHeader
            icon={Handshake}
            title="Hoạt động giao dịch gần đây"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('transactions')}>
                Lịch sử giao dịch <ChevronRight size={16} />
              </button>
            }
          />
          <div className="compact-list">
            {transactions.slice(0, 5).map((transaction) => {
              const partnerId =
                transaction.owner_account_id === account?.id
                   ? transaction.borrower_account_id
                   : transaction.owner_account_id
              const book = bookMap.get(transaction.book_id)
              return (
                <div className="list-line flex-align-center" key={transaction.id} style={{ padding: '6px 0' }}>
                  <div className="flex-align-center" style={{ flex: 1 }}>
                    {book?.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={`Bìa ${book.title}`}
                        className="book-cover-mini"
                        style={{ width: '24px', height: '32px', marginRight: '8px' }}
                      />
                    ) : (
                      <div className="book-cover-mini flex-align-center" style={{ width: '24px', height: '32px', marginRight: '8px', justifyContent: 'center', fontSize: '0.5rem', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>N/A</div>
                    )}
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>{book?.title || 'Sách'}</strong>
                      <span style={{ fontSize: '0.75rem' }}>
                        {accountMap.get(partnerId)?.full_name || 'Thành viên'} · {transactionTypeLabels[transaction.transaction_type]}
                      </span>
                    </div>
                  </div>
                  <StatusPill status={transaction.status}>
                    {transactionStatusLabels[transaction.status]}
                  </StatusPill>
                </div>
              )
            })}
            {transactions.length === 0 && <EmptyState icon={Handshake} text="Chưa có giao dịch gần đây." />}
          </div>
        </section>
      </div>

      {/* KHU VỰC THỊ TRƯỜNG & KHÁM PHÁ CỘNG ĐỒNG */}
      <div className="dashboard-section-header" style={{ marginTop: '8px' }}>
        <h2>Khám phá & Hỗ trợ cộng đồng</h2>
        <p>Tìm kiếm sách hay khả dụng và hỗ trợ vận chuyển sách giúp các thành viên</p>
      </div>

      <div className="two-column">
        {/* Sách sẵn có trong thư viện */}
        <section className="tool-panel">
          <PanelHeader
            icon={BookOpen}
            title="Sách mới sẵn sàng mượn"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('books')}>
                Mở kho <ChevronRight size={16} />
              </button>
            }
          />
          <div className="compact-list">
            {availableBooks.slice(0, 5).map((book) => {
              const owner = accountMap.get(book.owner_account_id)
              return (
                <div className="list-line flex-align-center" key={book.id} style={{ padding: '6px 0' }}>
                  <div className="flex-align-center" style={{ flex: 1 }}>
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={`Bìa ${book.title}`}
                        className="book-cover-mini"
                        style={{ width: '24px', height: '32px', marginRight: '8px' }}
                      />
                    ) : (
                      <div className="book-cover-mini flex-align-center" style={{ width: '24px', height: '32px', marginRight: '8px', justifyContent: 'center', fontSize: '0.5rem', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>N/A</div>
                    )}
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>{book.title}</strong>
                      <span style={{ fontSize: '0.75rem' }}>
                        {book.author} · {owner?.full_name || 'Thành viên'}
                      </span>
                    </div>
                  </div>
                  <StatusPill status={book.status}>{bookStatusLabels[book.status]}</StatusPill>
                </div>
              )
            })}
            {availableBooks.length === 0 && <EmptyState icon={BookOpen} text="Chưa có sách khả dụng." />}
          </div>
        </section>

        {/* Đơn hàng vận chuyển đang mở */}
        <section className="tool-panel">
          <PanelHeader
            icon={Truck}
            title="Đơn vận chuyển cần tình nguyện viên"
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
      </div>
    </div>
  )
}
