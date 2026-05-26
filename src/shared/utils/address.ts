import { customAddressId } from '../constants/rules'
import type { AccountAddress } from '../../types/domain'

export function defaultAddress(addresses: AccountAddress[]) {
  return addresses.find((address) => address.is_default) || addresses[0] || null
}

export function addressIdForValue(addresses: AccountAddress[], value: string) {
  return addresses.find((address) => address.address_text === value)?.id || customAddressId
}
