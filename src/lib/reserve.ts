import { supabaseServer } from '@/lib/supabase/server';
import { NUMBERS_PER_PURCHASE, TOTAL_NUMBERS } from '@/lib/constants';

export class ReserveValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReserveValidationError';
  }
}

export type ReserveInput = { name: string; phone: string; numbers: number[] };
export type ReserveResult =
  | { ok: true; purchaseId: string }
  | { ok: false; reason: 'taken'; takenNumbers: number[] }
  | { ok: false; reason: 'raffle_closed' }
  | { ok: false; reason: 'validation'; message: string };

export function validateReserveInput(input: ReserveInput): ReserveInput {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) {
    throw new ReserveValidationError('name must be 2-60 characters');
  }

  const phone = input.phone.replace(/[^\d+]/g, '');
  if (!/^\+?\d{7,15}$/.test(phone)) {
    throw new ReserveValidationError('phone must be 7-15 digits, optional + prefix');
  }

  if (input.numbers.length !== NUMBERS_PER_PURCHASE) {
    throw new ReserveValidationError(`must pick exactly ${NUMBERS_PER_PURCHASE} numbers`);
  }
  const set = new Set(input.numbers);
  if (set.size !== input.numbers.length) {
    throw new ReserveValidationError('duplicate numbers not allowed');
  }
  for (const n of input.numbers) {
    if (!Number.isInteger(n) || n < 0 || n >= TOTAL_NUMBERS) {
      throw new ReserveValidationError(`numbers must be integers in range 0-${TOTAL_NUMBERS - 1}`);
    }
  }

  return { name, phone, numbers: input.numbers };
}

export async function reserve(rawInput: ReserveInput): Promise<ReserveResult> {
  let input: ReserveInput;
  try {
    input = validateReserveInput(rawInput);
  } catch (err) {
    if (err instanceof ReserveValidationError) {
      return { ok: false, reason: 'validation', message: err.message };
    }
    throw err;
  }

  const sb = supabaseServer();
  // Supabase's typed client doesn't know about our custom `reserve_numbers`
  // function (not in the generated Database type). Cast to call it.
  const { data, error } = await sb.rpc('reserve_numbers' as never, {
    p_name: input.name,
    p_phone: input.phone,
    p_numbers: input.numbers,
  } as never);

  if (error) {
    if (error.message.includes('raffle_closed')) return { ok: false, reason: 'raffle_closed' };
    if (error.message.includes('race_lost')) return { ok: false, reason: 'taken', takenNumbers: [] };
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { purchase_id?: string; taken?: number[] }
    | null
    | undefined;
  if (!row || !row.purchase_id) {
    return { ok: false, reason: 'taken', takenNumbers: row?.taken ?? [] };
  }
  return { ok: true, purchaseId: row.purchase_id };
}
