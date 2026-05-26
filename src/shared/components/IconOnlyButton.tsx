import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

export function IconOnlyButton({
  label,
  busy,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  busy?: boolean
  children: ReactNode
}) {
  return (
    <button {...props} className="icon-button" aria-label={label} title={label} disabled={busy || disabled}>
      {busy ? <RefreshCw className="spin" size={18} /> : children}
    </button>
  )
}
