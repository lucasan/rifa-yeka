'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { supabaseBrowser } from '@/lib/supabase/client';
import { pad2 } from '@/lib/whatsapp';
import type { GridCell } from '@/lib/supabase/types';

type Props = {
  initialCells: GridCell[];
  selected?: Set<number>;
  onToggle?: (n: number) => void;
  disabled?: boolean;
};

export function NumberGrid({ initialCells, selected, onToggle, disabled }: Props) {
  const [cells, setCells] = useState<GridCell[]>(initialCells);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel('numbers-grid')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'numbers' }, async () => {
        const { data } = await supabaseBrowser
          .from('numbers')
          .select('n, purchase_id, purchases:purchase_id(name)')
          .order('n');
        if (data) {
          setCells(
            data.map((row: any) => ({
              n: row.n,
              purchase_id: row.purchase_id,
              buyer_name: row.purchases?.name ?? null,
            }))
          );
        }
      })
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  const byN = useMemo(() => {
    const map = new Map<number, GridCell>();
    cells.forEach((c) => map.set(c.n, c));
    return map;
  }, [cells]);

  return (
    <div className="grid grid-cols-10 gap-1 sm:gap-2 max-w-2xl mx-auto">
      {Array.from({ length: 100 }, (_, n) => {
        const cell = byN.get(n);
        const occupied = !!cell?.purchase_id;
        const isSelected = selected?.has(n) ?? false;
        const clickable = onToggle && !occupied && !disabled;

        return (
          <button
            type="button"
            key={n}
            disabled={!clickable}
            onClick={() => clickable && onToggle?.(n)}
            title={cell?.buyer_name ?? undefined}
            className={clsx(
              'aspect-square rounded-md text-xs sm:text-sm font-semibold transition-colors',
              occupied && 'bg-pink-200 text-pink-900 cursor-not-allowed',
              !occupied && !isSelected && 'bg-white text-purple-900 hover:bg-purple-100 border border-purple-200',
              isSelected && 'bg-purple-600 text-white ring-2 ring-purple-300'
            )}
          >
            {pad2(n)}
          </button>
        );
      })}
    </div>
  );
}
