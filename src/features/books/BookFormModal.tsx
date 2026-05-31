import type { FormEvent } from 'react'
import { ImagePlus, Plus, Upload, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { conditionLabels } from '../../shared/constants/labels'
import { customAddressId } from '../../shared/constants/rules'
import { ActionButton, Field, IconOnlyButton } from '../../shared/components'
import type { AccountAddress, BookCondition } from '../../types/domain'
import type { BookForm } from '../../types/forms'

const PREDEFINED_CATEGORIES = [
  'Văn học',
  'Kỹ năng sống / Phát triển bản thân',
  'Kinh tế / Kinh doanh',
  'Công nghệ / Tin học',
  'Khoa học / Đời sống',
  'Nghệ thuật / Thiết kế',
  'Giáo trình / Sách giáo khoa',
  'Ngoại ngữ',
  'Thiếu nhi',
  'Lịch sử / Địa lý',
  'Khác',
]

export function BookFormBody({
  form,
  addresses,
  submitIcon,
  submitLabel,
  busy,
  onFormChange,
  onCancel,
}: {
  form: BookForm
  addresses: AccountAddress[]
  submitIcon: LucideIcon
  submitLabel: string
  busy: boolean
  onFormChange: (value: BookForm) => void
  onCancel: () => void
}) {
  const useCustomPickup = form.address_id === customAddressId || addresses.length === 0
  const selectValue = form.category === '' ? '' : (PREDEFINED_CATEGORIES.includes(form.category) ? form.category : 'Khác')

  return (
    <>
      <label className="cover-picker">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onFormChange({ ...form, cover_file: event.target.files?.[0] || null })}
        />
        <div className="cover-preview">
          {form.cover_image_url ? <img src={form.cover_image_url} alt="" /> : <ImagePlus size={34} />}
        </div>
        <span>
          <Upload size={15} />
          {form.cover_file?.name || 'Ảnh minh họa'}
        </span>
      </label>

      <div className="book-form-fields">
        <Field label="Tên sách">
          <input
            required
            value={form.title}
            onChange={(event) => onFormChange({ ...form, title: event.target.value })}
            placeholder="Tên sách"
          />
        </Field>
        <Field label="Thể loại">
          <select
            required
            value={selectValue}
            onChange={(event) => onFormChange({ ...form, category: event.target.value })}
          >
            <option value="">-- Chọn thể loại --</option>
            {PREDEFINED_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tác giả">
          <input
            required
            value={form.author}
            onChange={(event) => onFormChange({ ...form, author: event.target.value })}
            placeholder="Tên tác giả"
          />
        </Field>
        <Field label="Năm xuất bản">
          <input
            type="number"
            min="1000"
            max="2100"
            value={form.publication_year}
            onChange={(event) => onFormChange({ ...form, publication_year: event.target.value })}
            placeholder="2024"
          />
        </Field>
        <Field label="Tình trạng">
          <select
            value={form.condition}
            onChange={(event) => onFormChange({ ...form, condition: event.target.value as BookCondition })}
          >
            {(Object.keys(conditionLabels) as BookCondition[]).map((condition) => (
              <option key={condition} value={condition}>
                {conditionLabels[condition]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Địa chỉ nhận sách">
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
        {useCustomPickup && (
          <Field label="Nhập địa chỉ">
            <input
              required
              value={form.pickup_location}
              onChange={(event) => onFormChange({ ...form, pickup_location: event.target.value })}
              placeholder="CLB sách, tòa nhà, khu vực"
            />
          </Field>
        )}
        <div className="form-actions">
          <ActionButton icon={submitIcon} busy={busy}>
            {submitLabel}
          </ActionButton>
          <ActionButton type="button" icon={X} variant="secondary" onClick={onCancel}>
            Hủy
          </ActionButton>
        </div>
      </div>
    </>
  )
}

export function BookFormModal({
  addresses,
  form,
  busy,
  onFormChange,
  onClose,
  onSubmit,
}: {
  addresses: AccountAddress[]
  form: BookForm
  busy: boolean
  onFormChange: (value: BookForm) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="dialog book-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-create-title"
      >
        <div className="dialog-header">
          <div>
            <span className="eyebrow">Kho sách</span>
            <h2 id="book-create-title">Thêm sách</h2>
          </div>
          <IconOnlyButton label="Đóng" onClick={onClose}>
            <X size={18} />
          </IconOnlyButton>
        </div>

        <form className="book-form redesigned book-modal-form" onSubmit={onSubmit}>
          <BookFormBody
            form={form}
            addresses={addresses}
            submitIcon={Plus}
            submitLabel="Thêm sách"
            busy={busy}
            onFormChange={onFormChange}
            onCancel={onClose}
          />
        </form>
      </section>
    </div>
  )
}
