import { supabaseServer } from '@/lib/supabase/server';
import { NumberGrid } from '@/components/NumberGrid';
import { ReserveForm } from '@/components/ReserveForm';
import { Flyer } from '@/components/Flyer';
import { WinnerBanner } from '@/components/WinnerBanner';
import type { GridCell, RaffleState } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

async function loadGrid(): Promise<GridCell[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('numbers')
    .select('n, purchase_id, purchases:purchase_id(name)')
    .order('n');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    n: row.n,
    purchase_id: row.purchase_id,
    buyer_name: row.purchases?.name ?? null,
  }));
}

async function loadRaffleState(): Promise<RaffleState | null> {
  const sb = supabaseServer();
  const { data } = await sb.from('raffle_state').select('*').eq('id', 1).single();
  return data as RaffleState | null;
}

async function loadWinnerName(winningNumber: number): Promise<string | null> {
  const sb = supabaseServer();
  const { data } = await sb
    .from('numbers')
    .select('purchases:purchase_id(name)')
    .eq('n', winningNumber)
    .single();
  return (data as any)?.purchases?.name ?? null;
}

export default async function HomePage() {
  const [cells, state] = await Promise.all([loadGrid(), loadRaffleState()]);
  const isClosed = state?.winning_number != null;
  const winnerName = isClosed ? await loadWinnerName(state!.winning_number!) : null;
  const available = cells.filter((c) => !c.purchase_id).length;

  return (
    <main>
      {isClosed && <WinnerBanner winningNumber={state!.winning_number!} winnerName={winnerName} />}
      <Flyer />

      <section className="max-w-2xl mx-auto px-4 pb-10">
        <p className="text-center text-sm mb-4 opacity-80">
          Quedan <span className="font-bold">{available}</span> de 100 números libres
        </p>

        {isClosed ? (
          <NumberGrid initialCells={cells} disabled />
        ) : (
          <ReserveForm initialCells={cells} />
        )}
      </section>
    </main>
  );
}
