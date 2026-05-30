import {
  Bell,
  BookOpenCheck,
  Check,
  ChevronRight,
  Handshake,
  ArrowDownUp,
  MapPin,
  MoveRight,
  Truck,
  User,
  X,
  CircleCheckBig,
} from 'lucide-react'
import {
  deliveryStatusLabels,
  transactionStatusLabels,
  transactionTypeLabels,
} from '../../shared/constants/labels'
import { ActionButton, EmptyState, PanelHeader, StatusPill } from '../../shared/components'
import { getTransactionActionText } from '../../shared/utils/status'
import { formatDate } from '../../shared/utils/date'
import type { Account, Book, BookTransaction, Delivery } from '../../types/domain'
import type { View } from '../../types/forms'
import './notifications.css'

export function NotificationsView({
  account,
  transactions,
  deliveries,
  accountMap,
  bookMap,
  busyKey,
  onAccept,
  onReject,
  onConfirm,
  onConfirmReturn,
  setActiveView,
}: {
  account: Account | null
  transactions: BookTransaction[]
  deliveries: Delivery[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  busyKey: string | null
  onAccept: (transaction: BookTransaction) => void
  onReject: (transaction: BookTransaction) => void
  onConfirm: (transaction: BookTransaction) => void
  onConfirmReturn: (transaction: BookTransaction) => void
  setActiveView: (view: View) => void
}) {
  if (!account) {
    return <EmptyState icon={Bell} text="Vui lòng đăng nhập để xem thông báo đơn cần xử lý." />
  }

  // Lọc các giao dịch đang chờ tài khoản hiện tại xử lý
  const waitingForMe = transactions.filter((transaction) => {
    const isOwner = transaction.owner_account_id === account.id
    const isBorrower = transaction.borrower_account_id === account.id

    return (
      (isOwner && transaction.status === 'requested') ||
      (isOwner && transaction.status === 'return_requested') ||
      (isBorrower && transaction.delivery_method === 'self_pickup' && transaction.status === 'accepted') ||
      (isBorrower && transaction.delivery_method === 'volunteer' && transaction.status === 'delivered')
    )
  })

  // Đơn vận chuyển liên quan đến tôi đang mở hoặc cần tôi xử lý (nếu tôi là volunteer)
  const myVolunteerDeliveries = deliveries.filter(
    (d) => d.volunteer_account_id === account.id && ['accepted', 'in_transit'].includes(d.status)
  )

  return (
    <div className="view-stack">
      {/* THANH TỔNG KẾT */}
      <div className={`notif-summary-bar ${waitingForMe.length === 0 ? 'empty' : ''}`}>
        <div className="notif-icon-wrap">
          {waitingForMe.length > 0 ? <Bell size={22} /> : <CircleCheckBig size={22} />}
        </div>
        <div className="notif-summary-text">
          <strong>
            {waitingForMe.length > 0
              ? `${waitingForMe.length} yêu cầu đang chờ bạn hành động`
              : 'Tuyệt vời! Không có yêu cầu nào đang chờ'}
          </strong>
          <span>
            {waitingForMe.length > 0
              ? 'Xin hãy xem xét và xử lý các đơn dưới đây sớm nhất có thể'
              : 'Tất cả giao dịch của bạn đã được xử lý xong'}
          </span>
        </div>
        <button type="button" className="link-button" onClick={() => setActiveView('transactions')}>
          Tất cả giao dịch <ChevronRight size={16} />
        </button>
      </div>

      {/* DANH SÁCH CÁC ĐƠN CẦN XỬ LÝ */}
      {waitingForMe.length > 0 && (
        <section className="tool-panel">
          <PanelHeader icon={Bell} title="Giao dịch chờ xử lý" />

          <div style={{ display: 'grid', gap: '12px', marginTop: '10px' }}>
            {waitingForMe.map((transaction) => {
              const book = bookMap.get(transaction.book_id)
              const isOwner = transaction.owner_account_id === account.id
              const partnerId = isOwner ? transaction.borrower_account_id : transaction.owner_account_id
              const partner = accountMap.get(partnerId)
              const actionText = getTransactionActionText(transaction, account.id)

              return (
                <div className={`notif-card type-${transaction.status}`} key={transaction.id}>
                  {/* Card Body */}
                  <div className="notif-card-body">
                    {book?.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={`Bìa ${book.title}`}
                        className="notif-book-cover"
                      />
                    ) : (
                      <div className="notif-book-cover-placeholder">N/A</div>
                    )}

                    <div className="notif-card-info">
                      <div className="notif-card-title-row">
                        <strong>{book?.title || 'Sách'}</strong>
                        <StatusPill status={transaction.status}>
                          {transactionStatusLabels[transaction.status]}
                        </StatusPill>
                      </div>

                      <span className="notif-action-text">{actionText}</span>

                      <div className="notif-meta-row">
                        <span className="meta-item">
                          <User size={12} />
                          {isOwner ? 'Người mượn' : 'Chủ sách'}:&nbsp;
                          <strong>{partner?.full_name || 'Thành viên'}</strong>
                        </span>
                        <span className="meta-item">
                          <Handshake size={12} />
                          Loại:&nbsp;
                          <strong>{transactionTypeLabels[transaction.transaction_type]}</strong>
                        </span>
                        <span className="meta-item">
                          <ArrowDownUp size={12} />
                          Ngày tạo:&nbsp;
                          <strong>{formatDate(transaction.created_at)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="notif-card-actions">
                    {/* Trường hợp 1: Yêu cầu mượn (Chủ sách duyệt/từ chối) */}
                    {transaction.status === 'requested' && isOwner && (
                      <>
                        <ActionButton
                          variant="secondary"
                          icon={X}
                          busy={busyKey === `reject-${transaction.id}`}
                          onClick={() => onReject(transaction)}
                        >
                          Từ chối
                        </ActionButton>
                        <ActionButton
                          variant="primary"
                          icon={Check}
                          busy={busyKey === `accept-${transaction.id}`}
                          onClick={() => onAccept(transaction)}
                        >
                          Chấp nhận mượn
                        </ActionButton>
                      </>
                    )}

                    {/* Trường hợp 2: Tự nhận sách (Người mượn xác nhận đã nhận) */}
                    {transaction.status === 'accepted' && !isOwner && transaction.delivery_method === 'self_pickup' && (
                      <ActionButton
                        variant="primary"
                        icon={BookOpenCheck}
                        busy={busyKey === `confirm-${transaction.id}`}
                        onClick={() => onConfirm(transaction)}
                      >
                        Xác nhận đã lấy sách
                      </ActionButton>
                    )}

                    {/* Trường hợp 3: Giao qua tình nguyện viên (Người mượn xác nhận đã nhận) */}
                    {transaction.status === 'delivered' && !isOwner && transaction.delivery_method === 'volunteer' && (
                      <ActionButton
                        variant="primary"
                        icon={BookOpenCheck}
                        busy={busyKey === `confirm-${transaction.id}`}
                        onClick={() => onConfirm(transaction)}
                      >
                        Đã nhận được sách
                      </ActionButton>
                    )}

                    {/* Trường hợp 4: Yêu cầu trả sách (Chủ sách xác nhận đã nhận lại) */}
                    {transaction.status === 'return_requested' && isOwner && (
                      <ActionButton
                        variant="primary"
                        icon={Check}
                        busy={busyKey === `return-${transaction.id}`}
                        onClick={() => onConfirmReturn(transaction)}
                      >
                        Xác nhận đã nhận lại sách
                      </ActionButton>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* KHU VỰC PHỤ: ĐƠN VẬN CHUYỂN BẠN ĐANG ĐẢM NHIỆM */}
      {account.role === 'volunteer' && myVolunteerDeliveries.length > 0 && (
        <section className="tool-panel">
          <PanelHeader
            icon={Truck}
            title={`Đơn vận chuyển bạn đang phụ trách (${myVolunteerDeliveries.length})`}
            action={
              <button
                type="button"
                className="link-button"
                onClick={() => setActiveView('deliveries')}
              >
                Trang giao sách <ChevronRight size={16} />
              </button>
            }
          />
          <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
            {myVolunteerDeliveries.map((delivery) => (
              <div className="notif-delivery-card" key={delivery.id}>
                <div className="delivery-route">
                  <span className="route-label">Lấy hàng tại</span>
                  <span className="route-value">
                    <MapPin size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                    {delivery.pickup_location}
                  </span>
                </div>
                <MoveRight size={20} className="route-arrow" />
                <div className="delivery-route">
                  <span className="route-label">Giao đến</span>
                  <span className="route-value">
                    <MapPin size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                    {delivery.dropoff_location}
                  </span>
                </div>
                <StatusPill status={delivery.status}>
                  {deliveryStatusLabels[delivery.status]}
                </StatusPill>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
