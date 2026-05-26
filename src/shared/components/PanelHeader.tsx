import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function PanelHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon
  title: string
  action?: ReactNode
}) {
  return (
    <div className="panel-header">
      <div>
        <Icon size={20} />
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  )
}
