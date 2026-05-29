-- Fix: "column reference 'purchase_id' is ambiguous"
-- The function RETURNS TABLE column `purchase_id` clashes with the
-- `numbers.purchase_id` column inside the WHERE clauses. Qualify the
-- table references to disambiguate.

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
  select winning_number is null into raffle_open from raffle_state where id = 1;
  if not raffle_open then
    raise exception 'raffle_closed';
  end if;

  if array_length(p_numbers, 1) <> 5 then
    raise exception 'must_be_five_numbers';
  end if;

  select coalesce(array_agg(n), '{}') into already_taken
    from numbers where n = any(p_numbers) and numbers.purchase_id is not null;

  if array_length(already_taken, 1) is not null then
    return query select null::uuid, already_taken;
    return;
  end if;

  insert into purchases (name, phone) values (p_name, p_phone) returning id into new_purchase_id;

  update numbers
    set purchase_id = new_purchase_id
    where n = any(p_numbers) and numbers.purchase_id is null;

  get diagnostics updated_count = row_count;

  if updated_count <> 5 then
    raise exception 'race_lost';
  end if;

  return query select new_purchase_id, '{}'::int[];
end;
$$;
