import type { ButtonHTMLAttributes, FormEvent, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  EyeOff,
  HandHeart,
  History,
  Library,
  LogOut,
  Mail,
  MessageSquareWarning,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserRound,
  UserRoundPlus,
  X,
  type LucideIcon,
} from 'lucide-react'
import './App.css'
import {
  bookStatusLabels,
  complaintStatusLabels,
  conditionLabels,
  deliveryMethodLabels,
  deliveryStatusLabels,
  roleLabels,
  transactionStatusLabels,
  transactionTypeLabels,
} from './lib/labels'
import { supabase } from './lib/supabase'
import type {
  Account,
  Book,
  BookCondition,
  BookStatus,
  BookTransaction,
  Complaint,
  ComplaintStatus,
  Delivery,
  DeliveryMethod,
  DeliveryStatus,
  PointLedger,
  TransactionHistory,
  TransactionType,
} from './lib/types'

type View = 'dashboard' | 'books' | 'transactions' | 'deliveries' | 'complaints' | 'profile' | 'admin'
type Notice = { type: 'success' | 'error' | 'info'; text: string } | null
type AuthMode = 'signin' | 'signup'
type OwnershipFilter = 'all' | 'available' | 'mine'

type BookForm = {
  title: string
  category: string
  author: string
  publication_year: string
  condition: BookCondition
}

type RequestForm = {
  transaction_type: TransactionType
  delivery_method: DeliveryMethod
  return_due_at: string
  pickup_location: string
  dropoff_location: string
}

type ComplaintForm = {
  transaction_id: string
  reported_account_id: string
  complaint_details: string
}

const emptyBookForm: BookForm = {
  title: '',
  category: '',
  author: '',
  publication_year: '',
  condition: 'good',
}

const emptyRequestForm: RequestForm = {
  transaction_type: 'exchange',
  delivery_method: 'self_pickup',
  return_due_at: '',
  pickup_location: '',
  dropoff_location: '',
}

const emptyComplaintForm: ComplaintForm = {
  transaction_id: '',
  reported_account_id: '',
  complaint_details: '',
}

const navItems: Array<{ view: View; label: string; icon: LucideIcon; adminOnly?: boolean }> = [
  { view: 'dashboard', label: 'Tổng quan', icon: Library },
  { view: 'books', label: 'Kho sách', icon: BookOpen },
  { view: 'transactions', label: 'Giao dịch', icon: ArrowRightLeft },
  { view: 'deliveries', label: 'Giao sách', icon: Truck },
  { view: 'complaints', label: 'Khiếu nại', icon: MessageSquareWarning },
  { view: 'profile', label: 'Hồ sơ', icon: UserRound },
  { view: 'admin', label: 'Quản trị', icon: ShieldCheck, adminOnly: true },
]

const pointRule: Record<TransactionType, number> = {
  exchange: 10,
  borrow: 5,
}

const demoAccounts = [
  { label: 'Quản trị', email: 'admin@booksharehub.com', password: 'Bookshare123!' },
  { label: 'Thành viên', email: 'hung@booksharehub.com', password: 'Bookshare123!' },
  { label: 'Người giao', email: 'lan@booksharehub.com', password: 'Bookshare123!' },
]

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [transactions, setTransactions] = useState<BookTransaction[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [ledger, setLedger] = useState<PointLedger[]>([])
  const [history, setHistory] = useState<TransactionHistory[]>([])
  const [activeView, setActiveView] = useState<View>('dashboard')
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
  const [requestBookId, setRequestBookId] = useState<string | null>(null)
  const [bookForm, setBookForm] = useState<BookForm>(emptyBookForm)
  const [requestForm, setRequestForm] = useState<RequestForm>(emptyRequestForm)
  const [complaintForm, setComplaintForm] = useState<ComplaintForm>(emptyComplaintForm)
  const [profileForm, setProfileForm] = useState({ full_name: '', phone_number: '' })
  const [authForm, setAuthForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
  })

  const ensureAccount = useCallback(async (currentSession: Session) => {
    const user = currentSession.user
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (data) {
      setAccount(data as Account)
      setProfileForm({
        full_name: (data as Account).full_name,
        phone_number: (data as Account).phone_number || '',
      })
      return data as Account
    }

    const metadata = user.user_metadata as { full_name?: string; phone_number?: string } | undefined
    const fallbackName = user.email?.split('@')[0] || 'Thành viên'
    const { data: inserted, error: insertError } = await supabase
      .from('accounts')
      .insert({
        id: user.id,
        full_name: metadata?.full_name || fallbackName,
        phone_number: metadata?.phone_number || null,
        email_address: user.email || `${user.id}@bookshare.local`,
      })
      .select('*')
      .single()

    if (insertError) {
      throw insertError
    }

    setAccount(inserted as Account)
    setProfileForm({
      full_name: (inserted as Account).full_name,
      phone_number: (inserted as Account).phone_number || '',
    })
    return inserted as Account
  }, [])

  const loadAppData = useCallback(async (userId: string) => {
    setDataLoading(true)

    try {
      const [
        accountResult,
        accountsResult,
        booksResult,
        transactionsResult,
        deliveriesResult,
        complaintsResult,
        ledgerResult,
        historyResult,
      ] = await Promise.all([
        supabase.from('accounts').select('*').eq('id', userId).single(),
        supabase.from('accounts').select('*').order('full_name', { ascending: true }),
        supabase.from('books').select('*').order('created_at', { ascending: false }),
        supabase.from('book_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('deliveries').select('*').order('created_at', { ascending: false }),
        supabase.from('complaints').select('*').order('created_at', { ascending: false }),
        supabase.from('point_ledger').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('transaction_history').select('*').order('updated_at', { ascending: false }).limit(100),
      ])

      const results = [
        accountResult,
        accountsResult,
        booksResult,
        transactionsResult,
        deliveriesResult,
        complaintsResult,
        ledgerResult,
        historyResult,
      ]
      const firstError = results.find((result) => result.error)?.error

      if (firstError) {
        throw firstError
      }

      setSchemaReady(true)
      setAccount(accountResult.data as Account)
      setProfileForm({
        full_name: (accountResult.data as Account).full_name,
        phone_number: ((accountResult.data as Account).phone_number as string | null) || '',
      })
      setAccounts((accountsResult.data || []) as Account[])
      setBooks((booksResult.data || []) as Book[])
      setTransactions((transactionsResult.data || []) as BookTransaction[])
      setDeliveries((deliveriesResult.data || []) as Delivery[])
      setComplaints((complaintsResult.data || []) as Complaint[])
      setLedger((ledgerResult.data || []) as PointLedger[])
      setHistory((historyResult.data || []) as TransactionHistory[])
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

  const accountMap = useMemo(() => {
    return new Map(accounts.map((item) => [item.id, item]))
  }, [accounts])

  const bookMap = useMemo(() => {
    return new Map(books.map((item) => [item.id, item]))
  }, [books])

  const deliveryByTransaction = useMemo(() => {
    return new Map(deliveries.map((delivery) => [delivery.transaction_id, delivery]))
  }, [deliveries])

  const categories = useMemo(() => {
    return Array.from(new Set(books.map((book) => book.category).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'vi'),
    )
  }, [books])

  const filteredBooks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return books.filter((book) => {
      const isVisible = book.status !== 'hidden' || book.owner_account_id === account?.id
      const matchSearch =
        !normalizedSearch ||
        [book.title, book.author, book.category].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        )
      const matchCategory = categoryFilter === 'all' || book.category === categoryFilter
      const matchStatus = statusFilter === 'all' || book.status === statusFilter
      const matchOwnership =
        ownershipFilter === 'all' ||
        (ownershipFilter === 'available' && book.status === 'available') ||
        (ownershipFilter === 'mine' && book.owner_account_id === account?.id)

      return isVisible && matchSearch && matchCategory && matchStatus && matchOwnership
    })
  }, [account?.id, books, categoryFilter, ownershipFilter, searchTerm, statusFilter])

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
    return myTransactions.filter((transaction) =>
      ['requested', 'accepted', 'owner_confirmed', 'borrower_confirmed', 'completed'].includes(
        transaction.status,
      ),
    )
  }, [myTransactions])

  const openDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => delivery.status === 'open')
  }, [deliveries])

  const myDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => delivery.volunteer_account_id === account?.id)
  }, [account?.id, deliveries])

  const selectedRequestBook = requestBookId ? bookMap.get(requestBookId) : null

  async function refreshData() {
    if (session?.user.id) {
      await loadAppData(session.user.id)
    }
  }

  function clearLocalData() {
    setAccount(null)
    setAccounts([])
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

    try {
      await action()
      await refreshData()
      setNotice({ type: 'success', text: successText })
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setBusyKey(null)
    }
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
          setNotice({ type: 'info', text: 'Đã gửi yêu cầu đăng ký. Kiểm tra email nếu Supabase yêu cầu xác nhận.' })
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
    setActiveView('dashboard')
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

    const payload = {
      owner_account_id: account.id,
      title: bookForm.title.trim(),
      category: bookForm.category.trim(),
      author: bookForm.author.trim(),
      publication_year: bookForm.publication_year ? Number(bookForm.publication_year) : null,
      condition: bookForm.condition,
    }

    await runAction(
      editingBookId ? 'book-update' : 'book-create',
      editingBookId ? 'Đã cập nhật sách.' : 'Đã thêm sách vào kho.',
      async () => {
        const response = editingBookId
          ? await supabase.from('books').update(payload).eq('id', editingBookId)
          : await supabase.from('books').insert(payload)

        if (response.error) {
          throw response.error
        }

        resetBookForm()
      },
    )
  }

  function startEditBook(book: Book) {
    setEditingBookId(book.id)
    setBookForm({
      title: book.title,
      category: book.category,
      author: book.author,
      publication_year: book.publication_year ? String(book.publication_year) : '',
      condition: book.condition,
    })
    setActiveView('books')
  }

  function resetBookForm() {
    setEditingBookId(null)
    setBookForm(emptyBookForm)
  }

  async function updateBookStatus(bookId: string, status: BookStatus) {
    await runAction(`book-status-${bookId}`, 'Đã cập nhật trạng thái sách.', async () => {
      const { error } = await supabase.from('books').update({ status }).eq('id', bookId)

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
      const { error } = await supabase.rpc('create_transaction_request', {
        p_book_id: selectedRequestBook.id,
        p_transaction_type: requestForm.transaction_type,
        p_delivery_method: requestForm.delivery_method,
        p_return_due_at:
          requestForm.transaction_type === 'borrow' && requestForm.return_due_at
            ? new Date(requestForm.return_due_at).toISOString()
            : null,
        p_pickup_location:
          requestForm.delivery_method === 'volunteer' ? requestForm.pickup_location.trim() || null : null,
        p_dropoff_location:
          requestForm.delivery_method === 'volunteer' ? requestForm.dropoff_location.trim() || null : null,
      })

      if (error) {
        throw error
      }

      setRequestBookId(null)
      setRequestForm(emptyRequestForm)
      setActiveView('transactions')
    })
  }

  async function respondTransaction(transactionId: string, accept: boolean) {
    await runAction(
      `${accept ? 'accept' : 'reject'}-${transactionId}`,
      accept ? 'Đã chấp nhận yêu cầu.' : 'Đã từ chối yêu cầu.',
      async () => {
        const { error } = await supabase.rpc('respond_transaction', {
          p_transaction_id: transactionId,
          p_accept: accept,
          p_note: accept ? 'Chủ sách chấp nhận trên giao diện web' : 'Chủ sách từ chối trên giao diện web',
        })

        if (error) {
          throw error
        }
      },
    )
  }

  async function confirmTransaction(transactionId: string) {
    await runAction(`confirm-${transactionId}`, 'Đã ghi nhận xác nhận giao dịch.', async () => {
      const { error } = await supabase.rpc('confirm_transaction', {
        p_transaction_id: transactionId,
      })

      if (error) {
        throw error
      }
    })
  }

  async function markReturned(transactionId: string) {
    await runAction(`return-${transactionId}`, 'Đã xác nhận trả sách.', async () => {
      const { error } = await supabase.rpc('mark_book_returned', {
        p_transaction_id: transactionId,
      })

      if (error) {
        throw error
      }
    })
  }

  async function registerVolunteer() {
    await runAction('register-volunteer', 'Đã đăng ký làm người giao sách.', async () => {
      const { error } = await supabase.rpc('register_volunteer')

      if (error) {
        throw error
      }
    })
  }

  async function takeDelivery(deliveryId: string) {
    await runAction(`take-delivery-${deliveryId}`, 'Đã nhận đơn giao sách.', async () => {
      const { error } = await supabase.rpc('take_delivery', {
        p_delivery_id: deliveryId,
      })

      if (error) {
        throw error
      }
    })
  }

  async function updateDelivery(deliveryId: string, status: DeliveryStatus) {
    await runAction(`delivery-${deliveryId}-${status}`, 'Đã cập nhật đơn giao sách.', async () => {
      const { error } = await supabase.rpc('update_delivery_status', {
        p_delivery_id: deliveryId,
        p_status: status,
      })

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
      const { error } = await supabase.from('complaints').insert({
        transaction_id: complaintForm.transaction_id || null,
        complainant_account_id: account.id,
        reported_account_id: complaintForm.reported_account_id || null,
        complaint_details: complaintForm.complaint_details.trim(),
      })

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
      const { error } = await supabase
        .from('accounts')
        .update({
          full_name: profileForm.full_name.trim(),
          phone_number: profileForm.phone_number.trim() || null,
        })
        .eq('id', account.id)

      if (error) {
        throw error
      }
    })
  }

  async function updateComplaintStatus(complaintId: string, status: ComplaintStatus, outcome: string) {
    await runAction(`complaint-${complaintId}`, 'Đã cập nhật khiếu nại.', async () => {
      const { error } = await supabase
        .from('complaints')
        .update({
          status,
          outcome: outcome.trim() || null,
          handled_by_account_id: account?.id || null,
        })
        .eq('id', complaintId)

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

          {authMode === 'signin' && (
            <DemoAccounts accounts={demoAccounts} onUse={useDemoAccount} />
          )}

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
            .map((item) => (
              <button
                key={item.view}
                type="button"
                className={activeView === item.view ? 'active' : ''}
                onClick={() => setActiveView(item.view)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
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
            {activeView !== 'books' && (
              <ActionButton
                type="button"
                icon={Plus}
                variant="secondary"
                onClick={() => {
                  resetBookForm()
                  setActiveView('books')
                }}
              >
                Thêm sách
              </ActionButton>
            )}
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
            <span>Hãy chạy file SQL tại `supabase/schema.sql` trong Supabase SQL Editor trước khi dùng app.</span>
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
            setActiveView={setActiveView}
          />
        )}

        {activeView === 'books' && (
          <BooksView
            account={account}
            accountMap={accountMap}
            books={filteredBooks}
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
            onHideBook={(book) => updateBookStatus(book.id, book.status === 'hidden' ? 'available' : 'hidden')}
            onRequestBook={(book) => {
              setRequestBookId(book.id)
              setRequestForm(emptyRequestForm)
            }}
          />
        )}

        {activeView === 'transactions' && (
          <TransactionsView
            account={account}
            transactions={myTransactions}
            accountMap={accountMap}
            bookMap={bookMap}
            deliveries={deliveryByTransaction}
            busyKey={busyKey}
            onAccept={(transaction) => respondTransaction(transaction.id, true)}
            onReject={(transaction) => respondTransaction(transaction.id, false)}
            onConfirm={(transaction) => confirmTransaction(transaction.id)}
            onReturn={(transaction) => markReturned(transaction.id)}
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

        {activeView === 'profile' && (
          <ProfileView
            account={account}
            form={profileForm}
            ledger={ledger}
            history={history}
            accountMap={accountMap}
            busyKey={busyKey}
            onFormChange={setProfileForm}
            onSubmit={updateProfile}
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
          form={requestForm}
          busy={busyKey === 'request-create'}
          onFormChange={setRequestForm}
          onClose={() => setRequestBookId(null)}
          onSubmit={createRequest}
        />
      )}
    </main>
  )
}

function DashboardView({
  account,
  books,
  transactions,
  deliveries,
  ledger,
  accountMap,
  bookMap,
  setActiveView,
}: {
  account: Account | null
  books: Book[]
  transactions: BookTransaction[]
  deliveries: Delivery[]
  ledger: PointLedger[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  setActiveView: (view: View) => void
}) {
  const ownedBooks = books.filter((book) => book.owner_account_id === account?.id)
  const availableBooks = books.filter((book) => book.status === 'available')
  const waitingForMe = transactions.filter((transaction) => {
    if (!account) {
      return false
    }

    const isOwner = transaction.owner_account_id === account.id
    const isBorrower = transaction.borrower_account_id === account.id

    return (
      (isOwner && transaction.status === 'requested') ||
      (isOwner && ['accepted', 'borrower_confirmed'].includes(transaction.status) && !transaction.owner_confirmed_at) ||
      (isBorrower && ['accepted', 'owner_confirmed'].includes(transaction.status) && !transaction.borrower_confirmed_at)
    )
  })

  return (
    <div className="view-stack">
      <section className="stats-grid">
        <StatCard icon={CircleDollarSign} label="Điểm hiện tại" value={account?.points ?? 0} tone="green" />
        <StatCard icon={BookOpen} label="Sách của tôi" value={ownedBooks.length} tone="blue" />
        <StatCard icon={ArrowRightLeft} label="Giao dịch mở" value={transactions.length} tone="amber" />
        <StatCard icon={Truck} label="Đơn giao mở" value={deliveries.length} tone="neutral" />
      </section>

      <section className="process-band">
        {[
          ['1.0', 'Người dùng & điểm'],
          ['2.0', 'Kho sách'],
          ['3.0', 'Giao dịch'],
          ['4.0', 'Vận chuyển'],
          ['5.0', 'Khiếu nại'],
        ].map(([code, label]) => (
          <div className="process-step" key={code}>
            <span>{code}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </section>

      <div className="two-column">
        <section className="tool-panel">
          <PanelHeader
            icon={Clock3}
            title="Cần xử lý"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('transactions')}>
                Mở giao dịch <ChevronRight size={16} />
              </button>
            }
          />
          <div className="work-queue">
            {waitingForMe.slice(0, 4).map((transaction) => (
              <div className="queue-item" key={transaction.id}>
                <div>
                  <strong>{bookMap.get(transaction.book_id)?.title || 'Sách'}</strong>
                  <span>{getTransactionActionText(transaction, account?.id)}</span>
                </div>
                <StatusPill status={transaction.status}>
                  {transactionStatusLabels[transaction.status]}
                </StatusPill>
              </div>
            ))}
            {waitingForMe.length === 0 && <EmptyState icon={Clock3} text="Không có việc cần xử lý ngay." />}
          </div>
        </section>

        <section className="tool-panel">
          <PanelHeader
            icon={BookOpen}
            title="Sách đang có sẵn"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('books')}>
                Mở kho <ChevronRight size={16} />
              </button>
            }
          />
          <div className="compact-list">
            {availableBooks.slice(0, 5).map((book) => (
              <BookLine key={book.id} book={book} owner={accountMap.get(book.owner_account_id)} />
            ))}
            {availableBooks.length === 0 && <EmptyState icon={BookOpen} text="Chưa có sách khả dụng." />}
          </div>
        </section>
      </div>

      <div className="two-column">
        <section className="tool-panel">
          <PanelHeader
            icon={Truck}
            title="Đơn giao đang mở"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('deliveries')}>
                Nhận đơn <ChevronRight size={16} />
              </button>
            }
          />
          <div className="compact-list">
            {deliveries.slice(0, 5).map((delivery) => (
              <div className="list-line" key={delivery.id}>
                <div>
                  <strong>{delivery.pickup_location}</strong>
                  <span>{delivery.dropoff_location}</span>
                </div>
                <StatusPill status={delivery.status}>{deliveryStatusLabels[delivery.status]}</StatusPill>
              </div>
            ))}
            {deliveries.length === 0 && <EmptyState icon={Truck} text="Chưa có đơn giao đang mở." />}
          </div>
        </section>

        <section className="tool-panel">
          <PanelHeader
            icon={History}
            title="Biến động điểm"
            action={
              <button type="button" className="link-button" onClick={() => setActiveView('profile')}>
                Lịch sử <ChevronRight size={16} />
              </button>
            }
          />
          <div className="compact-list">
            {ledger.slice(0, 5).map((item) => (
              <LedgerLine key={item.id} item={item} />
            ))}
            {ledger.length === 0 && <EmptyState icon={History} text="Chưa có lịch sử điểm." />}
          </div>
        </section>
      </div>

      <section className="tool-panel">
        <PanelHeader icon={ArrowRightLeft} title="Giao dịch gần đây" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sách</th>
                <th>Đối tác</th>
                <th>Loại</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 6).map((transaction) => {
                const partnerId =
                  transaction.owner_account_id === account?.id
                    ? transaction.borrower_account_id
                    : transaction.owner_account_id
                return (
                  <tr key={transaction.id}>
                    <td>{bookMap.get(transaction.book_id)?.title || 'Sách đã xóa'}</td>
                    <td>{accountMap.get(partnerId)?.full_name || 'Thành viên'}</td>
                    <td>{transactionTypeLabels[transaction.transaction_type]}</td>
                    <td>
                      <StatusPill status={transaction.status}>
                        {transactionStatusLabels[transaction.status]}
                      </StatusPill>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function BooksView({
  account,
  accountMap,
  books,
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
  return (
    <div className="view-stack">
      <section className="toolbar">
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
      </section>

      <section className="quick-summary">
        <span>{books.length} sách phù hợp</span>
        <span>{books.filter((book) => book.status === 'available').length} sách có thể yêu cầu ngay</span>
      </section>

      <section className="tool-panel">
        <PanelHeader icon={editingBookId ? Pencil : Plus} title={editingBookId ? 'Sửa sách' : 'Thêm sách'} />
        <form className="book-form" onSubmit={onBookSubmit}>
          <Field label="Tên sách">
            <input
              required
              value={bookForm.title}
              onChange={(event) => onBookFormChange({ ...bookForm, title: event.target.value })}
              placeholder="Tên sách"
            />
          </Field>
          <Field label="Thể loại">
            <input
              required
              value={bookForm.category}
              onChange={(event) => onBookFormChange({ ...bookForm, category: event.target.value })}
              placeholder="Kỹ năng, văn học..."
            />
          </Field>
          <Field label="Tác giả">
            <input
              required
              value={bookForm.author}
              onChange={(event) => onBookFormChange({ ...bookForm, author: event.target.value })}
              placeholder="Tên tác giả"
            />
          </Field>
          <Field label="Năm xuất bản">
            <input
              type="number"
              min="1000"
              max="2100"
              value={bookForm.publication_year}
              onChange={(event) => onBookFormChange({ ...bookForm, publication_year: event.target.value })}
              placeholder="2024"
            />
          </Field>
          <Field label="Tình trạng">
            <select
              value={bookForm.condition}
              onChange={(event) =>
                onBookFormChange({ ...bookForm, condition: event.target.value as BookCondition })
              }
            >
              {(Object.keys(conditionLabels) as BookCondition[]).map((condition) => (
                <option key={condition} value={condition}>
                  {conditionLabels[condition]}
                </option>
              ))}
            </select>
          </Field>
          <div className="form-actions">
            <ActionButton
              icon={editingBookId ? Check : Plus}
              busy={busyKey === 'book-create' || busyKey === 'book-update'}
            >
              {editingBookId ? 'Lưu sách' : 'Thêm sách'}
            </ActionButton>
            {editingBookId && (
              <ActionButton type="button" icon={X} variant="secondary" onClick={onResetBookForm}>
                Hủy
              </ActionButton>
            )}
          </div>
        </form>
      </section>

      <section className="book-grid">
        {books.map((book) => {
          const owner = accountMap.get(book.owner_account_id)
          const isMine = book.owner_account_id === account?.id
          const canRequest = !isMine && book.status === 'available'

          return (
            <article className="book-card" key={book.id}>
              <div className={`book-cover condition-${book.condition}`}>
                <BookOpen size={28} />
                <span>{book.category.slice(0, 22)}</span>
              </div>
              <div className="book-card-body">
                <div className="card-title-row">
                  <div>
                    <h2>{book.title}</h2>
                    <p>{book.author}</p>
                  </div>
                  <StatusPill status={book.status}>{bookStatusLabels[book.status]}</StatusPill>
                </div>
                <dl className="meta-grid">
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
                    <ActionButton type="button" icon={Pencil} variant="secondary" onClick={() => onEditBook(book)}>
                      Sửa
                    </ActionButton>
                  )}
                  {isMine && ['available', 'hidden'].includes(book.status) && (
                    <ActionButton type="button" icon={EyeOff} variant="secondary" onClick={() => onHideBook(book)}>
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
      </section>
    </div>
  )
}

function TransactionsView({
  account,
  transactions,
  accountMap,
  bookMap,
  deliveries,
  busyKey,
  onAccept,
  onReject,
  onConfirm,
  onReturn,
}: {
  account: Account | null
  transactions: BookTransaction[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  deliveries: Map<string, Delivery>
  busyKey: string | null
  onAccept: (transaction: BookTransaction) => void
  onReject: (transaction: BookTransaction) => void
  onConfirm: (transaction: BookTransaction) => void
  onReturn: (transaction: BookTransaction) => void
}) {
  return (
    <section className="entity-list">
      {transactions.map((transaction) => {
        const book = bookMap.get(transaction.book_id)
        const owner = accountMap.get(transaction.owner_account_id)
        const borrower = accountMap.get(transaction.borrower_account_id)
        const delivery = deliveries.get(transaction.id)
        const isOwner = transaction.owner_account_id === account?.id
        const isBorrower = transaction.borrower_account_id === account?.id
        const canConfirm =
          (isOwner || isBorrower) &&
          ['accepted', 'owner_confirmed', 'borrower_confirmed'].includes(transaction.status) &&
          ((isOwner && !transaction.owner_confirmed_at) ||
            (isBorrower && !transaction.borrower_confirmed_at))
        const canReturn =
          transaction.transaction_type === 'borrow' &&
          transaction.status === 'completed' &&
          (isOwner || isBorrower)

        return (
          <article className="entity-card" key={transaction.id}>
            <div className="entity-main">
              <div className="entity-icon">
                <ArrowRightLeft size={22} />
              </div>
              <div>
                <div className="entity-title-row">
                  <h2>{book?.title || 'Sách đã xóa'}</h2>
                  <StatusPill status={transaction.status}>
                    {transactionStatusLabels[transaction.status]}
                  </StatusPill>
                </div>
                <p>
                  {owner?.full_name || 'Chủ sách'} ↔ {borrower?.full_name || 'Người nhận'}
                </p>
                <dl className="meta-grid">
                  <div>
                    <dt>Loại</dt>
                    <dd>{transactionTypeLabels[transaction.transaction_type]}</dd>
                  </div>
                  <div>
                    <dt>Giao nhận</dt>
                    <dd>{deliveryMethodLabels[transaction.delivery_method]}</dd>
                  </div>
                  <div>
                    <dt>Điểm</dt>
                    <dd>+{pointRule[transaction.transaction_type]} / -{pointRule[transaction.transaction_type]}</dd>
                  </div>
                  <div>
                    <dt>Tạo lúc</dt>
                    <dd>{formatDate(transaction.created_at)}</dd>
                  </div>
                </dl>
                {delivery && (
                  <div className="inline-note">
                    <Truck size={16} />
                    <span>{deliveryStatusLabels[delivery.status]}</span>
                  </div>
                )}
                <div className="next-step-note">
                  <Clock3 size={16} />
                  <span>{getTransactionActionText(transaction, account?.id)}</span>
                </div>
              </div>
            </div>
            <div className="entity-actions">
              {isOwner && transaction.status === 'requested' && (
                <>
                  <ActionButton
                    type="button"
                    icon={Check}
                    busy={busyKey === `accept-${transaction.id}`}
                    onClick={() => onAccept(transaction)}
                  >
                    Chấp nhận
                  </ActionButton>
                  <ActionButton
                    type="button"
                    icon={X}
                    variant="secondary"
                    busy={busyKey === `reject-${transaction.id}`}
                    onClick={() => onReject(transaction)}
                  >
                    Từ chối
                  </ActionButton>
                </>
              )}
              {canConfirm && (
                <ActionButton
                  type="button"
                  icon={PackageCheck}
                  busy={busyKey === `confirm-${transaction.id}`}
                  onClick={() => onConfirm(transaction)}
                >
                  Xác nhận
                </ActionButton>
              )}
              {canReturn && (
                <ActionButton
                  type="button"
                  icon={PackageCheck}
                  variant="secondary"
                  busy={busyKey === `return-${transaction.id}`}
                  onClick={() => onReturn(transaction)}
                >
                  Đã trả
                </ActionButton>
              )}
            </div>
          </article>
        )
      })}
      {transactions.length === 0 && <EmptyState icon={ArrowRightLeft} text="Chưa có giao dịch." />}
    </section>
  )
}

function DeliveriesView({
  account,
  openDeliveries,
  myDeliveries,
  accountMap,
  bookMap,
  transactionMap,
  busyKey,
  onRegister,
  onTake,
  onUpdate,
}: {
  account: Account | null
  openDeliveries: Delivery[]
  myDeliveries: Delivery[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  transactionMap: Map<string, BookTransaction>
  busyKey: string | null
  onRegister: () => void
  onTake: (deliveryId: string) => void
  onUpdate: (deliveryId: string, status: DeliveryStatus) => void
}) {
  const isVolunteer = account?.role === 'volunteer' || account?.role === 'admin'

  return (
    <div className="view-stack">
      {!isVolunteer && (
        <section className="tool-panel action-strip">
          <div>
            <h2>Đăng ký giao sách miễn phí</h2>
            <p>Vai trò hiện tại: {account ? roleLabels[account.role] : 'Thành viên'}</p>
          </div>
          <ActionButton icon={HandHeart} busy={busyKey === 'register-volunteer'} onClick={onRegister}>
            Đăng ký
          </ActionButton>
        </section>
      )}

      <section className="tool-panel">
        <PanelHeader icon={Truck} title="Đơn giao đang mở" />
        <DeliveryList
          deliveries={openDeliveries}
          accountMap={accountMap}
          bookMap={bookMap}
          transactionMap={transactionMap}
          busyKey={busyKey}
          action={(delivery) =>
            isVolunteer ? (
              <ActionButton
                type="button"
                icon={Check}
                busy={busyKey === `take-delivery-${delivery.id}`}
                onClick={() => onTake(delivery.id)}
              >
                Nhận đơn
              </ActionButton>
            ) : null
          }
        />
      </section>

      <section className="tool-panel">
        <PanelHeader icon={PackageCheck} title="Đơn tôi đang giao" />
        <DeliveryList
          deliveries={myDeliveries}
          accountMap={accountMap}
          bookMap={bookMap}
          transactionMap={transactionMap}
          busyKey={busyKey}
          action={(delivery) => (
            <>
              {delivery.status === 'accepted' && (
                <ActionButton
                  type="button"
                  icon={Truck}
                  variant="secondary"
                  busy={busyKey === `delivery-${delivery.id}-in_transit`}
                  onClick={() => onUpdate(delivery.id, 'in_transit')}
                >
                  Đang giao
                </ActionButton>
              )}
              {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                <ActionButton
                  type="button"
                  icon={PackageCheck}
                  busy={busyKey === `delivery-${delivery.id}-delivered`}
                  onClick={() => onUpdate(delivery.id, 'delivered')}
                >
                  Đã giao
                </ActionButton>
              )}
            </>
          )}
        />
      </section>
    </div>
  )
}

function DeliveryList({
  deliveries,
  accountMap,
  bookMap,
  transactionMap,
  busyKey,
  action,
}: {
  deliveries: Delivery[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  transactionMap: Map<string, BookTransaction>
  busyKey: string | null
  action: (delivery: Delivery) => ReactNode
}) {
  void busyKey

  if (deliveries.length === 0) {
    return <EmptyState icon={Truck} text="Không có đơn giao sách." />
  }

  return (
    <div className="entity-list compact">
      {deliveries.map((delivery) => {
        const transaction = transactionMap.get(delivery.transaction_id)
        const book = transaction ? bookMap.get(transaction.book_id) : null
        const owner = transaction ? accountMap.get(transaction.owner_account_id) : null
        const borrower = transaction ? accountMap.get(transaction.borrower_account_id) : null

        return (
          <article className="entity-card" key={delivery.id}>
            <div className="entity-main">
              <div className="entity-icon">
                <Truck size={22} />
              </div>
              <div>
                <div className="entity-title-row">
                  <h2>{book?.title || 'Sách trong giao dịch'}</h2>
                  <StatusPill status={delivery.status}>{deliveryStatusLabels[delivery.status]}</StatusPill>
                </div>
                <p>
                  {owner?.full_name || 'Chủ sách'} → {borrower?.full_name || 'Người nhận'}
                </p>
                <dl className="meta-grid">
                  <div>
                    <dt>Nhận sách</dt>
                    <dd>{delivery.pickup_location}</dd>
                  </div>
                  <div>
                    <dt>Giao sách</dt>
                    <dd>{delivery.dropoff_location}</dd>
                  </div>
                  <div>
                    <dt>Tạo lúc</dt>
                    <dd>{formatDate(delivery.created_at)}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="entity-actions">{action(delivery)}</div>
          </article>
        )
      })}
    </div>
  )
}

function ComplaintsView({
  account,
  complaints,
  transactions,
  accountMap,
  bookMap,
  form,
  busyKey,
  onFormChange,
  onSubmit,
}: {
  account: Account | null
  complaints: Complaint[]
  transactions: BookTransaction[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  form: ComplaintForm
  busyKey: string | null
  onFormChange: (form: ComplaintForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const selectedTransaction = transactions.find((transaction) => transaction.id === form.transaction_id)
  const reportOptions = selectedTransaction
    ? [selectedTransaction.owner_account_id, selectedTransaction.borrower_account_id].filter(
        (id) => id !== account?.id,
      )
    : accountsFromTransactions(transactions, account?.id)

  return (
    <div className="view-stack">
      <section className="tool-panel">
        <PanelHeader icon={MessageSquareWarning} title="Gửi khiếu nại" />
        <form className="book-form complaint-form" onSubmit={onSubmit}>
          <Field label="Giao dịch">
            <select
              value={form.transaction_id}
              onChange={(event) =>
                onFormChange({ ...form, transaction_id: event.target.value, reported_account_id: '' })
              }
            >
              <option value="">Không gắn giao dịch</option>
              {transactions.map((transaction) => (
                <option key={transaction.id} value={transaction.id}>
                  {bookMap.get(transaction.book_id)?.title || 'Sách'} -{' '}
                  {transactionStatusLabels[transaction.status]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tài khoản bị báo cáo">
            <select
              value={form.reported_account_id}
              onChange={(event) => onFormChange({ ...form, reported_account_id: event.target.value })}
            >
              <option value="">Chưa chọn</option>
              {reportOptions.map((accountId) => (
                <option key={accountId} value={accountId}>
                  {accountMap.get(accountId)?.full_name || 'Thành viên'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nội dung">
            <textarea
              required
              rows={4}
              value={form.complaint_details}
              onChange={(event) => onFormChange({ ...form, complaint_details: event.target.value })}
              placeholder="Nội dung khiếu nại"
            />
          </Field>
          <ActionButton icon={MessageSquareWarning} busy={busyKey === 'complaint-create'}>
            Gửi khiếu nại
          </ActionButton>
        </form>
      </section>

      <section className="entity-list">
        {complaints.map((complaint) => (
          <article className="entity-card" key={complaint.id}>
            <div className="entity-main">
              <div className="entity-icon warning">
                <MessageSquareWarning size={22} />
              </div>
              <div>
                <div className="entity-title-row">
                  <h2>{accountMap.get(complaint.complainant_account_id)?.full_name || 'Thành viên'}</h2>
                  <StatusPill status={complaint.status}>{complaintStatusLabels[complaint.status]}</StatusPill>
                </div>
                <p>{complaint.complaint_details}</p>
                <dl className="meta-grid">
                  <div>
                    <dt>Bị báo cáo</dt>
                    <dd>{accountMap.get(complaint.reported_account_id || '')?.full_name || 'Chưa chọn'}</dd>
                  </div>
                  <div>
                    <dt>Tạo lúc</dt>
                    <dd>{formatDate(complaint.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Kết quả</dt>
                    <dd>{complaint.outcome || 'Chưa có'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </article>
        ))}
        {complaints.length === 0 && <EmptyState icon={MessageSquareWarning} text="Chưa có khiếu nại." />}
      </section>
    </div>
  )
}

function ProfileView({
  account,
  form,
  ledger,
  history,
  accountMap,
  busyKey,
  onFormChange,
  onSubmit,
}: {
  account: Account | null
  form: { full_name: string; phone_number: string }
  ledger: PointLedger[]
  history: TransactionHistory[]
  accountMap: Map<string, Account>
  busyKey: string | null
  onFormChange: (form: { full_name: string; phone_number: string }) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="two-column align-start">
      <section className="tool-panel">
        <PanelHeader icon={UserRound} title="Thông tin tài khoản" />
        <form className="stack-form" onSubmit={onSubmit}>
          <Field label="Họ tên">
            <input
              required
              value={form.full_name}
              onChange={(event) => onFormChange({ ...form, full_name: event.target.value })}
            />
          </Field>
          <Field label="Số điện thoại">
            <input
              value={form.phone_number}
              onChange={(event) => onFormChange({ ...form, phone_number: event.target.value })}
            />
          </Field>
          <div className="account-summary">
            <MetricLine label="Email" value={account?.email_address || ''} />
            <MetricLine label="Vai trò" value={account ? roleLabels[account.role] : ''} />
            <MetricLine label="Điểm" value={String(account?.points ?? 0)} />
          </div>
          <ActionButton icon={Check} busy={busyKey === 'profile-update'}>
            Lưu hồ sơ
          </ActionButton>
        </form>
      </section>

      <section className="tool-panel">
        <PanelHeader icon={History} title="Lịch sử điểm" />
        <div className="compact-list">
          {ledger.map((item) => (
            <LedgerLine key={item.id} item={item} />
          ))}
          {ledger.length === 0 && <EmptyState icon={History} text="Chưa có lịch sử điểm." />}
        </div>
      </section>

      <section className="tool-panel span-two">
        <PanelHeader icon={ClipboardList} title="Lịch sử trạng thái giao dịch" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Người cập nhật</th>
                <th>Ghi chú</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{item.status_updated_to}</td>
                  <td>{accountMap.get(item.updated_by_account_id || '')?.full_name || 'Hệ thống'}</td>
                  <td>{item.note || ''}</td>
                  <td>{formatDate(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AdminView({
  accounts,
  books,
  transactions,
  complaints,
  accountMap,
  bookMap,
  busyKey,
  onUpdateComplaint,
}: {
  accounts: Account[]
  books: Book[]
  transactions: BookTransaction[]
  complaints: Complaint[]
  accountMap: Map<string, Account>
  bookMap: Map<string, Book>
  busyKey: string | null
  onUpdateComplaint: (complaintId: string, status: ComplaintStatus, outcome: string) => void
}) {
  const [complaintDrafts, setComplaintDrafts] = useState<Record<string, { status: ComplaintStatus; outcome: string }>>(
    {},
  )

  function draftFor(complaint: Complaint) {
    return (
      complaintDrafts[complaint.id] || {
        status: complaint.status,
        outcome: complaint.outcome || '',
      }
    )
  }

  return (
    <div className="view-stack">
      <section className="stats-grid">
        <StatCard icon={UserRound} label="Thành viên" value={accounts.length} tone="green" />
        <StatCard icon={BookOpen} label="Sách" value={books.length} tone="blue" />
        <StatCard icon={ArrowRightLeft} label="Giao dịch" value={transactions.length} tone="amber" />
        <StatCard icon={MessageSquareWarning} label="Khiếu nại" value={complaints.length} tone="neutral" />
      </section>

      <section className="tool-panel">
        <PanelHeader icon={UserRound} title="Thành viên" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Điểm</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((item) => (
                <tr key={item.id}>
                  <td>{item.full_name}</td>
                  <td>{item.email_address}</td>
                  <td>{roleLabels[item.role]}</td>
                  <td>{item.points}</td>
                  <td>{item.status ? 'Hoạt động' : 'Khóa'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tool-panel">
        <PanelHeader icon={MessageSquareWarning} title="Xử lý khiếu nại" />
        <div className="entity-list compact">
          {complaints.map((complaint) => {
            const draft = draftFor(complaint)
            const transaction = transactions.find((item) => item.id === complaint.transaction_id)

            return (
              <article className="entity-card" key={complaint.id}>
                <div className="entity-main">
                  <div className="entity-icon warning">
                    <MessageSquareWarning size={22} />
                  </div>
                  <div>
                    <div className="entity-title-row">
                      <h2>{accountMap.get(complaint.complainant_account_id)?.full_name || 'Thành viên'}</h2>
                      <StatusPill status={complaint.status}>{complaintStatusLabels[complaint.status]}</StatusPill>
                    </div>
                    <p>{complaint.complaint_details}</p>
                    <dl className="meta-grid">
                      <div>
                        <dt>Sách</dt>
                        <dd>{transaction ? bookMap.get(transaction.book_id)?.title || 'Sách' : 'Không gắn'}</dd>
                      </div>
                      <div>
                        <dt>Bị báo cáo</dt>
                        <dd>{accountMap.get(complaint.reported_account_id || '')?.full_name || 'Chưa chọn'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="admin-complaint-form">
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      setComplaintDrafts({
                        ...complaintDrafts,
                        [complaint.id]: {
                          ...draft,
                          status: event.target.value as ComplaintStatus,
                        },
                      })
                    }
                  >
                    {(Object.keys(complaintStatusLabels) as ComplaintStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {complaintStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <input
                    value={draft.outcome}
                    onChange={(event) =>
                      setComplaintDrafts({
                        ...complaintDrafts,
                        [complaint.id]: {
                          ...draft,
                          outcome: event.target.value,
                        },
                      })
                    }
                    placeholder="Kết quả xử lý"
                  />
                  <ActionButton
                    type="button"
                    icon={Check}
                    busy={busyKey === `complaint-${complaint.id}`}
                    onClick={() => onUpdateComplaint(complaint.id, draft.status, draft.outcome)}
                  >
                    Lưu
                  </ActionButton>
                </div>
              </article>
            )
          })}
          {complaints.length === 0 && <EmptyState icon={MessageSquareWarning} text="Chưa có khiếu nại." />}
        </div>
      </section>
    </div>
  )
}

function RequestDialog({
  account,
  book,
  owner,
  form,
  busy,
  onFormChange,
  onClose,
  onSubmit,
}: {
  account: Account | null
  book: Book
  owner?: Account
  form: RequestForm
  busy: boolean
  onFormChange: (form: RequestForm) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const requiredPoints = pointRule[form.transaction_type]
  const hasEnoughPoints = (account?.points || 0) >= requiredPoints

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="request-title">
        <div className="dialog-header">
          <div>
            <span className="eyebrow">Yêu cầu giao dịch</span>
            <h2 id="request-title">{book.title}</h2>
            <p>{owner?.full_name || 'Chủ sách'}</p>
          </div>
          <IconOnlyButton label="Đóng" onClick={onClose}>
            <X size={18} />
          </IconOnlyButton>
        </div>

        <form className="stack-form" onSubmit={onSubmit}>
          <Field label="Loại giao dịch">
            <select
              value={form.transaction_type}
              onChange={(event) =>
                onFormChange({ ...form, transaction_type: event.target.value as TransactionType })
              }
            >
              <option value="exchange">Trao đổi vĩnh viễn</option>
              <option value="borrow">Mượn có hoàn trả</option>
            </select>
          </Field>
          {form.transaction_type === 'borrow' && (
            <Field label="Hạn trả">
              <input
                type="datetime-local"
                value={form.return_due_at}
                onChange={(event) => onFormChange({ ...form, return_due_at: event.target.value })}
              />
            </Field>
          )}
          <Field label="Giao nhận">
            <select
              value={form.delivery_method}
              onChange={(event) =>
                onFormChange({ ...form, delivery_method: event.target.value as DeliveryMethod })
              }
            >
              <option value="self_pickup">Tự giao nhận</option>
              <option value="volunteer">Nhờ người giao sách miễn phí</option>
            </select>
          </Field>
          {form.delivery_method === 'volunteer' && (
            <>
              <Field label="Điểm nhận sách">
                <input
                  required
                  value={form.pickup_location}
                  onChange={(event) => onFormChange({ ...form, pickup_location: event.target.value })}
                  placeholder="Tòa nhà, phòng, khu vực"
                />
              </Field>
              <Field label="Điểm giao sách">
                <input
                  required
                  value={form.dropoff_location}
                  onChange={(event) => onFormChange({ ...form, dropoff_location: event.target.value })}
                  placeholder="Tòa nhà, phòng, khu vực"
                />
              </Field>
            </>
          )}
          <div className="point-check">
            <CircleDollarSign size={18} />
            <span>
              Cần {requiredPoints} điểm, hiện có {account?.points ?? 0} điểm
            </span>
          </div>
          <ActionButton icon={ArrowRightLeft} busy={busy} disabled={!hasEnoughPoints}>
            Gửi yêu cầu
          </ActionButton>
        </form>
      </section>
    </div>
  )
}

function PanelHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon
  title: string
  action?: ReactNode
}) {
  return (
    <div className="panel-header">
      <div>
        <Icon size={20} />
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  )
}

function DemoAccounts({
  accounts,
  onUse,
}: {
  accounts: typeof demoAccounts
  onUse: (email: string, password: string) => void
}) {
  return (
    <div className="demo-accounts">
      <div className="demo-accounts-header">
        <strong>Tài khoản demo</strong>
        <span>Mật khẩu: Bookshare123!</span>
      </div>
      <div className="demo-account-grid">
        {accounts.map((account) => (
          <button
            key={account.email}
            type="button"
            className="demo-account-button"
            onClick={() => onUse(account.email, account.password)}
          >
            <span>{account.label}</span>
            <strong>{account.email}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function ActionButton({
  icon: Icon,
  busy,
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon
  busy?: boolean
  variant?: 'primary' | 'secondary'
}) {
  return (
    <button {...props} className={`action-button ${variant} ${className}`} disabled={busy || disabled}>
      {busy ? <RefreshCw className="spin" size={16} /> : <Icon size={16} />}
      <span>{children}</span>
    </button>
  )
}

function IconOnlyButton({
  label,
  busy,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  busy?: boolean
}) {
  return (
    <button {...props} className="icon-button" aria-label={label} title={label} disabled={busy || disabled}>
      {busy ? <RefreshCw className="spin" size={18} /> : children}
    </button>
  )
}

function NoticeBanner({ notice, onClose }: { notice: Exclude<Notice, null>; onClose: () => void }) {
  return (
    <div className={`notice ${notice.type}`}>
      <span>{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="Đóng thông báo">
        <X size={16} />
      </button>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  tone: 'green' | 'blue' | 'amber' | 'neutral'
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function BookLine({ book, owner }: { book: Book; owner?: Account }) {
  return (
    <div className="list-line">
      <div>
        <strong>{book.title}</strong>
        <span>
          {book.author} · {owner?.full_name || 'Thành viên'}
        </span>
      </div>
      <StatusPill status={book.status}>{bookStatusLabels[book.status]}</StatusPill>
    </div>
  )
}

function LedgerLine({ item }: { item: PointLedger }) {
  return (
    <div className="list-line">
      <div>
        <strong>{item.reason}</strong>
        <span>{formatDate(item.created_at)}</span>
      </div>
      <span className={item.delta >= 0 ? 'delta positive' : 'delta negative'}>
        {item.delta > 0 ? '+' : ''}
        {item.delta}
      </span>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="empty-state">
      <Icon size={22} />
      <span>{text}</span>
    </div>
  )
}

function StatusPill({ status, children }: { status: string; children: ReactNode }) {
  return <span className={`status-pill ${statusTone(status)}`}>{children}</span>
}

function pageTitle(view: View) {
  const item = navItems.find((navItem) => navItem.view === view)
  return item?.label || 'BookShare Hub'
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Chưa có'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getTransactionActionText(transaction: BookTransaction, accountId?: string) {
  const isOwner = transaction.owner_account_id === accountId
  const isBorrower = transaction.borrower_account_id === accountId

  if (transaction.status === 'requested') {
    return isOwner ? 'Bạn cần chấp nhận hoặc từ chối yêu cầu.' : 'Đang chờ chủ sách phản hồi.'
  }

  if (transaction.status === 'accepted') {
    return 'Hai bên cần xác nhận sau khi giao nhận sách.'
  }

  if (transaction.status === 'owner_confirmed') {
    return isBorrower ? 'Bạn cần xác nhận đã nhận sách.' : 'Đang chờ người nhận xác nhận.'
  }

  if (transaction.status === 'borrower_confirmed') {
    return isOwner ? 'Bạn cần xác nhận đã giao sách.' : 'Đang chờ chủ sách xác nhận.'
  }

  if (transaction.status === 'completed' && transaction.transaction_type === 'borrow') {
    return 'Giao dịch mượn đang hiệu lực, có thể xác nhận trả sách khi hoàn tất.'
  }

  if (transaction.status === 'completed') {
    return 'Giao dịch đã hoàn tất và điểm đã được cập nhật.'
  }

  if (transaction.status === 'returned') {
    return 'Sách đã được trả và mở lại trong kho.'
  }

  return 'Không còn hành động bắt buộc.'
}

function statusTone(status: string) {
  if (['available', 'accepted', 'completed', 'returned', 'delivered', 'resolved'].includes(status)) {
    return 'good'
  }

  if (['requested', 'negotiating', 'owner_confirmed', 'borrower_confirmed', 'open', 'reviewing'].includes(status)) {
    return 'waiting'
  }

  if (['rejected', 'cancelled', 'hidden', 'worn'].includes(status)) {
    return 'muted'
  }

  return 'neutral'
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: unknown }).message)
  }

  return 'Đã xảy ra lỗi không xác định'
}

function accountsFromTransactions(transactions: BookTransaction[], currentAccountId?: string) {
  return Array.from(
    new Set(
      transactions
        .flatMap((transaction) => [transaction.owner_account_id, transaction.borrower_account_id])
        .filter((id) => id !== currentAccountId),
    ),
  )
}

export default App
