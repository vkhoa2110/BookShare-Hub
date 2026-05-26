import type { ComplaintForm } from '../types/forms'
import type { ComplaintStatus } from '../types/domain'
import { supabase } from './supabaseClient'

export async function listComplaints() {
  return supabase.from('complaints').select('*').order('created_at', { ascending: false })
}

export async function createComplaint(accountId: string, form: ComplaintForm) {
  return supabase.from('complaints').insert({
    transaction_id: form.transaction_id || null,
    complainant_account_id: accountId,
    reported_account_id: form.reported_account_id || null,
    complaint_details: form.complaint_details.trim(),
  })
}

export async function updateComplaintStatus({
  complaintId,
  status,
  outcome,
  handledByAccountId,
}: {
  complaintId: string
  status: ComplaintStatus
  outcome: string
  handledByAccountId: string | null
}) {
  return supabase
    .from('complaints')
    .update({
      status,
      outcome: outcome.trim() || null,
      handled_by_account_id: handledByAccountId,
    })
    .eq('id', complaintId)
}
