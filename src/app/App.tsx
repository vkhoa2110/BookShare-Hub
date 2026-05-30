import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  History,
  Library,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  UserRound,
  UserRoundPlus,
} from 'lucide-react'
import '../App.css'
import { navItems, pageTitle } from './navigation'
import { loadApplicationData } from './useAppData'
import { AdminView } from '../features/admin/AdminView'
import { BooksView } from '../features/books/BooksView'
import { BookFormModal } from '../features/books/BookFormModal'
import { createBookForm } from '../features/books/bookForms'
import { filterBooks } from '../features/books/bookUtils'
import { ComplaintsView } from '../features/complaints/ComplaintsView'
import { emptyComplaintForm } from '../features/complaints/complaintForms'
import { DashboardView } from '../features/dashboard/DashboardView'
import { DeliveriesView } from '../features/deliveries/DeliveriesView'
import { ProfileView } from '../features/profile/ProfileView'
import { emptyAddressForm } from '../features/profile/addressForms'
import { RequestDialog, ReturnDialog } from '../features/transactions/TransactionDialogs'
import { TransactionsView } from '../features/transactions/TransactionsView'
import {
  createRequestForm,
  createReturnForm,
  emptyRequestForm,
  emptyReturnForm,
} from '../features/transactions/transactionForms'
import { roleLabels } from '../shared/constants/labels'
import { demoAccounts } from '../shared/constants/rules'
import {
  ActionButton,
  DemoAccounts,
  Field,
  IconOnlyButton,
  MetricLine,
  NoticeBanner,
} from '../shared/components'
import { addressIdForValue } from '../shared/utils/address'
import { getErrorMessage } from '../shared/utils/errors'
import { initials } from '../shared/utils/account'
import {
  deleteAccountAddress,
  ensureAccountForSession,
  registerVolunteer as registerVolunteerAccount,
  saveAddress,
  updateAccountProfile,
} from '../services/accountService'
import { saveBook, updateBookStatus as saveBookStatus } from '../services/bookService'
import { createComplaint, updateComplaintStatus as saveComplaintStatus } from '../services/complaintService'
import { takeDelivery as takeDeliveryOrder, updateDeliveryStatus } from '../services/deliveryService'
import {
  confirmTransaction as confirmTransactionRequest,
  createTransactionRequest,
  markBookReturned,
  requestBookReturn as createBookReturnRequest,
  respondTransaction as respondTransactionRequest,
} from '../services/transactionService'
import { supabase } from '../lib/supabase'
import type {
  Account,
  AccountAddress,
  Book,
  BookStatus,
  BookTransaction,
  Complaint,
  ComplaintStatus,
  Delivery,
  DeliveryStatus,
  PointLedger,
  TransactionHistory,
} from '../lib/types'
import type {
  AddressForm,
  AuthMode,
  BookForm,
  ComplaintForm,
  Notice,
  OwnershipFilter,
  RequestForm,
  ReturnForm,
  View,
} from '../types/forms'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountAddresses, setAccountAddresses] = useState<AccountAddress[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [transactions, setTransactions] = useState<BookTransaction[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [ledger, setLedger] = useState<PointLedger[]>([])
  const [history, setHistory] = useState<TransactionHistory[]>([])
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [schemaReady, setSchemaReady] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all')
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [isBookCreateOpen, setIsBookCreateOpen] = useState(false)
  const [requestBookId, setRequestBookId] = useState<string | null>(null)
  const [returnTransactionId, setReturnTransactionId] = useState<string | null>(null)
  const [bookForm, setBookForm] = useState<BookForm>(() => createBookForm())
  const [requestForm, setRequestForm] = useState<RequestForm>(() => createRequestForm())
  const [returnForm, setReturnForm] = useState<ReturnForm>(() => createReturnForm())
  const [complaintForm, setComplaintForm] = useState<ComplaintForm>(emptyComplaintForm)
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddressForm)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [profileForm, setProfileForm] = useState({ full_name: '', phone_number: '' })
  const [authForm, setAuthForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
  })

  const ensureAccount = useCallback(async (currentSession: Session) => {
    const nextAccount = await ensureAccountForSession(currentSession)
    setAccount(nextAccount)
    setProfileForm({
      full_name: nextAccount.full_name,
      phone_number: nextAccount.phone_number || '',
    })
    return nextAccount
  }, [])

  const loadAppData = useCallback(async (userId: string) => {
    setDataLoading(true)

    try {
      const data = await loadApplicationData(userId)

      setSchemaReady(true)
      setAccount(data.account)
      setProfileForm({
        full_name: data.account.full_name,
        phone_number: data.account.phone_number || '',
      })
      setAccounts(data.accounts)
      setAccountAddresses(data.addresses)
      setBooks(data.books)
      setTransactions(data.transactions)
      setDeliveries(data.deliveries)
      setComplaints(data.complaints)
      setLedger(data.ledger)
      setHistory(data.history)
    } catch (error) {
      setSchemaReady(false)
      setNotice({
        type: 'error',
        text: `Chưa đọc được dữ liệu Supabase: ${getErrorMessage(error)}`,
      })
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      const { data } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      setSession(data.session)

      if (data.session) {
        try {
          await ensureAccount(data.session)
          await loadAppData(data.session.user.id)
        } catch (error) {
          setSchemaReady(false)
          setNotice({
            type: 'error',
            text: `Không khởi tạo được tài khoản: ${getErrorMessage(error)}`,
          })
        }
      }

      setLoading(false)
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (!nextSession) {
        clearLocalData()
        setLoading(false)
        return
      }

      window.setTimeout(async () => {
        try {
          await ensureAccount(nextSession)
          await loadAppData(nextSession.user.id)
        } catch (error) {
          setSchemaReady(false)
          setNotice({
            type: 'error',
            text: `Không tải được dữ liệu: ${getErrorMessage(error)}`,
          })
        }
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [ensureAccount, loadAppData])

  const handleViewChange = useCallback((view: View) => {
    setActiveView(view)
    if (view.startsWith('profile')) {
      setIsProfileExpanded(true)
    } else {
      setIsProfileExpanded(false)
    }
  }, [])

  const accountMap = useMemo(() => {
    return new Map(accounts.map((item) => [item.id, item]))
  }, [accounts])

  const bookMap = useMemo(() => {
    return new Map(books.map((item) => [item.id, item]))
  }, [books])

  const deliveriesByTransaction = useMemo(() => {
    const grouped = new Map<string, Delivery[]>()

    for (const delivery of deliveries) {
      grouped.set(delivery.transaction_id, [...(grouped.get(delivery.transaction_id) || []), delivery])
    }

    return grouped
  }, [deliveries])

  const categories = useMemo(() => {
    return Array.from(new Set(books.map((book) => book.category).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'vi'),
    )
  }, [books])

  const filteredBooks = useMemo(() => {
    return filterBooks({
      books,
      account,
      searchTerm,
      categoryFilter,
      statusFilter,
      ownershipFilter,
    })
  }, [account, books, categoryFilter, ownershipFilter, searchTerm, statusFilter])

  const myTransactions = useMemo(() => {
    if (!account) {
      return []
    }

    return transactions.filter(
      (transaction) =>
        transaction.owner_account_id === account.id ||
        transaction.borrower_account_id === account.id ||
        account.role === 'admin',
    )
  }, [account, transactions])

  const activeTransactions = useMemo(() => {
    return myTransactions.filter(
      (transaction) =>
        ['requested', 'accepted', 'delivered', 'return_requested'].includes(transaction.status) ||
        (transaction.transaction_type === 'borrow' && transaction.status === 'completed'),
    )
  }, [myTransactions])

  const openDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => delivery.status === 'open')
  }, [deliveries])

  const myDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => delivery.volunteer_account_id === account?.id)
  }, [account?.id, deliveries])

  const selectedRequestBook = requestBookId ? bookMap.get(requestBookId) : null
  const selectedReturnTransaction = returnTransactionId
    ? transactions.find((transaction) => transaction.id === returnTransactionId)
    : null

  async function refreshData() {
    if (session?.user.id) {
      await loadAppData(session.user.id)
    }
  }

  function clearLocalData() {
    setAccount(null)
    setAccounts([])
    setAccountAddresses([])
    setBooks([])
    setTransactions([])
    setDeliveries([])
    setComplaints([])
    setLedger([])
    setHistory([])
  }

  async function runAction(key: string, successText: string, action: () => Promise<void>) {
    setBusyKey(key)
    setNotice(null)
    let succeeded = false

    try {
      await action()
      await refreshData()
      setNotice({ type: 'success', text: successText })
      succeeded = true
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setBusyKey(null)
    }

    return succeeded
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyKey('auth')
    setNotice(null)

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              full_name: authForm.full_name,
              phone_number: authForm.phone_number,
            },
          },
        })

        if (error) {
          throw error
        }

        if (data.session) {
          await ensureAccount(data.session)
          await loadAppData(data.session.user.id)
          setNotice({ type: 'success', text: 'Đăng ký thành công. Tài khoản nhận 20 điểm.' })
        } else {
          setNotice({
            type: 'info',
            text: 'Đã gửi yêu cầu đăng ký. Kiểm tra email nếu Supabase yêu cầu xác nhận.',
          })
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        })

        if (error) {
          throw error
        }

        if (data.session) {
          await ensureAccount(data.session)
          await loadAppData(data.session.user.id)
        }
      }
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setSession(null)
    clearLocalData()
    setIsBookCreateOpen(false)
    handleViewChange('dashboard')
  }

  function useDemoAccount(email: string, password: string) {
    setAuthMode('signin')
    setAuthForm({
      full_name: '',
      phone_number: '',
      email,
      password,
    })
  }

  async function handleBookSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!account) {
      return
    }

    const isCreating = !editingBookId
    const succeeded = await runAction(
      editingBookId ? 'book-update' : 'book-create',
      editingBookId ? 'Đã cập nhật sách.' : 'Đã thêm sách vào kho.',
      async () => {
        if (!bookForm.pickup_location.trim()) {
          throw new Error('Cần chọn hoặc nhập địa chỉ nhận sách.')
        }

        const response = await saveBook(account.id, bookForm, editingBookId)

        if (response.error) {
          throw response.error
        }

        resetBookForm()
      },
    )

    if (succeeded && isCreating) {
      setIsBookCreateOpen(false)
    }
  }

  function startEditBook(book: Book) {
    setIsBookCreateOpen(false)
    setEditingBookId(book.id)
    setBookForm({
      title: book.title,
      category: book.category,
      author: book.author,
      publication_year: book.publication_year ? String(book.publication_year) : '',
      condition: book.condition,
      address_id: addressIdForValue(accountAddresses, book.pickup_location || ''),
      pickup_location: book.pickup_location || '',
      cover_image_url: book.cover_image_url || null,
      cover_file: null,
    })
    handleViewChange('books')
  }

  function resetBookForm() {
    setEditingBookId(null)
    setBookForm(createBookForm(accountAddresses))
  }

  function openBookCreate() {
    resetBookForm()
    handleViewChange('books')
    setIsBookCreateOpen(true)
  }

  function closeBookCreate() {
    setIsBookCreateOpen(false)
    resetBookForm()
  }

  async function updateBookStatus(bookId: string, status: BookStatus) {
    await runAction(`book-status-${bookId}`, 'Đã cập nhật trạng thái sách.', async () => {
      const { error } = await saveBookStatus(bookId, status)

      if (error) {
        throw error
      }
    })
  }

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedRequestBook) {
      return
    }

    await runAction('request-create', 'Đã gửi yêu cầu giao dịch.', async () => {
      const { error } = await createTransactionRequest({
        bookId: selectedRequestBook.id,
        transactionType: requestForm.transaction_type,
        deliveryMethod: requestForm.delivery_method,
        returnDueAt: requestForm.return_due_at,
        dropoffLocation: requestForm.dropoff_location,
      })

      if (error) {
        throw error
      }

      setRequestBookId(null)
      setRequestForm(emptyRequestForm)
      handleViewChange('transactions')
    })
  }

  async function respondTransaction(transactionId: string, accept: boolean) {
    await runAction(
      `${accept ? 'accept' : 'reject'}-${transactionId}`,
      accept ? 'Đã chấp nhận yêu cầu.' : 'Đã từ chối yêu cầu.',
      async () => {
        const { error } = await respondTransactionRequest(transactionId, accept)

        if (error) {
          throw error
        }
      },
    )
  }

  async function confirmTransaction(transactionId: string) {
    await runAction(`confirm-${transactionId}`, 'Đã xác nhận đã nhận sách.', async () => {
      const { error } = await confirmTransactionRequest(transactionId)

      if (error) {
        throw error
      }
    })
  }

  async function requestBookReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedReturnTransaction) {
      return
    }

    await runAction('return-request', 'Đã tạo yêu cầu hoàn trả sách.', async () => {
      const { error } = await createBookReturnRequest({
        transactionId: selectedReturnTransaction.id,
        deliveryMethod: returnForm.delivery_method,
        pickupLocation: returnForm.pickup_location,
      })

      if (error) {
        throw error
      }

      setReturnTransactionId(null)
      setReturnForm(emptyReturnForm)
      handleViewChange('transactions')
    })
  }

  async function markReturned(transactionId: string) {
    await runAction(`return-${transactionId}`, 'Đã xác nhận nhận lại sách và đóng giao dịch.', async () => {
      const { error } = await markBookReturned(transactionId)

      if (error) {
        throw error
      }
    })
  }

  async function registerVolunteer() {
    await runAction('register-volunteer', 'Đã đăng ký làm người giao sách.', async () => {
      const { error } = await registerVolunteerAccount()

      if (error) {
        throw error
      }
    })
  }

  async function takeDelivery(deliveryId: string) {
    await runAction(`take-delivery-${deliveryId}`, 'Đã nhận đơn giao sách.', async () => {
      const { error } = await takeDeliveryOrder(deliveryId)

      if (error) {
        throw error
      }
    })
  }

  async function updateDelivery(deliveryId: string, status: DeliveryStatus) {
    await runAction(`delivery-${deliveryId}-${status}`, 'Đã cập nhật đơn giao sách.', async () => {
      const { error } = await updateDeliveryStatus(deliveryId, status)

      if (error) {
        throw error
      }
    })
  }

  async function submitComplaint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!account) {
      return
    }

    await runAction('complaint-create', 'Đã gửi khiếu nại.', async () => {
      const { error } = await createComplaint(account.id, complaintForm)

      if (error) {
        throw error
      }

      setComplaintForm(emptyComplaintForm)
    })
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!account) {
      return
    }

    await runAction('profile-update', 'Đã cập nhật hồ sơ.', async () => {
      const { error } = await updateAccountProfile(account.id, profileForm)

      if (error) {
        throw error
      }
    })
  }

  function startEditAddress(address: AccountAddress) {
    setEditingAddressId(address.id)
    setAddressForm({
      label: address.label,
      address_text: address.address_text,
      is_default: address.is_default,
    })
  }

  function resetAddressForm() {
    setEditingAddressId(null)
    setAddressForm(emptyAddressForm)
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!account) {
      return
    }

    await runAction(
      editingAddressId ? 'address-update' : 'address-create',
      editingAddressId ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ.',
      async () => {
        if (!addressForm.address_text.trim()) {
          throw new Error('Địa chỉ không được để trống.')
        }

        const response = await saveAddress(account.id, addressForm, editingAddressId)

        if (response.error) {
          throw response.error
        }

        resetAddressForm()
      },
    )
  }

  async function deleteAddress(addressId: string) {
    if (!account) {
      return
    }

    await runAction(`address-delete-${addressId}`, 'Đã xóa địa chỉ.', async () => {
      const { error } = await deleteAccountAddress(account.id, addressId)

      if (error) {
        throw error
      }
    })
  }

  async function updateComplaintStatus(complaintId: string, status: ComplaintStatus, outcome: string) {
    await runAction(`complaint-${complaintId}`, 'Đã cập nhật khiếu nại.', async () => {
      const { error } = await saveComplaintStatus({
        complaintId,
        status,
        outcome,
        handledByAccountId: account?.id || null,
      })

      if (error) {
        throw error
      }
    })
  }

  if (loading) {
    return (
      <main className="shell loading-shell">
        <RefreshCw className="spin" size={26} />
        <span>Đang tải BookShare Hub</span>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="auth-shell">
        <section className="auth-brand" aria-label="BookShare Hub">
          <div className="brand-mark">
            <BookOpen size={34} />
          </div>
          <h1>BookShare Hub</h1>
          <div className="auth-metrics">
            <MetricLine label="Điểm đăng ký" value="+20" />
            <MetricLine label="Trao đổi" value="+10 / -10" />
            <MetricLine label="Cho mượn" value="+5 / -5" />
            <MetricLine label="Giao sách" value="+2" />
          </div>
        </section>

        <section className="auth-panel">
          <div className="segmented" role="tablist" aria-label="Chọn chế độ">
            <button
              className={authMode === 'signin' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('signin')}
            >
              Đăng nhập
            </button>
            <button
              className={authMode === 'signup' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('signup')}
            >
              Đăng ký
            </button>
          </div>

          {notice && <NoticeBanner notice={notice} onClose={() => setNotice(null)} />}

          {authMode === 'signin' && <DemoAccounts accounts={demoAccounts} onUse={useDemoAccount} />}

          <form className="stack-form" onSubmit={handleAuth}>
            {authMode === 'signup' && (
              <>
                <Field label="Họ tên">
                  <input
                    required
                    value={authForm.full_name}
                    onChange={(event) => setAuthForm({ ...authForm, full_name: event.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </Field>
                <Field label="Số điện thoại">
                  <input
                    value={authForm.phone_number}
                    onChange={(event) => setAuthForm({ ...authForm, phone_number: event.target.value })}
                    placeholder="09xxxxxxxx"
                  />
                </Field>
              </>
            )}
            <Field label="Email">
              <input
                required
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Mật khẩu">
              <input
                required
                type="password"
                minLength={6}
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                placeholder="Tối thiểu 6 ký tự"
              />
            </Field>
            <ActionButton icon={authMode === 'signup' ? UserRoundPlus : UserRound} busy={busyKey === 'auth'}>
              {authMode === 'signup' ? 'Tạo tài khoản' : 'Đăng nhập'}
            </ActionButton>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Điều hướng">
        <div className="sidebar-brand">
          <div className="brand-mark compact">
            <BookOpen size={24} />
          </div>
          <div>
            <strong>BookShare Hub</strong>
            <span>Câu lạc bộ đọc sách</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems
            .filter((item) => !item.adminOnly || account?.role === 'admin')
            .map((item) => {
              const isProfile = item.view === 'profile'
              const isProfileActive = activeView.startsWith('profile')

              if (isProfile) {
                return (
                  <div key="profile-group" style={{ display: 'grid', gap: '4px' }}>
                    <button
                      type="button"
                      className={isProfileActive ? 'active' : ''}
                      onClick={() => {
                        setIsProfileExpanded(!isProfileExpanded)
                        if (!activeView.startsWith('profile')) {
                          handleViewChange('profile-info')
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                    >
                      <item.icon size={18} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <ChevronDown
                        size={16}
                        style={{
                          transform: isProfileExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          opacity: 0.7,
                        }}
                      />
                    </button>

                    {isProfileExpanded && (
                      <div className="sub-nav-list">
                        <button
                          type="button"
                          className={activeView === 'profile-info' ? 'active' : ''}
                          onClick={() => handleViewChange('profile-info')}
                        >
                          <UserRound size={16} />
                          <span>Thông tin cá nhân</span>
                        </button>
                        <button
                          type="button"
                          className={activeView === 'profile-addresses' ? 'active' : ''}
                          onClick={() => handleViewChange('profile-addresses')}
                        >
                          <MapPin size={16} />
                          <span>Địa chỉ nhận sách</span>
                        </button>
                        <button
                          type="button"
                          className={activeView === 'profile-books' ? 'active' : ''}
                          onClick={() => handleViewChange('profile-books')}
                        >
                          <Library size={16} />
                          <span>Sách của tôi</span>
                        </button>
                        <button
                          type="button"
                          className={activeView === 'profile-points' ? 'active' : ''}
                          onClick={() => handleViewChange('profile-points')}
                        >
                          <CircleDollarSign size={16} />
                          <span>Lịch sử điểm</span>
                        </button>
                        <button
                          type="button"
                          className={activeView === 'profile-history' ? 'active' : ''}
                          onClick={() => handleViewChange('profile-history')}
                        >
                          <History size={16} />
                          <span>Lịch sử giao dịch</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <button
                  key={item.view}
                  type="button"
                  className={activeView === item.view ? 'active' : ''}
                  onClick={() => handleViewChange(item.view)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-chip">
            <div className="avatar">{initials(account?.full_name || session.user.email || 'BH')}</div>
            <div>
              <strong>{account?.full_name || session.user.email}</strong>
              <span>{account ? roleLabels[account.role] : 'Thành viên'}</span>
            </div>
          </div>
          <ActionButton icon={LogOut} variant="secondary" onClick={handleSignOut}>
            Đăng xuất
          </ActionButton>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">{account ? roleLabels[account.role] : 'Thành viên'}</span>
            <h1>{pageTitle(activeView)}</h1>
          </div>
          <div className="topbar-actions">
            <ActionButton type="button" icon={Plus} variant="secondary" onClick={openBookCreate}>
              Thêm sách
            </ActionButton>
            <div className="score-pill">
              <CircleDollarSign size={18} />
              <span>{account?.points ?? 0} điểm</span>
            </div>
            <IconOnlyButton label="Tải lại dữ liệu" onClick={refreshData} busy={dataLoading}>
              <RefreshCw size={18} />
            </IconOnlyButton>
          </div>
        </header>

        {!schemaReady && (
          <div className="setup-banner">
            <AlertTriangle size={18} />
            <span>
              Hãy chạy file SQL tại `supabase/schema.sql` trong Supabase SQL Editor trước khi dùng app.
            </span>
          </div>
        )}

        {notice && <NoticeBanner notice={notice} onClose={() => setNotice(null)} />}

        {activeView === 'dashboard' && (
          <DashboardView
            account={account}
            books={books}
            transactions={activeTransactions}
            deliveries={openDeliveries}
            ledger={ledger}
            accountMap={accountMap}
            bookMap={bookMap}
            setActiveView={handleViewChange}
          />
        )}

        {activeView === 'books' && (
          <BooksView
            account={account}
            accountMap={accountMap}
            books={filteredBooks}
            addressOptions={accountAddresses}
            categories={categories}
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            ownershipFilter={ownershipFilter}
            bookForm={bookForm}
            editingBookId={editingBookId}
            busyKey={busyKey}
            onSearch={setSearchTerm}
            onCategoryFilter={setCategoryFilter}
            onStatusFilter={setStatusFilter}
            onOwnershipFilter={setOwnershipFilter}
            onBookFormChange={setBookForm}
            onBookSubmit={handleBookSubmit}
            onResetBookForm={resetBookForm}
            onEditBook={startEditBook}
            onHideBook={(book) =>
              updateBookStatus(book.id, book.status === 'hidden' ? 'available' : 'hidden')
            }
            onRequestBook={(book) => {
              setRequestBookId(book.id)
              setRequestForm(createRequestForm(accountAddresses))
            }}
          />
        )}

        {activeView === 'transactions' && (
          <TransactionsView
            account={account}
            transactions={myTransactions}
            accountMap={accountMap}
            bookMap={bookMap}
            deliveries={deliveriesByTransaction}
            busyKey={busyKey}
            onAccept={(transaction) => respondTransaction(transaction.id, true)}
            onReject={(transaction) => respondTransaction(transaction.id, false)}
            onConfirm={(transaction) => confirmTransaction(transaction.id)}
            onRequestReturn={(transaction) => {
              setReturnTransactionId(transaction.id)
              setReturnForm(createReturnForm(accountAddresses))
            }}
            onConfirmReturn={(transaction) => markReturned(transaction.id)}
          />
        )}

        {activeView === 'deliveries' && (
          <DeliveriesView
            account={account}
            openDeliveries={openDeliveries}
            myDeliveries={myDeliveries}
            accountMap={accountMap}
            bookMap={bookMap}
            transactionMap={new Map(transactions.map((transaction) => [transaction.id, transaction]))}
            busyKey={busyKey}
            onRegister={registerVolunteer}
            onTake={takeDelivery}
            onUpdate={updateDelivery}
          />
        )}

        {activeView === 'complaints' && (
          <ComplaintsView
            account={account}
            complaints={complaints}
            transactions={myTransactions}
            accountMap={accountMap}
            bookMap={bookMap}
            form={complaintForm}
            busyKey={busyKey}
            onFormChange={setComplaintForm}
            onSubmit={submitComplaint}
          />
        )}

        {activeView.startsWith('profile') && (
          <ProfileView
            subView={activeView}
            account={account}
            form={profileForm}
            addresses={accountAddresses}
            addressForm={addressForm}
            editingAddressId={editingAddressId}
            ledger={ledger}
            history={history}
            accountMap={accountMap}
            busyKey={busyKey}
            onFormChange={setProfileForm}
            onSubmit={updateProfile}
            onAddressFormChange={setAddressForm}
            onAddressSubmit={submitAddress}
            onEditAddress={startEditAddress}
            onDeleteAddress={deleteAddress}
            onResetAddressForm={resetAddressForm}
            books={books}
            transactions={transactions}
          />
        )}

        {activeView === 'admin' && account?.role === 'admin' && (
          <AdminView
            accounts={accounts}
            books={books}
            transactions={transactions}
            complaints={complaints}
            accountMap={accountMap}
            bookMap={bookMap}
            busyKey={busyKey}
            onUpdateComplaint={updateComplaintStatus}
          />
        )}
      </section>

      {selectedRequestBook && (
        <RequestDialog
          account={account}
          book={selectedRequestBook}
          owner={accountMap.get(selectedRequestBook.owner_account_id)}
          addresses={accountAddresses}
          form={requestForm}
          busy={busyKey === 'request-create'}
          onFormChange={setRequestForm}
          onClose={() => setRequestBookId(null)}
          onSubmit={createRequest}
        />
      )}

      {selectedReturnTransaction && (
        <ReturnDialog
          transaction={selectedReturnTransaction}
          book={bookMap.get(selectedReturnTransaction.book_id)}
          owner={accountMap.get(selectedReturnTransaction.owner_account_id)}
          borrower={accountMap.get(selectedReturnTransaction.borrower_account_id)}
          addresses={accountAddresses}
          form={returnForm}
          busy={busyKey === 'return-request'}
          onFormChange={setReturnForm}
          onClose={() => setReturnTransactionId(null)}
          onSubmit={requestBookReturn}
        />
      )}

      {isBookCreateOpen && (
        <BookFormModal
          addresses={accountAddresses}
          form={bookForm}
          busy={busyKey === 'book-create'}
          onFormChange={setBookForm}
          onClose={closeBookCreate}
          onSubmit={handleBookSubmit}
        />
      )}
    </main>
  )
}

export default App
