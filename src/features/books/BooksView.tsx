import type { FormEvent } from 'react'
import {
  ArrowRightLeft,
  BookOpen,
  Check,
  EyeOff,
  Library,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
} from 'lucide-react'
import { bookStatusLabels, conditionLabels } from '../../shared/constants/labels'
import { ActionButton, EmptyState, PanelHeader, StatusPill } from '../../shared/components'
import type { Account, AccountAddress, Book, BookStatus, BookTransaction } from '../../types/domain'
import type { BookForm, OwnershipFilter } from '../../types/forms'
import { BookFormBody } from './BookFormModal'
import { BookCover, MiniBookItem } from './BookCover'

export function BooksView({
  account,
  accountMap,
  books,
  allBooks,
  transactions,
  addressOptions,
  categories,
  searchTerm,
  categoryFilter,
  statusFilter,
  ownershipFilter,
  bookForm,
  editingBookId,
  busyKey,
  onSearch,
  onCategoryFilter,
  onStatusFilter,
  onOwnershipFilter,
  onBookFormChange,
  onBookSubmit,
  onResetBookForm,
  onEditBook,
  onHideBook,
  onRequestBook,
}: {
  account: Account | null
  accountMap: Map<string, Account>
  books: Book[]
  allBooks: Book[]
  transactions: BookTransaction[]
  addressOptions: AccountAddress[]
  categories: string[]
  searchTerm: string
  categoryFilter: string
  statusFilter: string
  ownershipFilter: OwnershipFilter
  bookForm: BookForm
  editingBookId: string | null
  busyKey: string | null
  onSearch: (value: string) => void
  onCategoryFilter: (value: string) => void
  onStatusFilter: (value: string) => void
  onOwnershipFilter: (value: OwnershipFilter) => void
  onBookFormChange: (value: BookForm) => void
  onBookSubmit: (event: FormEvent<HTMLFormElement>) => void
  onResetBookForm: () => void
  onEditBook: (book: Book) => void
  onHideBook: (book: Book) => void
  onRequestBook: (book: Book) => void
}) {
  const ownedBooks = allBooks.filter((book) => book.owner_account_id === account?.id)
  const borrowedBooks = transactions
    .filter(
      (transaction) =>
        transaction.borrower_account_id === account?.id &&
        transaction.transaction_type === 'borrow' &&
        ['completed', 'return_requested'].includes(transaction.status),
    )
    .map((transaction) => ({
      transaction,
      book: allBooks.find((book) => book.id === transaction.book_id),
    }))
    .filter((item): item is { transaction: BookTransaction; book: Book } => {
      const book = item.book
      if (!book) {
        return false
      }

      return book.status === 'borrowed'
    })
  const availableBooks = books.filter((book) => book.status === 'available')

  return (
    <div className="view-stack books-view">
      <section className="books-controls">
        <div className="books-controls-header">
          <div>
            <span className="eyebrow">Khám phá sách</span>
            <h2>Danh sách đang mở</h2>
          </div>
        </div>

        <div className="toolbar books-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Tìm tên sách, tác giả, thể loại"
            />
          </div>
          <select value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}>
            <option value="all">Tất cả thể loại</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            {(Object.keys(bookStatusLabels) as BookStatus[]).map((status) => (
              <option key={status} value={status}>
                {bookStatusLabels[status]}
              </option>
            ))}
          </select>
          <div className="filter-pills" aria-label="Lọc nhanh sách">
            {[
              ['all', 'Tất cả'],
              ['available', 'Có sẵn'],
              ['mine', 'Của tôi'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={ownershipFilter === value ? 'filter-chip active' : 'filter-chip'}
                onClick={() => onOwnershipFilter(value as OwnershipFilter)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="quick-summary">
          <span>{books.length} sách phù hợp</span>
          <span>{availableBooks.length} sách có thể yêu cầu ngay</span>
        </div>
      </section>

      {editingBookId && (
        <section className="tool-panel book-edit-panel">
          <PanelHeader icon={Pencil} title="Sửa sách" />
          <form className="book-form redesigned book-edit-form" onSubmit={onBookSubmit}>
            <BookFormBody
              form={bookForm}
              addresses={addressOptions}
              submitIcon={Check}
              submitLabel="Lưu sách"
              busy={busyKey === 'book-update'}
              onFormChange={onBookFormChange}
              onCancel={onResetBookForm}
            />
          </form>
        </section>
      )}

      <div className="books-market-layout">
        <section className="books-results">
          <div className="books-section-header">
            <div>
              <span className="eyebrow">Danh sách sách</span>
              <h2>{books.length} sách phù hợp</h2>
            </div>
            <span>{availableBooks.length} có sẵn</span>
          </div>

          <div className="book-grid">
            {books.map((book) => {
              const owner = accountMap.get(book.owner_account_id)
              const isMine = book.owner_account_id === account?.id
              const canRequest = !isMine && book.status === 'available'

              return (
                <article className="book-card" key={book.id}>
                  <BookCover book={book} />
                  <div className="book-card-body">
                    <div className="card-title-row">
                      <div>
                        <span className="book-category-tag">{book.category}</span>
                        <h2>{book.title}</h2>
                        <p>{book.author}</p>
                      </div>
                      <StatusPill status={book.status}>{bookStatusLabels[book.status]}</StatusPill>
                    </div>
                    <dl className="meta-grid book-meta-grid">
                      <div>
                        <dt>Chủ sách</dt>
                        <dd>{owner?.full_name || 'Thành viên'}</dd>
                      </div>
                      <div>
                        <dt>Tình trạng</dt>
                        <dd>{conditionLabels[book.condition]}</dd>
                      </div>
                      <div>
                        <dt>Năm</dt>
                        <dd>{book.publication_year || 'Chưa rõ'}</dd>
                      </div>
                    </dl>
                    <div className="contact-strip">
                      <span>
                        <MapPin size={14} />
                        {book.pickup_location || 'Chưa cập nhật'}
                      </span>
                      <span>
                        <Mail size={14} />
                        {owner?.email_address || 'Chưa có email'}
                      </span>
                      <span>
                        <Phone size={14} />
                        {owner?.phone_number || 'Chưa có số điện thoại'}
                      </span>
                    </div>
                    <div className="card-actions">
                      {isMine && (
                        <ActionButton
                          type="button"
                          icon={Pencil}
                          variant="secondary"
                          onClick={() => onEditBook(book)}
                        >
                          Sửa
                        </ActionButton>
                      )}
                      {isMine && ['available', 'hidden'].includes(book.status) && (
                        <ActionButton
                          type="button"
                          icon={EyeOff}
                          variant="secondary"
                          onClick={() => onHideBook(book)}
                        >
                          {book.status === 'hidden' ? 'Hiện' : 'Ẩn'}
                        </ActionButton>
                      )}
                      {canRequest && (
                        <ActionButton type="button" icon={ArrowRightLeft} onClick={() => onRequestBook(book)}>
                          Yêu cầu
                        </ActionButton>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
            {books.length === 0 && <EmptyState icon={BookOpen} text="Không có sách phù hợp." />}
          </div>
        </section>

        <aside className="tool-panel my-books-panel">
          <PanelHeader icon={Library} title="Sách của tôi" />
          <div className="my-books-board">
            <div>
              <div className="mini-section-title">
                <h3>Đã đăng</h3>
                <span>{ownedBooks.length}</span>
              </div>
              <div className="mini-book-list">
                {ownedBooks.slice(0, 6).map((book) => (
                  <MiniBookItem key={book.id} book={book} detail={bookStatusLabels[book.status]} />
                ))}
                {ownedBooks.length === 0 && <EmptyState icon={BookOpen} text="Chưa đăng sách." />}
              </div>
            </div>
            <div>
              <div className="mini-section-title">
                <h3>Đang mượn</h3>
                <span>{borrowedBooks.length}</span>
              </div>
              <div className="mini-book-list">
                {borrowedBooks.slice(0, 6).map(({ book, transaction }) => (
                  <MiniBookItem
                    key={transaction.id}
                    book={book}
                    detail={transaction.status === 'return_requested' ? 'Đang trả sách' : 'Đang mượn'}
                  />
                ))}
                {borrowedBooks.length === 0 && <EmptyState icon={BookOpen} text="Chưa có sách đang mượn." />}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
