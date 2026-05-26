import type { ReactNode } from 'react'
import { Check, HandHeart, PackageCheck, Truck } from 'lucide-react'
import { deliveryStatusLabels, deliveryTypeLabels, roleLabels } from '../../shared/constants/labels'
import { ActionButton, EmptyState, PanelHeader, StatusPill } from '../../shared/components'
import { formatDate } from '../../shared/utils/date'
import { getDeliveryParticipantBlockReason } from '../../shared/utils/status'
import type { Account, Book, BookTransaction, Delivery, DeliveryStatus } from '../../types/domain'

export function DeliveriesView({
  account,
  openDeliveries,
  myDeliveries,
  accountMap,
  bookMap,
  transactionMap,
  busyKey,
  onRegister,
  onTake,
  onUpdate,
}: {
  account: Account | null
  openDeliveries: Delivery[]
  myDeliveries: Delivery[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  transactionMap: Map<string, BookTransaction>
  busyKey: string | null
  onRegister: () => void
  onTake: (deliveryId: string) => void
  onUpdate: (deliveryId: string, status: DeliveryStatus) => void
}) {
  const isVolunteer = account?.role === 'volunteer' || account?.role === 'admin'

  return (
    <div className="view-stack">
      {!isVolunteer && (
        <section className="tool-panel action-strip">
          <div>
            <h2>Đăng ký giao sách miễn phí</h2>
            <p>Vai trò hiện tại: {account ? roleLabels[account.role] : 'Thành viên'}</p>
          </div>
          <ActionButton icon={HandHeart} busy={busyKey === 'register-volunteer'} onClick={onRegister}>
            Đăng ký
          </ActionButton>
        </section>
      )}

      <section className="tool-panel">
        <PanelHeader icon={Truck} title="Đơn giao đang mở" />
        <DeliveryList
          deliveries={openDeliveries}
          accountMap={accountMap}
          bookMap={bookMap}
          transactionMap={transactionMap}
          busyKey={busyKey}
          action={(delivery) => {
            const transaction = transactionMap.get(delivery.transaction_id)
            const participantBlockReason = getDeliveryParticipantBlockReason(transaction, account?.id)

            if (!isVolunteer) {
              return null
            }

            if (participantBlockReason) {
              return <span className="inline-warning">{participantBlockReason}</span>
            }

            return (
              <ActionButton
                type="button"
                icon={Check}
                disabled={!transaction}
                busy={busyKey === `take-delivery-${delivery.id}`}
                onClick={() => onTake(delivery.id)}
              >
                Nhận đơn
              </ActionButton>
            )
          }}
        />
      </section>

      <section className="tool-panel">
        <PanelHeader icon={PackageCheck} title="Đơn tôi đang giao" />
        <DeliveryList
          deliveries={myDeliveries}
          accountMap={accountMap}
          bookMap={bookMap}
          transactionMap={transactionMap}
          busyKey={busyKey}
          action={(delivery) => (
            <>
              {delivery.status === 'accepted' && (
                <ActionButton
                  type="button"
                  icon={Truck}
                  variant="secondary"
                  busy={busyKey === `delivery-${delivery.id}-in_transit`}
                  onClick={() => onUpdate(delivery.id, 'in_transit')}
                >
                  Đang giao
                </ActionButton>
              )}
              {delivery.status === 'in_transit' && (
                <ActionButton
                  type="button"
                  icon={PackageCheck}
                  busy={busyKey === `delivery-${delivery.id}-delivered`}
                  onClick={() => onUpdate(delivery.id, 'delivered')}
                >
                  Đã giao
                </ActionButton>
              )}
            </>
          )}
        />
      </section>
    </div>
  )
}

function DeliveryList({
  deliveries,
  accountMap,
  bookMap,
  transactionMap,
  busyKey,
  action,
}: {
  deliveries: Delivery[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  transactionMap: Map<string, BookTransaction>
  busyKey: string | null
  action: (delivery: Delivery) => ReactNode
}) {
  void busyKey

  if (deliveries.length === 0) {
    return <EmptyState icon={Truck} text="Không có đơn giao sách." />
  }

  return (
    <div className="entity-list compact">
      {deliveries.map((delivery) => {
        const transaction = transactionMap.get(delivery.transaction_id)
        const book = transaction ? bookMap.get(transaction.book_id) : null
        const owner = transaction ? accountMap.get(transaction.owner_account_id) : null
        const borrower = transaction ? accountMap.get(transaction.borrower_account_id) : null
        const fromAccount = delivery.delivery_type === 'return' ? borrower : owner
        const toAccount = delivery.delivery_type === 'return' ? owner : borrower

        return (
          <article className="entity-card" key={delivery.id}>
            <div className="entity-main">
              <div className="entity-icon">
                <Truck size={22} />
              </div>
              <div>
                <div className="entity-title-row">
                  <h2>{book?.title || 'Sách trong giao dịch'}</h2>
                  <StatusPill status={delivery.status}>{deliveryStatusLabels[delivery.status]}</StatusPill>
                </div>
                <p>
                  {fromAccount?.full_name || 'Người giao'} → {toAccount?.full_name || 'Người nhận'}
                </p>
                <dl className="meta-grid">
                  <div>
                    <dt>Loại đơn</dt>
                    <dd>{deliveryTypeLabels[delivery.delivery_type]}</dd>
                  </div>
                  <div>
                    <dt>Nhận sách</dt>
                    <dd>{delivery.pickup_location}</dd>
                  </div>
                  <div>
                    <dt>Giao sách</dt>
                    <dd>{delivery.dropoff_location}</dd>
                  </div>
                  <div>
                    <dt>Tạo lúc</dt>
                    <dd>{formatDate(delivery.created_at)}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="entity-actions">{action(delivery)}</div>
          </article>
        )
      })}
    </div>
  )
}
