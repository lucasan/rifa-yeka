'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NumberGrid } from '@/components/NumberGrid';
import type { GridCell } from '@/lib/supabase/types';
import { pad2 } from '@/lib/whatsapp';

type Props = { initialCells: GridCell[] };

function pickRandom(cells: GridCell[], count = 5): number[] {
  const free = cells.filter((c) => !c.purchase_id).map((c) => c.n);
  const result: number[] = [];
  const pool = [...free];
  while (result.length < count && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

export function ReserveForm({ initialCells }: Props) {
  const router = useRouter();
  const [cells] = useState(initialCells);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedSelected = useMemo(
    () => [...selected].sort((a, b) => a - b),
    [selected]
  );

  function toggle(n: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else if (next.size < 5) next.add(n);
      return next;
    });
  }

  function randomPick() {
    const picked = pickRandom(cells);
    if (picked.length === 5) {
      setSelected(new Set(picked));
      setError(null);
    } else {
      setError(`Solo quedan ${picked.length} números libres. Escógelos manualmente.`);
    }
  }

  const canSubmit = name.trim().length >= 2 && /^\+?[\d\s]{7,20}$/.test(phone) && selected.size === 5 && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone, numbers: [...selected] }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body.error === 'taken') {
          setError(
            `Estos números acaban de ser apartados: ${body.takenNumbers.map(pad2).join(', ')}. Por favor escoge otros.`
          );
          setSelected((prev) => {
            const next = new Set(prev);
            body.takenNumbers.forEach((n: number) => next.delete(n));
            return next;
          });
          return;
        }
        if (body.error === 'raffle_closed') {
          setError('La rifa ya fue cerrada.');
          return;
        }
        setError(body.message ?? 'Error inesperado. Intenta de nuevo.');
        return;
      }
      router.push(`/pago/${body.purchaseId}`);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <p className="text-sm opacity-80 order-2 sm:order-1">
          Toca para escoger 5 números <span className="font-bold">({selected.size}/5)</span>
        </p>
        <button
          type="button"
          onClick={randomPick}
          className="order-1 sm:order-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-xl text-sm w-full sm:w-auto"
        >
          Sorpréndeme (5 al azar)
        </button>
      </div>

      <NumberGrid initialCells={cells} selected={selected} onToggle={toggle} />

      {sortedSelected.length > 0 && (
        <p className="text-center font-semibold">
          Tu selección: {sortedSelected.map(pad2).join(', ')}
        </p>
      )}

      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold">Tu nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-purple-300 px-3 py-2"
            placeholder="Ana Pérez"
            required
            minLength={2}
            maxLength={60}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Tu WhatsApp</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            className="mt-1 block w-full rounded-md border border-purple-300 px-3 py-2"
            placeholder="3001234567"
            required
          />
        </label>
      </div>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
      >
        {submitting ? 'Apartando…' : 'Apartar mis 5 números'}
      </button>
    </form>
  );
}
