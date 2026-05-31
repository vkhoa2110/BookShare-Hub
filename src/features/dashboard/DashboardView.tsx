import {
  Coins,
  BookMarked,
  BookOpen,
  Handshake,
  Truck,
  ChevronRight,
  History,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import {
  deliveryStatusLabels,
  transactionStatusLabels,
  transactionTypeLabels,
} from '../../shared/constants/labels'
import { EmptyState, PanelHeader, StatusPill } from '../../shared/components'
import { formatDate } from '../../shared/utils/date'
import type { Account, Book, BookTransaction, Delivery, PointLedger } from '../../types/domain'
import type { View } from '../../types/forms'
import './dashboard.css'

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
    <div className="view-stack dashboard-container">
      {/* KHUNG CHÀO MỪNG NỔI BẬT (WELCOME BANNER) */}
      <section className="dashboard-welcome-banner">
        <div className="welcome-text">
          <h1>Chào mừng trở lại, {account?.full_name || 'Hội viên'}! 👋</h1>
          <p>
            Hôm nay bạn muốn đọc tác phẩm nào? Hãy cùng CLB chia sẻ những cuốn sách hay và tích lũy thật nhiều điểm thưởng nhé!
          </p>
        </div>
        <div className="welcome-stats-chip">
          <div className="icon-circle">
            <Award size={20} />
          </div>
          <div className="stats-info">
            <span>Điểm tích lũy</span>
            <strong>{account?.points ?? 0}đ</strong>
          </div>
        </div>
      </section>

      {/* LƯỚI CHỈ SỐ THỐNG KÊ (INTERACTIVE STAT CARDS) */}
      <section
        className="dashboard-stats-grid"
        style={{
          gridTemplateColumns: account?.role === 'admin' ? 'repeat(3, 1fr)' : undefined,
        }}
      >
        {/* Số dư điểm */}
        <div className="dashboard-stat-card" onClick={() => setActiveView('profile-points')}>
          <div className="stat-icon-wrapper amber">
            <Coins size={22} />
          </div>
          <div className="stat-card-details">
            <span>Ví điểm hiện tại</span>
            <strong>{account?.points ?? 0}đ</strong>
          </div>
        </div>

        {/* Sách của tôi */}
        <div className="dashboard-stat-card" onClick={() => setActiveView('profile-books')}>
          <div className="stat-icon-wrapper blue">
            <BookMarked size={22} />
          </div>
          <div className="stat-card-details">
            <span>Sách của tôi</span>
            <strong>{ownedBooks.length} cuốn</strong>
          </div>
        </div>

        {/* Giao dịch mở */}
        <div className="dashboard-stat-card" onClick={() => setActiveView('transactions')}>
          <div className="stat-icon-wrapper purple">
            <Handshake size={22} />
          </div>
          <div className="stat-card-details">
            <span>Giao dịch của tôi</span>
            <strong>{transactions.length} đơn</strong>
          </div>
        </div>

        {/* Đơn giao mở */}
        {account?.role !== 'admin' && (
          <div className="dashboard-stat-card" onClick={() => setActiveView('deliveries')}>
            <div className="stat-icon-wrapper green">
              <Truck size={22} />
            </div>
            <div className="stat-card-details">
              <span>Đơn vận chuyển</span>
              <strong>{deliveries.length} lượt</strong>
            </div>
          </div>
        )}
      </section>

      {/* PHÂN HỆ: GÓC CÁ NHÂN */}
      <div className="dashboard-section-header">
        <h2>Góc cá nhân của bạn</h2>
        <p>Giám sát biến động điểm số cá nhân và nhật ký trạng thái giao dịch sách gần đây</p>
      </div>

      <div className="two-column">
        {/* Cột trái: Biến động điểm số */}
        <section className="tool-panel">
          <PanelHeader
            icon={History}
            title="Biến động điểm gần đây"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('profile-points')}>
                Xem thêm <ChevronRight size={16} />
              </button>
            }
          />
          <div className="premium-dashboard-list">
            {ledger.slice(0, 5).map((item) => {
              const isPlus = item.delta >= 0
              return (
                <div className="dashboard-list-item-card" key={item.id}>
                  <div className="dashboard-item-left">
                    <div
                      className={`ledger-icon-box ${isPlus ? 'plus' : 'minus'}`}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isPlus ? '#e4f2df' : '#fee2e2',
                        color: isPlus ? '#10b981' : '#ef4444',
                        flexShrink: 0,
                      }}
                    >
                      {isPlus ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                    </div>
                    <div className="dashboard-item-details">
                      <strong>{item.reason}</strong>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  <div className={`points-delta-badge ${isPlus ? 'plus' : 'minus'}`}>
                    {isPlus ? '+' : ''}
                    {item.delta}đ
                  </div>
                </div>
              )
            })}
            {ledger.length === 0 && <EmptyState icon={History} text="Chưa ghi nhận biến động điểm." />}
          </div>
        </section>

        {/* Cột phải: Nhật ký giao dịch gần đây */}
        <section className="tool-panel">
          <PanelHeader
            icon={Handshake}
            title="Giao dịch sách gần đây"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('transactions')}>
                Lịch sử giao dịch <ChevronRight size={16} />
              </button>
            }
          />
          <div className="premium-dashboard-list">
            {transactions.slice(0, 5).map((transaction) => {
              const partnerId =
                transaction.owner_account_id === account?.id
                  ? transaction.borrower_account_id
                  : transaction.owner_account_id
              const book = bookMap.get(transaction.book_id)
              
              return (
                <div className="dashboard-list-item-card" key={transaction.id}>
                  <div className="dashboard-item-left">
                    {book?.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={`Bìa ${book.title}`}
                        className="book-cover-mini"
                        style={{ width: '28px', height: '36px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        className="book-cover-mini flex-align-center"
                        style={{
                          width: '28px',
                          height: '36px',
                          borderRadius: '4px',
                          justifyContent: 'center',
                          fontSize: '0.45rem',
                          color: '#94a3b8',
                          border: '1px dashed #cbd5e1',
                          flexShrink: 0,
                        }}
                      >
                        N/A
                      </div>
                    )}
                    <div className="dashboard-item-details">
                      <strong>{book?.title || 'Sách'}</strong>
                      <span>
                        Đối tác: {accountMap.get(partnerId)?.full_name || 'Hội viên'} ·{' '}
                        {transactionTypeLabels[transaction.transaction_type]}
                      </span>
                    </div>
                  </div>
                  <StatusPill status={transaction.status}>
                    {transactionStatusLabels[transaction.status]}
                  </StatusPill>
                </div>
              )
            })}
            {transactions.length === 0 && <EmptyState icon={Handshake} text="Chưa ghi nhận hoạt động giao dịch." />}
          </div>
        </section>
      </div>

      {/* PHÂN HỆ: KHÁM PHÁ CỘNG ĐỒNG */}
      <div className="dashboard-section-header" style={{ marginTop: '8px' }}>
        <h2>{account?.role === 'admin' ? 'Khám phá cộng đồng' : 'Khám phá & Hỗ trợ cộng đồng'}</h2>
        <p>
          {account?.role === 'admin'
            ? 'Tìm kiếm các đầu sách mới khả dụng trong kho'
            : 'Tìm kiếm các đầu sách mới khả dụng trong kho và hỗ trợ vận chuyển sách giúp các thành viên'}
        </p>
      </div>

      <div className={account?.role === 'admin' ? '' : 'two-column'}>
        {/* Cột trái: Sách mới sẵn sàng mượn */}
        <section className="tool-panel">
          <PanelHeader
            icon={BookOpen}
            title="Sách mới sẵn sàng cho mượn"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('books')}>
                Tủ sách <ChevronRight size={16} />
              </button>
            }
          />
          <div className="premium-dashboard-list">
            {availableBooks.slice(0, 5).map((book) => {
              const owner = accountMap.get(book.owner_account_id)
              return (
                <div className="dashboard-list-item-card" key={book.id}>
                  <div className="dashboard-item-left">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={`Bìa ${book.title}`}
                        className="book-cover-mini"
                        style={{ width: '28px', height: '36px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        className="book-cover-mini flex-align-center"
                        style={{
                          width: '28px',
                          height: '36px',
                          borderRadius: '4px',
                          justifyContent: 'center',
                          fontSize: '0.45rem',
                          color: '#94a3b8',
                          border: '1px dashed #cbd5e1',
                          flexShrink: 0,
                        }}
                      >
                        N/A
                      </div>
                    )}
                    <div className="dashboard-item-details">
                      <strong>{book.title}</strong>
                      <span>
                        Tác giả: {book.author} · Người chia sẻ: {owner?.full_name || 'Hội viên'}
                      </span>
                    </div>
                  </div>
                  <span
                    className="book-category-tag"
                    style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', fontWeight: 800 }}
                  >
                    {book.category}
                  </span>
                </div>
              )
            })}
            {availableBooks.length === 0 && <EmptyState icon={BookOpen} text="Tủ sách CLB tạm thời hết sách sẵn có." />}
          </div>
        </section>

        {/* Cột phải: Đơn hàng vận chuyển cần tình nguyện viên */}
        {account?.role !== 'admin' && (
          <section className="tool-panel">
            <PanelHeader
              icon={Truck}
              title="Đơn vận chuyển tìm Tình nguyện viên"
              action={
                <button type="button" className="link-button" onClick={() => setActiveView('deliveries')}>
                  Đơn giao <ChevronRight size={16} />
                </button>
              }
            />
            <div className="premium-dashboard-list">
              {deliveries.slice(0, 5).map((delivery) => (
                <div className="dashboard-list-item-card" key={delivery.id}>
                  <div className="dashboard-item-left">
                    <div
                      className="stat-icon-wrapper green"
                      style={{ width: '32px', height: '32px', borderRadius: '6px' }}
                    >
                      <MapPin size={16} />
                    </div>
                    <div className="dashboard-item-details">
                      <div className="delivery-mini-stops">
                        <span>{delivery.pickup_location}</span>
                        <ArrowRight size={10} className="separator-arrow" />
                        <span>{delivery.dropoff_location}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                        Nhận đơn được tích lũy +2 điểm thưởng
                      </span>
                    </div>
                  </div>
                  <StatusPill status={delivery.status}>{deliveryStatusLabels[delivery.status]}</StatusPill>
                </div>
              ))}
              {deliveries.length === 0 && <EmptyState icon={Truck} text="Hiện chưa có đơn vận chuyển nào cần hỗ trợ." />}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
