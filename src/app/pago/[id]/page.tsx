import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { NEQUI_NUMBER, NEQUI_NAME } from '@/lib/constants';
import { buildPagoUrl, pad2 } from '@/lib/whatsapp';
import type { Purchase } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function PagoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseServer();

  const { data: purchase } = await sb.from('purchases').select('*').eq('id', id).single();
  const typed = purchase as Purchase | null;
  if (!typed) notFound();

  const { data: nums } = await sb.from('numbers').select('n').eq('purchase_id', id).order('n');
  const numbers = ((nums ?? []) as { n: number }[]).map((r) => r.n);

  const whatsappUrl = buildPagoUrl({ name: typed.name, numbers });

  return (
    <main className="max-w-md mx-auto px-4 py-8 space-y-6 text-center">
      <h1 className="text-2xl font-bold">¡Tus números están apartados! 💖</h1>

      <div className="bg-white rounded-2xl shadow p-4">
        <p className="text-sm opacity-70">Tus 5 números:</p>
        <p className="text-2xl font-extrabold tracking-wider mt-1">
          {numbers.map(pad2).join(' · ')}
        </p>
        <p className="text-xs opacity-60 mt-2">
          {typed.status === 'confirmed' ? '✅ Pago confirmado' : '⏳ Esperando confirmación de pago'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 space-y-3">
        <p className="font-semibold">Paga $20.000 por Nequi</p>
        <Image
          src="/nequi.jpeg"
          alt="QR Nequi para pagar"
          width={300}
          height={300}
          className="mx-auto rounded-xl"
        />
        <p className="text-sm">
          Número: <strong>{NEQUI_NUMBER}</strong>
          <br />
          A nombre de: <strong>{NEQUI_NAME}</strong>
        </p>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="block bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl"
      >
        Ya pagué — avisar por WhatsApp
      </a>

      <p className="text-xs opacity-70">
        Yeka confirmará tu pago manualmente y te avisará por WhatsApp.
      </p>

      <Link href="/" className="block text-purple-700 underline text-sm">
        Volver al inicio
      </Link>
    </main>
  );
}
