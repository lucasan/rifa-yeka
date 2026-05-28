import { NextResponse } from 'next/server';
import { reserve } from '@/lib/reserve';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { name, phone, numbers } = (body ?? {}) as { name?: string; phone?: string; numbers?: number[] };
  if (typeof name !== 'string' || typeof phone !== 'string' || !Array.isArray(numbers)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const result = await reserve({ name, phone, numbers });

  if (result.ok) {
    return NextResponse.json({ purchaseId: result.purchaseId });
  }
  if (result.reason === 'taken') {
    return NextResponse.json({ error: 'taken', takenNumbers: result.takenNumbers }, { status: 409 });
  }
  if (result.reason === 'raffle_closed') {
    return NextResponse.json({ error: 'raffle_closed' }, { status: 410 });
  }
  return NextResponse.json({ error: 'validation', message: result.message }, { status: 400 });
}
