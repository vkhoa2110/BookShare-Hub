import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const now = new Date().toISOString()
const password = 'Bookshare123!'
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

const users = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    email: 'admin@booksharehub.com',
    fullName: 'Quản trị viên',
    phone: '0900000001',
    role: 'admin',
    points: 20,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    email: 'hung@booksharehub.com',
    fullName: 'Nguyễn Phi Hùng',
    phone: '0900000002',
    role: 'member',
    points: 25,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    email: 'khoa@booksharehub.com',
    fullName: 'Lê Văn Khoa',
    phone: '0900000003',
    role: 'member',
    points: 20,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    email: 'huy@booksharehub.com',
    fullName: 'Đinh Viết Huy',
    phone: '0900000004',
    role: 'member',
    points: 25,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    email: 'lan@booksharehub.com',
    fullName: 'Mai Lan',
    phone: '0900000005',
    role: 'volunteer',
    points: 16,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    email: 'hieu@booksharehub.com',
    fullName: 'Bùi Trung Hiếu',
    phone: '0900000006',
    role: 'member',
    points: 20,
  },
]

const accountAddresses = [
  ['80000000-0000-4000-8000-000000000001', users[0].id, 'Văn phòng khoa', 'Văn phòng khoa CNTT', true],
  ['80000000-0000-4000-8000-000000000002', users[1].id, 'Sảnh nhà A', 'Sảnh nhà A', true],
  ['80000000-0000-4000-8000-000000000003', users[1].id, 'Tủ sách CLB', 'Tủ sách CLB - tầng 2 thư viện', false],
  ['80000000-0000-4000-8000-000000000004', users[2].id, 'CLB sách', 'Phòng CLB sách', true],
  ['80000000-0000-4000-8000-000000000005', users[2].id, 'Thư viện', 'Tủ sách CLB - tầng 2 thư viện', false],
  ['80000000-0000-4000-8000-000000000006', users[3].id, 'Phòng lab', 'Phòng lab 302', true],
  ['80000000-0000-4000-8000-000000000007', users[3].id, 'Sân nhà C', 'Sân sau nhà C', false],
  ['80000000-0000-4000-8000-000000000008', users[4].id, 'Quầy tình nguyện', 'Quầy sinh viên tình nguyện', true],
  ['80000000-0000-4000-8000-000000000009', users[5].id, 'Ký túc xá', 'Ký túc xá B1', true],
]

const books = [
  ['20000000-0000-4000-8000-000000000001', users[2].id, 'Đắc Nhân Tâm', 'Kỹ năng', 'Dale Carnegie', 2021, 'good', 'negotiating', 'Tủ sách CLB - tầng 2 thư viện', null],
  ['20000000-0000-4000-8000-000000000002', users[1].id, 'Nhà Giả Kim', 'Tiểu thuyết', 'Paulo Coelho', 2020, 'used', 'borrowed', 'Sảnh nhà A', null],
  ['20000000-0000-4000-8000-000000000003', users[3].id, 'Clean Code', 'Lập trình', 'Robert C. Martin', 2019, 'good', 'available', 'Phòng lab 302', null],
  ['20000000-0000-4000-8000-000000000004', users[4].id, 'Tuổi Trẻ Đáng Giá Bao Nhiêu', 'Truyền cảm hứng', 'Rosie Nguyễn', 2022, 'new', 'available', 'Quầy sinh viên tình nguyện', null],
  ['20000000-0000-4000-8000-000000000005', users[5].id, 'Atomic Habits', 'Kỹ năng', 'James Clear', 2023, 'good', 'negotiating', 'Ký túc xá B1', null],
  ['20000000-0000-4000-8000-000000000006', users[2].id, 'SQL for Data Analysis', 'Dữ liệu', 'Cathy Tanimura', 2021, 'used', 'borrowed', 'Phòng CLB sách', null],
  ['20000000-0000-4000-8000-000000000007', users[3].id, 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 'Văn học', 'Nguyễn Nhật Ánh', 2018, 'good', 'exchanged', 'Sân sau nhà C', null],
  ['20000000-0000-4000-8000-000000000008', users[0].id, 'Designing Data-Intensive Applications', 'Hệ thống', 'Martin Kleppmann', 2020, 'good', 'available', 'Văn phòng khoa CNTT', null],
  ['20000000-0000-4000-8000-000000000009', users[1].id, 'Không Gia Đình', 'Văn học', 'Hector Malot', 2017, 'used', 'negotiating', 'Sảnh nhà A', null],
]

const transactions = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    bookId: books[4][0],
    ownerId: users[5].id,
    borrowerId: users[1].id,
    type: 'exchange',
    method: 'volunteer',
    status: 'requested',
    pickup: books[4][8],
    dropoff: 'Sảnh nhà A',
    ownerConfirmed: null,
    borrowerConfirmed: null,
    pointsApplied: null,
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    bookId: books[8][0],
    ownerId: users[1].id,
    borrowerId: users[5].id,
    type: 'borrow',
    method: 'volunteer',
    status: 'accepted',
    pickup: books[8][8],
    dropoff: 'Khu tự học B1',
    ownerConfirmed: now,
    borrowerConfirmed: null,
    pointsApplied: null,
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    bookId: books[0][0],
    ownerId: users[2].id,
    borrowerId: users[1].id,
    type: 'borrow',
    method: 'volunteer',
    status: 'delivered',
    pickup: books[0][8],
    dropoff: 'Sảnh nhà A',
    ownerConfirmed: now,
    borrowerConfirmed: null,
    pointsApplied: null,
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    bookId: books[5][0],
    ownerId: users[2].id,
    borrowerId: users[3].id,
    type: 'borrow',
    method: 'volunteer',
    status: 'completed',
    pickup: books[5][8],
    dropoff: 'Phòng lab 302',
    ownerConfirmed: now,
    borrowerConfirmed: now,
    pointsApplied: now,
  },
  {
    id: '30000000-0000-4000-8000-000000000005',
    bookId: books[1][0],
    ownerId: users[1].id,
    borrowerId: users[2].id,
    type: 'borrow',
    method: 'volunteer',
    status: 'return_requested',
    pickup: books[1][8],
    dropoff: 'Tủ sách CLB - tầng 2 thư viện',
    ownerConfirmed: now,
    borrowerConfirmed: now,
    pointsApplied: now,
  },
  {
    id: '30000000-0000-4000-8000-000000000006',
    bookId: books[6][0],
    ownerId: users[3].id,
    borrowerId: users[4].id,
    type: 'exchange',
    method: 'self_pickup',
    status: 'completed',
    pickup: books[6][8],
    dropoff: null,
    ownerConfirmed: now,
    borrowerConfirmed: now,
    pointsApplied: now,
  },
]

const deliveries = [
  ['40000000-0000-4000-8000-000000000001', transactions[1].id, 'outbound', null, null, null, transactions[1].pickup, transactions[1].dropoff, 'open', null],
  ['40000000-0000-4000-8000-000000000002', transactions[2].id, 'outbound', users[4].id, now, now, transactions[2].pickup, transactions[2].dropoff, 'delivered', now],
  ['40000000-0000-4000-8000-000000000003', transactions[3].id, 'outbound', users[4].id, now, now, transactions[3].pickup, transactions[3].dropoff, 'delivered', now],
  ['40000000-0000-4000-8000-000000000004', transactions[4].id, 'outbound', users[4].id, now, now, transactions[4].pickup, transactions[4].dropoff, 'delivered', now],
  ['40000000-0000-4000-8000-000000000005', transactions[4].id, 'return', null, null, null, 'Tủ sách CLB - tầng 2 thư viện', transactions[4].pickup, 'open', null],
]

const ledger = [
  ['60000000-0000-4000-8000-000000000001', users[2].id, transactions[3].id, null, 5, 25, 'Cộng điểm cho mượn sách'],
  ['60000000-0000-4000-8000-000000000002', users[3].id, transactions[3].id, null, -5, 15, 'Trừ điểm mượn sách'],
  ['60000000-0000-4000-8000-000000000003', users[1].id, transactions[4].id, null, 5, 25, 'Cộng điểm cho mượn sách'],
  ['60000000-0000-4000-8000-000000000004', users[2].id, transactions[4].id, null, -5, 20, 'Trừ điểm mượn sách'],
  ['60000000-0000-4000-8000-000000000005', users[3].id, transactions[5].id, null, 10, 25, 'Cộng điểm trao đổi vĩnh viễn'],
  ['60000000-0000-4000-8000-000000000006', users[4].id, transactions[5].id, null, -10, 10, 'Trừ điểm nhận sách trao đổi'],
  ['60000000-0000-4000-8000-000000000007', users[4].id, null, deliveries[1][0], 2, 12, 'Cộng điểm giao sách miễn phí'],
  ['60000000-0000-4000-8000-000000000008', users[4].id, null, deliveries[2][0], 2, 14, 'Cộng điểm giao sách miễn phí'],
  ['60000000-0000-4000-8000-000000000009', users[4].id, null, deliveries[3][0], 2, 16, 'Cộng điểm giao sách miễn phí'],
]

const transactionHistory = transactions.map((transaction, index) => [
  `70000000-0000-4000-8000-00000000000${index + 1}`,
  transaction.id,
  transaction.status,
  transaction.borrowerId,
  transaction.status === 'completed' ? 'Dữ liệu mẫu: giao dịch đã hoàn tất' : 'Dữ liệu mẫu: tạo yêu cầu',
])

await client.connect()

try {
  await client.query('begin')

  for (const user of users) {
    await client.query(
      `
      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        is_sso_user,
        is_anonymous
      )
      values (
        '00000000-0000-0000-0000-000000000000',
        $1,
        'authenticated',
        'authenticated',
        $2,
        crypt($3, gen_salt('bf')),
        now(),
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', $4::text, 'phone_number', $5::text),
        now(),
        now(),
        false,
        false
      )
      on conflict (id) do update set
        email = excluded.email,
        encrypted_password = excluded.encrypted_password,
        email_confirmed_at = excluded.email_confirmed_at,
        confirmation_token = excluded.confirmation_token,
        recovery_token = excluded.recovery_token,
        email_change_token_new = excluded.email_change_token_new,
        email_change = excluded.email_change,
        raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data,
        updated_at = now()
      `,
      [user.id, user.email, password, user.fullName, user.phone],
    )

    await client.query(
      `
      insert into auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      values (
        gen_random_uuid(),
        $1::text,
        $1::uuid,
        jsonb_build_object(
          'sub',
          $1::text,
          'email',
          $2::text,
          'full_name',
          $3::text,
          'phone_number',
          $4::text,
          'email_verified',
          true,
          'phone_verified',
          false
        ),
        'email',
        now(),
        now(),
        now()
      )
      on conflict (provider_id, provider) do update set
        identity_data = excluded.identity_data,
        updated_at = now()
      `,
      [user.id, user.email, user.fullName, user.phone],
    )

    await client.query(
      `
      insert into public.accounts (
        id,
        full_name,
        phone_number,
        email_address,
        points,
        status,
        role
      )
      values ($1, $2, $3, $4, $5, true, $6)
      on conflict (id) do update set
        full_name = excluded.full_name,
        phone_number = excluded.phone_number,
        email_address = excluded.email_address,
        points = excluded.points,
        status = excluded.status,
        role = excluded.role
      `,
      [user.id, user.fullName, user.phone, user.email, user.points, user.role],
    )
  }

  await client.query(`
    truncate table
      public.point_ledger,
      public.transaction_history,
      public.complaints,
      public.deliveries,
      public.book_transactions,
      public.account_addresses,
      public.books
    restart identity cascade
  `)

  for (const address of accountAddresses) {
    await client.query(
      `
      insert into public.account_addresses (
        id,
        account_id,
        label,
        address_text,
        is_default
      )
      values ($1, $2, $3, $4, $5)
      on conflict (id) do update set
        account_id = excluded.account_id,
        label = excluded.label,
        address_text = excluded.address_text,
        is_default = excluded.is_default
      `,
      address,
    )
  }

  for (const book of books) {
    await client.query(
      `
      insert into public.books (
        id,
        owner_account_id,
        title,
        category,
        author,
        publication_year,
        condition,
        status,
        pickup_location,
        cover_image_url
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (id) do update set
        owner_account_id = excluded.owner_account_id,
        title = excluded.title,
        category = excluded.category,
        author = excluded.author,
        publication_year = excluded.publication_year,
        condition = excluded.condition,
        status = excluded.status,
        pickup_location = excluded.pickup_location,
        cover_image_url = excluded.cover_image_url
      `,
      book,
    )
  }

  for (const transaction of transactions) {
    await client.query(
      `
      insert into public.book_transactions (
        id,
        book_id,
        owner_account_id,
        borrower_account_id,
        transaction_type,
        delivery_method,
        status,
        pickup_location,
        dropoff_location,
        borrow_date,
        return_due_at,
        owner_confirmed_at,
        borrower_confirmed_at,
        points_applied_at
      )
      values (
        $1, $2, $3, $4, $5, $6, $7,
        $8,
        $9,
        case when $5 = 'borrow' and $7 in ('completed', 'return_requested', 'returned') then now() else null end,
        case when $5 = 'borrow' then now() + interval '21 days' else null end,
        $10,
        $11,
        $12
      )
      on conflict (id) do update set
        book_id = excluded.book_id,
        owner_account_id = excluded.owner_account_id,
        borrower_account_id = excluded.borrower_account_id,
        transaction_type = excluded.transaction_type,
        delivery_method = excluded.delivery_method,
        status = excluded.status,
        pickup_location = excluded.pickup_location,
        dropoff_location = excluded.dropoff_location,
        borrow_date = excluded.borrow_date,
        return_due_at = excluded.return_due_at,
        owner_confirmed_at = excluded.owner_confirmed_at,
        borrower_confirmed_at = excluded.borrower_confirmed_at,
        points_applied_at = excluded.points_applied_at
      `,
      [
        transaction.id,
        transaction.bookId,
        transaction.ownerId,
        transaction.borrowerId,
        transaction.type,
        transaction.method,
        transaction.status,
        transaction.pickup,
        transaction.dropoff,
        transaction.ownerConfirmed,
        transaction.borrowerConfirmed,
        transaction.pointsApplied,
      ],
    )

  }

  await client.query(
    `
    delete from public.transaction_history
    where transaction_id = any($1::uuid[])
      and (
        id::text like '70000000-0000-4000-8000-00000000000%'
        or note like 'Du lieu mau:%'
        or note like 'Dữ liệu mẫu:%'
      )
    `,
    [transactions.map((transaction) => transaction.id)],
  )

  for (const entry of transactionHistory) {
    await client.query(
      `
      insert into public.transaction_history (
        id,
        transaction_id,
        status_updated_to,
        updated_by_account_id,
        note
      )
      values ($1, $2, $3, $4, $5)
      on conflict (id) do update set
        transaction_id = excluded.transaction_id,
        status_updated_to = excluded.status_updated_to,
        updated_by_account_id = excluded.updated_by_account_id,
        note = excluded.note,
        updated_at = now()
      `,
      entry,
    )
  }

  for (const delivery of deliveries) {
    await client.query(
      `
      insert into public.deliveries (
        id,
        transaction_id,
        delivery_type,
        volunteer_account_id,
        accepted_at,
        delivered_at,
        pickup_location,
        dropoff_location,
        status,
        points_applied_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (id) do update set
        transaction_id = excluded.transaction_id,
        delivery_type = excluded.delivery_type,
        volunteer_account_id = excluded.volunteer_account_id,
        accepted_at = excluded.accepted_at,
        delivered_at = excluded.delivered_at,
        pickup_location = excluded.pickup_location,
        dropoff_location = excluded.dropoff_location,
        status = excluded.status,
        points_applied_at = excluded.points_applied_at
      `,
      delivery,
    )
  }

  await client.query(
    `
    insert into public.complaints (
      id,
      transaction_id,
      complainant_account_id,
      reported_account_id,
      complaint_details,
      status,
      outcome
    )
    values (
      '50000000-0000-4000-8000-000000000001',
      $1,
      $2,
      $3,
      'Muốn đổi địa điểm giao sách vì lịch học bị thay đổi.',
      'open',
      null
    )
    on conflict (id) do update set
      transaction_id = excluded.transaction_id,
      complainant_account_id = excluded.complainant_account_id,
      reported_account_id = excluded.reported_account_id,
      complaint_details = excluded.complaint_details,
      status = excluded.status,
      outcome = excluded.outcome
    `,
    [transactions[0].id, users[1].id, users[5].id],
  )

  for (const entry of ledger) {
    await client.query(
      `
      insert into public.point_ledger (
        id,
        account_id,
        transaction_id,
        delivery_id,
        delta,
        balance_after,
        reason
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (id) do update set
        account_id = excluded.account_id,
        transaction_id = excluded.transaction_id,
        delivery_id = excluded.delivery_id,
        delta = excluded.delta,
        balance_after = excluded.balance_after,
        reason = excluded.reason
      `,
      entry,
    )
  }

  await client.query('commit')
  console.log(`Seeded ${users.length} users, ${accountAddresses.length} addresses, ${books.length} books, ${transactions.length} transactions.`)
  console.log('Sample password for seeded users: Bookshare123!')
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  await client.end()
}
