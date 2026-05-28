export type PurchaseStatus = 'pending' | 'confirmed';

export type Purchase = {
  id: string;
  name: string;
  phone: string;
  status: PurchaseStatus;
  created_at: string;
  confirmed_at: string | null;
};

export type NumberRow = {
  n: number;
  purchase_id: string | null;
};

export type RaffleState = {
  // CHECK constraint in the DB enforces id = 1. We use `number` here (not the
  // literal `1`) so Supabase's typed `.eq('id', 1)` filter doesn't narrow to `never`.
  id: number;
  winning_number: number | null;
  closed_at: string | null;
};

export type GridCell = {
  n: number;
  purchase_id: string | null;
  buyer_name: string | null;
};
