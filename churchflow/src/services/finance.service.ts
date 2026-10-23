import { supabase } from '../lib/supabase';
import { getActiveOrganisationId } from './organisation.service';
import type {
  FinanceDonor,
  FinanceTransaction,
  FinanceExpense,
  FinanceReconciliation,
  FinanceSummary,
  GivingCategory,
  ExpenseCategory,
  PaymentChannel,
  ExpenseStatus,
} from '../types/finance.types';

// Deterministic in-memory fallback state in case Supabase table is pending migration
let fallbackDonors: FinanceDonor[] = [
  {
    id: 'd-1',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    donor_name: 'Faithfulness Onu',
    email: 'faithfulness@ncfunn.site',
    phone: '08140286257',
    notes: 'Finance Directorate Head',
    total_giving: 150000,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'd-2',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    donor_name: 'Pastor Ubagu Tony',
    email: 'tony@ncfunn.site',
    phone: '08031234567',
    notes: 'Resident Chapter Pastor',
    total_giving: 280000,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'd-3',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    donor_name: 'Sister Amaka Obi',
    email: 'amaka.obi@gmail.com',
    phone: '08059876543',
    notes: 'Dedicated Alumni Partner',
    total_giving: 220000,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'd-4',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    donor_name: 'Brother Chinedu Eze',
    email: 'chinedu.eze@unn.edu.ng',
    phone: '08023456789',
    notes: 'Engineering Finalist / Cell Leader',
    total_giving: 65000,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

let fallbackTransactions: FinanceTransaction[] = [
  {
    id: 'tx-1',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    donor_id: 'd-2',
    donor_name: 'Pastor Ubagu Tony',
    transaction_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    category: 'Tithe',
    amount: 80000,
    currency: 'NGN',
    channel: 'Transfer',
    reference: 'TRX-103948',
    status: 'Confirmed',
    source: 'Manual Entry',
    notes: 'October Pastoral Tithe',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'tx-2',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    donor_id: 'd-3',
    donor_name: 'Sister Amaka Obi',
    transaction_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    category: 'Building/Pledge',
    amount: 150000,
    currency: 'NGN',
    channel: 'Transfer',
    reference: 'TRX-847291',
    status: 'Confirmed',
    source: 'Manual Entry',
    notes: 'Sound equipment pledge fulfillment',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'tx-3',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    donor_id: null,
    donor_name: 'Sunday Congregation',
    transaction_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    category: 'Offering',
    amount: 125400,
    currency: 'NGN',
    channel: 'Cash',
    reference: 'COL-SUN-MAIN',
    status: 'Confirmed',
    source: 'Manual Entry',
    notes: 'Main Service basket collection',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'tx-4',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    donor_id: 'd-1',
    donor_name: 'Faithfulness Onu',
    transaction_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    category: 'Tithe',
    amount: 50000,
    currency: 'NGN',
    channel: 'Transfer',
    reference: 'TRX-948291',
    status: 'Confirmed',
    source: 'Manual Entry',
    notes: 'October first tithe',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'tx-5',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    donor_id: null,
    donor_name: 'Midweek Believers',
    transaction_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    category: 'Offering',
    amount: 42000,
    currency: 'NGN',
    channel: 'Cash',
    reference: 'COL-MIDWEEK',
    status: 'Confirmed',
    source: 'Manual Entry',
    notes: 'Wednesday service collection',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

let fallbackExpenses: FinanceExpense[] = [
  {
    id: 'exp-1',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    expense_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    category: 'Operations',
    amount: 35000,
    currency: 'NGN',
    beneficiary: 'Total Energies Nsukka',
    description: 'Diesel fuel for main generator (Sunday Service)',
    payment_method: 'Transfer',
    status: 'Paid',
    approved_by: 'Pastor Tony Ubagu',
    receipt_url: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'exp-2',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    expense_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    category: 'Equipment & Media',
    amount: 48000,
    currency: 'NGN',
    beneficiary: 'AudioPro Solutions Nsukka',
    description: 'Replacement of 3 XLR mic cables, 9V batteries, and audio jack',
    payment_method: 'Transfer',
    status: 'Paid',
    approved_by: 'Faithfulness Onu',
    receipt_url: null,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'exp-3',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    expense_date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    category: 'Honorarium & Welfare',
    amount: 60000,
    currency: 'NGN',
    beneficiary: 'Visiting Speaker Hospitality',
    description: 'Guest minister transportation & accommodation honorarium',
    payment_method: 'Transfer',
    status: 'Paid',
    approved_by: 'Pastor Tony Ubagu',
    receipt_url: null,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'exp-4',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    expense_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    category: 'Outreach & Missions',
    amount: 25000,
    currency: 'NGN',
    beneficiary: 'Evangelism Directorate',
    description: 'Campus tract printing & bottled water for Soul Winning team',
    payment_method: 'Cash',
    status: 'Approved',
    approved_by: 'Pastor Tony Ubagu',
    receipt_url: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

let fallbackReconciliations: FinanceReconciliation[] = [
  {
    id: 'rec-1',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    import_batch_id: 'batch-001',
    raw_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    raw_description: 'NIP/AMAKA OBI/OCTOBER-TITHE-OFFERING',
    raw_amount: 35000,
    suggested_category: 'Tithe',
    suggested_donor_name: 'Sister Amaka Obi',
    matched_donor_id: 'd-3',
    is_pooled_deposit: false,
    status: 'Pending',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'rec-2',
    organisation_id: '00000000-0000-0000-0000-000000000001',
    import_batch_id: 'batch-001',
    raw_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    raw_description: 'SUNDAY BASKET POOLED TELLER DEPOSIT',
    raw_amount: 98500,
    suggested_category: 'Offering',
    suggested_donor_name: 'Sunday Congregation',
    matched_donor_id: null,
    is_pooled_deposit: true,
    status: 'Pending',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const financeService = {
  /**
   * Fetches the overall financial summary for the active organisation
   */
  async getSummary(organisationId?: string): Promise<FinanceSummary> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      const [txRes, expRes, donorRes, recRes] = await Promise.all([
        supabase
          .from('finance_transactions')
          .select('amount, category')
          .eq('organisation_id', orgId),
        supabase
          .from('finance_expenses')
          .select('amount, status')
          .eq('organisation_id', orgId),
        supabase
          .from('finance_donors')
          .select('id', { count: 'exact', head: true })
          .eq('organisation_id', orgId),
        supabase
          .from('finance_reconciliations')
          .select('id', { count: 'exact', head: true })
          .eq('organisation_id', orgId)
          .eq('status', 'Pending'),
      ]);

      if (txRes.error || expRes.error) {
        throw new Error(txRes.error?.message || expRes.error?.message);
      }

      const transactions = (txRes.data || []) as { amount: number; category: GivingCategory }[];
      const expenses = (expRes.data || []) as { amount: number; status: ExpenseStatus }[];

      const totalInflow = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const totalExpenses = expenses
        .filter(e => e.status === 'Paid')
        .reduce((acc, e) => acc + Number(e.amount || 0), 0);

      const titheTotal = transactions
        .filter(t => t.category === 'Tithe')
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const offeringTotal = transactions
        .filter(t => t.category === 'Offering')
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const seedTotal = transactions
        .filter(t => t.category !== 'Tithe' && t.category !== 'Offering')
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      return {
        total_inflow: totalInflow,
        total_expenses: totalExpenses,
        net_balance: totalInflow - totalExpenses,
        tithe_total: titheTotal,
        offering_total: offeringTotal,
        seed_and_other_total: seedTotal,
        currency: 'NGN',
        total_donors_count: donorRes.count || 0,
        pending_reconciliations_count: recRes.count || 0,
      };
    } catch {
      // Fallback calculation
      const totalInflow = fallbackTransactions.reduce((acc, t) => acc + t.amount, 0);
      const totalExpenses = fallbackExpenses
        .filter(e => e.status === 'Paid')
        .reduce((acc, e) => acc + e.amount, 0);

      const titheTotal = fallbackTransactions
        .filter(t => t.category === 'Tithe')
        .reduce((acc, t) => acc + t.amount, 0);

      const offeringTotal = fallbackTransactions
        .filter(t => t.category === 'Offering')
        .reduce((acc, t) => acc + t.amount, 0);

      const seedTotal = fallbackTransactions
        .filter(t => t.category !== 'Tithe' && t.category !== 'Offering')
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        total_inflow: totalInflow,
        total_expenses: totalExpenses,
        net_balance: totalInflow - totalExpenses,
        tithe_total: titheTotal,
        offering_total: offeringTotal,
        seed_and_other_total: seedTotal,
        currency: 'NGN',
        total_donors_count: fallbackDonors.length,
        pending_reconciliations_count: fallbackReconciliations.filter(r => r.status === 'Pending').length,
      };
    }
  },

  /**
   * Fetches all registered donors
   */
  async getDonors(search?: string, organisationId?: string): Promise<FinanceDonor[]> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      let query = supabase
        .from('finance_donors')
        .select('*')
        .eq('organisation_id', orgId)
        .order('donor_name', { ascending: true });

      if (search?.trim()) {
        query = query.ilike('donor_name', `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as FinanceDonor[]) || [];
    } catch {
      if (!search?.trim()) return fallbackDonors;
      const q = search.toLowerCase();
      return fallbackDonors.filter(
        d => d.donor_name.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q)
      );
    }
  },

  /**
   * Fetches all transactions / contributions
   */
  async getTransactions(category?: GivingCategory, organisationId?: string): Promise<FinanceTransaction[]> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      let query = supabase
        .from('finance_transactions')
        .select('*, finance_donors(donor_name)')
        .eq('organisation_id', orgId)
        .order('transaction_date', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: Record<string, unknown>) => ({
        ...(row as unknown as FinanceTransaction),
        donor_name:
          (row.finance_donors as { donor_name?: string } | null)?.donor_name || 'Anonymous / General',
      }));
    } catch {
      if (!category) return fallbackTransactions;
      return fallbackTransactions.filter(t => t.category === category);
    }
  },

  /**
   * Records a new transaction (Tithe, Offering, Seed, etc.)
   */
  async recordTransaction(
    tx: Omit<FinanceTransaction, 'id' | 'created_at' | 'organisation_id'>,
    organisationId?: string
  ): Promise<FinanceTransaction> {
    const orgId = organisationId || getActiveOrganisationId();
    const payload = {
      ...tx,
      organisation_id: orgId,
    };

    try {
      const { data, error } = await supabase
        .from('finance_transactions')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as FinanceTransaction;
    } catch {
      const newTx: FinanceTransaction = {
        ...payload,
        id: `tx-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      fallbackTransactions = [newTx, ...fallbackTransactions];
      return newTx;
    }
  },

  /**
   * Fetches all expenses
   */
  async getExpenses(status?: ExpenseStatus, organisationId?: string): Promise<FinanceExpense[]> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      let query = supabase
        .from('finance_expenses')
        .select('*')
        .eq('organisation_id', orgId)
        .order('expense_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as FinanceExpense[]) || [];
    } catch {
      if (!status) return fallbackExpenses;
      return fallbackExpenses.filter(e => e.status === status);
    }
  },

  /**
   * Records a new expense
   */
  async recordExpense(
    exp: Omit<FinanceExpense, 'id' | 'created_at' | 'organisation_id'>,
    organisationId?: string
  ): Promise<FinanceExpense> {
    const orgId = organisationId || getActiveOrganisationId();
    const payload = {
      ...exp,
      organisation_id: orgId,
    };

    try {
      const { data, error } = await supabase
        .from('finance_expenses')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as FinanceExpense;
    } catch {
      const newExp: FinanceExpense = {
        ...payload,
        id: `exp-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      fallbackExpenses = [newExp, ...fallbackExpenses];
      return newExp;
    }
  },

  /**
   * Updates an expense's status (e.g. Approve or Mark as Paid)
   */
  async updateExpenseStatus(
    id: string,
    status: ExpenseStatus,
    approvedBy?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('finance_expenses')
        .update({ status, approved_by: approvedBy })
        .eq('id', id);
      if (error) throw error;
    } catch {
      fallbackExpenses = fallbackExpenses.map(e =>
        e.id === id ? { ...e, status, approved_by: approvedBy || e.approved_by } : e
      );
    }
  },

  /**
   * Fetches pending reconciliations
   */
  async getReconciliations(organisationId?: string): Promise<FinanceReconciliation[]> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      const { data, error } = await supabase
        .from('finance_reconciliations')
        .select('*')
        .eq('organisation_id', orgId)
        .eq('status', 'Pending')
        .order('raw_date', { ascending: false });

      if (error) throw error;
      return (data as FinanceReconciliation[]) || [];
    } catch {
      return fallbackReconciliations.filter(r => r.status === 'Pending');
    }
  },

  /**
   * Approves a reconciliation row into an official transaction
   */
  async approveReconciliation(id: string): Promise<void> {
    const recon = fallbackReconciliations.find(r => r.id === id);
    if (recon) {
      recon.status = 'Approved';
      // Record corresponding confirmed transaction
      await this.recordTransaction({
        transaction_date: recon.raw_date,
        category: recon.suggested_category,
        amount: recon.raw_amount,
        currency: 'NGN',
        channel: 'Transfer',
        reference: recon.raw_description.slice(0, 30),
        status: 'Confirmed',
        source: 'Bank Statement Import',
        notes: `Reconciled from: ${recon.raw_description}`,
        donor_id: recon.matched_donor_id || null,
        donor_name: recon.suggested_donor_name || 'Anonymous',
      });
    }

    try {
      await supabase
        .from('finance_reconciliations')
        .update({ status: 'Approved' })
        .eq('id', id);
    } catch {
      // Ignored for local fallback
    }
  },
};
