import type { ReactNode } from 'react'
import { statusTone } from '../utils/status'

export function StatusPill({ status, children }: { status: string; children: ReactNode }) {
  return <span className={`status-pill ${statusTone(status)}`}>{children}</span>
}
