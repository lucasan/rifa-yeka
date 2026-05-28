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
  id: 1;
  winning_number: number | null;
  closed_at: string | null;
};

export type GridCell = {
  n: number;
  purchase_id: string | null;
  buyer_name: string | null;
};
