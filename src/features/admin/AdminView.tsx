import { useState } from 'react'
import { ArrowRightLeft, BookOpen, Check, MessageSquareWarning, UserRound } from 'lucide-react'
import { complaintStatusLabels, roleLabels } from '../../shared/constants/labels'
import { ActionButton, EmptyState, PanelHeader, StatCard, StatusPill } from '../../shared/components'
import type { Account, Book, BookTransaction, Complaint, ComplaintStatus } from '../../types/domain'

export function AdminView({
  accounts,
  books,
  transactions,
  complaints,
  accountMap,
  bookMap,
  busyKey,
  onUpdateComplaint,
}: {
  accounts: Account[]
  books: Book[]
  transactions: BookTransaction[]
  complaints: Complaint[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  busyKey: string | null
  onUpdateComplaint: (complaintId: string, status: ComplaintStatus, outcome: string) => void
}) {
  const [complaintDrafts, setComplaintDrafts] = useState<
    Record<string, { status: ComplaintStatus; outcome: string }>
  >({})

  function draftFor(complaint: Complaint) {
    return (
      complaintDrafts[complaint.id] || {
        status: complaint.status,
        outcome: complaint.outcome || '',
      }
    )
  }

  return (
    <div className="view-stack">
      <section className="stats-grid">
        <StatCard icon={UserRound} label="Thành viên" value={accounts.length} tone="green" />
        <StatCard icon={BookOpen} label="Sách" value={books.length} tone="blue" />
        <StatCard icon={ArrowRightLeft} label="Giao dịch" value={transactions.length} tone="amber" />
        <StatCard icon={MessageSquareWarning} label="Khiếu nại" value={complaints.length} tone="neutral" />
      </section>

      <section className="tool-panel">
        <PanelHeader icon={UserRound} title="Thành viên" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Điểm</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((item) => (
                <tr key={item.id}>
                  <td>{item.full_name}</td>
                  <td>{item.email_address}</td>
                  <td>{roleLabels[item.role]}</td>
                  <td>{item.points}</td>
                  <td>{item.status ? 'Hoạt động' : 'Khóa'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tool-panel">
        <PanelHeader icon={MessageSquareWarning} title="Xử lý khiếu nại" />
        <div className="entity-list compact">
          {complaints.map((complaint) => {
            const draft = draftFor(complaint)
            const transaction = transactions.find((item) => item.id === complaint.transaction_id)

            return (
              <article className="entity-card" key={complaint.id}>
                <div className="entity-main">
                  <div className="entity-icon warning">
                    <MessageSquareWarning size={22} />
                  </div>
                  <div>
                    <div className="entity-title-row">
                      <h2>{accountMap.get(complaint.complainant_account_id)?.full_name || 'Thành viên'}</h2>
                      <StatusPill status={complaint.status}>
                        {complaintStatusLabels[complaint.status]}
                      </StatusPill>
                    </div>
                    <p>{complaint.complaint_details}</p>
                    <dl className="meta-grid">
                      <div>
                        <dt>Sách</dt>
                        <dd>
                          {transaction ? bookMap.get(transaction.book_id)?.title || 'Sách' : 'Không gắn'}
                        </dd>
                      </div>
                      <div>
                        <dt>Bị báo cáo</dt>
                        <dd>
                          {accountMap.get(complaint.reported_account_id || '')?.full_name || 'Chưa chọn'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="admin-complaint-form">
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      setComplaintDrafts({
                        ...complaintDrafts,
                        [complaint.id]: {
                          ...draft,
                          status: event.target.value as ComplaintStatus,
                        },
                      })
                    }
                  >
                    {(Object.keys(complaintStatusLabels) as ComplaintStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {complaintStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <input
                    value={draft.outcome}
                    onChange={(event) =>
                      setComplaintDrafts({
                        ...complaintDrafts,
                        [complaint.id]: {
                          ...draft,
                          outcome: event.target.value,
                        },
                      })
                    }
                    placeholder="Kết quả xử lý"
                  />
                  <ActionButton
                    type="button"
                    icon={Check}
                    busy={busyKey === `complaint-${complaint.id}`}
                    onClick={() => onUpdateComplaint(complaint.id, draft.status, draft.outcome)}
                  >
                    Lưu
                  </ActionButton>
                </div>
              </article>
            )
          })}
          {complaints.length === 0 && <EmptyState icon={MessageSquareWarning} text="Chưa có khiếu nại." />}
        </div>
      </section>
    </div>
  )
}
