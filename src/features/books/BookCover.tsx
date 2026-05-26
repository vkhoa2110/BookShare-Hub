import { BookOpen } from 'lucide-react'
import type { Book } from '../../types/domain'

export function MiniBookItem({ book, detail }: { book: Book; detail: string }) {
  return (
    <div className="mini-book-item">
      <BookCover book={book} size="small" />
      <div>
        <strong>{book.title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  )
}

export function BookCover({ book, size = 'default' }: { book: Book; size?: 'default' | 'small' }) {
  return (
    <div
      className={`book-cover condition-${book.condition} ${size === 'small' ? 'small' : ''} ${book.cover_image_url ? 'with-image' : ''}`}
    >
      {book.cover_image_url ? (
        <img src={book.cover_image_url} alt="" />
      ) : (
        <>
          <BookOpen size={size === 'small' ? 20 : 28} />
          <span>{book.category.slice(0, 22)}</span>
        </>
      )}
    </div>
  )
}
