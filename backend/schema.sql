-- Skema database DANA QRIS Gateway
-- Jalankan dengan: npm run db:setup  (butuh DATABASE_URL di .env)

create table if not exists orders (
  id           text primary key,
  base_amount  integer     not null,               -- harga dasar (rupiah)
  unique_code  integer     not null,               -- kode unik 100-999
  amount       integer     not null,               -- base_amount + unique_code = yang dibayar customer
  note         text,                               -- catatan/keterangan order (opsional)
  provider     text        not null default 'ANY', -- 'ANY' = boleh bayar lewat provider mana saja,
                                                    -- atau id provider tertentu (mis. 'dana_bisnis')
  status       text        not null default 'PENDING', -- PENDING | PAID | EXPIRED
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  paid_at      timestamptz,
  paid_provider text,                              -- provider asal pembayaran yang cocok
  paid_tx_id   text
);

-- Anti-tabrakan: tidak boleh ada 2 order PENDING dengan nominal sama.
create unique index if not exists orders_pending_amount_uniq
  on orders (amount) where status = 'PENDING';

-- Integrasi web utama (toko online / kasir Anda): tujuan webhook & redirect setelah bayar.
alter table orders add column if not exists callback_url    text;
alter table orders add column if not exists redirect_url    text;
alter table orders add column if not exists callback_status text;

-- Log pembayaran masuk dari HP. dedup_key menjamin 1 notif diproses sekali (idempotent).
create table if not exists payments (
  id           bigserial   primary key,
  dedup_key    text        unique not null,
  provider     text        not null default 'unknown', -- id provider asal notif
  amount       integer     not null,
  raw_text     text,
  order_id     text        references orders(id),
  matched      boolean     not null default false,
  received_at  timestamptz not null default now()
);
