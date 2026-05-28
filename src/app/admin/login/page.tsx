import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { buildSessionCookie } from '@/lib/auth';
import { requireServerEnv } from '@/lib/constants';

async function login(formData: FormData) {
  'use server';
  const password = String(formData.get('password') ?? '');
  if (password !== requireServerEnv('ADMIN_PASSWORD')) {
    redirect('/admin/login?error=1');
  }
  const { name, value, maxAge } = buildSessionCookie();
  const store = await cookies();
  store.set(name, value, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge, path: '/' });
  redirect('/admin');
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="max-w-sm mx-auto p-6 mt-12 bg-white rounded-2xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-center">Admin — Rifa de Yeka</h1>
      <form action={login} className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold">Contraseña</span>
          <input
            type="password"
            name="password"
            autoFocus
            required
            className="mt-1 block w-full rounded-md border border-purple-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-red-600 text-sm">Contraseña incorrecta.</p>}
        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl">
          Entrar
        </button>
      </form>
    </main>
  );
}
