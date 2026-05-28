function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const YEKA_WHATSAPP = process.env.YEKA_WHATSAPP ?? '+573244255786';
export const NEQUI_NUMBER = process.env.NEQUI_NUMBER ?? '3164959139';
export const NEQUI_NAME = process.env.NEQUI_NAME ?? 'Lucas Torres';

export const TOTAL_NUMBERS = 100;
export const NUMBERS_PER_PURCHASE = 5;
export const RAFFLE_DATE_LABEL = 'lunes 8 de junio, 1:00 pm (Chontico)';

export function requireServerEnv(name: 'SUPABASE_SERVICE_ROLE_KEY' | 'ADMIN_PASSWORD' | 'ADMIN_SESSION_SECRET' | 'NEXT_PUBLIC_SUPABASE_URL'): string {
  return required(name);
}
