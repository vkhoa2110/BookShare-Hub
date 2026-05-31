import { useState } from 'react'
import { ArrowRightLeft, BookOpen, Check, MessageSquareWarning, UserRound, Search, Pencil, Trash2, X, Handshake, Library, ShieldAlert } from 'lucide-react'
import {
  bookStatusLabels,
  complaintStatusLabels,
  conditionLabels,
  roleLabels,
} from '../../shared/constants/labels'
import { ActionButton, EmptyState, PanelHeader, StatCard, StatusPill, IconOnlyButton, Field } from '../../shared/components'
import type { Account, Book, BookTransaction, Complaint, ComplaintStatus } from '../../types/domain'
import './admin.css'
import { formatDate } from '../../shared/utils/date'

import type { View } from '../../types/forms'

type AdminSubTab = 'overview' | 'members' | 'books' | 'complaints'

export function AdminView({
  subView = 'admin-overview',
  accounts,
  books,
  transactions,
  complaints,
  accountMap,
  bookMap,
  busyKey,
  onUpdateComplaint,
  onTabChange,
  onDeleteBook,
  onEditBook,
  onUpdateAccount,
  onDeleteAccount,
}: {
  subView?: string
  accounts: Account[]
  books: Book[]
  transactions: BookTransaction[]
  complaints: Complaint[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  busyKey: string | null
  onUpdateComplaint: (complaintId: string, status: ComplaintStatus, outcome: string) => void
  onTabChange: (view: View) => void
  onDeleteBook: (bookId: string) => void
  onEditBook: (book: Book) => void
  onUpdateAccount: (
    accountId: string,
    payload: {
      full_name: string
      phone_number: string | null
      role: 'member' | 'volunteer' | 'admin'
      points: number
      status: boolean
    }
  ) => Promise<boolean>
  onDeleteAccount: (accountId: string) => void
}) {
  const activeTab = subView === 'admin' || subView === 'admin-overview'
    ? 'overview'
    : (subView.replace('admin-', '') as AdminSubTab)

  const setActiveTab = (tab: AdminSubTab) => {
    onTabChange(`admin-${tab}` as View)
  }

  // Bộ lọc cho Thành viên
  const [memberSearch, setMemberSearch] = useState('')
  const [memberRoleFilter, setMemberRoleFilter] = useState('all')
  const [memberStatusFilter, setMemberStatusFilter] = useState('all')

  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountForm, setAccountForm] = useState({
    full_name: '',
    phone_number: '',
    role: 'member' as 'member' | 'volunteer' | 'admin',
    points: 0,
    status: true,
  })

  const startEditAccount = (account: Account) => {
    setEditingAccount(account)
    setAccountForm({
      full_name: account.full_name,
      phone_number: account.phone_number || '',
      role: account.role,
      points: account.points,
      status: account.status,
    })
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return

    const succeeded = await onUpdateAccount(editingAccount.id, {
      full_name: accountForm.full_name.trim(),
      phone_number: accountForm.phone_number.trim() || null,
      role: accountForm.role,
      points: Number(accountForm.points),
      status: accountForm.status,
    })

    if (succeeded) {
      setEditingAccount(null)
    }
  }

  // Bộ lọc cho Kho Sách
  const [bookSearch, setBookSearch] = useState('')
  const [bookConditionFilter, setBookConditionFilter] = useState('all')
  const [bookStatusFilter, setBookStatusFilter] = useState('all')

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

  // Xử lý bộ lọc Thành viên
  const filteredAccounts = accounts.filter((item) => {
    const matchesSearch =
      item.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      item.email_address.toLowerCase().includes(memberSearch.toLowerCase())

    const matchesRole = memberRoleFilter === 'all' || item.role === memberRoleFilter
    const matchesStatus =
      memberStatusFilter === 'all' ||
      (memberStatusFilter === 'active' && item.status) ||
      (memberStatusFilter === 'locked' && !item.status)

    return matchesSearch && matchesRole && matchesStatus
  })

  // Xử lý bộ lọc Sách
  const filteredBooks = books.filter((item) => {
    const ownerName = accountMap.get(item.owner_account_id)?.full_name || ''
    const matchesSearch =
      item.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      item.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(bookSearch.toLowerCase()) ||
      ownerName.toLowerCase().includes(bookSearch.toLowerCase())

    const matchesCondition = bookConditionFilter === 'all' || item.condition === bookConditionFilter
    const matchesStatus = bookStatusFilter === 'all' || item.status === bookStatusFilter

    return matchesSearch && matchesCondition && matchesStatus
  })

  return (
    <div className="view-stack">


      {/* PHÂN HỆ: TỔNG QUAN */}
      {activeTab === 'overview' && (
        <>
          <div className="dashboard-section-header" style={{ marginTop: 0 }}>
            <h2>Số liệu vận hành hệ thống</h2>
            <p>Tổng quan các thống kê số lượng thành viên, sách, giao dịch và khiếu nại trong câu lạc bộ</p>
          </div>

          <section className="stats-grid">
            <div className="clickable-stat-card" onClick={() => setActiveTab('members')}>
              <StatCard icon={UserRound} label="Thành viên" value={accounts.length} tone="blue" />
            </div>
            <div className="clickable-stat-card" onClick={() => setActiveTab('books')}>
              <StatCard icon={Library} label="Sách" value={books.length} tone="green" />
            </div>
            <div className="clickable-stat-card">
              <StatCard icon={Handshake} label="Giao dịch" value={transactions.length} tone="purple" />
            </div>
            <div className="clickable-stat-card" onClick={() => setActiveTab('complaints')}>
              <StatCard icon={ShieldAlert} label="Khiếu nại" value={complaints.length} tone="red" />
            </div>
          </section>

          <div className="dashboard-section-header">
            <h2>Hoạt động & Đóng góp thành viên</h2>
            <p>Giám sát giao dịch trao đổi sách thời gian thực và danh sách xếp hạng các đóng góp tích cực</p>
          </div>

          <div className="dashboard-grid-two-col">
            {/* Cột trái: Giao dịch gần đây */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <ArrowRightLeft size={18} />
                  <h3>Giao dịch gần đây</h3>
                </div>
              </div>
              <div className="table-wrap" style={{ margin: 0, border: 'none' }}>
                {transactions.length === 0 ? (
                  <EmptyState icon={ArrowRightLeft} text="Chưa có giao dịch nào." />
                ) : (
                  <table style={{ fontSize: '0.8125rem' }}>
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Sách</th>
                        <th>Chủ sách</th>
                        <th>Người mượn</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...transactions].slice(0, 5).map((item) => {
                        const book = bookMap.get(item.book_id)
                        return (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 700 }}>#{item.id.slice(0, 8)}</td>
                            <td>
                              <span style={{ fontWeight: 600 }}>{book?.title || 'Sách'}</span>
                            </td>
                            <td>{accountMap.get(item.owner_account_id)?.full_name || 'Chủ sách'}</td>
                            <td>{accountMap.get(item.borrower_account_id)?.full_name || 'Người mượn'}</td>
                            <td>
                              <StatusPill status={item.status}>
                                {item.status === 'requested'
                                  ? 'Đang yêu cầu'
                                  : item.status === 'accepted'
                                  ? 'Đã duyệt'
                                  : item.status === 'delivered'
                                  ? 'Đã giao'
                                  : item.status === 'completed'
                                  ? 'Hoàn thành'
                                  : item.status === 'rejected'
                                  ? 'Từ chối'
                                  : item.status === 'return_requested'
                                  ? 'Yêu cầu trả'
                                  : item.status}
                              </StatusPill>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Cột phải: Thành viên tích cực */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <UserRound size={18} />
                  <h3>Đóng góp tích cực</h3>
                </div>
                <button type="button" className="dashboard-card-link" onClick={() => setActiveTab('members')}>
                  Xem tất cả
                </button>
              </div>
              <div className="dashboard-list">
                {[...accounts]
                  .sort((a, b) => b.points - a.points)
                  .slice(0, 5)
                  .map((item, idx) => {
                    const initialsLabel = item.full_name
                      .split(' ')
                      .slice(-2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'TV'
                    
                    const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other'

                    return (
                      <div className="dashboard-list-item" key={item.id}>
                        <span className={`rank-badge ${rankClass}`}>{idx + 1}</span>
                        <div className="member-rank-avatar">{initialsLabel}</div>
                        <div className="member-rank-info">
                          <span className="name">{item.full_name}</span>
                          <span className="email">{item.email_address}</span>
                        </div>
                        <span className="member-rank-points">{item.points}đ</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          <div className="dashboard-section-header">
            <h2>Kiểm duyệt nội dung & Khiếu nại</h2>
            <p>Xem sách mới đưa lên kệ để kiểm duyệt và nhanh chóng xử lý các khiếu nại tranh chấp phát sinh</p>
          </div>

          <div className="dashboard-grid-equal-col">
            {/* Cột trái: Sách mới cập nhật */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <BookOpen size={18} />
                  <h3>Sách mới đăng gần đây</h3>
                </div>
                <button type="button" className="dashboard-card-link" onClick={() => setActiveTab('books')}>
                  Xem tất cả
                </button>
              </div>
              <div className="table-wrap" style={{ margin: 0, border: 'none' }}>
                {books.length === 0 ? (
                  <EmptyState icon={BookOpen} text="Chưa có sách nào được đăng." />
                ) : (
                  <table style={{ fontSize: '0.8125rem' }}>
                    <thead>
                      <tr>
                        <th>Tên sách</th>
                        <th>Thể loại</th>
                        <th>Chủ sách</th>
                        <th>Tình trạng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...books].slice(0, 5).map((item) => {
                        const owner = accountMap.get(item.owner_account_id)
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="flex-align-center">
                                {item.cover_image_url ? (
                                  <img
                                    src={item.cover_image_url}
                                    alt={`Bìa ${item.title}`}
                                    className="book-cover-mini"
                                    style={{ width: '24px', height: '32px' }}
                                  />
                                ) : (
                                  <div className="book-cover-mini flex-align-center" style={{ width: '24px', height: '32px', justifyContent: 'center', fontSize: '0.5rem', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>N/A</div>
                                )}
                                <span style={{ fontWeight: 700 }}>{item.title}</span>
                              </div>
                            </td>
                            <td>{item.category}</td>
                            <td>{owner?.full_name || 'Chủ sách'}</td>
                            <td>
                              <span className={`condition-tag ${item.condition}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                {item.condition === 'new' ? 'Mới' : item.condition === 'good' ? 'Tốt' : item.condition === 'used' ? 'Đã dùng' : 'Cũ'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Cột phải: Khiếu nại chưa xử lý */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <MessageSquareWarning size={18} />
                  <h3>Khiếu nại chưa xử lý</h3>
                </div>
                <button type="button" className="dashboard-card-link" onClick={() => setActiveTab('complaints')}>
                  Xem tất cả
                </button>
              </div>
              <div className="dashboard-list">
                {complaints.filter((c) => c.status === 'open' || c.status === 'reviewing').length === 0 ? (
                  <EmptyState icon={MessageSquareWarning} text="Tuyệt vời! Không có khiếu nại chưa xử lý." />
                ) : (
                  complaints
                    .filter((c) => c.status === 'open' || c.status === 'reviewing')
                    .slice(0, 3)
                    .map((item) => {
                      const complainant = accountMap.get(item.complainant_account_id)
                      const reported = accountMap.get(item.reported_account_id || '')
                      return (
                        <div className="complaint-overview-card" key={item.id}>
                          <div className="header-row">
                            <span>Người báo cáo: {complainant?.full_name || 'Thành viên'}</span>
                            <StatusPill status={item.status}>
                              {item.status === 'open' ? 'Chờ xử lý' : 'Đang xử lý'}
                            </StatusPill>
                          </div>
                          <p className="details">{item.complaint_details}</p>
                          <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
                            Đối tượng bị báo cáo: {reported?.full_name || 'Chưa rõ'}
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* PHÂN HỆ: QUẢN TRỊ THÀNH VIÊN */}
      {activeTab === 'members' && (
        <section className="tool-panel">
          <PanelHeader icon={UserRound} title="Quản trị Thành viên" />
          
          {/* Thanh tìm kiếm & lọc thành viên */}
          <div className="admin-panel-filters">
            <div className="search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm theo họ tên, email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filters-group">
              <div className="filter-item">
                <label>Vai trò:</label>
                <select value={memberRoleFilter} onChange={(e) => setMemberRoleFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="member">Thành viên</option>
                  <option value="volunteer">Người giao sách</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div className="filter-item">
                <label>Trạng thái:</label>
                <select value={memberStatusFilter} onChange={(e) => setMemberStatusFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="locked">Bị khóa</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-wrap">
            {filteredAccounts.length === 0 ? (
              <EmptyState icon={UserRound} text="Không tìm thấy thành viên nào khớp bộ lọc." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Điểm</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.full_name}</td>
                      <td>{item.email_address}</td>
                      <td>
                        <span className={`role-badge ${item.role}`}>
                          {roleLabels[item.role]}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#4f46e5' }}>{item.points}</td>
                      <td>
                        <StatusPill status={item.status ? 'active' : 'locked'}>
                          {item.status ? 'Hoạt động' : 'Khóa'}
                        </StatusPill>
                      </td>
                      <td>
                        <div className="flex-align-center" style={{ gap: '6px' }}>
                          <IconOnlyButton
                            label="Sửa thành viên"
                            onClick={() => startEditAccount(item)}
                          >
                            <Pencil size={15} style={{ color: '#4f46e5' }} />
                          </IconOnlyButton>
                          <IconOnlyButton
                            label="Xóa thành viên"
                            onClick={() => onDeleteAccount(item.id)}
                            busy={busyKey === `account-delete-${item.id}`}
                          >
                            <Trash2 size={15} style={{ color: '#dc2626' }} />
                          </IconOnlyButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* PHÂN HỆ: QUẢN TRỊ KHO SÁCH */}
      {activeTab === 'books' && (
        <section className="tool-panel">
          <PanelHeader icon={BookOpen} title="Quản trị Kho Sách" />
          
          {/* Thanh tìm kiếm & lọc sách */}
          <div className="admin-panel-filters">
            <div className="search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm theo tên sách, tác giả, chủ sách, thể loại..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filters-group">
              <div className="filter-item">
                <label>Tình trạng:</label>
                <select value={bookConditionFilter} onChange={(e) => setBookConditionFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="new">Mới</option>
                  <option value="good">Tốt</option>
                  <option value="used">Đã dùng</option>
                  <option value="worn">Cũ</option>
                </select>
              </div>
              <div className="filter-item">
                <label>Trạng thái sách:</label>
                <select value={bookStatusFilter} onChange={(e) => setBookStatusFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="available">Có sẵn</option>
                  <option value="negotiating">Đang giao dịch</option>
                  <option value="exchanged">Đã trao đổi</option>
                  <option value="borrowed">Đang cho mượn</option>
                  <option value="returned">Đã trả</option>
                  <option value="hidden">Đã ẩn</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-wrap">
            {filteredBooks.length === 0 ? (
              <EmptyState icon={BookOpen} text="Không tìm thấy sách nào khớp bộ lọc." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Thông tin Sách</th>
                    <th>Tác giả</th>
                    <th>Thể loại</th>
                    <th>Chủ sở hữu</th>
                    <th>Tình trạng</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((item) => {
                    const owner = accountMap.get(item.owner_account_id)
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="flex-align-center">
                            {item.cover_image_url ? (
                              <img
                                src={item.cover_image_url}
                                alt={`Bìa ${item.title}`}
                                className="book-cover-mini"
                              />
                            ) : (
                              <div className="book-cover-mini flex-align-center" style={{ justifyContent: 'center', fontSize: '0.65rem', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>N/A</div>
                            )}
                            <span className="book-title-mini">{item.title}</span>
                          </div>
                        </td>
                        <td>{item.author}</td>
                        <td>{item.category}</td>
                        <td style={{ fontWeight: 600 }}>{owner?.full_name || 'Chủ sách'}</td>
                        <td>
                          <span className={`condition-tag ${item.condition}`}>
                            {conditionLabels[item.condition]}
                          </span>
                        </td>
                        <td>
                          <StatusPill status={item.status}>
                            {bookStatusLabels[item.status]}
                          </StatusPill>
                          {item.status === 'borrowed' && (() => {
                            const activeTx = transactions?.find(
                              (t) => t.book_id === item.id && ['completed', 'return_requested'].includes(t.status)
                            )
                            return activeTx?.return_due_at ? (
                              <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, marginTop: '4px' }}>
                                Hạn trả: {formatDate(activeTx.return_due_at)}
                              </div>
                            ) : null
                          })()}
                        </td>
                        <td>
                          <div className="flex-align-center" style={{ gap: '6px' }}>
                            <IconOnlyButton
                              label="Sửa sách"
                              onClick={() => onEditBook(item)}
                            >
                              <Pencil size={15} style={{ color: '#4f46e5' }} />
                            </IconOnlyButton>
                            <IconOnlyButton
                              label="Xóa sách"
                              onClick={() => onDeleteBook(item.id)}
                              busy={busyKey === `book-delete-${item.id}`}
                            >
                              <Trash2 size={15} style={{ color: '#dc2626' }} />
                            </IconOnlyButton>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* PHÂN HỆ: XỬ LÝ KHIẾU NẠI */}
      {activeTab === 'complaints' && (
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
      )}
      {/* DIALOG SỬA THÀNH VIÊN */}
      {editingAccount && (
        <div className="dialog-backdrop" role="presentation">
          <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="member-edit-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-header">
              <div>
                <span className="eyebrow">Quản trị thành viên</span>
                <h2 id="member-edit-title">Sửa thông tin</h2>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem' }}>{editingAccount.email_address}</p>
              </div>
              <IconOnlyButton label="Đóng" onClick={() => setEditingAccount(null)}>
                <X size={18} />
              </IconOnlyButton>
            </div>
            <form className="stack-form" onSubmit={handleSaveAccount}>
              <Field label="Họ tên">
                <input
                  required
                  value={accountForm.full_name}
                  onChange={(e) => setAccountForm({ ...accountForm, full_name: e.target.value })}
                />
              </Field>
              <Field label="Số điện thoại">
                <input
                  value={accountForm.phone_number}
                  onChange={(e) => setAccountForm({ ...accountForm, phone_number: e.target.value })}
                  placeholder="Chưa cập nhật"
                />
              </Field>
              <Field label="Vai trò">
                <select
                  value={accountForm.role}
                  onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value as 'member' | 'volunteer' | 'admin' })}
                >
                  <option value="member">Thành viên</option>
                  <option value="volunteer">Người giao sách</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </Field>
              <Field label="Số điểm">
                <input
                  required
                  type="number"
                  min={0}
                  value={accountForm.points}
                  onChange={(e) => setAccountForm({ ...accountForm, points: Number(e.target.value) })}
                />
              </Field>
              <Field label="Trạng thái hoạt động">
                <select
                  value={accountForm.status ? 'active' : 'locked'}
                  onChange={(e) => setAccountForm({ ...accountForm, status: e.target.value === 'active' })}
                >
                  <option value="active">Hoạt động</option>
                  <option value="locked">Bị khóa</option>
                </select>
              </Field>
              <div className="form-actions">
                <ActionButton icon={Check} busy={busyKey === `account-update-${editingAccount.id}`}>
                  Lưu thay đổi
                </ActionButton>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
