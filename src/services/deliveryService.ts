import type { DeliveryStatus } from '../types/domain'
import { supabase } from './supabaseClient'

export async function listDeliveries() {
  return supabase.from('deliveries').select('*').order('created_at', { ascending: false })
}

export async function takeDelivery(deliveryId: string) {
  return supabase.rpc('take_delivery', {
    p_delivery_id: deliveryId,
  })
}

export async function updateDeliveryStatus(deliveryId: string, status: DeliveryStatus) {
  return supabase.rpc('update_delivery_status', {
    p_delivery_id: deliveryId,
    p_status: status,
  })
}
