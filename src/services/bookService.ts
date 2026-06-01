import { bookCoverBucket } from '../shared/constants/rules'
import { cropBookCoverFile, extensionForImageType } from '../shared/utils/image'
import type { BookForm } from '../types/forms'
import type { BookStatus } from '../types/domain'
import { supabase } from './supabaseClient'

export async function listBooks() {
  return supabase.from('books').select('*').order('created_at', { ascending: false })
}

export async function uploadBookCover(accountId: string, file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('File ảnh không hợp lệ.')
  }

  const croppedFile = await cropBookCoverFile(file)
  const extension = extensionForImageType(croppedFile.type)
  const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`
  const path = `${accountId}/${safeName}`
  const uploaded = await supabase.storage.from(bookCoverBucket).upload(path, croppedFile, {
    contentType: croppedFile.type,
    upsert: false,
  })

  if (uploaded.error) {
    throw uploaded.error
  }

  const { data } = supabase.storage.from(bookCoverBucket).getPublicUrl(path)
  return data.publicUrl
}

export async function saveBook(accountId: string, form: BookForm, editingBookId: string | null) {
  const coverImageUrl = form.cover_file
    ? await uploadBookCover(accountId, form.cover_file)
    : form.cover_image_url
  const bookFields = {
    title: form.title.trim(),
    category: form.category.trim(),
    author: form.author.trim(),
    publication_year: form.publication_year ? Number(form.publication_year) : null,
    condition: form.condition,
    pickup_location: form.pickup_location.trim(),
    cover_image_url: coverImageUrl || null,
  }

  return editingBookId
    ? supabase.from('books').update(bookFields).eq('id', editingBookId)
    : supabase.from('books').insert({ ...bookFields, owner_account_id: accountId })
}

export async function updateBookStatus(bookId: string, status: BookStatus) {
  return supabase.from('books').update({ status }).eq('id', bookId)
}

export async function deleteBook(bookId: string) {
  return supabase.from('books').delete().eq('id', bookId)
}
