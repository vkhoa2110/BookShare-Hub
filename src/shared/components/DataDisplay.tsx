import type { LucideIcon } from 'lucide-react'
import { bookStatusLabels } from '../constants/labels'
import { formatDate } from '../utils/date'
import type { Account, Book, PointLedger } from '../../types/domain'
import { StatusPill } from './StatusPill'

export function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  tone: 'green' | 'blue' | 'amber' | 'neutral'
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function BookLine({ book, owner }: { book: Book; owner?: Account }) {
  return (
    <div className="list-line">
      <div>
        <strong>{book.title}</strong>
        <span>
          {book.author} · {owner?.full_name || 'Thành viên'}
        </span>
      </div>
      <StatusPill status={book.status}>{bookStatusLabels[book.status]}</StatusPill>
    </div>
  )
}

export function LedgerLine({ item }: { item: PointLedger }) {
  return (
    <div className="list-line">
      <div>
        <strong>{item.reason}</strong>
        <span>{formatDate(item.created_at)}</span>
      </div>
      <span className={item.delta >= 0 ? 'delta positive' : 'delta negative'}>
        {item.delta > 0 ? '+' : ''}
        {item.delta}
      </span>
    </div>
  )
}
