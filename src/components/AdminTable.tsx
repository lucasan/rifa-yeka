'use client';

import { confirmPurchase, resetPurchase } from '@/app/admin/actions';
import { pad2 } from '@/lib/whatsapp';
import type { Purchase } from '@/lib/supabase/types';

type Row = Purchase & { numbers: number[] };
type Props = { rows: Row[] };

export function AdminTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-center opacity-70 py-6">Aún no hay compras.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-2">Nombre</th>
            <th className="py-2 px-2">Teléfono</th>
            <th className="py-2 px-2">Números</th>
            <th className="py-2 px-2">Estado</th>
            <th className="py-2 px-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 px-2">{r.name}</td>
              <td className="py-2 px-2"><a href={`https://wa.me/${r.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="underline">{r.phone}</a></td>
              <td className="py-2 px-2 font-mono">{[...r.numbers].sort((a,b)=>a-b).map(pad2).join(', ')}</td>
              <td className="py-2 px-2">
                {r.status === 'confirmed'
                  ? <span className="text-green-700">✅ Confirmado</span>
                  : <span className="text-amber-700">⏳ Pendiente</span>}
              </td>
              <td className="py-2 px-2 space-y-1">
                {r.status === 'pending' && (
                  <form action={confirmPurchase}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="px-2 py-1 bg-green-600 text-white rounded text-xs">Confirmar pago</button>
                  </form>
                )}
                <form
                  action={resetPurchase}
                  onSubmit={(e) => {
                    if (!confirm(`¿Resetear a ${r.name} y liberar sus números ${[...r.numbers].sort((a,b)=>a-b).map(pad2).join(', ')}?`)) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={r.id} />
                  <button className="px-2 py-1 bg-red-600 text-white rounded text-xs">Resetear</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
