import { customAddressId } from '../../shared/constants/rules'
import { defaultAddress } from '../../shared/utils/address'
import type { AccountAddress } from '../../types/domain'
import type { RequestForm, ReturnForm } from '../../types/forms'

export const emptyRequestForm: RequestForm = {
  transaction_type: 'exchange',
  delivery_method: 'self_pickup',
  return_due_at: '',
  address_id: 'custom',
  pickup_location: '',
  dropoff_location: '',
}

export const emptyReturnForm: ReturnForm = {
  delivery_method: 'self_pickup',
  address_id: 'custom',
  pickup_location: '',
  dropoff_location: '',
}

export function createRequestForm(addresses: AccountAddress[] = []): RequestForm {
  const address = defaultAddress(addresses)

  return {
    ...emptyRequestForm,
    address_id: address?.id || customAddressId,
    dropoff_location: address?.address_text || '',
  }
}

export function createReturnForm(addresses: AccountAddress[] = []): ReturnForm {
  const address = defaultAddress(addresses)

  return {
    ...emptyReturnForm,
    address_id: address?.id || customAddressId,
    pickup_location: address?.address_text || '',
  }
}
