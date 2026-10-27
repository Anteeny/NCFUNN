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
  ExpenseStatus,
} from '../types/finance.types';

export interface GoogleSheetConfig {
  url: string;
  sheetId: string;
  sheetName?: string;
  lastSyncedAt?: string;
  rowCount?: number;
}

// In-memory state (NO DUMMY DATA — completely empty until connected or recorded)
let fallbackDonors: FinanceDonor[] = [];
let fallbackTransactions: FinanceTransaction[] = [];
let fallbackExpenses: FinanceExpense[] = [];
let fallbackReconciliations: FinanceReconciliation[] = [];

// Storage keys
const GSHEET_STORAGE_KEY = 'churchflow_finance_gsheet_config';
const TRANSACTIONS_STORAGE_KEY = 'churchflow_finance_transactions';
const EXPENSES_STORAGE_KEY = 'churchflow_finance_expenses';
const DONORS_STORAGE_KEY = 'churchflow_finance_donors';

// Load any previously synced records from local cache
function loadLocalCache() {
  try {
    const cachedTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (cachedTx) fallbackTransactions = JSON.parse(cachedTx);

    const cachedExp = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (cachedExp) fallbackExpenses = JSON.parse(cachedExp);

    const cachedDon = localStorage.getItem(DONORS_STORAGE_KEY);
    if (cachedDon) fallbackDonors = JSON.parse(cachedDon);
  } catch (e) {
    console.warn('Could not load local finance cache:', e);
  }
}

loadLocalCache();

function saveLocalCache() {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(fallbackTransactions));
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(fallbackExpenses));
    localStorage.setItem(DONORS_STORAGE_KEY, JSON.stringify(fallbackDonors));
  } catch (e) {
    console.warn('Could not save local finance cache:', e);
  }
}

// Helper to extract Google Sheet ID from URL
export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Simple CSV parser that handles quotes and commas
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim().replace(/^"|"$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^"|"$/g, ''));
    return row;
  });
}

export const financeService = {
  /**
   * Retrieves the current Google Sheet configuration
   */
  getGoogleSheetConfig(): GoogleSheetConfig | null {
    try {
      const saved = localStorage.getItem(GSHEET_STORAGE_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },

  /**
   * Saves the Google Sheet URL configuration
   */
  saveGoogleSheetConfig(url: string, sheetName?: string): GoogleSheetConfig {
    const sheetId = extractSheetId(url);
    if (!sheetId) {
      throw new Error('Invalid Google Sheet URL. Please provide a valid Google Sheets link.');
    }

    const cfg: GoogleSheetConfig = {
      url: url.trim(),
      sheetId,
      sheetName: sheetName?.trim() || undefined,
      lastSyncedAt: new Date().toISOString(),
      rowCount: 0,
    };

    localStorage.setItem(GSHEET_STORAGE_KEY, JSON.stringify(cfg));
    return cfg;
  },

  /**
   * Syncs real finance records from the connected Google Sheet
   */
  async syncFromGoogleSheet(urlOverride?: string): Promise<{ transactions: number; expenses: number; totalRows: number }> {
    const cfg = urlOverride ? this.saveGoogleSheetConfig(urlOverride) : this.getGoogleSheetConfig();
    if (!cfg || !cfg.sheetId) {
      throw new Error('No Google Sheet connected. Please enter your Google Sheet link first.');
    }

    const exportUrl = `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:csv${
      cfg.sheetName ? '&sheet=' + encodeURIComponent(cfg.sheetName) : ''
    }`;

    const res = await fetch(exportUrl);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch Google Sheet (${res.status} ${res.statusText}). Make sure the Google Sheet sharing setting is set to "Anyone with the link can view".`
      );
    }

    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      throw new Error('Google Sheet returned no data rows. Please ensure your sheet has headers and rows.');
    }

    const headers = rows[0].map(h => h.toLowerCase());
    
    // Find column indexes flexibly
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('item') || h.includes('narration') || h.includes('particular') || h.includes('purpose') || h.includes('donor') || h.includes('beneficiary'));
    const catIdx = headers.findIndex(h => h.includes('cat') || h.includes('type'));
    const inflowIdx = headers.findIndex(h => h.includes('inflow') || h.includes('income') || h.includes('credit') || h.includes('giving') || h.includes('tithe') || h.includes('offering'));
    const outflowIdx = headers.findIndex(h => h.includes('outflow') || h.includes('expense') || h.includes('debit') || h.includes('disbursement'));
    const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('total') || h.includes('value'));

    const parsedTransactions: FinanceTransaction[] = [];
    const parsedExpenses: FinanceExpense[] = [];
    const donorSet = new Map<string, number>();

    const orgId = getActiveOrganisationId();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawDate = dateIdx >= 0 && row[dateIdx] ? row[dateIdx] : new Date().toISOString().split('T')[0];
      const rawDesc = descIdx >= 0 && row[descIdx] ? row[descIdx] : 'Ledger Entry';
      const rawCat = catIdx >= 0 && row[catIdx] ? row[catIdx] : '';

      // Check Inflow
      let inflowVal = 0;
      if (inflowIdx >= 0 && row[inflowIdx]) {
        inflowVal = parseFloat(row[inflowIdx].replace(/[^0-9.-]+/g, '')) || 0;
      }

      // Check Outflow
      let outflowVal = 0;
      if (outflowIdx >= 0 && row[outflowIdx]) {
        outflowVal = parseFloat(row[outflowIdx].replace(/[^0-9.-]+/g, '')) || 0;
      }

      // Single Amount Column fallback
      if (inflowVal === 0 && outflowVal === 0 && amountIdx >= 0 && row[amountIdx]) {
        const val = parseFloat(row[amountIdx].replace(/[^0-9.-]+/g, '')) || 0;
        const lowDesc = (rawDesc + ' ' + rawCat).toLowerCase();
        if (
          lowDesc.includes('expense') ||
          lowDesc.includes('fuel') ||
          lowDesc.includes('paid') ||
          lowDesc.includes('purchase') ||
          lowDesc.includes('honorarium')
        ) {
          outflowVal = Math.abs(val);
        } else {
          inflowVal = Math.abs(val);
        }
      }

      // Process Inflow -> Transaction
      if (inflowVal > 0) {
        const lowDesc = (rawDesc + ' ' + rawCat).toLowerCase();
        let cat: GivingCategory = 'Offering';
        if (lowDesc.includes('tithe')) cat = 'Tithe';
        else if (lowDesc.includes('pledge') || lowDesc.includes('building')) cat = 'Building/Pledge';
        else if (lowDesc.includes('seed')) cat = 'Seed';
        else if (lowDesc.includes('thanksgiving')) cat = 'Thanksgiving';

        parsedTransactions.push({
          id: `gs-tx-${i}`,
          organisation_id: orgId,
          donor_name: rawDesc,
          transaction_date: rawDate,
          category: cat,
          amount: inflowVal,
          currency: 'NGN',
          channel: 'Transfer',
          reference: `GS-${i}`,
          status: 'Confirmed',
          source: 'Google Sheet Sync',
          notes: rawCat || 'Imported from Google Sheet',
          created_at: new Date().toISOString(),
        });

        donorSet.set(rawDesc, (donorSet.get(rawDesc) || 0) + inflowVal);
      }

      // Process Outflow -> Expense
      if (outflowVal > 0) {
        const lowDesc = (rawDesc + ' ' + rawCat).toLowerCase();
        let cat: ExpenseCategory = 'Operations';
        if (lowDesc.includes('mission') || lowDesc.includes('outreach')) cat = 'Outreach & Missions';
        else if (lowDesc.includes('honorarium') || lowDesc.includes('welfare') || lowDesc.includes('pastor')) cat = 'Honorarium & Welfare';
        else if (lowDesc.includes('media') || lowDesc.includes('sound') || lowDesc.includes('equipment')) cat = 'Equipment & Media';
        else if (lowDesc.includes('logistics') || lowDesc.includes('transport')) cat = 'Logistics';
        else if (lowDesc.includes('power') || lowDesc.includes('light') || lowDesc.includes('bill')) cat = 'Utilities';

        parsedExpenses.push({
          id: `gs-exp-${i}`,
          organisation_id: orgId,
          expense_date: rawDate,
          category: cat,
          amount: outflowVal,
          currency: 'NGN',
          beneficiary: rawDesc,
          description: rawCat ? `${rawCat} - ${rawDesc}` : rawDesc,
          payment_method: 'Transfer',
          status: 'Paid',
          approved_by: 'Finance Committee',
          created_at: new Date().toISOString(),
        });
      }
    }

    // Build unique donors
    const parsedDonors: FinanceDonor[] = Array.from(donorSet.entries()).map(([name, total], idx) => ({
      id: `gs-d-${idx}`,
      organisation_id: orgId,
      donor_name: name,
      total_giving: total,
      created_at: new Date().toISOString(),
    }));

    // Update in-memory state and cache
    fallbackTransactions = parsedTransactions;
    fallbackExpenses = parsedExpenses;
    fallbackDonors = parsedDonors;
    saveLocalCache();

    // Update config
    cfg.lastSyncedAt = new Date().toISOString();
    cfg.rowCount = rows.length - 1;
    localStorage.setItem(GSHEET_STORAGE_KEY, JSON.stringify(cfg));

    return {
      transactions: parsedTransactions.length,
      expenses: parsedExpenses.length,
      totalRows: rows.length - 1,
    };
  },

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

      if (txRes.error || expRes.error || !txRes.data || !expRes.data) {
        throw new Error(txRes.error?.message || expRes.error?.message || 'No DB table');
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
      // Local state from Google Sheet sync or manual entries
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
      saveLocalCache();
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
      saveLocalCache();
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
      saveLocalCache();
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
      saveLocalCache();
    }

    try {
      await supabase
        .from('finance_reconciliations')
        .update({ status: 'Approved' })
        .eq('id', id);
    } catch {
      // Handled in local cache
    }
  },
};
