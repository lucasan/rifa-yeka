'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase/server';
import { verifySessionCookie, ADMIN_COOKIE_NAME } from '@/lib/auth';

async function requireAdmin() {
  const store = await cookies();
  const cookie = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionCookie(cookie)) redirect('/admin/login');
}

export async function confirmPurchase(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const sb = supabaseServer();
  const { error } = await sb
    .from('purchases')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function resetPurchase(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const sb = supabaseServer();
  const { error: updErr } = await sb.from('numbers').update({ purchase_id: null } as never).eq('purchase_id', id);
  if (updErr) throw updErr;
  const { error: delErr } = await sb.from('purchases').delete().eq('id', id);
  if (delErr) throw delErr;
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function closeRaffle(formData: FormData) {
  await requireAdmin();
  const winning = Number(formData.get('winning_number'));
  if (!Number.isInteger(winning) || winning < 0 || winning > 99) {
    throw new Error('número ganador inválido');
  }
  const sb = supabaseServer();
  const { error } = await sb
    .from('raffle_state')
    .update({ winning_number: winning, closed_at: new Date().toISOString() } as never)
    .eq('id', 1);
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function reopenRaffle() {
  await requireAdmin();
  const sb = supabaseServer();
  const { error } = await sb
    .from('raffle_state')
    .update({ winning_number: null, closed_at: null } as never)
    .eq('id', 1);
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function logoutAdmin() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  redirect('/admin/login');
}
