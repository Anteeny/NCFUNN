export type GivingCategory =
  | 'Tithe'
  | 'Offering'
  | 'Thanksgiving'
  | 'Seed'
  | 'Building/Pledge'
  | 'Other';

export type ExpenseCategory =
  | 'Operations'
  | 'Outreach & Missions'
  | 'Honorarium & Welfare'
  | 'Equipment & Media'
  | 'Logistics'
  | 'Utilities'
  | 'Other';

export type PaymentChannel = 'Transfer' | 'Cash' | 'POS' | 'Cheque' | 'Online';

export type ExpenseStatus = 'Requested' | 'Approved' | 'Paid' | 'Rejected';

export interface FinanceDonor {
  id: string;
  organisation_id: string;
  member_id?: string | null;
  donor_name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  total_giving?: number;
  created_at: string;
}

export interface FinanceTransaction {
  id: string;
  organisation_id: string;
  donor_id?: string | null;
  donor_name?: string;
  transaction_date: string;
  category: GivingCategory;
  amount: number;
  currency: string;
  channel: PaymentChannel;
  reference?: string | null;
  status: 'Confirmed' | 'Pending Reconciliation' | 'Flagged';
  source: 'Manual Entry' | 'Bank Statement Import' | 'Google Sheet Sync';
  notes?: string | null;
  created_at: string;
}

export interface FinanceExpense {
  id: string;
  organisation_id: string;
  expense_date: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  beneficiary: string;
  description: string;
  payment_method: PaymentChannel;
  status: ExpenseStatus;
  approved_by?: string | null;
  receipt_url?: string | null;
  created_at: string;
}

export interface FinanceReconciliation {
  id: string;
  organisation_id: string;
  import_batch_id: string;
  raw_date: string;
  raw_description: string;
  raw_amount: number;
  suggested_category: GivingCategory;
  suggested_donor_name?: string | null;
  matched_donor_id?: string | null;
  is_pooled_deposit: boolean;
  status: 'Pending' | 'Approved' | 'Discarded';
  created_at: string;
}

export interface FinanceSummary {
  total_inflow: number;
  total_expenses: number;
  net_balance: number;
  tithe_total: number;
  offering_total: number;
  seed_and_other_total: number;
  currency: string;
  total_donors_count: number;
  pending_reconciliations_count: number;
}
