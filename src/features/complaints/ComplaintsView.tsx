import type { FormEvent } from 'react'
import {
  MessageSquareWarning,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { complaintStatusLabels, transactionStatusLabels } from '../../shared/constants/labels'
import { ActionButton, EmptyState, Field, StatusPill } from '../../shared/components'
import { accountsFromTransactions, initials } from '../../shared/utils/account'
import { formatDate } from '../../shared/utils/date'
import type { Account, Book, BookTransaction, Complaint } from '../../types/domain'
import type { ComplaintForm } from '../../types/forms'
import './complaints.css'

export function ComplaintsView({
  account,
  complaints,
  transactions,
  accountMap,
  bookMap,
  form,
  busyKey,
  onFormChange,
  onSubmit,
}: {
  account: Account | null
  complaints: Complaint[]
  transactions: BookTransaction[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  form: ComplaintForm
  busyKey: string | null
  onFormChange: (form: ComplaintForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const selectedTransaction = transactions.find((transaction) => transaction.id === form.transaction_id)
  const reportOptions = selectedTransaction
    ? [selectedTransaction.owner_account_id, selectedTransaction.borrower_account_id].filter(
        (id) => id !== account?.id,
      )
    : accountsFromTransactions(transactions, account?.id)

  return (
    <div className="view-stack complaints-grid-container">
      {/* CỘT TRÁI: DANH SÁCH KHIẾU NẠI ĐÃ GỬI */}
      <div style={{ display: 'grid', gap: '16px' }}>
        <section className="tool-panel" style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '16px' }}>Khiếu nại của tôi & hội viên</span>
        </section>

        <div className="entity-list" style={{ marginTop: 0 }}>
          {complaints.map((complaint) => {
            const complainant = accountMap.get(complaint.complainant_account_id)
            const reported = accountMap.get(complaint.reported_account_id || '')
            const transaction = transactions.find((item) => item.id === complaint.transaction_id)
            const book = transaction ? bookMap.get(transaction.book_id) : null

            return (
              <article className="complaint-modern-card" key={complaint.id}>
                {/* Header người khiếu nại & Trạng thái */}
                <div className="complaint-card-header">
                  <div className="complaint-reporter-info">
                    <div className="reporter-avatar-mini">
                      {initials(complainant?.full_name || 'BH')}
                    </div>
                    <div>
                      <h3>{complainant?.full_name || 'Thành viên CLB'}</h3>
                    </div>
                  </div>
                  <StatusPill status={complaint.status}>
                    {complaintStatusLabels[complaint.status]}
                  </StatusPill>
                </div>

                {/* Chi tiết nội dung khiếu nại */}
                <div className="complaint-details-box">
                  {complaint.complaint_details}
                </div>

                {/* Thông tin Metadata phụ */}
                <div className="complaint-meta-row">
                  <div className="meta-item">
                    <User size={14} style={{ color: '#ef4444' }} />
                    <span className="meta-text">
                      Bị báo cáo: <strong>{reported?.full_name || 'Chưa rõ'}</strong>
                    </span>
                  </div>

                  {book && (
                    <div className="meta-item">
                      <BookOpen size={14} style={{ color: '#2563eb' }} />
                      <span className="meta-text">
                        Sách: <strong>{book.title}</strong>
                      </span>
                    </div>
                  )}

                  <div className="meta-item">
                    <Clock size={14} />
                    <span className="meta-text">
                      Gửi lúc: <strong>{formatDate(complaint.created_at)}</strong>
                    </span>
                  </div>
                </div>

                {/* Kết quả xử lý chính thức của Ban quản trị */}
                {complaint.outcome && (
                  <div className="complaint-outcome-banner">
                    <CheckCircle2 size={16} className="outcome-icon" />
                    <div className="outcome-content">
                      <span>Phản hồi từ Ban Quản Trị</span>
                      <p>{complaint.outcome}</p>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
          {complaints.length === 0 && (
            <div className="tool-panel">
              <EmptyState icon={MessageSquareWarning} text="Chưa ghi nhận đơn khiếu nại nào." />
            </div>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: FORM GỬI KHIẾU NẠI MỚI */}
      <section className="complaint-form-panel">
        <span className="eyebrow" style={{ display: 'block', marginBottom: '12px' }}>Tạo khiếu nại mới</span>
        
        {/* Banner hướng dẫn chi tiết */}
        <div className="complaint-guidance-card">
          <AlertTriangle size={18} className="guidance-icon" />
          <div className="guidance-text">
            <p>Nguyên tắc ứng xử CLB</p>
            <span>Hãy cung cấp chi tiết sự việc, mã giao dịch cụ thể để Ban Quản Trị nhanh chóng tiến hành đối soát và bảo vệ quyền lợi chính đáng của bạn.</span>
          </div>
        </div>

        <form className="stack-form" onSubmit={onSubmit}>
          <Field label="Giao dịch phát sinh tranh chấp">
            <select
              value={form.transaction_id}
              onChange={(event) =>
                onFormChange({ ...form, transaction_id: event.target.value, reported_account_id: '' })
              }
            >
              <option value="">Không gắn giao dịch</option>
              {transactions.map((transaction) => (
                <option key={transaction.id} value={transaction.id}>
                  {bookMap.get(transaction.book_id)?.title || 'Sách'} -{' '}
                  {transactionStatusLabels[transaction.status]}
                </option>
              ))}
            </select>
          </Field>
          
          <Field label="Tài khoản bị báo cáo">
            <select
              value={form.reported_account_id}
              onChange={(event) => onFormChange({ ...form, reported_account_id: event.target.value })}
            >
              <option value="">Chưa chọn đối tượng</option>
              {reportOptions.map((accountId) => (
                <option key={accountId} value={accountId}>
                  {accountMap.get(accountId)?.full_name || 'Thành viên'}
                </option>
              ))}
            </select>
          </Field>
          
          <Field label="Mô tả nội dung tranh chấp">
            <textarea
              required
              rows={4}
              value={form.complaint_details}
              onChange={(event) => onFormChange({ ...form, complaint_details: event.target.value })}
              placeholder="Vui lòng trình bày rõ ràng sự việc (Ví dụ: sách bị cũ rách hơn cam kết, không nhận được sách từ shipper, chủ sách không gửi hàng...)"
            />
          </Field>
          
          <div style={{ marginTop: '8px' }}>
            <ActionButton icon={MessageSquareWarning} busy={busyKey === 'complaint-create'} style={{ width: '100%' }}>
              Gửi đơn khiếu nại
            </ActionButton>
          </div>
        </form>
      </section>
    </div>
  )
}
