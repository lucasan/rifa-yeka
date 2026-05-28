import { YEKA_WHATSAPP } from './constants';

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function buildPagueUrl({ name, numbers }: { name: string; numbers: number[] }): string {
  const phone = YEKA_WHATSAPP.replace(/[^0-9]/g, '');
  const formatted = numbers.map(pad2).join(', ');
  const text = `Hola Yeka! Ya pagué la rifa. Mis números son ${formatted}. Nombre: ${name}. Adjunto comprobante.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
