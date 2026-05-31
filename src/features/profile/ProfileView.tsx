import type { FormEvent } from 'react'
import {
  BookOpen,
  Check,
  ClipboardList,
  History,
  Home,
  Library,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
  Mail,
  ShieldCheck,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
import { bookStatusLabels, roleLabels } from '../../shared/constants/labels'
import {
  ActionButton,
  EmptyState,
  Field,
  IconOnlyButton,
  StatusPill,
} from '../../shared/components'
import { formatDate } from '../../shared/utils/date'
import type {
  Account,
  AccountAddress,
  Book,
  BookTransaction,
  PointLedger,
  TransactionHistory,
} from '../../types/domain'
import type { AddressForm, ProfileForm, View } from '../../types/forms'
import { BookCover } from '../books/BookCover'
import { initials } from '../../shared/utils/account'
import './profile.css'

export function ProfileView({
  subView = 'profile-info',
  account,
  form,
  addresses,
  addressForm,
  editingAddressId,
  ledger,
  history,
  accountMap,
  busyKey,
  onFormChange,
  onSubmit,
  onAddressFormChange,
  onAddressSubmit,
  onEditAddress,
  onDeleteAddress,
  onResetAddressForm,
  books = [],
  transactions = [],
}: {
  subView?: View
  account: Account | null
  form: ProfileForm
  addresses: AccountAddress[]
  addressForm: AddressForm
  editingAddressId: string | null
  ledger: PointLedger[]
  history: TransactionHistory[]
  accountMap: Map<string, Account>
  busyKey: string | null
  onFormChange: (form: ProfileForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onAddressFormChange: (form: AddressForm) => void
  onAddressSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEditAddress: (address: AccountAddress) => void
  onDeleteAddress: (addressId: string) => void
  onResetAddressForm: () => void
  books?: Book[]
  transactions?: BookTransaction[]
}) {
  const currentSubView = subView === 'profile' ? 'profile-info' : subView

  const ownedBooks = books.filter((book) => book.owner_account_id === account?.id)
  const borrowedBooks = transactions
    .filter(
      (transaction) =>
        transaction.borrower_account_id === account?.id &&
        transaction.transaction_type === 'borrow' &&
        ['completed', 'return_requested'].includes(transaction.status),
    )
    .map((transaction) => ({
      transaction,
      book: books.find((book) => book.id === transaction.book_id),
    }))
    .filter((item): item is { transaction: BookTransaction; book: Book } => {
      const book = item.book
      if (!book) {
        return false
      }
      return book.status === 'borrowed'
    })

  const filteredHistory = history.filter((item) => {
    if (account?.role === 'admin') {
      return true
    }

    const transaction = transactions.find((t) => t.id === item.transaction_id)
    if (!transaction) {
      return item.updated_by_account_id === account?.id
    }

    return (
      transaction.owner_account_id === account?.id ||
      transaction.borrower_account_id === account?.id ||
      item.updated_by_account_id === account?.id
    )
  })

  return (
    <div className="profile-sub-page">
      {/* 1. THÔNG TIN CÁ NHÂN (TAB: profile-info) */}
      {currentSubView === 'profile-info' && (
        <div className="profile-info-grid-container">
          {/* Cột trái: Chi tiết tài khoản & Thẻ Hero */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Thẻ Hero nâng cấp */}
            <div className="profile-card-hero">
              <div className="profile-avatar-large">
                {initials(account?.full_name || account?.email_address || 'BH')}
              </div>
              <div className="profile-hero-details">
                <h2>{account?.full_name || 'Thành viên'}</h2>
                <div className="profile-hero-badges">
                  {account?.role === 'volunteer' ? (
                    <>
                      <span className="profile-role-badge volunteer">
                        Người giao sách
                      </span>
                      <span className="profile-role-badge member">
                        Thành viên
                      </span>
                    </>
                  ) : (
                    <span className="profile-role-badge">
                      {account ? roleLabels[account.role] : 'Đọc giả'}
                    </span>
                  )}
                  {account?.role !== 'admin' && (
                    <span className="profile-points-badge">
                      <Award size={14} />
                      <strong>{account?.points ?? 0}đ</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Chi tiết tài khoản dạng lưới trực quan */}
            <div className="tool-panel">
              <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Thông tin tài khoản</span>
              <div className="profile-details-card">
                <div className="detail-item-box">
                  <div className="detail-item-icon">
                    <Mail size={16} />
                  </div>
                  <div className="detail-item-info">
                    <span>Email đăng ký</span>
                    <strong>{account?.email_address || 'Chưa cập nhật'}</strong>
                  </div>
                </div>

                <div className="detail-item-box">
                  <div className="detail-item-icon">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="detail-item-info">
                    <span>Vai trò hệ thống</span>
                    <strong>
                      {account?.role === 'volunteer'
                        ? 'Người giao sách, Thành viên'
                        : account
                        ? roleLabels[account.role]
                        : 'Thành viên'}
                    </strong>
                  </div>
                </div>

                {account?.role !== 'admin' && (
                  <div className="detail-item-box">
                    <div className="detail-item-icon">
                      <Award size={16} />
                    </div>
                    <div className="detail-item-info">
                      <span>Điểm thưởng tích lũy</span>
                      <strong>{account?.points ?? 0} điểm</strong>
                    </div>
                  </div>
                )}

                <div className="detail-item-box">
                  <div className="detail-item-icon">
                    <UserRound size={16} />
                  </div>
                  <div className="detail-item-info">
                    <span>Trạng thái tài khoản</span>
                    <strong>{account?.status ? 'Đang hoạt động' : 'Bị khóa'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form cập nhật thông tin */}
          <section className="tool-panel" style={{ alignSelf: 'stretch' }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: '16px' }}>Cập nhật hồ sơ</span>
            <form className="stack-form" onSubmit={onSubmit}>
              <Field label="Họ tên">
                <input
                  required
                  value={form.full_name}
                  onChange={(event) => onFormChange({ ...form, full_name: event.target.value })}
                  placeholder="Nhập họ tên của bạn"
                />
              </Field>
              <Field label="Số điện thoại">
                <input
                  value={form.phone_number}
                  onChange={(event) => onFormChange({ ...form, phone_number: event.target.value })}
                  placeholder="Nhập số điện thoại liên hệ"
                />
              </Field>
              
              <div style={{ marginTop: '12px' }}>
                <ActionButton icon={Check} busy={busyKey === 'profile-update'} style={{ width: '100%' }}>
                  Lưu thay đổi hồ sơ
                </ActionButton>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* 2. ĐỊA CHỈ NHẬN SÁCH (TAB: profile-addresses) */}
      {currentSubView === 'profile-addresses' && (
        <div className="addresses-grid-container">
          {/* Cột trái: Danh sách địa chỉ nhận sách */}
          <div style={{ display: 'grid', gap: '16px' }}>
            <section className="tool-panel" style={{ borderBottom: 'none', paddingBottom: '0' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: '16px' }}>Sổ địa chỉ của tôi</span>
            </section>
            
            <div className="address-list" style={{ marginTop: 0 }}>
              {addresses.map((address) => (
                <div className="address-modern-card" key={address.id}>
                  <div className="address-icon-box">
                    <Home size={20} />
                  </div>
                  <div className="address-card-body">
                    <div className="address-card-header">
                      <strong>{address.label}</strong>
                      {address.is_default && (
                        <StatusPill status="completed">Mặc định</StatusPill>
                      )}
                    </div>
                    <p>{address.address_text}</p>
                  </div>
                  
                  <div className="address-card-actions">
                    <IconOnlyButton label="Sửa địa chỉ" onClick={() => onEditAddress(address)}>
                      <Pencil size={15} style={{ color: '#4f46e5' }} />
                    </IconOnlyButton>
                    <IconOnlyButton
                      label="Xóa địa chỉ"
                      busy={busyKey === `address-delete-${address.id}`}
                      onClick={() => onDeleteAddress(address.id)}
                    >
                      <Trash2 size={15} style={{ color: '#dc2626' }} />
                    </IconOnlyButton>
                  </div>
                </div>
              ))}
              {addresses.length === 0 && (
                <div className="tool-panel">
                  <EmptyState icon={MapPin} text="Bạn chưa thiết lập địa chỉ nhận sách nào." />
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Form Thêm/Sửa địa chỉ */}
          <section className="tool-panel">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '16px' }}>
              {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </span>
            <form className="stack-form" onSubmit={onAddressSubmit}>
              <Field label="Tên địa chỉ nhận sách">
                <input
                  required
                  value={addressForm.label}
                  onChange={(event) => onAddressFormChange({ ...addressForm, label: event.target.value })}
                  placeholder="Ví dụ: Nhà riêng, Trường học, Cơ quan..."
                />
              </Field>
              <Field label="Địa chỉ chi tiết">
                <textarea
                  required
                  rows={3}
                  value={addressForm.address_text}
                  onChange={(event) => onAddressFormChange({ ...addressForm, address_text: event.target.value })}
                  placeholder="Số nhà, ngõ/ngách, tên đường, phường/xã..."
                />
              </Field>
              <label className="check-line" style={{ padding: '4px 0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(event) => onAddressFormChange({ ...addressForm, is_default: event.target.checked })}
                />
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>Đặt làm địa chỉ nhận sách mặc định</span>
              </label>
              <div className="form-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <ActionButton
                  icon={editingAddressId ? Check : Plus}
                  busy={busyKey === 'address-create' || busyKey === 'address-update'}
                  style={{ flex: 1 }}
                >
                  {editingAddressId ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
                </ActionButton>
                {editingAddressId && (
                  <ActionButton type="button" icon={X} variant="secondary" onClick={onResetAddressForm}>
                    Hủy
                  </ActionButton>
                )}
              </div>
            </form>
          </section>
        </div>
      )}

      {/* 3. SÁCH CỦA TÔI (TAB: profile-books) */}
      {currentSubView === 'profile-books' && (
        <div className="my-books-dashboard">
          {/* Cột trái: Sách đã đăng tải */}
          <div className="books-dashboard-card">
            <div className="books-dashboard-header">
              <h3>
                <Library size={18} style={{ color: '#24755d' }} />
                Sách đã đăng tải
              </h3>
              <span className="count">{ownedBooks.length} cuốn</span>
            </div>
            
            <div className="books-dashboard-list">
              {ownedBooks.map((book) => (
                <div className="premium-mini-book" key={book.id}>
                  <BookCover book={book} size="small" />
                  <div className="mini-book-details">
                    <h4>{book.title}</h4>
                    <p>{book.author} · {book.category}</p>
                  </div>
                  <StatusPill status={book.status}>
                    {bookStatusLabels[book.status]}
                  </StatusPill>
                </div>
              ))}
              {ownedBooks.length === 0 && (
                <EmptyState icon={BookOpen} text="Bạn chưa đăng tải cuốn sách nào lên thư viện." />
              )}
            </div>
          </div>

          {/* Cột phải: Sách đang mượn đọc */}
          <div className="books-dashboard-card">
            <div className="books-dashboard-header">
              <h3>
                <BookOpen size={18} style={{ color: '#2563eb' }} />
                Sách đang mượn đọc
              </h3>
              <span className="count">{borrowedBooks.length} cuốn</span>
            </div>

            <div className="books-dashboard-list">
              {borrowedBooks.map(({ book, transaction }) => (
                <div className="premium-mini-book" key={transaction.id}>
                  <BookCover book={book} size="small" />
                  <div className="mini-book-details">
                    <h4>{book.title}</h4>
                    <p>{book.author} · {book.category}</p>
                  </div>
                  <StatusPill status={transaction.status === 'return_requested' ? 'waiting' : 'good'}>
                    {transaction.status === 'return_requested' ? 'Đang gửi trả' : 'Đang mượn'}
                  </StatusPill>
                </div>
              ))}
              {borrowedBooks.length === 0 && (
                <EmptyState icon={BookOpen} text="Hiện tại bạn không mượn cuốn sách nào." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. LỊCH SỬ ĐIỂM (TAB: profile-points) */}
      {currentSubView === 'profile-points' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Card số dư điểm hiện tại */}
          <div className="ledger-hero-points">
            <div>
              <h3>Số dư điểm hiện hành</h3>
            </div>
            <div className="points-display">
              <Award size={32} style={{ color: '#10b981' }} />
              <strong>{account?.points ?? 0}đ</strong>
            </div>
          </div>

          {/* Danh sách lịch sử biến động điểm */}
          <section className="tool-panel">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '16px' }}>Lịch sử biến động điểm</span>
            <div className="ledger-modern-list">
              {ledger.map((item) => {
                const isPlus = item.delta >= 0
                return (
                  <div className="ledger-modern-item" key={item.id}>
                    <div className="ledger-item-left">
                      <div className={`ledger-icon-box ${isPlus ? 'plus' : 'minus'}`}>
                        {isPlus ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div className="ledger-item-details">
                        <strong>{item.reason}</strong>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                    <div className={`ledger-points-delta ${isPlus ? 'plus' : 'minus'}`}>
                      {isPlus ? '+' : ''}{item.delta}đ
                    </div>
                  </div>
                )
              })}
              {ledger.length === 0 && (
                <EmptyState icon={History} text="Chưa ghi nhận biến động điểm nào." />
              )}
            </div>
          </section>
        </div>
      )}

      {/* 5. LỊCH SỬ GIAO DỊCH (TAB: profile-history) */}
      {currentSubView === 'profile-history' && (
        <section className="tool-panel">
          <span className="eyebrow" style={{ display: 'block', marginBottom: '16px' }}>Lịch sử giao dịch & cập nhật hệ thống</span>
          <div className="table-wrap" style={{ margin: 0 }}>
            {filteredHistory.length === 0 ? (
              <EmptyState icon={ClipboardList} text="Chưa ghi nhận lịch sử giao dịch nào." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Trạng thái cập nhật</th>
                    <th>Người thực hiện</th>
                    <th>Ghi chú chi tiết</th>
                    <th>Thời gian cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>
                        <span className={`status-pill ${item.status_updated_to === 'completed' ? 'good' : 'muted'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                          {item.status_updated_to}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {accountMap.get(item.updated_by_account_id || '')?.full_name || 'Hệ thống tự động'}
                      </td>
                      <td style={{ color: '#475569' }}>{item.note || 'Không có ghi chú'}</td>
                      <td style={{ fontSize: '0.8125rem' }}>{formatDate(item.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
