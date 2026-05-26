import type { ButtonHTMLAttributes } from 'react'
import { RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function ActionButton({
  icon: Icon,
  busy,
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon
  busy?: boolean
  variant?: 'primary' | 'secondary'
}) {
  return (
    <button {...props} className={`action-button ${variant} ${className}`} disabled={busy || disabled}>
      {busy ? <RefreshCw className="spin" size={16} /> : <Icon size={16} />}
      <span>{children}</span>
    </button>
  )
}
