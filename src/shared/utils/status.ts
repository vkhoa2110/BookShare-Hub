import type { BookTransaction, DeliveryStatus, DeliveryType, TransactionStatus } from '../../types/domain'

export function getTransactionActionText(transaction: BookTransaction, accountId?: string) {
  const isOwner = transaction.owner_account_id === accountId
  const isBorrower = transaction.borrower_account_id === accountId

  if (transaction.status === 'requested') {
    return isOwner ? 'Bạn cần chấp nhận hoặc từ chối yêu cầu này.' : 'Đang chờ chủ sách phản hồi.'
  }

  if (transaction.status === 'accepted') {
    if (transaction.delivery_method === 'volunteer') {
      return 'Đơn giao sách đang chờ người giao nhận.'
    }

    return isBorrower ? 'Hãy xác nhận khi bạn đã nhận sách.' : 'Đang chờ người nhận xác nhận.'
  }

  if (transaction.status === 'delivered') {
    return isBorrower ? 'Sách đã được giao. Hãy xác nhận đã nhận.' : 'Đang chờ người nhận xác nhận.'
  }

  if (transaction.status === 'completed' && transaction.transaction_type === 'borrow') {
    return isBorrower ? 'Bạn có thể tạo yêu cầu trả sách khi muốn hoàn trả.' : 'Sách đang được mượn.'
  }

  if (transaction.status === 'return_requested') {
    return isOwner ? 'Hãy xác nhận khi đã nhận lại sách.' : 'Đang chờ chủ sách xác nhận đã nhận lại.'
  }

  if (transaction.status === 'returned') {
    return 'Sách đã được hoàn trả.'
  }

  if (transaction.status === 'completed') {
    return 'Giao dịch đã hoàn tất.'
  }

  if (transaction.status === 'rejected') {
    return 'Yêu cầu đã bị từ chối.'
  }

  return 'Không cần thao tác thêm.'
}

export function getDeliveryParticipantBlockReason(
  transaction: BookTransaction | undefined,
  accountId?: string,
) {
  if (!transaction || !accountId) {
    return null
  }

  if (transaction.owner_account_id === accountId || transaction.borrower_account_id === accountId) {
    return 'Người trong giao dịch không thể nhận đơn giao này.'
  }

  return null
}

export function statusTone(status: string) {
  const good: Array<TransactionStatus | DeliveryStatus | DeliveryType | string> = [
    'available',
    'completed',
    'delivered',
    'returned',
    'resolved',
  ]
  const waiting: Array<TransactionStatus | DeliveryStatus | string> = [
    'requested',
    'accepted',
    'in_transit',
    'open',
    'reviewing',
    'return_requested',
  ]

  if (good.includes(status)) {
    return 'good'
  }

  if (waiting.includes(status)) {
    return 'waiting'
  }

  return 'muted'
}
