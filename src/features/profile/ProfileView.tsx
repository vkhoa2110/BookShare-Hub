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
} from 'lucide-react'
import { bookStatusLabels, roleLabels } from '../../shared/constants/labels'
import {
  ActionButton,
  EmptyState,
  Field,
  IconOnlyButton,
  LedgerLine,
  MetricLine,
  PanelHeader,
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
import { MiniBookItem } from '../books/BookCover'

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

  return (
    <div
      className={`profile-sub-page${['profile-info', 'profile-addresses'].includes(currentSubView) ? ' centered' : ''}`}
    >
      {currentSubView === 'profile-info' && (
        <section className="tool-panel">
          <PanelHeader icon={UserRound} title="Thông tin tài khoản" />
          <form className="stack-form" onSubmit={onSubmit}>
            <Field label="Họ tên">
              <input
                required
                value={form.full_name}
                onChange={(event) => onFormChange({ ...form, full_name: event.target.value })}
              />
            </Field>
            <Field label="Số điện thoại">
              <input
                value={form.phone_number}
                onChange={(event) => onFormChange({ ...form, phone_number: event.target.value })}
              />
            </Field>
            <div className="account-summary">
              <MetricLine label="Email" value={account?.email_address || ''} />
              <MetricLine label="Vai trò" value={account ? roleLabels[account.role] : ''} />
              <MetricLine label="Điểm" value={String(account?.points ?? 0)} />
            </div>
            <ActionButton icon={Check} busy={busyKey === 'profile-update'}>
              Lưu hồ sơ
            </ActionButton>
          </form>
        </section>
      )}

      {currentSubView === 'profile-addresses' && (
        <section className="tool-panel">
          <PanelHeader icon={Home} title="Địa chỉ nhận sách" />
          <form className="stack-form" onSubmit={onAddressSubmit}>
            <Field label="Tên địa chỉ">
              <input
                required
                value={addressForm.label}
                onChange={(event) => onAddressFormChange({ ...addressForm, label: event.target.value })}
                placeholder="Nhà, trường, CLB..."
              />
            </Field>
            <Field label="Địa chỉ">
              <textarea
                required
                rows={3}
                value={addressForm.address_text}
                onChange={(event) => onAddressFormChange({ ...addressForm, address_text: event.target.value })}
                placeholder="Tòa nhà, phòng, khu vực"
              />
            </Field>
            <label className="check-line">
              <input
                type="checkbox"
                checked={addressForm.is_default}
                onChange={(event) => onAddressFormChange({ ...addressForm, is_default: event.target.checked })}
              />
              <span>Đặt làm mặc định</span>
            </label>
            <div className="form-actions">
              <ActionButton
                icon={editingAddressId ? Check : Plus}
                busy={busyKey === 'address-create' || busyKey === 'address-update'}
              >
                {editingAddressId ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}
              </ActionButton>
              {editingAddressId && (
                <ActionButton type="button" icon={X} variant="secondary" onClick={onResetAddressForm}>
                  Hủy
                </ActionButton>
              )}
            </div>
          </form>
          <div className="address-list">
            {addresses.map((address) => (
              <div className="address-item" key={address.id}>
                <div>
                  <strong>{address.label}</strong>
                  <span>{address.address_text}</span>
                </div>
                {address.is_default && <StatusPill status="completed">Mặc định</StatusPill>}
                <div className="address-actions">
                  <IconOnlyButton label="Sửa địa chỉ" onClick={() => onEditAddress(address)}>
                    <Pencil size={16} />
                  </IconOnlyButton>
                  <IconOnlyButton
                    label="Xóa địa chỉ"
                    busy={busyKey === `address-delete-${address.id}`}
                    onClick={() => onDeleteAddress(address.id)}
                  >
                    <Trash2 size={16} />
                  </IconOnlyButton>
                </div>
              </div>
            ))}
            {addresses.length === 0 && <EmptyState icon={MapPin} text="Chưa có địa chỉ." />}
          </div>
        </section>
      )}

      {currentSubView === 'profile-books' && (
        <section className="tool-panel">
          <PanelHeader icon={Library} title="Sách của tôi" />
          <div className="my-books-board">
            <div>
              <div className="mini-section-title">
                <h3>Đã đăng</h3>
                <span>{ownedBooks.length}</span>
              </div>
              <div className="mini-book-list">
                {ownedBooks.map((book) => (
                  <MiniBookItem key={book.id} book={book} detail={bookStatusLabels[book.status]} />
                ))}
                {ownedBooks.length === 0 && <EmptyState icon={BookOpen} text="Chưa đăng sách." />}
              </div>
            </div>
            <div>
              <div className="mini-section-title">
                <h3>Đang mượn</h3>
                <span>{borrowedBooks.length}</span>
              </div>
              <div className="mini-book-list">
                {borrowedBooks.map(({ book, transaction }) => (
                  <MiniBookItem
                    key={transaction.id}
                    book={book}
                    detail={transaction.status === 'return_requested' ? 'Đang trả sách' : 'Đang mượn'}
                  />
                ))}
                {borrowedBooks.length === 0 && <EmptyState icon={BookOpen} text="Chưa có sách đang mượn." />}
              </div>
            </div>
          </div>
        </section>
      )}

      {currentSubView === 'profile-points' && (
        <section className="tool-panel">
          <PanelHeader icon={History} title="Lịch sử điểm" />
          <div className="compact-list">
            {ledger.map((item) => (
              <LedgerLine key={item.id} item={item} />
            ))}
            {ledger.length === 0 && <EmptyState icon={History} text="Chưa có lịch sử điểm." />}
          </div>
        </section>
      )}

      {currentSubView === 'profile-history' && (
        <section className="tool-panel">
          <PanelHeader icon={ClipboardList} title="Lịch sử trạng thái giao dịch" />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trạng thái</th>
                  <th>Người cập nhật</th>
                  <th>Ghi chú</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.status_updated_to}</td>
                    <td>{accountMap.get(item.updated_by_account_id || '')?.full_name || 'Hệ thống'}</td>
                    <td>{item.note || ''}</td>
                    <td>{formatDate(item.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
