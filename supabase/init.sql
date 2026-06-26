-- 左邓粉丝座位互助网站 Supabase 表结构
-- 使用方式：复制整份到 Supabase SQL Editor 执行。

create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  venue_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  account text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'needs_proof' check (status in ('needs_proof', 'pending', 'approved', 'rejected', 'deactivated')),
  weibo_name text,
  wechat_name text,
  offline_group boolean,
  reject_reason text,
  fan_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists venue_zones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  tier_name text not null,
  zone_name text not null,
  row_counts jsonb not null,
  sort_order int not null default 0,
  unique(event_id, zone_name)
);

create table if not exists seats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  zone_id uuid not null references venue_zones(id) on delete cascade,
  row_no int not null,
  seat_no int not null,
  message text,
  updated_at timestamptz not null default now(),
  unique(event_id, user_id),
  unique(event_id, zone_id, row_no, seat_no)
);

create table if not exists proof_fields (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  type text not null check (type in ('image', 'text', 'radio', 'checkbox')),
  options jsonb,
  required boolean not null default true,
  sort_order int not null default 0
);

create table if not exists proof_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  submitted_at timestamptz not null default now(),
  unique(user_id, event_id)
);

create table if not exists proof_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references proof_submissions(id) on delete cascade,
  field_id uuid not null references proof_fields(id) on delete cascade,
  value_text text,
  value_json jsonb,
  file_url text,
  unique(submission_id, field_id)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references app_users(id),
  user_id uuid references app_users(id),
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists app_users_status_idx on app_users(status);
create index if not exists seats_event_zone_idx on seats(event_id, zone_id);
create index if not exists seats_user_idx on seats(user_id);
create index if not exists proof_submissions_user_event_idx on proof_submissions(user_id, event_id);

insert into events (name, venue_name, status)
select '左邓粉丝 · 银河综艺馆 · 同担座位互助', '银河综艺馆', 'active'
where not exists (select 1 from events where status = 'active');

do $$
declare
  active_event uuid;
  zone_no int;
  tier_name text;
begin
  select id into active_event from events where status = 'active' order by created_at desc limit 1;

  for zone_no in 101..115 loop
    insert into venue_zones(event_id, tier_name, zone_name, row_counts, sort_order)
    values(active_event, '一层看台', zone_no || '区', '[14,14,14,14,14,14,14,14,14,14]'::jsonb, zone_no)
    on conflict(event_id, zone_name) do nothing;
  end loop;

  for zone_no in 201..219 loop
    insert into venue_zones(event_id, tier_name, zone_name, row_counts, sort_order)
    values(active_event, '二层看台', zone_no || '区', '[22,22,22,22,22,22,22,22,22,22,22,22]'::jsonb, zone_no)
    on conflict(event_id, zone_name) do nothing;
  end loop;

  for zone_no in 301..317 loop
    insert into venue_zones(event_id, tier_name, zone_name, row_counts, sort_order)
    values(active_event, '三层看台', zone_no || '区', '[28,28,28,28,28,28,28,28,28,28,28,28,28,28]'::jsonb, zone_no)
    on conflict(event_id, zone_name) do nothing;
  end loop;

  insert into proof_fields(event_id, label, type, options, sort_order)
  values
    (active_event, '微博名', 'text', null, 1),
    (active_event, '微信名', 'text', null, 2),
    (active_event, '是否在线下群', 'radio', '["是", "否"]'::jsonb, 3),
    (active_event, '微博主页自证截图', 'image', null, 4),
    (active_event, '官周自证截图', 'image', null, 5),
    (active_event, '数据组周自证截图', 'image', null, 6)
  on conflict do nothing;
end $$;

alter table events enable row level security;
alter table app_users enable row level security;
alter table venue_zones enable row level security;
alter table seats enable row level security;
alter table proof_fields enable row level security;
alter table proof_submissions enable row level security;
alter table proof_answers enable row level security;
alter table audit_logs enable row level security;
