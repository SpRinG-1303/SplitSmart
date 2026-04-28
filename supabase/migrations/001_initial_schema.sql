create extension if not exists "uuid-ossp";

create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text not null,
  color text not null,
  currency text not null default '₹',
  members jsonb not null default '[]',
  me_member_id text not null,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount numeric not null,
  category text not null,
  paid_by text not null,
  split_type text not null,
  splits jsonb not null default '[]',
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.settlements (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  from_member_id text not null,
  to_member_id text not null,
  amount numeric not null,
  settled_at timestamptz not null default now()
);

create table public.activity (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;
alter table public.activity enable row level security;

create policy "own_groups_select" on public.groups for select using (auth.uid() = user_id);
create policy "own_groups_insert" on public.groups for insert with check (auth.uid() = user_id);
create policy "own_groups_update" on public.groups for update using (auth.uid() = user_id);
create policy "own_groups_delete" on public.groups for delete using (auth.uid() = user_id);

create policy "own_expenses_select" on public.expenses for select using (auth.uid() = user_id);
create policy "own_expenses_insert" on public.expenses for insert with check (auth.uid() = user_id);
create policy "own_expenses_delete" on public.expenses for delete using (auth.uid() = user_id);

create policy "own_settlements_select" on public.settlements for select using (auth.uid() = user_id);
create policy "own_settlements_insert" on public.settlements for insert with check (auth.uid() = user_id);

create policy "own_activity_select" on public.activity for select using (auth.uid() = user_id);
create policy "own_activity_insert" on public.activity for insert with check (auth.uid() = user_id);

create index groups_user_id_idx on public.groups(user_id);
create index expenses_group_id_idx on public.expenses(group_id);
create index settlements_group_id_idx on public.settlements(group_id);
create index activity_group_id_idx on public.activity(group_id);
