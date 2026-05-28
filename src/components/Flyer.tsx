import Image from 'next/image';
import { RAFFLE_DATE_LABEL } from '@/lib/constants';

export function Flyer() {
  return (
    <section className="max-w-md mx-auto px-4 py-6 text-center">
      <Image
        src="/flyer_rifa_yeka.png"
        alt="Rifa de Yeka — para arreglar la pantalla del teléfono"
        width={600}
        height={800}
        priority
        className="rounded-2xl shadow-xl mx-auto"
      />
      <p className="mt-4 text-sm opacity-80">Sorteo: {RAFFLE_DATE_LABEL}</p>
    </section>
  );
}
