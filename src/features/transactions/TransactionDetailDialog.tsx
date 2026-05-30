import {
  Check,
  PackageCheck,
  Truck,
  X,
  MapPin,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  History,
  AlertTriangle,
} from 'lucide-react'
import {
  deliveryStatusLabels,
  deliveryTypeLabels,
  transactionTypeLabels,
  deliveryMethodLabels,
} from '../../shared/constants/labels'
import { pointRule } from '../../shared/constants/rules'
import { ActionButton, IconOnlyButton } from '../../shared/components'
import { formatDate } from '../../shared/utils/date'
import type { LucideIcon } from 'lucide-react'
import type { Account, Book, BookTransaction, Delivery } from '../../types/domain'

interface Step {
  id: number
  label: string
  icon: LucideIcon
  isCompleted: boolean
  isActive: boolean
  isWarning?: boolean
}

export function TransactionDetailDialog({
  transaction,
  book,
  owner,
  borrower,
  account,
  deliveries,
  accountMap,
  busyKey,
  onClose,
  onAccept,
  onReject,
  onConfirm,
  onRequestReturn,
  onConfirmReturn,
}: {
  transaction: BookTransaction
  book?: Book
  owner?: Account
  borrower?: Account
  account: Account | null
  deliveries: Delivery[]
  accountMap?: Map<string, Account>
  busyKey: string | null
  onClose: () => void
  onAccept: () => void
  onReject: () => void
  onConfirm: () => void
  onRequestReturn: () => void
  onConfirmReturn: () => void
}) {
  const isOwner = transaction.owner_account_id === account?.id
  const isBorrower = transaction.borrower_account_id === account?.id
  const outboundDeliveries = deliveries.filter((delivery) => delivery.delivery_type === 'outbound')
  const hasPendingReturnDelivery = deliveries.some(
    (delivery) =>
      delivery.delivery_type === 'return' && !['delivered', 'cancelled'].includes(delivery.status),
  )
  const hasPendingOutboundDelivery = outboundDeliveries.some((delivery) => delivery.status !== 'delivered')

  const canConfirmReceipt =
    isBorrower &&
    ((transaction.delivery_method === 'self_pickup' && transaction.status === 'accepted') ||
      (transaction.delivery_method === 'volunteer' &&
        transaction.status === 'delivered' &&
        !hasPendingOutboundDelivery))
  const canRequestReturn =
    isBorrower && transaction.transaction_type === 'borrow' && transaction.status === 'completed'
  const canConfirmReturn =
    isOwner && transaction.transaction_type === 'borrow' && transaction.status === 'return_requested'

  // Trạng thái đơn để vẽ stepper
  const status = transaction.status
  const isRequested = status === 'requested'
  const isAccepted = status === 'accepted'
  const isRejected = status === 'rejected'
  const isCancelled = status === 'cancelled'
  const isDelivered = status === 'delivered'
  const isCompleted = status === 'completed'
  const isReturnRequested = status === 'return_requested'
  const isReturned = status === 'returned'

  const isExchange = transaction.transaction_type === 'exchange'
  const steps: Step[] = []

  if (isExchange) {
    steps.push({
      id: 1,
      label: 'Yêu cầu',
      icon: FileText,
      isCompleted: true,
      isActive: isRequested,
    })
    steps.push({
      id: 2,
      label: isRejected ? 'Từ chối' : isCancelled ? 'Đã hủy' : 'Duyệt đơn',
      icon: isRejected || isCancelled ? X : CheckCircle2,
      isCompleted: !isRequested && !isRejected && !isCancelled,
      isActive: isAccepted || isRejected || isCancelled,
      isWarning: isRejected || isCancelled,
    })
    steps.push({
      id: 3,
      label: 'Giao nhận',
      icon: Truck,
      isCompleted: isDelivered || isCompleted,
      isActive: isDelivered && !isRejected && !isCancelled,
    })
    steps.push({
      id: 4,
      label: 'Hoàn tất',
      icon: PackageCheck,
      isCompleted: isCompleted,
      isActive: isCompleted && !isRejected && !isCancelled,
    })
  } else {
    steps.push({
      id: 1,
      label: 'Yêu cầu',
      icon: FileText,
      isCompleted: true,
      isActive: isRequested,
    })
    steps.push({
      id: 2,
      label: isRejected ? 'Từ chối' : isCancelled ? 'Đã hủy' : 'Duyệt đơn',
      icon: isRejected || isCancelled ? X : CheckCircle2,
      isCompleted: !isRequested && !isRejected && !isCancelled,
      isActive: isAccepted || isRejected || isCancelled,
      isWarning: isRejected || isCancelled,
    })
    steps.push({
      id: 3,
      label: 'Giao nhận',
      icon: Truck,
      isCompleted: isDelivered || isCompleted || isReturnRequested || isReturned,
      isActive: isDelivered && !isRejected && !isCancelled,
    })
    steps.push({
      id: 4,
      label: 'Đang mượn',
      icon: BookOpen,
      isCompleted: isCompleted || isReturnRequested || isReturned,
      isActive: isCompleted && !isRejected && !isCancelled,
    })
    steps.push({
      id: 5,
      label: isReturnRequested ? 'Chờ trả' : 'Đã trả',
      icon: History,
      isCompleted: isReturned,
      isActive: isReturnRequested || isReturned,
    })
  }

  // Tính tiến độ thanh kết nối
  const completedProgress =
    steps.length > 1
      ? ((steps.filter((s) => s.isCompleted).length - 1) / (steps.length - 1)) * 100
      : 0

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.trim().split(' ').pop()?.charAt(0).toUpperCase() || '?'
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="dialog-header">
          <div>
            <span className="eyebrow">Giao dịch</span>
            <h2 id="detail-title">Chi tiết giao dịch</h2>
          </div>
          <IconOnlyButton label="Đóng" onClick={onClose}>
            <X size={18} />
          </IconOnlyButton>
        </div>

        {/* Thanh trạng thái Stepper trực quan */}
        <div className="transaction-stepper-container">
          <div className="transaction-stepper">
            <div
              className="stepper-progress-line"
              style={{ width: `${completedProgress}%` }}
            ></div>
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={`stepper-step ${step.isCompleted ? 'completed' : ''} ${
                    step.isActive ? 'active' : ''
                  } ${step.isWarning ? 'warning' : ''}`}
                >
                  <div className="step-circle" title={step.label}>
                    <Icon size={16} />
                  </div>
                  <span className="step-label">{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="detail-content">
          {/* Thông báo đặc biệt nếu giao dịch bị hủy hoặc từ chối */}
          {(isRejected || isCancelled) && (
            <div className="status-notice-banner warning">
              <AlertTriangle size={20} className="banner-icon" />
              <div>
                <strong>Giao dịch {isRejected ? 'đã bị từ chối' : 'đã bị hủy'}</strong>
                <p>Giao dịch này không thể tiếp tục thực hiện.</p>
              </div>
            </div>
          )}

          {/* Sơ đồ giao nhận Chủ sách -> Người nhận */}
          <div className="transaction-flow-card">
            <div className="user-profile-box">
              <div className="user-avatar-bubble owner">
                {getInitials(owner?.full_name)}
              </div>
              <div className="user-info">
                <span className="user-role">Chủ sở hữu (Người giao)</span>
                <span className="user-name">{owner?.full_name || 'Chủ sách'}</span>
              </div>
            </div>
            <div className="flow-arrow-container">
              <div className="flow-line"></div>
              <ArrowRight size={20} className="flow-arrow-icon" />
            </div>
            <div className="user-profile-box">
              <div className="user-avatar-bubble borrower">
                {getInitials(borrower?.full_name)}
              </div>
              <div className="user-info">
                <span className="user-role">Người nhận (Người mượn)</span>
                <span className="user-name">{borrower?.full_name || 'Người nhận'}</span>
              </div>
            </div>
          </div>

          {/* Bố cục chính hai cột */}
          <div className="detail-main-layout">
            {/* Cột trái: Thông tin sách & Thẻ bên lề */}
            <div className="detail-sidebar">
              <div className="book-sidebar-card">
                <div className="book-sidebar-cover">
                  {book?.cover_image_url ? (
                    <img src={book.cover_image_url} alt={`Bìa ${book.title}`} />
                  ) : (
                    <div className="book-cover--placeholder">No Image</div>
                  )}
                  {book?.condition && (
                    <span className={`book-condition-badge ${book.condition}`} data-condition={book.condition}>
                      {book.condition === 'new'
                        ? 'Mới'
                        : book.condition === 'good'
                        ? 'Tốt'
                        : book.condition === 'used'
                        ? 'Đã dùng'
                        : 'Cũ'}
                    </span>
                  )}
                </div>

                <div className="book-sidebar-details">
                  <h4 className="book-sidebar-title">{book?.title || 'Sách đã xóa'}</h4>

                  <div className="book-sidebar-row">
                    <span className="label">Tác giả:</span>
                    <span className="value">{book?.author || 'Không rõ'}</span>
                  </div>
                  <div className="book-sidebar-row">
                    <span className="label">Thể loại:</span>
                    <span className="value">{book?.category || 'Chưa phân loại'}</span>
                  </div>
                  {book?.publication_year && (
                    <div className="book-sidebar-row">
                      <span className="label">Năm XB:</span>
                      <span className="value">{book.publication_year}</span>
                    </div>
                  )}
                </div>

                <div className="book-sidebar-footer">
                  <div className={`sidebar-badge transaction-type ${transaction.transaction_type}`}>
                    <BookOpen size={13} />
                    <span>{transactionTypeLabels[transaction.transaction_type]}</span>
                  </div>
                  <div className="sidebar-badge transaction-points">
                    <Coins size={13} />
                    <span>+{pointRule[transaction.transaction_type]} Điểm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin giao nhận, Mốc thời gian, Hành trình vận chuyển */}
            <div className="detail-main-info">
              {/* Thẻ địa điểm giao nhận */}
              <div className="info-section-card">
                <div className="card-header">
                  <MapPin size={16} className="card-icon text-indigo" />
                  <h3>Địa điểm & Giao nhận</h3>
                </div>
                <dl className="card-grid">
                  <div>
                    <dt>Phương thức giao nhận</dt>
                    <dd className="badge-value">{deliveryMethodLabels[transaction.delivery_method]}</dd>
                  </div>
                  {transaction.delivery_method === 'volunteer' && (
                    <div>
                      <dt>Người giao sách</dt>
                      <dd>
                        {(() => {
                          const activeDelivery = deliveries.find(
                            (d) =>
                              (transaction.status === 'return_requested' && d.delivery_type === 'return') ||
                              (transaction.status !== 'return_requested' && d.delivery_type === 'outbound')
                          )
                          const volId = activeDelivery?.volunteer_account_id
                          const volAccount = volId && accountMap ? accountMap.get(volId) : null
                          return volAccount ? (
                            <span className="volunteer-name-display">{volAccount.full_name}</span>
                          ) : (
                            <span className="volunteer-pending-display">Đang chờ nhận đơn...</span>
                          )
                        })()}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Lấy sách từ chủ sở hữu</dt>
                    <dd>{transaction.pickup_location || book?.pickup_location || 'Chưa cập nhật'}</dd>
                  </div>
                  {transaction.dropoff_location && (
                    <div className="full-width">
                      <dt>Nhận sách tại</dt>
                      <dd className="highlight-dropoff">{transaction.dropoff_location}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Thẻ mốc thời gian */}
              <div className="info-section-card">
                <div className="card-header">
                  <Clock size={16} className="card-icon text-amber" />
                  <h3>Mốc thời gian</h3>
                </div>
                <dl className="card-grid">
                  <div className="full-width">
                    <dt>Mã giao dịch</dt>
                    <dd style={{ marginTop: '0.125rem' }}><code className="header-tx-id">{transaction.id}</code></dd>
                  </div>
                  <div>
                    <dt>Ngày tạo yêu cầu</dt>
                    <dd>{formatDate(transaction.created_at)}</dd>
                  </div>
                  {transaction.return_due_at && (
                    <div>
                      <dt className="text-warning-label">Hạn trả sách</dt>
                      <dd className="text-warning-value">{formatDate(transaction.return_due_at)}</dd>
                    </div>
                  )}
                  {transaction.owner_confirmed_at && (
                    <div>
                      <dt>Ngày xác nhận</dt>
                      <dd>{formatDate(transaction.owner_confirmed_at)}</dd>
                    </div>
                  )}
                  {transaction.borrower_confirmed_at && (
                    <div>
                      <dt>Ngày hoàn tất</dt>
                      <dd>{formatDate(transaction.borrower_confirmed_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Trục hành trình giao hàng dọc */}
              {deliveries.length > 0 && (
                <div className="info-section-card">
                  <div className="card-header">
                    <Truck size={16} className="card-icon text-blue" />
                    <h3>Hành trình giao nhận</h3>
                  </div>
                  <div className="vertical-delivery-timeline">
                    {deliveries.map((delivery, index) => {
                      const volunteer = delivery.volunteer_account_id && accountMap
                        ? accountMap.get(delivery.volunteer_account_id)
                        : null
                      return (
                        <div key={delivery.id} className="timeline-node">
                          {index < deliveries.length - 1 && <div className="timeline-connector"></div>}
                          <div className={`timeline-dot-wrapper ${delivery.status}`}>
                            <Truck size={14} />
                          </div>
                          <div className="timeline-info">
                            <div className="timeline-title-row">
                              <span className="delivery-type-label">
                                {deliveryTypeLabels[delivery.delivery_type]}
                              </span>
                              <span className={`delivery-status-badge ${delivery.status}`}>
                                {deliveryStatusLabels[delivery.status]}
                              </span>
                            </div>
                            {volunteer && (
                              <span className="delivery-volunteer-sub">
                                Người giao: <strong>{volunteer.full_name}</strong>
                              </span>
                            )}
                            <span className="delivery-id-sub">Mã vận đơn: <code>{delivery.id}</code></span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Các nút hành động */}
        {account?.role !== 'admin' &&
          ((isOwner && transaction.status === 'requested') ||
            canConfirmReceipt ||
            canRequestReturn ||
            canConfirmReturn) && (
            <div className="dialog-actions">
              {isOwner && transaction.status === 'requested' && (
                <div className="action-buttons">
                  <ActionButton
                    type="button"
                    icon={Check}
                    busy={busyKey === `accept-${transaction.id}`}
                    onClick={onAccept}
                    title="Chấp nhận giao dịch này"
                  >
                    Chấp nhận
                  </ActionButton>
                  <ActionButton
                    type="button"
                    icon={X}
                    variant="secondary"
                    busy={busyKey === `reject-${transaction.id}`}
                    onClick={onReject}
                    title="Từ chối giao dịch này"
                  >
                    Từ chối
                  </ActionButton>
                </div>
              )}
              {canConfirmReceipt && (
                <ActionButton
                  type="button"
                  icon={PackageCheck}
                  busy={busyKey === `confirm-${transaction.id}`}
                  onClick={onConfirm}
                  title="Xác nhận đã nhận sách"
                >
                  Đã nhận sách
                </ActionButton>
              )}
              {canRequestReturn && (
                <ActionButton
                  type="button"
                  icon={PackageCheck}
                  variant="secondary"
                  busy={busyKey === 'return-request'}
                  onClick={onRequestReturn}
                  title="Yêu cầu trả sách"
                >
                  Yêu cầu trả sách
                </ActionButton>
              )}
              {canConfirmReturn && (
                <ActionButton
                  type="button"
                  icon={PackageCheck}
                  variant="secondary"
                  busy={busyKey === `return-${transaction.id}`}
                  disabled={hasPendingReturnDelivery}
                  title={hasPendingReturnDelivery ? 'Cần hoàn tất đơn giao trả trước' : 'Xác nhận đã nhận lại sách'}
                  onClick={onConfirmReturn}
                >
                  {hasPendingReturnDelivery ? 'Chờ đơn giao trả' : 'Đã nhận lại sách'}
                </ActionButton>
              )}
            </div>
          )}
      </section>
    </div>
  )
}

