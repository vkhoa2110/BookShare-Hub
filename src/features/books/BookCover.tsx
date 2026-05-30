import { BookOpen } from 'lucide-react'
import type { Book } from '../../types/domain'

function getBookInitial(title: string) {
  return title.trim().charAt(0).toLocaleUpperCase('vi') || '?'
}

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
      className={`book-cover condition-${book.condition} ${size === 'small' ? 'small' : ''} ${
        book.cover_image_url ? 'with-image' : 'with-placeholder'
      }`}
    >
      {book.cover_image_url ? (
        <img src={book.cover_image_url} alt={`Bìa ${book.title}`} />
      ) : (
        <>
          <div className="book-cover-placeholder-mark" aria-hidden="true">
            {size === 'small' ? <BookOpen size={20} /> : getBookInitial(book.title)}
          </div>
        </>
      )}
    </div>
  )
}
