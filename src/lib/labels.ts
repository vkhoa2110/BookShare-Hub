import type {
  AccountRole,
  BookCondition,
  BookStatus,
  ComplaintStatus,
  DeliveryMethod,
  DeliveryStatus,
  TransactionStatus,
  TransactionType,
} from './types'

export const conditionLabels: Record<BookCondition, string> = {
  new: 'Mới',
  good: 'Tốt',
  used: 'Đã dùng',
  worn: 'Cũ',
}

export const bookStatusLabels: Record<BookStatus, string> = {
  available: 'Có sẵn',
  negotiating: 'Đang giao dịch',
  exchanged: 'Đã trao đổi',
  borrowed: 'Đang cho mượn',
  returned: 'Đã trả',
  hidden: 'Đã ẩn',
}

export const transactionTypeLabels: Record<TransactionType, string> = {
  exchange: 'Trao đổi',
  borrow: 'Cho mượn',
}

export const transactionStatusLabels: Record<TransactionStatus, string> = {
  requested: 'Chờ duyệt',
  accepted: 'Đã chấp nhận',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
  owner_confirmed: 'Chủ sách đã xác nhận',
  borrower_confirmed: 'Người nhận đã xác nhận',
  completed: 'Hoàn tất',
  returned: 'Đã trả sách',
}

export const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  self_pickup: 'Tự giao nhận',
  volunteer: 'Nhờ người giao',
}

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  open: 'Đang mở',
  accepted: 'Đã nhận đơn',
  in_transit: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
}

export const complaintStatusLabels: Record<ComplaintStatus, string> = {
  open: 'Mở',
  reviewing: 'Đang xử lý',
  resolved: 'Đã xử lý',
  rejected: 'Từ chối',
}

export const roleLabels: Record<AccountRole, string> = {
  member: 'Thành viên',
  volunteer: 'Người giao sách',
  admin: 'Quản trị viên',
}
