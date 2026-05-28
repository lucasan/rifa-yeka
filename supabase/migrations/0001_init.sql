-- =============== Tables ===============
create table purchases (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(name) between 2 and 60),
  phone         text not null check (length(phone) between 7 and 20),
  status        text not null default 'pending' check (status in ('pending', 'confirmed')),
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz
);

create table numbers (
  n            int primary key check (n between 0 and 99),
  purchase_id  uuid references purchases(id) on delete set null
);
create index numbers_purchase_id_idx on numbers(purchase_id);

create table raffle_state (
  id              int primary key check (id = 1),
  winning_number  int check (winning_number between 0 and 99),
  closed_at       timestamptz
);

-- =============== Seed ===============
insert into numbers (n) select generate_series(0, 99);
insert into raffle_state (id) values (1);

-- =============== RPC: reserve_numbers ===============
create or replace function reserve_numbers(
  p_name text,
  p_phone text,
  p_numbers int[]
) returns table(purchase_id uuid, taken int[]) language plpgsql as $$
declare
  new_purchase_id uuid;
  updated_count int;
  already_taken int[];
  raffle_open bool;
begin
  -- Check raffle is open
  select winning_number is null into raffle_open from raffle_state where id = 1;
  if not raffle_open then
    raise exception 'raffle_closed';
  end if;

  if array_length(p_numbers, 1) <> 5 then
    raise exception 'must_be_five_numbers';
  end if;

  -- Find conflicts up front (so we can return them without inserting a purchase row)
  select coalesce(array_agg(n), '{}') into already_taken
    from numbers where n = any(p_numbers) and purchase_id is not null;

  if array_length(already_taken, 1) is not null then
    return query select null::uuid, already_taken;
    return;
  end if;

  -- Insert purchase
  insert into purchases (name, phone) values (p_name, p_phone) returning id into new_purchase_id;

  -- Assign numbers atomically. WHERE purchase_id IS NULL handles last-microsecond races.
  update numbers
    set purchase_id = new_purchase_id
    where n = any(p_numbers) and purchase_id is null;

  get diagnostics updated_count = row_count;

  if updated_count <> 5 then
    -- Race lost. Rollback by raising; the outer transaction will discard the purchase insert too.
    raise exception 'race_lost';
  end if;

  return query select new_purchase_id, '{}'::int[];
end;
$$;

-- =============== RLS ===============
alter table purchases enable row level security;
alter table numbers enable row level security;
alter table raffle_state enable row level security;

-- Public reads
create policy purchases_select_public on purchases for select using (true);
create policy numbers_select_public on numbers for select using (true);
create policy raffle_state_select_public on raffle_state for select using (true);

-- No public writes. Server uses service role (bypasses RLS).

-- =============== Column-level grants (hide phone from anon) ===============
-- RLS gives row-level control but not column-level. We use grants to keep
-- the phone column off-limits to anon. Service role bypasses grants too,
-- so server-side reads still see everything.
revoke all on purchases from anon, authenticated;
grant select (id, name, status, created_at) on purchases to anon, authenticated;
