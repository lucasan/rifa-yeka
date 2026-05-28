import { Suspense } from 'react';
import { supabaseServer } from '@/lib/supabase/server';
import { ReserveForm } from '@/components/ReserveForm';
import type { GridCell, RaffleState } from '@/lib/supabase/types';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ApartarPage() {
  const sb = supabaseServer();
  const { data: state } = await sb.from('raffle_state').select('*').eq('id', 1).single();
  const typed = state as RaffleState | null;
  if (typed?.winning_number != null) redirect('/');

  const { data } = await sb
    .from('numbers')
    .select('n, purchase_id, purchases:purchase_id(name)')
    .order('n');
  const cells: GridCell[] = (data ?? []).map((row: any) => ({
    n: row.n,
    purchase_id: row.purchase_id,
    buyer_name: row.purchases?.name ?? null,
  }));

  return (
    <Suspense>
      <ReserveForm initialCells={cells} />
    </Suspense>
  );
}
