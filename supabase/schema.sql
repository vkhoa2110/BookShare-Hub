create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone_number text,
  email_address text not null unique,
  points integer not null default 20 check (points >= 0),
  status boolean not null default true,
  role text not null default 'member' check (role in ('member', 'volunteer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_addresses (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  label text not null default 'Địa chỉ',
  address_text text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references public.accounts(id) on delete cascade,
  title text not null,
  category text not null,
  author text not null,
  publication_year integer check (publication_year between 1000 and extract(year from now())::integer + 1),
  condition text not null check (condition in ('new', 'good', 'used', 'worn')),
  pickup_location text not null default 'Chưa cập nhật',
  cover_image_url text,
  status text not null default 'available' check (status in ('available', 'negotiating', 'exchanged', 'borrowed', 'returned', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_transactions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete restrict,
  owner_account_id uuid not null references public.accounts(id) on delete restrict,
  borrower_account_id uuid not null references public.accounts(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('exchange', 'borrow')),
  delivery_method text not null default 'self_pickup' check (delivery_method in ('self_pickup', 'volunteer')),
  status text not null default 'requested' check (status in ('requested', 'accepted', 'rejected', 'cancelled', 'delivered', 'completed', 'return_requested', 'returned')),
  pickup_location text,
  dropoff_location text,
  borrow_date timestamptz,
  return_due_at timestamptz,
  actual_return_date_at timestamptz,
  owner_confirmed_at timestamptz,
  borrower_confirmed_at timestamptz,
  points_applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_transaction_participants check (owner_account_id <> borrower_account_id)
);

create table if not exists public.transaction_history (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.book_transactions(id) on delete cascade,
  status_updated_to text not null,
  updated_by_account_id uuid references public.accounts(id) on delete set null,
  updated_at timestamptz not null default now(),
  note text
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.book_transactions(id) on delete cascade,
  delivery_type text not null default 'outbound' check (delivery_type in ('outbound', 'return')),
  volunteer_account_id uuid references public.accounts(id) on delete set null,
  accepted_at timestamptz,
  delivered_at timestamptz,
  pickup_location text not null,
  dropoff_location text not null,
  status text not null default 'open' check (status in ('open', 'accepted', 'in_transit', 'delivered', 'cancelled')),
  points_applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.book_transactions(id) on delete set null,
  complainant_account_id uuid not null references public.accounts(id) on delete cascade,
  reported_account_id uuid references public.accounts(id) on delete set null,
  handled_by_account_id uuid references public.accounts(id) on delete set null,
  complaint_details text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  transaction_id uuid references public.book_transactions(id) on delete set null,
  delivery_id uuid references public.deliveries(id) on delete set null,
  delta integer not null,
  balance_after integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists books_search_idx on public.books using gin (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce(category, ''))
);
create index if not exists account_addresses_account_idx on public.account_addresses(account_id, is_default desc, created_at desc);
create index if not exists books_owner_idx on public.books(owner_account_id);
create index if not exists transactions_owner_idx on public.book_transactions(owner_account_id);
create index if not exists transactions_borrower_idx on public.book_transactions(borrower_account_id);
create index if not exists deliveries_status_idx on public.deliveries(status);
create index if not exists point_ledger_account_idx on public.point_ledger(account_id, created_at desc);

alter table public.books
add column if not exists pickup_location text not null default 'Chưa cập nhật',
add column if not exists cover_image_url text;

alter table public.book_transactions
add column if not exists pickup_location text,
add column if not exists dropoff_location text;

alter table public.deliveries
add column if not exists delivery_type text not null default 'outbound';

create index if not exists deliveries_transaction_type_idx on public.deliveries(transaction_id, delivery_type);

do $$
begin
  update public.book_transactions
  set status = 'accepted'
  where status in ('owner_confirmed', 'borrower_confirmed');

  alter table public.book_transactions
    drop constraint if exists book_transactions_status_check;
  alter table public.book_transactions
    add constraint book_transactions_status_check
    check (status in (
      'requested',
      'accepted',
      'rejected',
      'cancelled',
      'delivered',
      'completed',
      'return_requested',
      'returned'
    ));

  alter table public.deliveries
    drop constraint if exists deliveries_delivery_type_check;
  alter table public.deliveries
    add constraint deliveries_delivery_type_check
    check (delivery_type in ('outbound', 'return'));
end $$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_accounts_updated_at on public.accounts;
create trigger touch_accounts_updated_at
before update on public.accounts
for each row execute function public.touch_updated_at();

drop trigger if exists touch_account_addresses_updated_at on public.account_addresses;
create trigger touch_account_addresses_updated_at
before update on public.account_addresses
for each row execute function public.touch_updated_at();

drop trigger if exists touch_books_updated_at on public.books;
create trigger touch_books_updated_at
before update on public.books
for each row execute function public.touch_updated_at();

drop trigger if exists touch_transactions_updated_at on public.book_transactions;
create trigger touch_transactions_updated_at
before update on public.book_transactions
for each row execute function public.touch_updated_at();

drop trigger if exists touch_deliveries_updated_at on public.deliveries;
create trigger touch_deliveries_updated_at
before update on public.deliveries
for each row execute function public.touch_updated_at();

drop trigger if exists touch_complaints_updated_at on public.complaints;
create trigger touch_complaints_updated_at
before update on public.complaints
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.accounts (id, full_name, phone_number, email_address, points, status, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'phone_number', ''),
    new.email,
    20,
    true,
    'member'
  )
  on conflict (id) do nothing;

  insert into public.point_ledger (account_id, delta, balance_after, reason)
  values (new.id, 20, 20, 'Điểm khởi đầu khi đăng ký')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_account_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.accounts
    where id = auth.uid()
      and role = 'admin'
      and status = true
  );
$$;

create or replace function public.add_points(
  p_account_id uuid,
  p_delta integer,
  p_reason text,
  p_transaction_id uuid default null,
  p_delivery_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update public.accounts
  set points = points + p_delta
  where id = p_account_id
    and points + p_delta >= 0
  returning points into v_balance;

  if v_balance is null then
    raise exception 'Không đủ điểm để hoàn tất nghiệp vụ';
  end if;

  insert into public.point_ledger (
    account_id,
    transaction_id,
    delivery_id,
    delta,
    balance_after,
    reason
  )
  values (
    p_account_id,
    p_transaction_id,
    p_delivery_id,
    p_delta,
    v_balance,
    p_reason
  );
end;
$$;

create or replace function public.create_transaction_request(
  p_book_id uuid,
  p_transaction_type text,
  p_delivery_method text default 'self_pickup',
  p_return_due_at timestamptz default null,
  p_pickup_location text default null,
  p_dropoff_location text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_book public.books%rowtype;
  v_cost integer;
  v_points integer;
  v_transaction_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập';
  end if;

  if p_transaction_type not in ('exchange', 'borrow') then
    raise exception 'Loại giao dịch không hợp lệ';
  end if;

  if p_delivery_method not in ('self_pickup', 'volunteer') then
    raise exception 'Hình thức giao nhận không hợp lệ';
  end if;

  select * into v_book
  from public.books
  where id = p_book_id
  for update;

  if not found or v_book.status <> 'available' then
    raise exception 'Sách không khả dụng';
  end if;

  if v_book.owner_account_id = auth.uid() then
    raise exception 'Không thể yêu cầu sách của chính mình';
  end if;

  v_cost := case when p_transaction_type = 'exchange' then 10 else 5 end;

  select points into v_points
  from public.accounts
  where id = auth.uid()
    and status = true;

  if v_points is null then
    raise exception 'Tài khoản chưa sẵn sàng';
  end if;

  if v_points < v_cost then
    raise exception 'Không đủ điểm để gửi yêu cầu';
  end if;

  if coalesce(nullif(p_dropoff_location, ''), nullif(p_pickup_location, '')) is null then
    raise exception 'Cần nhập địa chỉ hoặc điểm hẹn nhận sách';
  end if;

  insert into public.book_transactions (
    book_id,
    owner_account_id,
    borrower_account_id,
    transaction_type,
    delivery_method,
    pickup_location,
    dropoff_location,
    return_due_at
  )
  values (
    p_book_id,
    v_book.owner_account_id,
    auth.uid(),
    p_transaction_type,
    p_delivery_method,
    v_book.pickup_location,
    coalesce(nullif(p_dropoff_location, ''), nullif(p_pickup_location, '')),
    case when p_transaction_type = 'borrow' then p_return_due_at else null end
  )
  returning id into v_transaction_id;

  update public.books
  set status = 'negotiating'
  where id = p_book_id;

  insert into public.transaction_history (
    transaction_id,
    status_updated_to,
    updated_by_account_id,
    note
  )
  values (
    v_transaction_id,
    'requested',
    auth.uid(),
    'Tạo yêu cầu giao dịch'
  );

  return v_transaction_id;
end;
$$;

create or replace function public.respond_transaction(
  p_transaction_id uuid,
  p_accept boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.book_transactions%rowtype;
  v_next_status text;
begin
  select * into v_transaction
  from public.book_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Không tìm thấy giao dịch';
  end if;

  if v_transaction.owner_account_id <> auth.uid() then
    raise exception 'Chỉ chủ sách được phản hồi yêu cầu';
  end if;

  if v_transaction.status <> 'requested' then
    raise exception 'Giao dịch không còn ở trạng thái chờ duyệt';
  end if;

  v_next_status := case when p_accept then 'accepted' else 'rejected' end;

  update public.book_transactions
  set status = v_next_status,
      owner_confirmed_at = case when p_accept and owner_confirmed_at is null then now() else owner_confirmed_at end
  where id = p_transaction_id;

  if p_accept then
    update public.books
    set status = 'negotiating'
    where id = v_transaction.book_id;

    if v_transaction.delivery_method = 'volunteer' then
      insert into public.deliveries (
        transaction_id,
        delivery_type,
        pickup_location,
        dropoff_location
      )
      select
        p_transaction_id,
        'outbound',
        coalesce(nullif(v_transaction.pickup_location, ''), 'Chưa cập nhật'),
        coalesce(nullif(v_transaction.dropoff_location, ''), 'Chưa cập nhật')
      where not exists (
        select 1
        from public.deliveries
        where transaction_id = p_transaction_id
          and delivery_type = 'outbound'
      );
    end if;
  else
    update public.books
    set status = 'available'
    where id = v_transaction.book_id;

    update public.deliveries
    set status = 'cancelled'
    where transaction_id = p_transaction_id
      and status <> 'delivered';
  end if;

  insert into public.transaction_history (
    transaction_id,
    status_updated_to,
    updated_by_account_id,
    note
  )
  values (
    p_transaction_id,
    v_next_status,
    auth.uid(),
    coalesce(p_note, case when p_accept then 'Chủ sách chấp nhận' else 'Chủ sách từ chối' end)
  );
end;
$$;

create or replace function public.confirm_transaction(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.book_transactions%rowtype;
  v_owner_delta integer;
  v_borrower_delta integer;
  v_pending_outbound_delivery_count integer;
begin
  select * into v_transaction
  from public.book_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Không tìm thấy giao dịch';
  end if;

  if v_transaction.borrower_account_id <> auth.uid() then
    raise exception 'Chỉ người nhận sách được xác nhận đã nhận sách';
  end if;

  if v_transaction.delivery_method = 'self_pickup' and v_transaction.status <> 'accepted' then
    raise exception 'Giao dịch tự giao nhận chưa thể xác nhận';
  end if;

  if v_transaction.delivery_method = 'volunteer' and v_transaction.status <> 'delivered' then
    raise exception 'Người giao sách chưa xác nhận đã giao xong';
  end if;

  select count(*) into v_pending_outbound_delivery_count
  from public.deliveries
  where transaction_id = p_transaction_id
    and delivery_type = 'outbound'
    and status <> 'delivered';

  if v_pending_outbound_delivery_count > 0 then
    raise exception 'Đơn giao sách chưa hoàn tất';
  end if;

  update public.book_transactions
  set borrower_confirmed_at = coalesce(borrower_confirmed_at, now()),
      borrow_date = case
        when transaction_type = 'borrow' and borrow_date is null then now()
        else borrow_date
      end,
      status = 'completed'
  where id = p_transaction_id;

  insert into public.transaction_history (
    transaction_id,
    status_updated_to,
    updated_by_account_id,
    note
  )
  values (
    p_transaction_id,
    'completed',
    auth.uid(),
    'Người nhận xác nhận đã nhận sách'
  );

  if v_transaction.points_applied_at is null then
    v_owner_delta := case when v_transaction.transaction_type = 'exchange' then 10 else 5 end;
    v_borrower_delta := -v_owner_delta;

    perform public.add_points(
      v_transaction.owner_account_id,
      v_owner_delta,
      case when v_transaction.transaction_type = 'exchange'
        then 'Cộng điểm trao đổi vĩnh viễn'
        else 'Cộng điểm cho mượn sách'
      end,
      p_transaction_id,
      null
    );

    perform public.add_points(
      v_transaction.borrower_account_id,
      v_borrower_delta,
      case when v_transaction.transaction_type = 'exchange'
        then 'Trừ điểm nhận sách trao đổi'
        else 'Trừ điểm mượn sách'
      end,
      p_transaction_id,
      null
    );

    update public.book_transactions
    set points_applied_at = now()
    where id = p_transaction_id;

    update public.books
    set status = case when v_transaction.transaction_type = 'exchange' then 'exchanged' else 'borrowed' end
    where id = v_transaction.book_id;
  end if;
end;
$$;

create or replace function public.request_book_return(
  p_transaction_id uuid,
  p_delivery_method text default 'self_pickup',
  p_pickup_location text default null,
  p_dropoff_location text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.book_transactions%rowtype;
begin
  select * into v_transaction
  from public.book_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Không tìm thấy giao dịch';
  end if;

  if v_transaction.borrower_account_id <> auth.uid() then
    raise exception 'Chỉ người mượn được tạo yêu cầu hoàn trả';
  end if;

  if v_transaction.transaction_type <> 'borrow' or v_transaction.status <> 'completed' then
    raise exception 'Chỉ giao dịch mượn đang hiệu lực mới được yêu cầu hoàn trả';
  end if;

  if p_delivery_method not in ('self_pickup', 'volunteer') then
    raise exception 'Hình thức hoàn trả không hợp lệ';
  end if;

  if p_delivery_method = 'volunteer' and nullif(p_pickup_location, '') is null then
    raise exception 'Cần nhập địa chỉ lấy sách trả';
  end if;

  update public.book_transactions
  set status = 'return_requested'
  where id = p_transaction_id;

  insert into public.transaction_history (
    transaction_id,
    status_updated_to,
    updated_by_account_id,
    note
  )
  values (
    p_transaction_id,
    'return_requested',
    auth.uid(),
    case when p_delivery_method = 'volunteer'
      then 'Người mượn yêu cầu trả sách và cần người giao lượt về'
      else 'Người mượn yêu cầu trả sách, hai bên tự giao nhận'
    end
  );

  if p_delivery_method = 'volunteer' then
    insert into public.deliveries (
      transaction_id,
      delivery_type,
      pickup_location,
      dropoff_location
    )
    values (
      p_transaction_id,
      'return',
      coalesce(nullif(p_pickup_location, ''), 'Chưa cập nhật'),
      coalesce(nullif(v_transaction.pickup_location, ''), nullif(p_dropoff_location, ''), 'Chưa cập nhật')
    );
  end if;
end;
$$;

create or replace function public.mark_book_returned(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.book_transactions%rowtype;
  v_pending_return_delivery_count integer;
begin
  select * into v_transaction
  from public.book_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Không tìm thấy giao dịch';
  end if;

  if v_transaction.owner_account_id <> auth.uid() then
    raise exception 'Chỉ chủ sách được xác nhận đã nhận lại sách';
  end if;

  if v_transaction.transaction_type <> 'borrow' or v_transaction.status <> 'return_requested' then
    raise exception 'Chỉ giao dịch mượn đang chờ hoàn trả mới được đóng';
  end if;

  select count(*) into v_pending_return_delivery_count
  from public.deliveries
  where transaction_id = p_transaction_id
    and delivery_type = 'return'
    and status not in ('delivered', 'cancelled');

  if v_pending_return_delivery_count > 0 then
    raise exception 'Đơn giao trả chưa hoàn tất';
  end if;

  update public.book_transactions
  set status = 'returned',
      actual_return_date_at = now()
  where id = p_transaction_id;

  update public.books
  set status = 'available'
  where id = v_transaction.book_id;

  insert into public.transaction_history (
    transaction_id,
    status_updated_to,
    updated_by_account_id,
    note
  )
  values (
    p_transaction_id,
    'returned',
    auth.uid(),
    'Chủ sách xác nhận đã nhận lại sách'
  );
end;
$$;

-- Repair legacy rows where a borrow transaction was returned but the book stayed borrowed.
update public.books b
set status = 'available'
where b.status = 'borrowed'
  and exists (
    select 1
    from public.book_transactions t
    where t.book_id = b.id
      and t.transaction_type = 'borrow'
      and t.status = 'returned'
  )
  and not exists (
    select 1
    from public.book_transactions t
    where t.book_id = b.id
      and t.status in ('requested', 'accepted', 'delivered', 'completed', 'return_requested')
  );

create or replace function public.register_volunteer()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.accounts
  set role = case when role = 'admin' then 'admin' else 'volunteer' end
  where id = auth.uid();
end;
$$;

create or replace function public.take_delivery(p_delivery_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_transaction public.book_transactions%rowtype;
begin
  select role into v_role
  from public.accounts
  where id = auth.uid()
    and status = true;

  if v_role not in ('volunteer', 'admin') then
    raise exception 'Bạn cần đăng ký làm người giao sách';
  end if;

  select t.* into v_transaction
  from public.deliveries d
  join public.book_transactions t on t.id = d.transaction_id
  where d.id = p_delivery_id;

  if not found then
    raise exception 'Không tìm thấy đơn giao';
  end if;

  if auth.uid() in (v_transaction.owner_account_id, v_transaction.borrower_account_id) then
    raise exception 'Người cho mượn hoặc người nhận sách không được nhận đơn giao của chính giao dịch này';
  end if;

  update public.deliveries
  set volunteer_account_id = auth.uid(),
      accepted_at = now(),
      status = 'accepted'
  where id = p_delivery_id
    and status = 'open'
    and volunteer_account_id is null;

  if not found then
    raise exception 'Đơn giao không còn khả dụng';
  end if;
end;
$$;

create or replace function public.update_delivery_status(
  p_delivery_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_transaction public.book_transactions%rowtype;
begin
  if p_status not in ('in_transit', 'delivered') then
    raise exception 'Trạng thái giao sách không hợp lệ';
  end if;

  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if not found then
    raise exception 'Không tìm thấy đơn giao';
  end if;

  if v_delivery.volunteer_account_id <> auth.uid() then
    raise exception 'Chỉ người nhận giao được cập nhật đơn này';
  end if;

  select * into v_transaction
  from public.book_transactions
  where id = v_delivery.transaction_id;

  if found and auth.uid() in (v_transaction.owner_account_id, v_transaction.borrower_account_id) then
    raise exception 'Người trong giao dịch không được cập nhật đơn giao của chính giao dịch này';
  end if;

  if p_status = 'in_transit' and v_delivery.status <> 'accepted' then
    raise exception 'Chỉ đơn đã nhận mới được chuyển sang đang giao';
  end if;

  if p_status = 'delivered' and v_delivery.status <> 'in_transit' then
    raise exception 'Cần chuyển đơn sang đang giao trước khi xác nhận đã giao';
  end if;

  update public.deliveries
  set status = p_status,
      delivered_at = case when p_status = 'delivered' and delivered_at is null then now() else delivered_at end
  where id = p_delivery_id;

  if p_status = 'delivered' then
    if v_delivery.delivery_type = 'outbound' then
      update public.book_transactions
      set status = 'delivered'
      where id = v_delivery.transaction_id
        and status = 'accepted';

      insert into public.transaction_history (
        transaction_id,
        status_updated_to,
        updated_by_account_id,
        note
      )
      values (
        v_delivery.transaction_id,
        'delivered',
        auth.uid(),
        'Người giao sách xác nhận đã giao sách cho người nhận'
      );
    else
      insert into public.transaction_history (
        transaction_id,
        status_updated_to,
        updated_by_account_id,
        note
      )
      values (
        v_delivery.transaction_id,
        'return_requested',
        auth.uid(),
        'Người giao sách xác nhận đã giao sách lượt trả'
      );
    end if;
  end if;

  if p_status = 'delivered' and v_delivery.points_applied_at is null then
    perform public.add_points(
      auth.uid(),
      2,
      'Cộng điểm giao sách miễn phí',
      null,
      p_delivery_id
    );

    update public.deliveries
    set points_applied_at = now()
    where id = p_delivery_id;
  end if;
end;
$$;

alter table public.accounts enable row level security;
alter table public.account_addresses enable row level security;
alter table public.books enable row level security;
alter table public.book_transactions enable row level security;
alter table public.transaction_history enable row level security;
alter table public.deliveries enable row level security;
alter table public.complaints enable row level security;
alter table public.point_ledger enable row level security;

drop policy if exists accounts_select_authenticated on public.accounts;
create policy accounts_select_authenticated
on public.accounts for select
to authenticated
using (true);

drop policy if exists accounts_insert_own on public.accounts;
create policy accounts_insert_own
on public.accounts for insert
to authenticated
with check (id = auth.uid());

drop policy if exists accounts_update_own on public.accounts;
create policy accounts_update_own
on public.accounts for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists account_addresses_select_own on public.account_addresses;
create policy account_addresses_select_own
on public.account_addresses for select
to authenticated
using (account_id = auth.uid() or public.current_account_is_admin());

drop policy if exists account_addresses_insert_own on public.account_addresses;
create policy account_addresses_insert_own
on public.account_addresses for insert
to authenticated
with check (account_id = auth.uid());

drop policy if exists account_addresses_update_own on public.account_addresses;
create policy account_addresses_update_own
on public.account_addresses for update
to authenticated
using (account_id = auth.uid())
with check (account_id = auth.uid());

drop policy if exists account_addresses_delete_own on public.account_addresses;
create policy account_addresses_delete_own
on public.account_addresses for delete
to authenticated
using (account_id = auth.uid());

drop policy if exists books_select_authenticated on public.books;
create policy books_select_authenticated
on public.books for select
to authenticated
using (status <> 'hidden' or owner_account_id = auth.uid() or public.current_account_is_admin());

drop policy if exists books_insert_owner on public.books;
create policy books_insert_owner
on public.books for insert
to authenticated
with check (owner_account_id = auth.uid());

drop policy if exists books_update_owner on public.books;
create policy books_update_owner
on public.books for update
to authenticated
using (owner_account_id = auth.uid() or public.current_account_is_admin())
with check (owner_account_id = auth.uid() or public.current_account_is_admin());

drop policy if exists transactions_select_participants on public.book_transactions;
create policy transactions_select_participants
on public.book_transactions for select
to authenticated
using (
  owner_account_id = auth.uid()
  or borrower_account_id = auth.uid()
  or public.current_account_is_admin()
);

drop policy if exists transaction_history_select_participants on public.transaction_history;
create policy transaction_history_select_participants
on public.transaction_history for select
to authenticated
using (
  exists (
    select 1
    from public.book_transactions t
    where t.id = transaction_history.transaction_id
      and (
        t.owner_account_id = auth.uid()
        or t.borrower_account_id = auth.uid()
        or public.current_account_is_admin()
      )
  )
);

drop policy if exists deliveries_select_relevant on public.deliveries;
create policy deliveries_select_relevant
on public.deliveries for select
to authenticated
using (
  status = 'open'
  or volunteer_account_id = auth.uid()
  or public.current_account_is_admin()
  or exists (
    select 1
    from public.book_transactions t
    where t.id = deliveries.transaction_id
      and (t.owner_account_id = auth.uid() or t.borrower_account_id = auth.uid())
  )
);

drop policy if exists complaints_select_relevant on public.complaints;
create policy complaints_select_relevant
on public.complaints for select
to authenticated
using (
  complainant_account_id = auth.uid()
  or reported_account_id = auth.uid()
  or handled_by_account_id = auth.uid()
  or public.current_account_is_admin()
);

drop policy if exists complaints_insert_complainant on public.complaints;
create policy complaints_insert_complainant
on public.complaints for insert
to authenticated
with check (complainant_account_id = auth.uid());

drop policy if exists complaints_update_admin on public.complaints;
create policy complaints_update_admin
on public.complaints for update
to authenticated
using (public.current_account_is_admin())
with check (public.current_account_is_admin());

drop policy if exists point_ledger_select_own on public.point_ledger;
create policy point_ledger_select_own
on public.point_ledger for select
to authenticated
using (account_id = auth.uid() or public.current_account_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-covers',
  'book-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists book_covers_public_select on storage.objects;
create policy book_covers_public_select
on storage.objects for select
to public
using (bucket_id = 'book-covers');

drop policy if exists book_covers_insert_own_folder on storage.objects;
create policy book_covers_insert_own_folder
on storage.objects for insert
to authenticated
with check (bucket_id = 'book-covers' and name like auth.uid()::text || '/%');

drop policy if exists book_covers_update_own_folder on storage.objects;
create policy book_covers_update_own_folder
on storage.objects for update
to authenticated
using (bucket_id = 'book-covers' and name like auth.uid()::text || '/%')
with check (bucket_id = 'book-covers' and name like auth.uid()::text || '/%');

drop policy if exists book_covers_delete_own_folder on storage.objects;
create policy book_covers_delete_own_folder
on storage.objects for delete
to authenticated
using (bucket_id = 'book-covers' and name like auth.uid()::text || '/%');

revoke execute on function public.add_points(uuid, integer, text, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.create_transaction_request(uuid, text, text, timestamptz, text, text) from public, anon;
revoke execute on function public.respond_transaction(uuid, boolean, text) from public, anon;
revoke execute on function public.confirm_transaction(uuid) from public, anon;
revoke execute on function public.request_book_return(uuid, text, text, text) from public, anon;
revoke execute on function public.mark_book_returned(uuid) from public, anon;
revoke execute on function public.register_volunteer() from public, anon;
revoke execute on function public.take_delivery(uuid) from public, anon;
revoke execute on function public.update_delivery_status(uuid, text) from public, anon;

grant usage on schema public to authenticated, anon;
grant select on public.accounts, public.account_addresses, public.books to authenticated;
grant insert (id, full_name, phone_number, email_address) on public.accounts to authenticated;
grant update (full_name, phone_number) on public.accounts to authenticated;
grant insert, update, delete on public.account_addresses to authenticated;
grant select, insert, update on public.books to authenticated;
grant select on public.book_transactions, public.transaction_history, public.deliveries, public.point_ledger to authenticated;
grant select, insert on public.complaints to authenticated;
grant update on public.complaints to authenticated;
grant execute on function public.create_transaction_request(uuid, text, text, timestamptz, text, text) to authenticated;
grant execute on function public.respond_transaction(uuid, boolean, text) to authenticated;
grant execute on function public.confirm_transaction(uuid) to authenticated;
grant execute on function public.request_book_return(uuid, text, text, text) to authenticated;
grant execute on function public.mark_book_returned(uuid) to authenticated;
grant execute on function public.register_volunteer() to authenticated;
grant execute on function public.take_delivery(uuid) to authenticated;
grant execute on function public.update_delivery_status(uuid, text) to authenticated;
