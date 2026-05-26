import type { FormEvent } from 'react'
import { Check, ClipboardList, History, Home, MapPin, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'
import { roleLabels } from '../../shared/constants/labels'
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
import type { Account, AccountAddress, PointLedger, TransactionHistory } from '../../types/domain'
import type { AddressForm, ProfileForm } from '../../types/forms'

export function ProfileView({
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
}: {
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
}) {
  return (
    <div className="two-column align-start">
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

      <section className="tool-panel">
        <PanelHeader icon={History} title="Lịch sử điểm" />
        <div className="compact-list">
          {ledger.map((item) => (
            <LedgerLine key={item.id} item={item} />
          ))}
          {ledger.length === 0 && <EmptyState icon={History} text="Chưa có lịch sử điểm." />}
        </div>
      </section>

      <section className="tool-panel span-two">
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
    </div>
  )
}
