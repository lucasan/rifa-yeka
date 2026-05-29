import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { verifySessionCookie, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { AdminTable } from '@/components/AdminTable';
import { closeRaffle, reopenRaffle, logoutAdmin } from './actions';
import { pad2 } from '@/lib/whatsapp';
import type { Purchase, NumberRow, RaffleState } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const store = await cookies();
  if (!verifySessionCookie(store.get(ADMIN_COOKIE_NAME)?.value)) redirect('/admin/login');

  const sb = supabaseServer();
  const [{ data: purchases }, { data: numberRows }, { data: state }] = await Promise.all([
    sb.from('purchases').select('*').order('created_at', { ascending: false }),
    sb.from('numbers').select('n, purchase_id'),
    sb.from('raffle_state').select('*').eq('id', 1).single(),
  ]);

  const purchasesTyped = (purchases ?? []) as Purchase[];
  const numbersTyped = (numberRows ?? []) as NumberRow[];
  const stateTyped = state as RaffleState | null;

  const byPurchase = new Map<string, number[]>();
  numbersTyped.forEach((r) => {
    if (r.purchase_id) {
      const arr = byPurchase.get(r.purchase_id) ?? [];
      arr.push(r.n);
      byPurchase.set(r.purchase_id, arr);
    }
  });

  const rows = purchasesTyped.map((p) => ({ ...p, numbers: byPurchase.get(p.id) ?? [] }));
  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const confirmedCount = rows.filter((r) => r.status === 'confirmed').length;
  const closed = stateTyped?.winning_number != null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Panel — Rifa de Yeka</h1>
        <form action={logoutAdmin}><button className="text-sm underline">Salir</button></form>
      </header>

      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white rounded-xl p-3 shadow">
          <p className="text-2xl font-bold">{rows.length}</p>
          <p className="text-xs opacity-70">Compras</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow">
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs opacity-70">Pendientes</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow">
          <p className="text-2xl font-bold text-green-700">{confirmedCount}</p>
          <p className="text-xs opacity-70">Confirmadas</p>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-bold mb-2">Compras</h2>
        <AdminTable rows={rows} />
      </section>

      <section className="bg-white rounded-2xl shadow p-4 space-y-3">
        <h2 className="font-bold">Sorteo</h2>
        {closed ? (
          <>
            <p>
              Número ganador actual: <strong>{pad2(stateTyped!.winning_number!)}</strong>
            </p>
            <form action={closeRaffle} className="flex gap-2 items-end">
              <label className="flex-1">
                <span className="text-xs">Corregir número ganador (0–99)</span>
                <input name="winning_number" type="number" min={0} max={99} required className="block w-full border rounded px-2 py-1" />
              </label>
              <button className="bg-purple-600 text-white px-3 py-1 rounded">Actualizar</button>
            </form>
            <form action={reopenRaffle}>
              <button className="text-red-700 text-sm underline">Reabrir rifa</button>
            </form>
          </>
        ) : (
          <form action={closeRaffle} className="flex gap-2 items-end">
            <label className="flex-1">
              <span className="text-xs">Número ganador (0–99)</span>
              <input name="winning_number" type="number" min={0} max={99} required className="block w-full border rounded px-2 py-1" />
            </label>
            <button className="bg-pink-600 text-white px-3 py-1 rounded font-semibold">Cerrar rifa</button>
          </form>
        )}
      </section>
    </main>
  );
}
