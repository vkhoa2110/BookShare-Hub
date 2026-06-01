import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import type { Account, AccountAddress, PointLedger, TransactionHistory } from '../types/domain'
import type { AddressForm, ProfileForm } from '../types/forms'

export async function getAccount(userId: string) {
  return supabase.from('accounts').select('*').eq('id', userId).single()
}

export async function listAccounts() {
  return supabase.from('accounts').select('*').order('full_name', { ascending: true })
}

export async function listAddresses(accountId: string) {
  return supabase
    .from('account_addresses')
    .select('*')
    .eq('account_id', accountId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
}

export async function listPointLedger() {
  return supabase.from('point_ledger').select('*').order('created_at', { ascending: false }).limit(50)
}

export async function listTransactionHistory() {
  return supabase.from('transaction_history').select('*').order('updated_at', { ascending: false }).limit(100)
}

export async function ensureAccountForSession(currentSession: Session) {
  const user = currentSession.user
  const existing = await supabase.from('accounts').select('*').eq('id', user.id).maybeSingle()

  if (existing.error) {
    throw existing.error
  }

  if (existing.data) {
    return existing.data as Account
  }

  const metadata = user.user_metadata as { full_name?: string; phone_number?: string } | undefined
  const fallbackName = user.email?.split('@')[0] || 'Thành viên'
  const inserted = await supabase
    .from('accounts')
    .insert({
      id: user.id,
      full_name: metadata?.full_name || fallbackName,
      phone_number: metadata?.phone_number || null,
      email_address: user.email || `${user.id}@bookshare.local`,
    })
    .select('*')
    .single()

  if (inserted.error) {
    throw inserted.error
  }

  return inserted.data as Account
}

export async function updateAccountProfile(accountId: string, form: ProfileForm) {
  return supabase
    .from('accounts')
    .update({
      full_name: form.full_name.trim(),
      phone_number: form.phone_number.trim() || null,
    })
    .eq('id', accountId)
}

export async function saveAddress(accountId: string, form: AddressForm, editingAddressId: string | null) {
  if (form.is_default) {
    const reset = await supabase
      .from('account_addresses')
      .update({ is_default: false })
      .eq('account_id', accountId)

    if (reset.error) {
      return reset
    }
  }

  const payload = {
    account_id: accountId,
    label: form.label.trim() || 'Địa chỉ',
    address_text: form.address_text.trim(),
    is_default: form.is_default,
  }

  return editingAddressId
    ? supabase.from('account_addresses').update(payload).eq('id', editingAddressId)
    : supabase.from('account_addresses').insert(payload)
}

export async function deleteAccountAddress(accountId: string, addressId: string) {
  return supabase.from('account_addresses').delete().eq('id', addressId).eq('account_id', accountId)
}

export async function registerVolunteer() {
  return supabase.rpc('register_volunteer')
}

export type AccountData = {
  account: Account
  accounts: Account[]
  addresses: AccountAddress[]
  ledger: PointLedger[]
  history: TransactionHistory[]
}

export async function adminUpdateAccount(
  accountId: string,
  payload: {
    full_name: string
    phone_number: string | null
    role: 'member' | 'volunteer' | 'admin'
    points: number
    status: boolean
  },
) {
  return supabase.rpc('admin_update_account', {
    p_account_id: accountId,
    p_full_name: payload.full_name,
    p_phone_number: payload.phone_number,
    p_role: payload.role,
    p_points: payload.points,
    p_status: payload.status,
  })
}

export async function adminDeleteAccount(accountId: string) {
  return supabase.from('accounts').delete().eq('id', accountId)
}
