import { customAddressId } from '../../shared/constants/rules'
import { defaultAddress } from '../../shared/utils/address'
import type { AccountAddress } from '../../types/domain'
import type { BookForm } from '../../types/forms'

export const emptyBookForm: BookForm = {
  title: '',
  category: '',
  author: '',
  publication_year: '',
  condition: 'good',
  address_id: 'custom',
  pickup_location: '',
  cover_image_url: null,
  cover_file: null,
}

export function createBookForm(addresses: AccountAddress[] = []): BookForm {
  const address = defaultAddress(addresses)

  return {
    ...emptyBookForm,
    address_id: address?.id || customAddressId,
    pickup_location: address?.address_text || '',
  }
}
