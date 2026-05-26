import type { FormEvent } from 'react'
import { MessageSquareWarning } from 'lucide-react'
import { complaintStatusLabels, transactionStatusLabels } from '../../shared/constants/labels'
import { ActionButton, EmptyState, Field, PanelHeader, StatusPill } from '../../shared/components'
import { accountsFromTransactions } from '../../shared/utils/account'
import { formatDate } from '../../shared/utils/date'
import type { Account, Book, BookTransaction, Complaint } from '../../types/domain'
import type { ComplaintForm } from '../../types/forms'

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
    <div className="view-stack">
      <section className="tool-panel">
        <PanelHeader icon={MessageSquareWarning} title="Gửi khiếu nại" />
        <form className="book-form complaint-form" onSubmit={onSubmit}>
          <Field label="Giao dịch">
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
              <option value="">Chưa chọn</option>
              {reportOptions.map((accountId) => (
                <option key={accountId} value={accountId}>
                  {accountMap.get(accountId)?.full_name || 'Thành viên'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nội dung">
            <textarea
              required
              rows={4}
              value={form.complaint_details}
              onChange={(event) => onFormChange({ ...form, complaint_details: event.target.value })}
              placeholder="Nội dung khiếu nại"
            />
          </Field>
          <ActionButton icon={MessageSquareWarning} busy={busyKey === 'complaint-create'}>
            Gửi khiếu nại
          </ActionButton>
        </form>
      </section>

      <section className="entity-list">
        {complaints.map((complaint) => (
          <article className="entity-card" key={complaint.id}>
            <div className="entity-main">
              <div className="entity-icon warning">
                <MessageSquareWarning size={22} />
              </div>
              <div>
                <div className="entity-title-row">
                  <h2>{accountMap.get(complaint.complainant_account_id)?.full_name || 'Thành viên'}</h2>
                  <StatusPill status={complaint.status}>{complaintStatusLabels[complaint.status]}</StatusPill>
                </div>
                <p>{complaint.complaint_details}</p>
                <dl className="meta-grid">
                  <div>
                    <dt>Bị báo cáo</dt>
                    <dd>{accountMap.get(complaint.reported_account_id || '')?.full_name || 'Chưa chọn'}</dd>
                  </div>
                  <div>
                    <dt>Tạo lúc</dt>
                    <dd>{formatDate(complaint.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Kết quả</dt>
                    <dd>{complaint.outcome || 'Chưa có'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </article>
        ))}
        {complaints.length === 0 && <EmptyState icon={MessageSquareWarning} text="Chưa có khiếu nại." />}
      </section>
    </div>
  )
}
