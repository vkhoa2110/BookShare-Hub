---
title: BookShare Hub
sdk: docker
app_port: 7860
pinned: false
---

# BookShare Hub

Web app trao đổi sách cho câu lạc bộ đọc sách, triển khai bằng React + Vite và lưu dữ liệu trên Supabase.

## Chức năng chính

- Đăng ký/đăng nhập bằng Supabase Auth, tài khoản mới nhận 20 điểm.
- Quản lý danh mục sách: thêm, sửa, ẩn/hiện, tìm kiếm và lọc.
- Gửi yêu cầu trao đổi vĩnh viễn hoặc mượn có hoàn trả.
- Chủ sách chấp nhận/từ chối, hai bên xác nhận để cộng/trừ điểm một lần.
- Đăng ký người giao sách miễn phí, nhận đơn và cộng 2 điểm khi giao thành công.
- Gửi khiếu nại, xem lịch sử trạng thái giao dịch và lịch sử điểm.
- Trang quản trị cho tài khoản có `role = 'admin'`.

## Thiết lập Supabase

1. Mở Supabase Dashboard của project.
2. Vào **SQL Editor** và chạy toàn bộ file [`supabase/schema.sql`](supabase/schema.sql).
3. App dùng Supabase Auth để mã hóa mật khẩu; bảng `accounts` chỉ lưu hồ sơ, điểm và vai trò.
4. URL và publishable key đã có trong `.env.local`; không đưa mật khẩu Postgres vào mã nguồn.

Có thể chạy migration bằng terminal nếu đã đặt biến môi trường `DATABASE_URL`. Nếu direct database host của Supabase chỉ có IPv6 trên máy hiện tại, dùng SQL Editor hoặc lấy pooler URL IPv4 trong Supabase Dashboard.

```bash
npm run db:apply
```

Seed dữ liệu mẫu:

```bash
npm run db:seed
```

Các tài khoản mẫu dùng mật khẩu `Bookshare123!`, ví dụ `admin@booksharehub.com`, `hung@booksharehub.com`, `lan@booksharehub.com`.

Sau khi chạy schema, có thể cấp quyền quản trị bằng SQL:

```sql
update public.accounts
set role = 'admin'
where email_address = 'email-cua-ban@example.com';
```

## Chạy project

```bash
npm install
npm run dev
```

Build kiểm tra:

```bash
npm run check
npm run build
npm run test
npm run lint
```

## Cấu trúc mã nguồn

Project được tách theo feature để dễ review và làm việc nhóm:

```txt
src/
  app/                 # điều hướng và app-level config
  features/            # từng màn hình nghiệp vụ: books, transactions, deliveries...
  services/            # Supabase query/RPC/storage wrapper
  shared/              # component, constants, utils dùng chung
  styles/              # CSS layout/shared toàn app
  types/               # domain types và form types
```

Quy ước khi thêm tính năng:

- UI của màn hình đặt trong `src/features/<feature>/`.
- Query/RPC Supabase đặt trong `src/services/`, không gọi trực tiếp từ component mới.
- Component dùng lại đặt trong `src/shared/components/`.
- Logic thuần có thể test đặt trong `src/shared/utils/` hoặc `src/features/<feature>/*Utils.ts`.
- Chạy `npm run check` trước khi gửi code.

Các script làm việc nhóm:

- `npm run typecheck`: kiểm tra TypeScript.
- `npm run lint`: kiểm tra ESLint.
- `npm run format`: format bằng Prettier.
- `npm run format:check`: kiểm tra format.
- `npm run test`: chạy Vitest unit tests.
- `npm run check`: chạy typecheck, lint, format check và test.
