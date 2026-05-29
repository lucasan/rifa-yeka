import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function resetDb() {
  await sb.from('numbers').update({ purchase_id: null }).neq('n', -1);
  await sb.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('raffle_state').update({ winning_number: null, closed_at: null }).eq('id', 1);
}
