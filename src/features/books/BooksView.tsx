import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRightLeft,
  BookOpen,
  Check,
  EyeOff,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
} from 'lucide-react'
import { bookStatusLabels, conditionLabels } from '../../shared/constants/labels'
import { ActionButton, EmptyState, PanelHeader, StatusPill } from '../../shared/components'
import type { Account, AccountAddress, Book } from '../../types/domain'
import type { BookForm, OwnershipFilter } from '../../types/forms'
import { BookFormBody } from './BookFormModal'
import { BookCover } from './BookCover'

export function BooksView({
  account,
  accountMap,
  books,
  addressOptions,
  categories,
  searchTerm,
  categoryFilter,
  ownershipFilter,
  bookForm,
  editingBookId,
  busyKey,
  onSearch,
  onCategoryFilter,
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
  addressOptions: AccountAddress[]
  categories: string[]
  searchTerm: string
  categoryFilter: string
  ownershipFilter: OwnershipFilter
  bookForm: BookForm
  editingBookId: string | null
  busyKey: string | null
  onSearch: (value: string) => void
  onCategoryFilter: (value: string) => void
  onOwnershipFilter: (value: OwnershipFilter) => void
  onBookFormChange: (value: BookForm) => void
  onBookSubmit: (event: FormEvent<HTMLFormElement>) => void
  onResetBookForm: () => void
  onEditBook: (book: Book) => void
  onHideBook: (book: Book) => void
  onRequestBook: (book: Book) => void
}) {
  const [activeTab, setActiveTab] = useState<'available' | 'borrowed'>('available')

  // Available books matching search, category, ownership
  const availableBooks = books.filter(
    (book) => book.status === 'available' || (book.status === 'hidden' && book.owner_account_id === account?.id)
  )

  // Borrowed books matching search, category, ownership
  const borrowedBooks = books.filter((book) => book.status === 'borrowed')

  // Selected books to display based on active tab
  const displayBooks = activeTab === 'available' ? availableBooks : borrowedBooks

  return (
    <div className="view-stack books-view">
      <section className="books-controls">
        <div className="books-controls-header">
          <div>
            <span className="eyebrow">Khám phá sách</span>
            <h2>Danh sách đang mở</h2>
          </div>
        </div>

        {/* Tabs chuyển đổi giữa Sách có sẵn và Sách đang cho mượn */}
        <div className="books-tabs">
          <button
            className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            <span className="tab-label">Sách có sẵn</span>
            <span className="tab-count">{availableBooks.length}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'borrowed' ? 'active' : ''}`}
            onClick={() => setActiveTab('borrowed')}
          >
            <span className="tab-label">Sách đang cho mượn</span>
            <span className="tab-count">{borrowedBooks.length}</span>
          </button>
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
          <div className="filter-pills two-columns" aria-label="Lọc nhanh sách">
            {[
              ['all', 'Tất cả'],
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
          <span>{displayBooks.length} sách phù hợp</span>
          {activeTab === 'available' && (
            <span>
              {availableBooks.filter((b) => b.status === 'available' && b.owner_account_id !== account?.id).length} sách có thể yêu cầu ngay
            </span>
          )}
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
        <div className="books-section-header">
          <div>
            <span className="eyebrow">Danh sách sách</span>
            <h2>{displayBooks.length} sách phù hợp</h2>
          </div>
          <span>
            {activeTab === 'available'
              ? `${availableBooks.filter((b) => b.status === 'available').length} có sẵn`
              : `${borrowedBooks.length} đang cho mượn`}
          </span>
        </div>

        <div className="book-grid">
          {displayBooks.map((book) => {
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
          {displayBooks.length === 0 && <EmptyState icon={BookOpen} text="Không có sách phù hợp." />}
        </div>
      </section>
    </div>
  )
}
