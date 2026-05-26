import { ArrowRightLeft, Check, Clock3, PackageCheck, Truck, X } from 'lucide-react'
import {
  deliveryStatusLabels,
  deliveryTypeLabels,
  deliveryMethodLabels,
  transactionStatusLabels,
  transactionTypeLabels,
} from '../../shared/constants/labels'
import { pointRule } from '../../shared/constants/rules'
import { ActionButton, EmptyState, StatusPill } from '../../shared/components'
import { formatDate } from '../../shared/utils/date'
import { getTransactionActionText } from '../../shared/utils/status'
import type { Account, Book, BookTransaction, Delivery } from '../../types/domain'

export function TransactionsView({
  account,
  transactions,
  accountMap,
  bookMap,
  deliveries,
  busyKey,
  onAccept,
  onReject,
  onConfirm,
  onRequestReturn,
  onConfirmReturn,
}: {
  account: Account | null
  transactions: BookTransaction[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  deliveries: Map<string, Delivery[]>
  busyKey: string | null
  onAccept: (transaction: BookTransaction) => void
  onReject: (transaction: BookTransaction) => void
  onConfirm: (transaction: BookTransaction) => void
  onRequestReturn: (transaction: BookTransaction) => void
  onConfirmReturn: (transaction: BookTransaction) => void
}) {
  return (
    <section className="entity-list">
      {transactions.map((transaction) => {
        const book = bookMap.get(transaction.book_id)
        const owner = accountMap.get(transaction.owner_account_id)
        const borrower = accountMap.get(transaction.borrower_account_id)
        const transactionDeliveries = deliveries.get(transaction.id) || []
        const isOwner = transaction.owner_account_id === account?.id
        const isBorrower = transaction.borrower_account_id === account?.id
        const outboundDeliveries = transactionDeliveries.filter(
          (delivery) => delivery.delivery_type === 'outbound',
        )
        const hasPendingReturnDelivery = transactionDeliveries.some(
          (delivery) =>
            delivery.delivery_type === 'return' && !['delivered', 'cancelled'].includes(delivery.status),
        )
        const hasPendingOutboundDelivery = outboundDeliveries.some(
          (delivery) => delivery.status !== 'delivered',
        )
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

        return (
          <article className="entity-card" key={transaction.id}>
            <div className="entity-main">
              <div className="entity-icon">
                <ArrowRightLeft size={22} />
              </div>
              <div>
                <div className="entity-title-row">
                  <h2>{book?.title || 'Sách đã xóa'}</h2>
                  <StatusPill status={transaction.status}>
                    {transactionStatusLabels[transaction.status]}
                  </StatusPill>
                </div>
                <p>
                  {owner?.full_name || 'Chủ sách'} ↔ {borrower?.full_name || 'Người nhận'}
                </p>
                <dl className="meta-grid">
                  <div>
                    <dt>Loại</dt>
                    <dd>{transactionTypeLabels[transaction.transaction_type]}</dd>
                  </div>
                  <div>
                    <dt>Giao nhận</dt>
                    <dd>{deliveryMethodLabels[transaction.delivery_method]}</dd>
                  </div>
                  <div>
                    <dt>Lấy sách</dt>
                    <dd>{transaction.pickup_location || book?.pickup_location || 'Chưa cập nhật'}</dd>
                  </div>
                  {transaction.dropoff_location && (
                    <div>
                      <dt>Nhận sách</dt>
                      <dd>{transaction.dropoff_location || 'Chưa cập nhật'}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Điểm</dt>
                    <dd>
                      +{pointRule[transaction.transaction_type]} / -{pointRule[transaction.transaction_type]}
                    </dd>
                  </div>
                  <div>
                    <dt>Tạo lúc</dt>
                    <dd>{formatDate(transaction.created_at)}</dd>
                  </div>
                </dl>
                {transactionDeliveries.length > 0 && (
                  <div className="delivery-stack">
                    {transactionDeliveries.map((delivery) => (
                      <div className="inline-note" key={delivery.id}>
                        <Truck size={16} />
                        <span>
                          {deliveryTypeLabels[delivery.delivery_type]}:{' '}
                          {deliveryStatusLabels[delivery.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="next-step-note">
                  <Clock3 size={16} />
                  <span>{getTransactionActionText(transaction, account?.id)}</span>
                </div>
              </div>
            </div>
            <div className="entity-actions">
              {isOwner && transaction.status === 'requested' && (
                <>
                  <ActionButton
                    type="button"
                    icon={Check}
                    busy={busyKey === `accept-${transaction.id}`}
                    onClick={() => onAccept(transaction)}
                  >
                    Chấp nhận
                  </ActionButton>
                  <ActionButton
                    type="button"
                    icon={X}
                    variant="secondary"
                    busy={busyKey === `reject-${transaction.id}`}
                    onClick={() => onReject(transaction)}
                  >
                    Từ chối
                  </ActionButton>
                </>
              )}
              {canConfirmReceipt && (
                <ActionButton
                  type="button"
                  icon={PackageCheck}
                  busy={busyKey === `confirm-${transaction.id}`}
                  onClick={() => onConfirm(transaction)}
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
                  onClick={() => onRequestReturn(transaction)}
                >
                  Yêu cầu trả
                </ActionButton>
              )}
              {canConfirmReturn && (
                <ActionButton
                  type="button"
                  icon={PackageCheck}
                  variant="secondary"
                  busy={busyKey === `return-${transaction.id}`}
                  disabled={hasPendingReturnDelivery}
                  title={hasPendingReturnDelivery ? 'Cần hoàn tất đơn giao trả trước.' : undefined}
                  onClick={() => onConfirmReturn(transaction)}
                >
                  {hasPendingReturnDelivery ? 'Chờ đơn giao trả' : 'Đã nhận lại'}
                </ActionButton>
              )}
            </div>
          </article>
        )
      })}
      {transactions.length === 0 && <EmptyState icon={ArrowRightLeft} text="Chưa có giao dịch." />}
    </section>
  )
}
