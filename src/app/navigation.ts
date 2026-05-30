import {
  ArrowRightLeft,
  BookOpen,
  Library,
  MessageSquareWarning,
  ShieldCheck,
  Truck,
  UserRound,
  Bell,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { View } from '../types/forms'

export const navItems: Array<{ view: View; label: string; icon: LucideIcon; adminOnly?: boolean }> = [
  { view: 'dashboard', label: 'Tổng quan', icon: Library },
  { view: 'notifications', label: 'Cần xử lý', icon: Bell },
  { view: 'books', label: 'Kho sách', icon: BookOpen },
  { view: 'transactions', label: 'Giao dịch', icon: ArrowRightLeft },
  { view: 'deliveries', label: 'Giao sách', icon: Truck },
  { view: 'complaints', label: 'Khiếu nại', icon: MessageSquareWarning },
  { view: 'profile', label: 'Hồ sơ', icon: UserRound },
  { view: 'admin', label: 'Quản trị', icon: ShieldCheck, adminOnly: true },
]

export function pageTitle(view: View) {
  if (view === 'profile' || view === 'profile-info') return 'Hồ sơ - Thông tin cá nhân'
  if (view === 'profile-addresses') return 'Hồ sơ - Địa chỉ nhận sách'
  if (view === 'profile-books') return 'Hồ sơ - Sách của tôi'
  if (view === 'profile-points') return 'Hồ sơ - Lịch sử điểm'
  if (view === 'profile-history') return 'Hồ sơ - Lịch sử giao dịch'

  if (view === 'admin' || view === 'admin-overview') return 'Quản trị - Tổng quan'
  if (view === 'admin-members') return 'Quản trị - Thành viên'
  if (view === 'admin-books') return 'Quản trị - Kho sách'
  if (view === 'admin-complaints') return 'Quản trị - Khiếu nại'

  if (view === 'notifications') return 'Đơn hàng & Giao dịch cần xử lý'

  const item = navItems.find((navItem) => navItem.view === view)
  return item?.label || 'BookShare Hub'
}
