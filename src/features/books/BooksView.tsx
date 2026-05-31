import { useMemo, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import {
  ArrowRightLeft,
  BookOpen,
  Calendar,
  Check,
  EyeOff,
  ListFilter,
  MapPin,
  Pencil,
  Plus,
  Search,
  Tag,
  UserRound,
  X,
} from 'lucide-react'
import { bookStatusLabels, conditionLabels } from '../../shared/constants/labels'
import { ActionButton, EmptyState, IconOnlyButton, PanelHeader, StatusPill } from '../../shared/components'
import type { Account, AccountAddress, Book, BookTransaction } from '../../types/domain'
import type { BookForm } from '../../types/forms'
import { BookFormBody } from './BookFormModal'
import { BookCover } from './BookCover'
import { filterBooks, normalizeBookSearchText } from './bookUtils'
import { formatDate } from '../../shared/utils/date'

type BookScope = 'all' | 'available' | 'borrowed'
type BookSort = 'relevance' | 'newest' | 'title'

function getBookTime(book: Book) {
  const time = Date.parse(book.created_at)
  return Number.isNaN(time) ? 0 : time
}

function rankBook(book: Book, searchTerm: string) {
  const term = normalizeBookSearchText(searchTerm.trim())

  if (!term) {
    return 0
  }

  const title = normalizeBookSearchText(book.title)
  const author = normalizeBookSearchText(book.author)
  const category = normalizeBookSearchText(book.category)

  if (title === term) return 0
  if (title.startsWith(term)) return 1
  if (author.startsWith(term)) return 2
  if (title.includes(term)) return 3
  if (author.includes(term)) return 4
  if (category.includes(term)) return 5
  return 6
}

function BookDetailDialog({
  account,
  book,
  owner,
  onClose,
  onEditBook,
  onHideBook,
  onRequestBook,
  transactions = [],
}: {
  account: Account | null
  book: Book
  owner?: Account
  onClose: () => void
  onEditBook: (book: Book) => void
  onHideBook: (book: Book) => void
  onRequestBook: (book: Book) => void
  transactions?: BookTransaction[]
}) {
  const isMine = book.owner_account_id === account?.id
  const canRequest = !isMine && book.status === 'available' && account?.role !== 'admin'

  function closeThen(action: (book: Book) => void) {
    onClose()
    action(book)
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="dialog book-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-detail-title"
      >
        <div className="dialog-header book-detail-header">
          <div>
            <h2 id="book-detail-title">Chi tiết sách</h2>
          </div>
          <IconOnlyButton label="Đóng" onClick={onClose}>
            <X size={18} />
          </IconOnlyButton>
        </div>

        <div className="book-detail-layout">
          <div className="book-detail-cover-wrap">
            <BookCover book={book} />
            <StatusPill status={book.status}>{bookStatusLabels[book.status]}</StatusPill>
          </div>

          <div className="book-detail-content">
            <div className="book-detail-title-block">
              <span>{book.category}</span>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
            </div>

            <dl className="book-detail-grid">
              <div>
                <dt>
                  <UserRound size={15} />
                  Chủ sách
                </dt>
                <dd>{owner?.full_name || 'Thành viên'}</dd>
              </div>
              <div>
                <dt>
                  <BookOpen size={15} />
                  Tình trạng
                </dt>
                <dd>{conditionLabels[book.condition]}</dd>
              </div>
              <div>
                <dt>
                  <Calendar size={15} />
                  Năm xuất bản
                </dt>
                <dd>{book.publication_year || 'Chưa rõ'}</dd>
              </div>
              <div>
                <dt>
                  <Tag size={15} />
                  Thể loại
                </dt>
                <dd>{book.category}</dd>
              </div>
              <div className="book-detail-address">
                <dt>
                  <MapPin size={15} />
                  Địa chỉ lấy sách
                </dt>
                <dd>{book.pickup_location || 'Chưa cập nhật'}</dd>
              </div>
              {book.status === 'borrowed' && (() => {
                const activeTx = transactions?.find(
                  (t) => t.book_id === book.id && ['completed', 'return_requested'].includes(t.status)
                )
                return activeTx?.return_due_at ? (
                  <div className="book-detail-return-due" style={{ gridColumn: '1 / -1' }}>
                    <dt style={{ color: '#b45309', fontWeight: 800 }}>
                      <Calendar size={15} />
                      Ngày dự kiến trả
                    </dt>
                    <dd style={{ color: '#b45309', fontWeight: 800 }}>{formatDate(activeTx.return_due_at)}</dd>
                  </div>
                ) : null
              })()}
            </dl>

            <div className="book-detail-actions">
              {canRequest && (
                <ActionButton type="button" icon={ArrowRightLeft} onClick={() => closeThen(onRequestBook)}>
                  Yêu cầu mượn
                </ActionButton>
              )}
              {isMine && (
                <ActionButton type="button" icon={Pencil} onClick={() => closeThen(onEditBook)}>
                  Sửa
                </ActionButton>
              )}
              {isMine && ['available', 'hidden'].includes(book.status) && (
                <ActionButton
                  type="button"
                  icon={EyeOff}
                  variant="secondary"
                  onClick={() => closeThen(onHideBook)}
                >
                  {book.status === 'hidden' ? 'Hiện sách' : 'Ẩn sách'}
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export function BooksView({
  account,
  accountMap,
  books,
  addressOptions,
  categories,
  searchTerm,
  categoryFilter,
  bookForm,
  editingBookId,
  busyKey,
  onSearch,
  onCategoryFilter,
  onBookFormChange,
  onBookSubmit,
  onResetBookForm,
  onEditBook,
  onHideBook,
  onRequestBook,
  onOpenBookCreate,
  transactions = [],
}: {
  account: Account | null
  accountMap: Map<string, Account>
  books: Book[]
  addressOptions: AccountAddress[]
  categories: string[]
  searchTerm: string
  categoryFilter: string
  bookForm: BookForm
  editingBookId: string | null
  busyKey: string | null
  onSearch: (value: string) => void
  onCategoryFilter: (value: string) => void
  onBookFormChange: (value: BookForm) => void
  onBookSubmit: (event: FormEvent<HTMLFormElement>) => void
  onResetBookForm: () => void
  onEditBook: (book: Book) => void
  onHideBook: (book: Book) => void
  onRequestBook: (book: Book) => void
  onOpenBookCreate: () => void
  transactions?: BookTransaction[]
}) {
  const [bookScope, setBookScope] = useState<BookScope>('all')
  const [sortOrder, setSortOrder] = useState<BookSort>('relevance')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const baseFilteredBooks = useMemo(
    () =>
      filterBooks({
        books,
        account,
        searchTerm,
        categoryFilter,
        statusFilter: 'all',
        ownershipFilter: 'all',
      }).filter((book) => book.status !== 'exchanged' && book.owner_account_id !== account?.id),
    [account, books, categoryFilter, searchTerm],
  )

  const scopedBooks = useMemo(() => {
    if (bookScope === 'available') {
      return baseFilteredBooks.filter((book) => book.status === 'available')
    }

    if (bookScope === 'borrowed') {
      return baseFilteredBooks.filter((book) => book.status === 'borrowed')
    }

    return baseFilteredBooks
  }, [baseFilteredBooks, bookScope])

  const displayBooks = useMemo(() => {
    const sortedBooks = [...scopedBooks]

    if (sortOrder === 'title') {
      return sortedBooks.sort((firstBook, secondBook) =>
        firstBook.title.localeCompare(secondBook.title, 'vi'),
      )
    }

    if (sortOrder === 'newest') {
      return sortedBooks.sort((firstBook, secondBook) => getBookTime(secondBook) - getBookTime(firstBook))
    }

    return sortedBooks.sort((firstBook, secondBook) => {
      const rankDelta = rankBook(firstBook, searchTerm) - rankBook(secondBook, searchTerm)

      if (rankDelta !== 0) {
        return rankDelta
      }

      return getBookTime(secondBook) - getBookTime(firstBook)
    })
  }, [scopedBooks, searchTerm, sortOrder])

  const normalizedSearchTerm = searchTerm.trim()

  const scopeOptions: Array<{ value: BookScope; label: string }> = [
    { value: 'all', label: 'Tất cả' },
    { value: 'available', label: 'Có sẵn' },
    { value: 'borrowed', label: 'Đang mượn' },
  ]

  function openBookDetailFromKeyboard(event: KeyboardEvent<HTMLElement>, book: Book) {
    if (event.target !== event.currentTarget) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedBook(book)
    }
  }

  return (
    <div className="view-stack books-view">
      <section className="books-controls search-first-controls" role="search" aria-label="Tìm sách trong kho">
        <div className="book-search-primary-row">
          <div className="book-search-main">
            <label className="book-category-control">
              <select
                aria-label="Lọc theo thể loại"
                value={categoryFilter}
                onChange={(event) => onCategoryFilter(event.target.value)}
              >
                <option value="all">Tất cả thể loại</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="book-search-field">
              <Search size={20} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Tên sách, tác giả, thể loại, địa điểm..."
                aria-label="Tìm theo tên sách, tác giả, thể loại hoặc địa điểm"
              />
            </div>

            {normalizedSearchTerm && (
              <button
                type="button"
                className="book-search-clear"
                onClick={() => onSearch('')}
                aria-label="Xóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <ActionButton
            type="button"
            icon={Plus}
            variant="primary"
            onClick={onOpenBookCreate}
            className="book-add-button"
          >
            Thêm sách
          </ActionButton>
        </div>

        <div className="book-search-panel-footer">
          <div className="book-scope-pills" aria-label="Lọc nhanh sách">
            {scopeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={bookScope === option.value ? 'active' : ''}
                onClick={() => setBookScope(option.value)}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          <div className="book-search-tools">
            <label className="book-sort-control">
              <ListFilter size={16} />
              <select
                aria-label="Sắp xếp sách"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as BookSort)}
              >
                <option value="relevance">Phù hợp nhất</option>
                <option value="newest">Mới nhất</option>
                <option value="title">Tên A-Z</option>
              </select>
            </label>
          </div>
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

      <section className="books-results">
        <div className="books-section-header books-results-header">
          <div>
            <span className="eyebrow">Kết quả</span>
            <h2>{displayBooks.length} sách phù hợp</h2>
          </div>
          <span>{categoryFilter === 'all' ? 'Tất cả thể loại' : categoryFilter}</span>
        </div>

        <div className="book-grid">
          {displayBooks.map((book) => {
            return (
              <article
                className="book-card"
                key={book.id}
                role="button"
                tabIndex={0}
                aria-label={`Xem chi tiết ${book.title}`}
                onClick={() => setSelectedBook(book)}
                onKeyDown={(event) => openBookDetailFromKeyboard(event, book)}
              >
                <div className="book-card-cover-wrap">
                  <BookCover book={book} />
                  <StatusPill status={book.status}>{bookStatusLabels[book.status]}</StatusPill>
                  <span className="book-condition-tag">{conditionLabels[book.condition]}</span>
                </div>
                <div className="book-card-body">
                  <div className="book-card-title-block">
                    <h2>{book.title}</h2>
                    <p>
                      {book.author} · {book.category}
                    </p>
                  </div>

                  <div className="book-card-meta" aria-label="Thông tin tóm tắt">
                    <span className="book-card-address">
                      <MapPin size={14} />
                      <span>{book.pickup_location || 'Chưa cập nhật'}</span>
                    </span>
                    {book.status === 'borrowed' && (() => {
                      const activeTx = transactions?.find(
                        (t) => t.book_id === book.id && ['completed', 'return_requested'].includes(t.status)
                      )
                      return activeTx?.return_due_at ? (
                        <span className="book-card-return-due" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#b45309', fontWeight: 700, marginTop: '4px' }}>
                          <Calendar size={13} />
                          <span>Hạn trả: {formatDate(activeTx.return_due_at)}</span>
                        </span>
                      ) : null
                    })()}
                  </div>
                </div>
              </article>
            )
          })}
          {displayBooks.length === 0 && (
            <div className="books-empty-state">
              <EmptyState icon={BookOpen} text="Không có sách phù hợp." />
            </div>
          )}
        </div>
      </section>

      {selectedBook && (
        <BookDetailDialog
          account={account}
          book={selectedBook}
          owner={accountMap.get(selectedBook.owner_account_id)}
          onClose={() => setSelectedBook(null)}
          onEditBook={onEditBook}
          onHideBook={onHideBook}
          onRequestBook={onRequestBook}
          transactions={transactions}
        />
      )}
    </div>
  )
}
