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
  PaymentChannel,
} from '../types/finance.types';

export const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1dWdZfNeAhbXkVdnlR0sYXsrxxcC1YgN4pAfoTMjfsS0/edit?usp=sharing';

export interface GoogleSheetConfig {
  url: string;
  sheetId: string;
  sheetName?: string;
  availableSheets?: string[];
  lastSyncedAt?: string;
  rowCount?: number;
}

// In-memory state (NO DUMMY DATA)
let fallbackDonors: FinanceDonor[] = [];
let fallbackTransactions: FinanceTransaction[] = [];
let fallbackExpenses: FinanceExpense[] = [];
let fallbackReconciliations: FinanceReconciliation[] = [];

// Storage keys
const GSHEET_STORAGE_KEY = 'churchflow_finance_gsheet_config';
const TRANSACTIONS_STORAGE_KEY = 'churchflow_finance_transactions';
const EXPENSES_STORAGE_KEY = 'churchflow_finance_expenses';
const DONORS_STORAGE_KEY = 'churchflow_finance_donors';

// Month map for dates and sorting
const MONTH_INDEX: Record<string, number> = {
  JANUARY: 1,
  FEBRUARY: 2,
  MARCH: 3,
  APRIL: 4,
  MAY: 5,
  JUNE: 6,
  JULY: 7,
  AUGUST: 8,
  SEPTEMBER: 9,
  OCTOBER: 10,
  NOVEMBER: 11,
  DECEMBER: 12,
};

// Load previously synced records from local cache
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

// Clean numerical currency amount from string
function cleanAmount(val: string | number | undefined | null): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
}

// RFC-compliant CSV line parser handling quotes
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

// Helper to check if a record matches a selected month
function recordMatchesMonth(dateStr: string, notes: string | null | undefined, month: string): boolean {
  if (!month || month === 'ALL') return true;
  const mIndex = MONTH_INDEX[month.toUpperCase()];
  if (mIndex) {
    const padM = String(mIndex).padStart(2, '0');
    if (dateStr.includes(`-${padM}-`)) return true;
  }
  if (notes && notes.toUpperCase().includes(month.toUpperCase())) return true;
  return false;
}

export const financeService = {
  /**
   * Retrieves the current Google Sheet configuration (defaults to church sheet if unset)
   */
  getGoogleSheetConfig(): GoogleSheetConfig {
    try {
      const saved = localStorage.getItem(GSHEET_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }

    const defaultId = extractSheetId(DEFAULT_SHEET_URL) || '1dWdZfNeAhbXkVdnlR0sYXsrxxcC1YgN4pAfoTMjfsS0';
    return {
      url: DEFAULT_SHEET_URL,
      sheetId: defaultId,
      sheetName: 'ALL',
      availableSheets: ['ALL', 'JUNE', 'MAY', 'APRIL', 'MARCH', 'FEBRUARY', 'JANUARY'],
      rowCount: fallbackTransactions.length + fallbackExpenses.length,
    };
  },

  /**
   * Returns discovered months available from the sheet
   */
  getAvailableSheetMonths(): string[] {
    const cfg = this.getGoogleSheetConfig();
    if (cfg?.availableSheets && cfg.availableSheets.length > 0) {
      return cfg.availableSheets;
    }
    return ['ALL', 'JUNE', 'MAY', 'APRIL', 'MARCH', 'FEBRUARY', 'JANUARY'];
  },

  /**
   * Saves the Google Sheet URL configuration
   */
  saveGoogleSheetConfig(url: string, sheetName?: string): GoogleSheetConfig {
    const sheetId = extractSheetId(url);
    if (!sheetId) {
      throw new Error('Invalid Google Sheet URL. Please provide a valid Google Sheets link.');
    }

    const prev = this.getGoogleSheetConfig();
    const cfg: GoogleSheetConfig = {
      url: url.trim(),
      sheetId,
      sheetName: sheetName?.trim() || prev.sheetName || 'ALL',
      availableSheets: prev.availableSheets || ['ALL', 'JUNE', 'MAY', 'APRIL', 'MARCH', 'FEBRUARY', 'JANUARY'],
      lastSyncedAt: new Date().toISOString(),
      rowCount: fallbackTransactions.length + fallbackExpenses.length,
    };

    localStorage.setItem(GSHEET_STORAGE_KEY, JSON.stringify(cfg));
    return cfg;
  },

  /**
   * Syncs real finance records from the connected Google Sheet across monthly tabs
   */
  async syncFromGoogleSheet(
    urlOverride?: string
  ): Promise<{ transactions: number; expenses: number; totalRows: number; months: string[] }> {
    const cfg = urlOverride ? this.saveGoogleSheetConfig(urlOverride) : this.getGoogleSheetConfig();
    if (!cfg || !cfg.sheetId) {
      throw new Error('No Google Sheet connected. Please enter your Google Sheet link first.');
    }

    const orgId = getActiveOrganisationId();
    const sheetId = cfg.sheetId;

    // 1. Fetch default sheet to test against and parse
    const defaultUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    const defaultRes = await fetch(defaultUrl);
    if (!defaultRes.ok) {
      throw new Error(
        `Failed to fetch Google Sheet (${defaultRes.status} ${defaultRes.statusText}). Make sure the Google Sheet sharing setting is set to "Anyone with the link can view".`
      );
    }
    const defaultText = await defaultRes.text();

    // 2. Discover available monthly tabs
    const candidateMonths = [
      'JANUARY',
      'FEBRUARY',
      'MARCH',
      'APRIL',
      'MAY',
      'JUNE',
      'JULY',
      'AUGUST',
      'SEPTEMBER',
      'OCTOBER',
      'NOVEMBER',
      'DECEMBER',
      'FEB',
      'MAR',
      'APR',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];

    const discoveredTabs: { name: string; csv: string }[] = [];

    // Always inspect default sheet first
    discoveredTabs.push({ name: 'JANUARY', csv: defaultText });

    // Check other candidate months
    await Promise.all(
      candidateMonths.map(async m => {
        try {
          const tabUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(m)}`;
          const res = await fetch(tabUrl);
          if (res.ok) {
            const text = await res.text();
            // In Google Sheets, a non-existent sheet echoes the default first sheet exactly
            if (text !== defaultText && text.length > 50 && !text.includes('<!DOCTYPE html>')) {
              discoveredTabs.push({ name: m, csv: text });
            }
          }
        } catch {
          // ignore individual tab failure
        }
      })
    );

    // Sort tabs chronologically by month
    discoveredTabs.sort((a, b) => {
      const ma = MONTH_INDEX[a.name.toUpperCase()] || 0;
      const mb = MONTH_INDEX[b.name.toUpperCase()] || 0;
      return mb - ma; // Newest first
    });

    const parsedTransactions: FinanceTransaction[] = [];
    const parsedExpenses: FinanceExpense[] = [];
    const donorTotals = new Map<string, number>();

    const year = 2026;

    // 3. Parse each discovered tab
    for (const tab of discoveredTabs) {
      const cleanTab = tab.name.trim();
      const monthNum = MONTH_INDEX[cleanTab.toUpperCase()] || 1;
      const monthStr = String(monthNum).padStart(2, '0');
      const rows = parseCSV(tab.csv);

      if (rows.length === 0) continue;

      const firstRowStr = (rows[0] || []).join(' ').toLowerCase();

      // Check if this sheet is a Monthly Day Matrix (e.g. "INCOME Days" or has day columns)
      const isMatrix = firstRowStr.includes('income') || firstRowStr.includes('1st') || firstRowStr.includes('days');

      if (isMatrix) {
        // --- MATRIX PARSER ---
        let isExpenseSection = false;
        const dayColumns: Record<number, number> = {};

        // Populate standard 1..31 day map for columns
        for (let c = 1; c <= 31; c++) {
          dayColumns[c] = c;
        }

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0 || !row[0]) continue;
          const firstCell = row[0].trim();
          const firstUpper = firstCell.toUpperCase();

          if (firstUpper.includes('EXPENSES')) {
            isExpenseSection = true;
            continue;
          }

          if (firstUpper.includes('INCOME DAYS')) {
            for (let c = 1; c < row.length; c++) {
              const header = row[c].trim();
              const match = header.match(/^([0-9]{1,2})/);
              if (match) {
                dayColumns[c] = parseInt(match[1], 10);
              }
            }
            continue;
          }

          if (firstUpper === 'TOTAL' || firstUpper.startsWith('DAYS') || firstCell === '') {
            continue;
          }

          if (!isExpenseSection) {
            // INCOME ENTRY
            const categoryName = firstCell;
            let mappedCategory: GivingCategory = 'Offering';
            const low = categoryName.toLowerCase();

            if (low.includes('tithe') || low.includes('first fruit')) {
              mappedCategory = 'Tithe';
            } else if (low.includes('altar') || low.includes('seed') || low.includes('sacrifice')) {
              mappedCategory = 'Seed';
            } else if (low.includes('thanksgiving')) {
              mappedCategory = 'Thanksgiving';
            } else if (low.includes('building') || low.includes('pledge')) {
              mappedCategory = 'Building/Pledge';
            } else if (low.includes('zone')) {
              mappedCategory = 'Offering';
            }

            const channel: PaymentChannel = low.includes('cash') ? 'Cash' : 'Transfer';
            const donorName =
              low.includes('first fruit')
                ? 'First Fruit Contributors'
                : low.includes('tithe')
                ? 'NCF Tithers'
                : low.includes('altar')
                ? 'Altar Seed Partners'
                : low.includes('thanksgiving')
                ? 'Thanksgiving Worshippers'
                : low.includes('zone')
                ? 'Zones Fellowship'
                : 'Sunday Congregation';

            for (let c = 1; c < row.length; c++) {
              const dayNum = dayColumns[c];
              if (!dayNum || dayNum > 31) continue;
              const amt = cleanAmount(row[c]);
              if (amt > 0) {
                const dateStr = `${year}-${monthStr}-${String(dayNum).padStart(2, '0')}`;
                parsedTransactions.push({
                  id: `tx-matrix-${cleanTab}-${r}-${c}`,
                  organisation_id: orgId,
                  donor_name: donorName,
                  transaction_date: dateStr,
                  category: mappedCategory,
                  amount: amt,
                  currency: 'NGN',
                  channel,
                  reference: `GS-${cleanTab.slice(0, 3).toUpperCase()}-${String(dayNum).padStart(2, '0')}-${mappedCategory.toUpperCase().slice(0, 4)}`,
                  status: 'Confirmed',
                  source: 'Google Sheet Sync',
                  notes: `${cleanTab} ${dayNum}, ${year}: ${categoryName}`,
                  created_at: new Date().toISOString(),
                });

                donorTotals.set(donorName, (donorTotals.get(donorName) || 0) + amt);
              }
            }
          } else {
            // EXPENSE ENTRY
            const expenseName = firstCell;
            let mappedCategory: ExpenseCategory = 'Operations';
            const low = expenseName.toLowerCase();

            if (low.includes('honour') || low.includes('welfare') || low.includes('pastor')) {
              mappedCategory = 'Honorarium & Welfare';
            } else if (low.includes('town')) {
              mappedCategory = 'Outreach & Missions';
            } else if (low.includes('tcrew') || low.includes('sound') || low.includes('media') || low.includes('mic')) {
              mappedCategory = 'Equipment & Media';
            } else if (low.includes('bus') || low.includes('transport') || low.includes('fuel') || low.includes('logistics')) {
              mappedCategory = 'Logistics';
            } else if (low.includes('light') || low.includes('hall') || low.includes('power') || low.includes('nepa')) {
              mappedCategory = 'Utilities';
            } else if (low.includes('charge') || low.includes('30%')) {
              mappedCategory = 'Operations';
            }

            const beneficiary =
              low.includes('honour')
                ? 'Honourarium / Minister Support'
                : low.includes('brethren welfare')
                ? 'Brethren Welfare & Relief'
                : low.includes('pastor')
                ? 'Pastoral Care Allowance'
                : low.includes('tcrew')
                ? 'Technical Crew & Sound'
                : low.includes('town')
                ? 'Town Fellowship & Outreach'
                : low.includes('light')
                ? 'Electricity / Generator Light'
                : low.includes('hall')
                ? 'Church Hall Rent'
                : low.includes('bus')
                ? 'Transportation & Buses'
                : low.includes('charge')
                ? 'Bank Charges & Fees'
                : low.includes('30%')
                ? '30% Headquarters Remittance'
                : expenseName;

            for (let c = 1; c < row.length; c++) {
              const dayNum = dayColumns[c];
              if (!dayNum || dayNum > 31) continue;
              const amt = cleanAmount(row[c]);
              if (amt > 0) {
                const dateStr = `${year}-${monthStr}-${String(dayNum).padStart(2, '0')}`;
                parsedExpenses.push({
                  id: `exp-matrix-${cleanTab}-${r}-${c}`,
                  organisation_id: orgId,
                  expense_date: dateStr,
                  category: mappedCategory,
                  amount: amt,
                  currency: 'NGN',
                  beneficiary,
                  description: `${cleanTab} ${dayNum}, ${year}: ${expenseName} disbursement`,
                  payment_method: 'Transfer',
                  status: 'Paid',
                  approved_by: 'Finance Directorate',
                  created_at: new Date().toISOString(),
                });
              }
            }
          }
        }
      } else {
        // --- STANDARD FLAT LEDGER PARSER ---
        const headers = (rows[0] || []).map(h => h.toLowerCase());
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const descIdx = headers.findIndex(
          h => h.includes('desc') || h.includes('item') || h.includes('narration') || h.includes('particular')
        );
        const donorIdx = headers.findIndex(h => h.includes('donor') || h.includes('member') || h.includes('name'));
        const catIdx = headers.findIndex(h => h.includes('cat') || h.includes('type'));
        const inflowIdx = headers.findIndex(
          h => h.includes('inflow') || h.includes('income') || h.includes('credit') || h.includes('giving')
        );
        const outflowIdx = headers.findIndex(
          h => h.includes('outflow') || h.includes('expense') || h.includes('debit') || h.includes('disbursement')
        );
        const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('total') || h.includes('value'));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rawDate = dateIdx >= 0 && row[dateIdx] ? row[dateIdx] : `${year}-${monthStr}-01`;
          const rawDesc = descIdx >= 0 && row[descIdx] ? row[descIdx] : 'Church Ledger Item';
          const rawDonor = donorIdx >= 0 && row[donorIdx] ? row[donorIdx] : rawDesc;
          const rawCat = catIdx >= 0 && row[catIdx] ? row[catIdx] : '';

          let inflowVal = inflowIdx >= 0 ? cleanAmount(row[inflowIdx]) : 0;
          let outflowVal = outflowIdx >= 0 ? cleanAmount(row[outflowIdx]) : 0;

          if (inflowVal === 0 && outflowVal === 0 && amountIdx >= 0 && row[amountIdx]) {
            const val = cleanAmount(row[amountIdx]);
            const low = (rawDesc + ' ' + rawCat).toLowerCase();
            if (
              low.includes('expense') ||
              low.includes('fuel') ||
              low.includes('paid') ||
              low.includes('honorarium') ||
              low.includes('welfare') ||
              low.includes('light') ||
              low.includes('repair') ||
              low.includes('transport')
            ) {
              outflowVal = Math.abs(val);
            } else {
              inflowVal = Math.abs(val);
            }
          }

          if (inflowVal > 0) {
            const low = (rawDesc + ' ' + rawCat).toLowerCase();
            let cat: GivingCategory = 'Offering';
            if (low.includes('tithe') || low.includes('first fruit')) cat = 'Tithe';
            else if (low.includes('pledge') || low.includes('building')) cat = 'Building/Pledge';
            else if (low.includes('seed') || low.includes('altar')) cat = 'Seed';
            else if (low.includes('thanksgiving')) cat = 'Thanksgiving';

            parsedTransactions.push({
              id: `gs-tx-${cleanTab}-${i}`,
              organisation_id: orgId,
              donor_name: rawDonor,
              transaction_date: rawDate,
              category: cat,
              amount: inflowVal,
              currency: 'NGN',
              channel: 'Transfer',
              reference: `GS-${cleanTab.slice(0, 3)}-${i}`,
              status: 'Confirmed',
              source: 'Google Sheet Sync',
              notes: `${cleanTab}: ${rawDesc}`,
              created_at: new Date().toISOString(),
            });

            donorTotals.set(rawDonor, (donorTotals.get(rawDonor) || 0) + inflowVal);
          }

          if (outflowVal > 0) {
            const low = (rawDesc + ' ' + rawCat).toLowerCase();
            let cat: ExpenseCategory = 'Operations';
            if (low.includes('mission') || low.includes('outreach') || low.includes('town')) cat = 'Outreach & Missions';
            else if (low.includes('honorarium') || low.includes('welfare') || low.includes('pastor') || low.includes('honour')) cat = 'Honorarium & Welfare';
            else if (low.includes('media') || low.includes('sound') || low.includes('tcrew') || low.includes('instrument')) cat = 'Equipment & Media';
            else if (low.includes('logistics') || low.includes('transport') || low.includes('bus') || low.includes('fuel')) cat = 'Logistics';
            else if (low.includes('power') || low.includes('light') || low.includes('hall') || low.includes('bill')) cat = 'Utilities';

            parsedExpenses.push({
              id: `gs-exp-${cleanTab}-${i}`,
              organisation_id: orgId,
              expense_date: rawDate,
              category: cat,
              amount: outflowVal,
              currency: 'NGN',
              beneficiary: rawDonor,
              description: `${cleanTab}: ${rawDesc}`,
              payment_method: 'Transfer',
              status: 'Paid',
              approved_by: 'Finance Committee',
              created_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Build unique donors
    const parsedDonors: FinanceDonor[] = Array.from(donorTotals.entries()).map(([name, total], idx) => ({
      id: `gs-donor-${idx}`,
      organisation_id: orgId,
      donor_name: name,
      total_giving: total,
      created_at: new Date().toISOString(),
    }));

    // Sort transactions and expenses newest first
    parsedTransactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    parsedExpenses.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());

    // Update in-memory state and local cache
    fallbackTransactions = parsedTransactions;
    fallbackExpenses = parsedExpenses;
    fallbackDonors = parsedDonors;
    saveLocalCache();

    const uniqueMonths = ['ALL', ...discoveredTabs.map(t => t.name.toUpperCase())];

    // Update config
    cfg.lastSyncedAt = new Date().toISOString();
    cfg.rowCount = parsedTransactions.length + parsedExpenses.length;
    cfg.availableSheets = uniqueMonths;
    localStorage.setItem(GSHEET_STORAGE_KEY, JSON.stringify(cfg));

    return {
      transactions: parsedTransactions.length,
      expenses: parsedExpenses.length,
      totalRows: parsedTransactions.length + parsedExpenses.length,
      months: uniqueMonths,
    };
  },

  /**
   * Fetches the overall financial summary for the active organisation (with optional month filter)
   */
  async getSummary(organisationId?: string, month?: string): Promise<FinanceSummary> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      const [txRes, expRes, donorRes, recRes] = await Promise.all([
        supabase
          .from('finance_transactions')
          .select('amount, category, transaction_date, notes')
          .eq('organisation_id', orgId),
        supabase
          .from('finance_expenses')
          .select('amount, status, expense_date, description')
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

      let transactions = (txRes.data || []) as {
        amount: number;
        category: GivingCategory;
        transaction_date: string;
        notes?: string;
      }[];
      let expenses = (expRes.data || []) as {
        amount: number;
        status: ExpenseStatus;
        expense_date: string;
        description?: string;
      }[];

      if (month && month !== 'ALL') {
        transactions = transactions.filter(t => recordMatchesMonth(t.transaction_date, t.notes, month));
        expenses = expenses.filter(e => recordMatchesMonth(e.expense_date, e.description, month));
      }

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
        total_donors_count: donorRes.count || fallbackDonors.length,
        pending_reconciliations_count: recRes.count || 0,
      };
    } catch {
      // Local state from Google Sheet sync or manual entries
      let txList = fallbackTransactions;
      let expList = fallbackExpenses;

      if (month && month !== 'ALL') {
        txList = txList.filter(t => recordMatchesMonth(t.transaction_date, t.notes, month));
        expList = expList.filter(e => recordMatchesMonth(e.expense_date, e.description, month));
      }

      const totalInflow = txList.reduce((acc, t) => acc + t.amount, 0);
      const totalExpenses = expList
        .filter(e => e.status === 'Paid')
        .reduce((acc, e) => acc + e.amount, 0);

      const titheTotal = txList
        .filter(t => t.category === 'Tithe')
        .reduce((acc, t) => acc + t.amount, 0);

      const offeringTotal = txList
        .filter(t => t.category === 'Offering')
        .reduce((acc, t) => acc + t.amount, 0);

      const seedTotal = txList
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
   * Fetches all transactions / contributions (with optional month filter)
   */
  async getTransactions(
    category?: GivingCategory,
    organisationId?: string,
    month?: string
  ): Promise<FinanceTransaction[]> {
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

      let list = (data || []).map((row: Record<string, unknown>) => ({
        ...(row as unknown as FinanceTransaction),
        donor_name:
          (row.finance_donors as { donor_name?: string } | null)?.donor_name || 'Anonymous / General',
      }));

      if (month && month !== 'ALL') {
        list = list.filter(t => recordMatchesMonth(t.transaction_date, t.notes, month));
      }

      return list;
    } catch {
      let list = fallbackTransactions;
      if (category) {
        list = list.filter(t => t.category === category);
      }
      if (month && month !== 'ALL') {
        list = list.filter(t => recordMatchesMonth(t.transaction_date, t.notes, month));
      }
      return list;
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
   * Fetches all expenses (with optional month filter)
   */
  async getExpenses(
    status?: ExpenseStatus,
    organisationId?: string,
    month?: string
  ): Promise<FinanceExpense[]> {
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

      let list = (data as FinanceExpense[]) || [];
      if (month && month !== 'ALL') {
        list = list.filter(e => recordMatchesMonth(e.expense_date, e.description, month));
      }
      return list;
    } catch {
      let list = fallbackExpenses;
      if (status) {
        list = list.filter(e => e.status === status);
      }
      if (month && month !== 'ALL') {
        list = list.filter(e => recordMatchesMonth(e.expense_date, e.description, month));
      }
      return list;
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
