import { createClient } from '@supabase/supabase-js';
import { requireServerEnv } from '@/lib/constants';
import type { Purchase, NumberRow, RaffleState } from './types';

export type Database = {
  public: {
    Tables: {
      purchases: { Row: Purchase; Insert: Omit<Purchase, 'id' | 'created_at' | 'confirmed_at' | 'status'> & { status?: 'pending' | 'confirmed' }; Update: Partial<Purchase> };
      numbers: { Row: NumberRow; Insert: NumberRow; Update: Partial<NumberRow> };
      raffle_state: { Row: RaffleState; Insert: Partial<RaffleState> & { id: number }; Update: Partial<RaffleState> };
    };
  };
};

export function supabaseServer() {
  return createClient<Database>(
    requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
