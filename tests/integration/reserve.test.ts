import { reserve } from '@/lib/reserve';
import { supabaseServer } from '@/lib/supabase/server';

async function resetDb() {
  const sb = supabaseServer();
  await sb.from('numbers').update({ purchase_id: null } as never).neq('n', -1);
  await sb.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('raffle_state').update({ winning_number: null, closed_at: null } as never).eq('id', 1);
}

describe('reserve (integration)', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  it('reserves 5 numbers happily', async () => {
    const result = await reserve({ name: 'Ana', phone: '3001234567', numbers: [1, 2, 3, 4, 5] });
    expect(result.ok).toBe(true);
  });

  it('rejects when numbers are already taken', async () => {
    await reserve({ name: 'Ana', phone: '3001234567', numbers: [10, 11, 12, 13, 14] });
    const result = await reserve({ name: 'Bea', phone: '3009999999', numbers: [10, 20, 30, 40, 50] });
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'taken') {
      expect(result.takenNumbers).toContain(10);
    }
  });

  it('only one of two concurrent reservations on the same numbers succeeds', async () => {
    const nums = [70, 71, 72, 73, 74];
    const [a, b] = await Promise.all([
      reserve({ name: 'Ana', phone: '3001111111', numbers: nums }),
      reserve({ name: 'Bea', phone: '3002222222', numbers: nums }),
    ]);
    const oks = [a, b].filter((r) => r.ok).length;
    expect(oks).toBe(1);
  });

  it('blocks reservations after raffle is closed', async () => {
    const sb = supabaseServer();
    await sb.from('raffle_state').update({ winning_number: 42 } as never).eq('id', 1);
    const result = await reserve({ name: 'Late', phone: '3003333333', numbers: [80, 81, 82, 83, 84] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('raffle_closed');
  });
});
