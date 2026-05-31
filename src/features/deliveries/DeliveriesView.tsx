import { useState } from 'react'
import {
  Truck,
  MapPin,
  User,
  Phone,
  Clock,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Check,
  CheckCircle2,
  Navigation,
  HandHeart,
  Calendar,
} from 'lucide-react'
import { deliveryTypeLabels } from '../../shared/constants/labels'
import { ActionButton, EmptyState } from '../../shared/components'
import { formatDate } from '../../shared/utils/date'
import { getDeliveryParticipantBlockReason } from '../../shared/utils/status'
import type { Account, Book, BookTransaction, Delivery, DeliveryStatus } from '../../types/domain'
import './deliveries.css'

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
  const [activeTab, setActiveTab] = useState<'open' | 'my'>(isVolunteer ? 'my' : 'open')

  return (
    <div className="view-stack deliveries-container">
      {/* BANNER ĐĂNG KÝ (Chỉ hiện khi chưa là Volunteer) */}
      {!isVolunteer && (
        <section className="delivery-hero-banner">
          <div className="delivery-hero-content">
            <h2>
              <Sparkles size={24} style={{ color: '#fbbf24' }} />
              Trở thành Đại sứ Giao sách!
            </h2>
            <p>
              Tham gia đội ngũ Người giao sách tình nguyện để nhận điểm thưởng lớn và lan tỏa văn hóa đọc đến mọi thành viên câu lạc bộ!
            </p>
            <div className="delivery-benefits-grid">
              <div className="benefit-card">
                <strong>🪙 Tích lũy điểm nhanh</strong>
                <span>Nhận ngay +2 điểm cho mỗi lượt giao sách thành công.</span>
              </div>
              <div className="benefit-card">
                <strong>🚚 Hoạt động năng nổ</strong>
                <span>Nhận huy hiệu vinh danh và thăng hạng đóng góp.</span>
              </div>
            </div>
          </div>
          <div className="delivery-hero-actions">
            <ActionButton
              icon={HandHeart}
              variant="primary"
              busy={busyKey === 'register-volunteer'}
              onClick={onRegister}
              style={{ background: '#e0f0d6', color: '#12352c', border: 'none' }}
            >
              Đăng ký ngay
            </ActionButton>
          </div>
        </section>
      )}

      {/* THANH TABS HƯỚNG DẪN (Chỉ hiển thị cho người giao sách hoặc admin) */}
      {isVolunteer && (
        <div className="delivery-tabs">
          <button
            type="button"
            className={`delivery-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            <ShieldCheck size={18} />
            <span>Nhiệm vụ của tôi</span>
            <span className="badge">{myDeliveries.length}</span>
          </button>
          <button
            type="button"
            className={`delivery-tab-btn ${activeTab === 'open' ? 'active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            <Navigation size={18} />
            <span>Đơn hàng có sẵn</span>
            <span className="badge">{openDeliveries.length}</span>
          </button>
        </div>
      )}

      {/* DANH SÁCH ĐƠN HÀNG CÓ SẴN (TAB: OPEN) */}
      {(!isVolunteer || activeTab === 'open') && (
        <section className="delivery-grid">
          {openDeliveries.length === 0 ? (
            <div className="delivery-empty-wrapper">
              <EmptyState
                icon={Truck}
                text="Hiện tại không có đơn giao sách nào đang mở. Hãy quay lại sau!"
              />
            </div>
          ) : (
            openDeliveries.map((delivery) => {
              const transaction = transactionMap.get(delivery.transaction_id)
              const book = transaction ? bookMap.get(transaction.book_id) : null
              const owner = transaction ? accountMap.get(transaction.owner_account_id) : null
              const borrower = transaction ? accountMap.get(transaction.borrower_account_id) : null
              const fromAccount = delivery.delivery_type === 'return' ? borrower : owner
              const toAccount = delivery.delivery_type === 'return' ? owner : borrower
              const participantBlockReason = getDeliveryParticipantBlockReason(transaction, account?.id)

              return (
                <article className="delivery-modern-card" key={delivery.id}>
                  {/* Tiêu đề & Loại giao dịch */}
                  <div className="delivery-card-header">
                    <div className="delivery-book-chip">
                      <div className="book-icon-wrapper">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <h3>{book?.title || 'Sách trong hệ thống'}</h3>
                        <p>{book?.author || 'Tác giả ẩn danh'}</p>
                      </div>
                    </div>
                    <span className={`delivery-type-tag ${delivery.delivery_type}`}>
                      {deliveryTypeLabels[delivery.delivery_type]}
                    </span>
                  </div>

                  {/* Bản đồ hành trình (Lấy hàng -> Giao hàng) */}
                  <div className="delivery-route-map">
                    <div className="delivery-route-line"></div>
                    
                    {/* Điểm nhận */}
                    <div className="route-stop">
                      <span className="stop-marker start">A</span>
                      <div className="stop-details">
                        <span className="stop-label">Điểm lấy sách (Từ {delivery.delivery_type === 'return' ? 'người mượn' : 'chủ sách'})</span>
                        <span className="stop-user">
                          <User size={14} style={{ color: '#10b981' }} />
                          {fromAccount?.full_name || 'Thành viên'}
                          {fromAccount?.phone_number && (
                            <a href={`tel:${fromAccount.phone_number}`} className="phone-link">
                              <Phone size={12} />
                              {fromAccount.phone_number}
                            </a>
                          )}
                        </span>
                        <span className="stop-address">
                          <MapPin size={14} style={{ color: '#64748b' }} />
                          {delivery.pickup_location}
                        </span>
                      </div>
                    </div>

                    {/* Điểm giao */}
                    <div className="route-stop">
                      <span className="stop-marker end">B</span>
                      <div className="stop-details">
                        <span className="stop-label">Điểm giao sách (Đến {delivery.delivery_type === 'return' ? 'chủ sách' : 'người mượn'})</span>
                        <span className="stop-user">
                          <User size={14} style={{ color: '#ef4444' }} />
                          {toAccount?.full_name || 'Thành viên'}
                          {toAccount?.phone_number && (
                            <a href={`tel:${toAccount.phone_number}`} className="phone-link">
                              <Phone size={12} />
                              {toAccount.phone_number}
                            </a>
                          )}
                        </span>
                        <span className="stop-address">
                          <MapPin size={14} style={{ color: '#64748b' }} />
                          {delivery.dropoff_location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Nút Hành động */}
                  <div className="delivery-card-actions">
                    <div className="delivery-time">
                      <Clock size={14} />
                      <span>{formatDate(delivery.created_at)}</span>
                    </div>
                    
                    <div className="delivery-button-wrapper">
                      {!isVolunteer ? (
                        <span className="inline-note" style={{ fontSize: '12px', color: '#64748b' }}>
                          Cần đăng ký Người giao sách để nhận đơn
                        </span>
                      ) : participantBlockReason ? (
                        <span className="inline-warning" style={{ fontSize: '12px' }}>
                          {participantBlockReason}
                        </span>
                      ) : (
                        <ActionButton
                          type="button"
                          icon={Check}
                          disabled={!transaction}
                          busy={busyKey === `take-delivery-${delivery.id}`}
                          onClick={() => onTake(delivery.id)}
                          style={{ padding: '8px 24px' }}
                        >
                          Nhận đơn giao này
                        </ActionButton>
                      )}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </section>
      )}

      {/* NHIỆM VỤ ĐANG GIAO CỦA TÔI (TAB: MY) */}
      {isVolunteer && activeTab === 'my' && (
        <section className="delivery-grid">
          {myDeliveries.length === 0 ? (
            <div className="delivery-empty-wrapper">
              <EmptyState
                icon={Truck}
                text="Bạn chưa nhận đơn giao nào. Hãy chuyển qua tab 'Đơn hàng có sẵn' để nhận đơn đầu tiên!"
              />
            </div>
          ) : (
            myDeliveries.map((delivery) => {
              const transaction = transactionMap.get(delivery.transaction_id)
              const book = transaction ? bookMap.get(transaction.book_id) : null
              const owner = transaction ? accountMap.get(transaction.owner_account_id) : null
              const borrower = transaction ? accountMap.get(transaction.borrower_account_id) : null
              const fromAccount = delivery.delivery_type === 'return' ? borrower : owner
              const toAccount = delivery.delivery_type === 'return' ? owner : borrower

              // Logic xác định các bước của tiến trình giao hàng
              const stepIndex =
                delivery.status === 'accepted' ? 1 : delivery.status === 'in_transit' ? 2 : 3

              return (
                <article className="delivery-modern-card" key={delivery.id}>
                  {/* Tiêu đề & Loại */}
                  <div className="delivery-card-header">
                    <div className="delivery-book-chip">
                      <div className="book-icon-wrapper" style={{ background: '#dbeafe', color: '#2563eb' }}>
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <h3>{book?.title || 'Sách trong hệ thống'}</h3>
                        <p>{book?.author || 'Tác giả ẩn danh'}</p>
                      </div>
                    </div>
                    <span className={`delivery-type-tag ${delivery.delivery_type}`}>
                      {deliveryTypeLabels[delivery.delivery_type]}
                    </span>
                  </div>

                  {/* Hành trình tuyến đường */}
                  <div className="delivery-route-map">
                    <div className="delivery-route-line"></div>
                    
                    {/* Điểm lấy */}
                    <div className="route-stop">
                      <span className="stop-marker start">A</span>
                      <div className="stop-details">
                        <span className="stop-label">Điểm lấy sách (Từ {delivery.delivery_type === 'return' ? 'người mượn' : 'chủ sách'})</span>
                        <span className="stop-user">
                          <User size={14} style={{ color: '#10b981' }} />
                          {fromAccount?.full_name || 'Thành viên'}
                          {fromAccount?.phone_number && (
                            <a href={`tel:${fromAccount.phone_number}`} className="phone-link">
                              <Phone size={12} />
                              {fromAccount.phone_number}
                            </a>
                          )}
                        </span>
                        <span className="stop-address">
                          <MapPin size={14} style={{ color: '#64748b' }} />
                          {delivery.pickup_location}
                        </span>
                      </div>
                    </div>

                    {/* Điểm giao */}
                    <div className="route-stop">
                      <span className="stop-marker end">B</span>
                      <div className="stop-details">
                        <span className="stop-label">Điểm giao sách (Đến {delivery.delivery_type === 'return' ? 'chủ sách' : 'người mượn'})</span>
                        <span className="stop-user">
                          <User size={14} style={{ color: '#ef4444' }} />
                          {toAccount?.full_name || 'Thành viên'}
                          {toAccount?.phone_number && (
                            <a href={`tel:${toAccount.phone_number}`} className="phone-link">
                              <Phone size={12} />
                              {toAccount.phone_number}
                            </a>
                          )}
                        </span>
                        <span className="stop-address">
                          <MapPin size={14} style={{ color: '#64748b' }} />
                          {delivery.dropoff_location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TIẾN TRÌNH GIAO HÀNG (STEPPER TRỰC QUAN) */}
                  <div className="delivery-stepper-progress">
                    <span className="stepper-progress-header">Tiến độ giao sách</span>
                    <div className="stepper-steps-wrapper">
                      <div className="stepper-line"></div>
                      <div
                        className="stepper-line-active"
                        style={{
                          width: stepIndex === 1 ? '0%' : stepIndex === 2 ? '50%' : '100%',
                        }}
                      ></div>
                      
                      <div className={`stepper-step ${stepIndex >= 1 ? 'completed' : ''}`}>
                        <div className="stepper-node">
                          {stepIndex > 1 ? <Check size={12} /> : '1'}
                        </div>
                        <span className="stepper-text">Nhận đơn</span>
                      </div>

                      <div
                        className={`stepper-step ${
                          stepIndex > 2 ? 'completed' : stepIndex === 2 ? 'active' : ''
                        }`}
                      >
                        <div className="stepper-node">
                          {stepIndex > 2 ? <Check size={12} /> : '2'}
                        </div>
                        <span className="stepper-text">Đang giao</span>
                      </div>

                      <div className={`stepper-step ${stepIndex === 3 ? 'completed' : ''}`}>
                        <div className="stepper-node">
                          {stepIndex === 3 ? <CheckCircle2 size={12} /> : '3'}
                        </div>
                        <span className="stepper-text">Hoàn thành</span>
                      </div>
                    </div>
                  </div>

                  {/* Bảng thao tác hành động */}
                  <div className="delivery-card-actions">
                    <div className="delivery-time">
                      <Calendar size={14} />
                      <span>Nhận lúc {formatDate(delivery.accepted_at || delivery.created_at)}</span>
                    </div>

                    <div className="delivery-button-wrapper">
                      {delivery.status === 'accepted' && (
                        <ActionButton
                          type="button"
                          icon={Truck}
                          variant="secondary"
                          busy={busyKey === `delivery-${delivery.id}-in_transit`}
                          onClick={() => onUpdate(delivery.id, 'in_transit')}
                          style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 24px' }}
                        >
                          Bắt đầu đi giao
                        </ActionButton>
                      )}
                      {delivery.status === 'in_transit' && (
                        <ActionButton
                          type="button"
                          icon={CheckCircle2}
                          variant="primary"
                          busy={busyKey === `delivery-${delivery.id}-delivered`}
                          onClick={() => onUpdate(delivery.id, 'delivered')}
                          style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '8px 24px' }}
                        >
                          Xác nhận Đã Giao
                        </ActionButton>
                      )}
                      {delivery.status === 'delivered' && (
                        <span className="inline-note" style={{ fontSize: '13px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Giao hàng hoàn tất
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </section>
      )}
    </div>
  )
}
