import { X } from 'lucide-react'
import type { Notice } from '../../types/forms'

export function NoticeBanner({ notice, onClose }: { notice: Exclude<Notice, null>; onClose: () => void }) {
  return (
    <div className={`notice ${notice.type}`}>
      <span>{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="Đóng thông báo">
        <X size={16} />
      </button>
    </div>
  )
}
