import type { FormEvent } from 'react'
import { ArrowRightLeft, CircleDollarSign, MapPin, PackageCheck, X } from 'lucide-react'
import { pointRule, customAddressId } from '../../shared/constants/rules'
import { ActionButton, Field, IconOnlyButton } from '../../shared/components'
import type {
  Account,
  AccountAddress,
  Book,
  BookTransaction,
  DeliveryMethod,
  TransactionType,
} from '../../types/domain'
import type { RequestForm, ReturnForm } from '../../types/forms'

export function RequestDialog({
  account,
  book,
  owner,
  addresses,
  form,
  busy,
  onFormChange,
  onClose,
  onSubmit,
}: {
  account: Account | null
  book: Book
  owner?: Account
  addresses: AccountAddress[]
  form: RequestForm
  busy: boolean
  onFormChange: (form: RequestForm) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const requiredPoints = pointRule[form.transaction_type]
  const hasEnoughPoints = (account?.points || 0) >= requiredPoints
  const useCustomAddress = form.address_id === customAddressId || addresses.length === 0

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="request-title">
        <div className="dialog-header">
          <div>
            <span className="eyebrow">Yêu cầu giao dịch</span>
            <h2 id="request-title">{book.title}</h2>
            <p>{owner?.full_name || 'Chủ sách'}</p>
          </div>
          <IconOnlyButton label="Đóng" onClick={onClose}>
            <X size={18} />
          </IconOnlyButton>
        </div>

        <form className="stack-form" onSubmit={onSubmit}>
          <Field label="Loại giao dịch">
            <select
              value={form.transaction_type}
              onChange={(event) =>
                onFormChange({ ...form, transaction_type: event.target.value as TransactionType })
              }
            >
              <option value="exchange">Trao đổi vĩnh viễn</option>
              <option value="borrow">Mượn có hoàn trả</option>
            </select>
          </Field>
          {form.transaction_type === 'borrow' && (
            <Field label="Hạn trả">
              <input
                type="datetime-local"
                value={form.return_due_at}
                onChange={(event) => onFormChange({ ...form, return_due_at: event.target.value })}
              />
            </Field>
          )}
          <Field label="Giao nhận">
            <select
              value={form.delivery_method}
              onChange={(event) =>
                onFormChange({ ...form, delivery_method: event.target.value as DeliveryMethod })
              }
            >
              <option value="self_pickup">Tự giao nhận</option>
              <option value="volunteer">Nhờ người giao sách miễn phí</option>
            </select>
          </Field>
          <div className="dialog-note">
            <MapPin size={16} />
            <span>Địa điểm lấy sách từ chủ sở hữu: {book.pickup_location || 'Chưa cập nhật'}</span>
          </div>
          <Field label="Địa chỉ/điểm hẹn nhận sách">
            <select
              value={form.address_id}
              onChange={(event) => {
                const addressId = event.target.value
                const address = addresses.find((item) => item.id === addressId)
                onFormChange({
                  ...form,
                  address_id: addressId,
                  dropoff_location: address?.address_text || '',
                })
              }}
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label}
                </option>
              ))}
              <option value={customAddressId}>Địa chỉ khác</option>
            </select>
          </Field>
          {useCustomAddress && (
            <Field label="Nhập địa chỉ">
              <input
                required
                value={form.dropoff_location}
                onChange={(event) => onFormChange({ ...form, dropoff_location: event.target.value })}
                placeholder={
                  form.delivery_method === 'volunteer'
                    ? 'Nơi người giao sách mang sách tới'
                    : 'Nơi hai bên tự gặp để nhận sách'
                }
              />
            </Field>
          )}
          <div className="point-check">
            <CircleDollarSign size={18} />
            <span>
              Cần {requiredPoints} điểm, hiện có {account?.points ?? 0} điểm
            </span>
          </div>
          <ActionButton icon={ArrowRightLeft} busy={busy} disabled={!hasEnoughPoints}>
            Gửi yêu cầu
          </ActionButton>
        </form>
      </section>
    </div>
  )
}

export function ReturnDialog({
  transaction,
  book,
  owner,
  borrower,
  addresses,
  form,
  busy,
  onFormChange,
  onClose,
  onSubmit,
}: {
  transaction: BookTransaction
  book?: Book
  owner?: Account
  borrower?: Account
  addresses: AccountAddress[]
  form: ReturnForm
  busy: boolean
  onFormChange: (form: ReturnForm) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const useCustomAddress = form.address_id === customAddressId || addresses.length === 0

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="return-title">
        <div className="dialog-header">
          <div>
            <span className="eyebrow">Hoàn trả sách</span>
            <h2 id="return-title">{book?.title || 'Sách đang mượn'}</h2>
            <p>
              {borrower?.full_name || 'Người mượn'} → {owner?.full_name || 'Chủ sách'}
            </p>
          </div>
          <IconOnlyButton label="Đóng" onClick={onClose}>
            <X size={18} />
          </IconOnlyButton>
        </div>

        <form className="stack-form" onSubmit={onSubmit}>
          <Field label="Cách hoàn trả">
            <select
              value={form.delivery_method}
              onChange={(event) =>
                onFormChange({ ...form, delivery_method: event.target.value as DeliveryMethod })
              }
            >
              <option value="self_pickup">Tự gặp để trả sách</option>
              <option value="volunteer">Nhờ người giao sách lượt về</option>
            </select>
          </Field>
          {form.delivery_method === 'volunteer' && (
            <>
              <Field label="Địa chỉ lấy sách trả">
                <select
                  value={form.address_id}
                  onChange={(event) => {
                    const addressId = event.target.value
                    const address = addresses.find((item) => item.id === addressId)
                    onFormChange({
                      ...form,
                      address_id: addressId,
                      pickup_location: address?.address_text || '',
                    })
                  }}
                >
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label}
                    </option>
                  ))}
                  <option value={customAddressId}>Địa chỉ khác</option>
                </select>
              </Field>
              {useCustomAddress && (
                <Field label="Nhập địa chỉ">
                  <input
                    required
                    value={form.pickup_location}
                    onChange={(event) => onFormChange({ ...form, pickup_location: event.target.value })}
                    placeholder="Nơi người giao sách lấy sách từ người mượn"
                  />
                </Field>
              )}
            </>
          )}
          <div className="dialog-note">
            <MapPin size={16} />
            <span>
              Điểm trả cho chủ sách: {transaction.pickup_location || book?.pickup_location || 'Chưa cập nhật'}
            </span>
          </div>
          <ActionButton icon={PackageCheck} busy={busy}>
            Tạo yêu cầu trả sách
          </ActionButton>
        </form>
      </section>
    </div>
  )
}
