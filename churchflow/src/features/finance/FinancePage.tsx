import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  X,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { financeService } from '../../services/finance.service';
import type {
  FinanceDonor,
  FinanceTransaction,
  FinanceExpense,
  FinanceReconciliation,
  FinanceSummary,
  GivingCategory,
  ExpenseCategory,
  PaymentChannel,
} from '../../types/finance.types';

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'giving' | 'expenses' | 'reconciliation'>('overview');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [donors, setDonors] = useState<FinanceDonor[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [reconciliations, setReconciliations] = useState<FinanceReconciliation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [givingFilter, setGivingFilter] = useState<GivingCategory | 'All'>('All');
  const [expenseFilter, setExpenseFilter] = useState<'All' | 'Paid' | 'Approved' | 'Requested'>('All');

  // Modals
  const [showRecordGivingModal, setShowRecordGivingModal] = useState(false);
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);
  const [selectedDonorFolder, setSelectedDonorFolder] = useState<FinanceDonor | null>(null);

  // New Giving Form State
  const [givingForm, setGivingForm] = useState({
    donorName: '',
    category: 'Tithe' as GivingCategory,
    amount: '',
    channel: 'Transfer' as PaymentChannel,
    reference: '',
    notes: '',
  });

  // New Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    beneficiary: '',
    category: 'Operations' as ExpenseCategory,
    amount: '',
    description: '',
    paymentMethod: 'Transfer' as PaymentChannel,
    approvedBy: '',
  });

  // Load all finance data
  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, don, tx, exp, rec] = await Promise.all([
        financeService.getSummary(),
        financeService.getDonors(),
        financeService.getTransactions(),
        financeService.getExpenses(),
        financeService.getReconciliations(),
      ]);
      setSummary(sum);
      setDonors(don);
      setTransactions(tx);
      setExpenses(exp);
      setReconciliations(rec);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format Currency
  const formatNaira = (amount: number) => {
    return '₦' + Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  // Submit Giving
  const handleRecordGiving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!givingForm.amount || Number(givingForm.amount) <= 0) return;

    await financeService.recordTransaction({
      transaction_date: new Date().toISOString().split('T')[0],
      category: givingForm.category,
      amount: Number(givingForm.amount),
      currency: 'NGN',
      channel: givingForm.channel,
      reference: givingForm.reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Confirmed',
      source: 'Manual Entry',
      notes: givingForm.notes,
      donor_name: givingForm.donorName || 'Anonymous / General Congregation',
    });

    setShowRecordGivingModal(false);
    setGivingForm({
      donorName: '',
      category: 'Tithe',
      amount: '',
      channel: 'Transfer',
      reference: '',
      notes: '',
    });
    loadData();
  };

  // Submit Expense
  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0 || !expenseForm.beneficiary) return;

    await financeService.recordExpense({
      expense_date: new Date().toISOString().split('T')[0],
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      currency: 'NGN',
      beneficiary: expenseForm.beneficiary,
      description: expenseForm.description,
      payment_method: expenseForm.paymentMethod,
      status: 'Paid',
      approved_by: expenseForm.approvedBy || 'Resident Pastor',
    });

    setShowRecordExpenseModal(false);
    setExpenseForm({
      beneficiary: '',
      category: 'Operations',
      amount: '',
      description: '',
      paymentMethod: 'Transfer',
      approvedBy: '',
    });
    loadData();
  };

  // Approve reconciliation
  const handleApproveRecon = async (id: string) => {
    await financeService.approveReconciliation(id);
    loadData();
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchCat = givingFilter === 'All' || t.category === givingFilter;
      const matchSearch =
        !searchQuery.trim() ||
        t.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [transactions, givingFilter, searchQuery]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchStatus = expenseFilter === 'All' || e.status === expenseFilter;
      const matchSearch =
        !searchQuery.trim() ||
        e.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [expenses, expenseFilter, searchQuery]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ==================================================================== */}
      {/* EXECUTIVE HEADER & BANNER                                            */}
      {/* ==================================================================== */}
      <div
        className="portal-card"
        style={{
          padding: '28px 32px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(22,163,74,0.04) 100%), var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--blue)', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              <Landmark size={16} /> CHURCHFLOW TREASURY & FINANCIAL LEDGER
            </div>
            <h1 className="font-serif" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
              Finance, Giving & Disbursements
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Comprehensive multi-tenant financial reporting, auditable tithes & offerings, and expense workflows.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowRecordGivingModal(true)}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                background: 'var(--blue)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={16} /> Record Contribution
            </button>

            <button
              onClick={() => setShowRecordExpenseModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                background: 'var(--card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <ArrowDownRight size={16} color="#e11d48" /> Record Expense
            </button>
          </div>
        </div>

        {/* TOP METRIC CARDS */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '24px' }}>
            {/* Total Inflow */}
            <div style={{ background: 'var(--card)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Total Inflow (M-T-D)</span>
                <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(22,163,74,0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>
                {formatNaira(summary.total_inflow)}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Tithes: {formatNaira(summary.tithe_total)}
              </div>
            </div>

            {/* Total Disbursements */}
            <div style={{ background: 'var(--card)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Total Expenses Paid</span>
                <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(225,29,72,0.12)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowDownRight size={16} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#e11d48' }}>
                {formatNaira(summary.total_expenses)}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Verified disbursements
              </div>
            </div>

            {/* Net Balance */}
            <div style={{ background: 'var(--card)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Net Treasury Balance</span>
                <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(37,99,235,0.12)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Landmark size={16} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: summary.net_balance >= 0 ? 'var(--blue)' : '#e11d48' }}>
                {formatNaira(summary.net_balance)}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Active operating surplus
              </div>
            </div>

            {/* Reconciliation Queue Alert */}
            <div style={{ background: 'var(--card)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Reconciliation Queue</span>
                <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245,158,11,0.12)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={16} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--amber)' }}>
                {summary.pending_reconciliations_count} Pending
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Bank statement drafts to resolve
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* TABS NAVIGATION                                                      */}
      {/* ==================================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        {[
          { id: 'overview', label: 'Financial Overview & Reports' },
          { id: 'giving', label: 'Giving & Donor Folders' },
          { id: 'expenses', label: 'Expenses & Disbursements' },
          { id: 'reconciliation', label: `Statement Reconciliation (${reconciliations.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              background: activeTab === tab.id ? 'var(--blue)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & REPORTS                                            */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Giving Breakdown Card */}
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>
              Inflow Breakdown by Category
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Tithes</span>
                  <strong>{formatNaira(summary.tithe_total)}</strong>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--navy-soft)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${summary.total_inflow > 0 ? (summary.tithe_total / summary.total_inflow) * 100 : 0}%`,
                      background: 'var(--blue)',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Sunday & Midweek Offerings</span>
                  <strong>{formatNaira(summary.offering_total)}</strong>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--navy-soft)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${summary.total_inflow > 0 ? (summary.offering_total / summary.total_inflow) * 100 : 0}%`,
                      background: '#16a34a',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Building, Seeds & Pledges</span>
                  <strong>{formatNaira(summary.seed_and_other_total)}</strong>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--navy-soft)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${summary.total_inflow > 0 ? (summary.seed_and_other_total / summary.total_inflow) * 100 : 0}%`,
                      background: '#8b5cf6',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Connected Google Sheets Status */}
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileSpreadsheet size={20} color="var(--blue)" />
              <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                Financial Ledger Source
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
              As specified in the ChurchFlow Framework, finance reports can read from the church’s configured Google Sheet or operate in native database mode.
            </p>
            <div style={{ background: 'var(--navy-soft)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>Source Mode:</span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#16a34a', background: 'rgba(22,163,74,0.12)', padding: '2px 8px', borderRadius: '12px' }}>
                  Native Database (PostgreSQL)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>RLS Multi-Tenant Scope:</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>00000000-...-0001 (NCF UNN)</span>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Bank account numbers and sensitive balances are masked in general directories.
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: GIVING & DONOR FOLDERS                                        */}
      {/* ==================================================================== */}
      {activeTab === 'giving' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* DONOR FOLDERS DIRECTORY */}
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                  Donor Folders & Contribution Profiles
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Dedicated confidential donor histories. Selecting a donor opens their itemized giving statement.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search donors..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      padding: '6px 12px 6px 32px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      fontSize: '12.5px',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {donors.map(donor => (
                <div
                  key={donor.id}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14.5px', color: 'var(--text)' }}>{donor.donor_name}</strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--blue)', fontWeight: 700, background: 'var(--blue-soft)', padding: '2px 8px', borderRadius: '10px' }}>
                        FOLDER
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{donor.email || donor.phone || 'No contact provided'}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>{donor.notes || 'Covenant partner'}</div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Recorded Total</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a' }}>
                        {formatNaira(donor.total_giving || 0)}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDonorFolder(donor)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'var(--navy-soft)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={13} /> View Statement
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ALL TRANSACTIONS TABLE */}
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                Recent Contributions & Inflows
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Category:</span>
                {(['All', 'Tithe', 'Offering', 'Building/Pledge'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setGivingFilter(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: givingFilter === cat ? 700 : 500,
                      background: givingFilter === cat ? 'var(--blue)' : 'var(--navy-soft)',
                      color: givingFilter === cat ? '#ffffff' : 'var(--text)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px' }}>Donor / Source</th>
                    <th style={{ padding: '10px 12px' }}>Category</th>
                    <th style={{ padding: '10px 12px' }}>Channel</th>
                    <th style={{ padding: '10px 12px' }}>Reference</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{tx.transaction_date}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{tx.donor_name}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background:
                              tx.category === 'Tithe'
                                ? 'var(--blue-soft)'
                                : tx.category === 'Offering'
                                ? 'rgba(22,163,74,0.12)'
                                : 'rgba(139,92,246,0.12)',
                            color:
                              tx.category === 'Tithe'
                                ? 'var(--blue)'
                                : tx.category === 'Offering'
                                ? '#16a34a'
                                : '#8b5cf6',
                          }}
                        >
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{tx.channel}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {tx.reference || '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                        {formatNaira(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: EXPENSES & DISBURSEMENTS                                      */}
      {/* ==================================================================== */}
      {activeTab === 'expenses' && (
        <div className="portal-card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                Disbursements & Expenditure Tracker
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Track church operating costs, generator fuel, missions, and honorarium with distinct approval states.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(['All', 'Paid', 'Approved', 'Requested'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setExpenseFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: expenseFilter === st ? 700 : 500,
                    background: expenseFilter === st ? 'var(--blue)' : 'var(--navy-soft)',
                    color: expenseFilter === st ? '#ffffff' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Beneficiary / Vendor</th>
                  <th style={{ padding: '10px 12px' }}>Description</th>
                  <th style={{ padding: '10px 12px' }}>Category</th>
                  <th style={{ padding: '10px 12px' }}>Approved By</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>{exp.expense_date}</td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{exp.beneficiary}</td>
                    <td style={{ padding: '12px', color: 'var(--text)' }}>{exp.description}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'var(--navy-soft)', color: 'var(--text)' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{exp.approved_by || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background:
                            exp.status === 'Paid'
                              ? 'rgba(22,163,74,0.12)'
                              : exp.status === 'Approved'
                              ? 'var(--blue-soft)'
                              : 'rgba(245,158,11,0.12)',
                          color:
                            exp.status === 'Paid'
                              ? '#16a34a'
                              : exp.status === 'Approved'
                              ? 'var(--blue)'
                              : 'var(--amber)',
                        }}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#e11d48' }}>
                      {formatNaira(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: STATEMENT IMPORT & RECONCILIATION QUEUE                       */}
      {/* ==================================================================== */}
      {activeTab === 'reconciliation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Clock size={20} color="var(--amber)" />
              <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                Bank Statement Drafts & Reconciliation Queue
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '850px' }}>
              As required by Section 11 of the framework, imported bank statement rows are parsed into reviewable drafts. Authorized staff confirm categories and match senders to donor profiles before committing rows into verified totals.
            </p>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reconciliations.map(rec => (
                <div
                  key={rec.id}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rec.raw_date}</span>
                      {rec.is_pooled_deposit && (
                        <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '6px', background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' }}>
                          POOLED DEPOSIT
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                      {rec.raw_description}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Suggested Category: <strong style={{ color: 'var(--blue)' }}>{rec.suggested_category}</strong> | Matched Donor: <strong style={{ color: 'var(--text)' }}>{rec.suggested_donor_name || 'Unmatched'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Draft Amount</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>
                        {formatNaira(rec.raw_amount)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleApproveRecon(rec.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={15} /> Approve into Ledger
                    </button>
                  </div>
                </div>
              ))}

              {reconciliations.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  All bank statement entries have been reconciled into the live ledger.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: RECORD GIVING (INFLOW)                                        */}
      {/* ==================================================================== */}
      {showRecordGivingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--card)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '28px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="font-serif" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                Record Contribution / Inflow
              </h2>
              <button onClick={() => setShowRecordGivingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordGiving} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Donor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sister Amaka Obi (Leave blank for Sunday basket)"
                  value={givingForm.donorName}
                  onChange={e => setGivingForm({ ...givingForm, donorName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Category *</label>
                  <select
                    value={givingForm.category}
                    onChange={e => setGivingForm({ ...givingForm, category: e.target.value as GivingCategory })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                  >
                    <option value="Tithe">Tithe</option>
                    <option value="Offering">Offering</option>
                    <option value="Thanksgiving">Thanksgiving</option>
                    <option value="Seed">Seed</option>
                    <option value="Building/Pledge">Building/Pledge</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={givingForm.amount}
                    onChange={e => setGivingForm({ ...givingForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Payment Channel</label>
                  <select
                    value={givingForm.channel}
                    onChange={e => setGivingForm({ ...givingForm, channel: e.target.value as PaymentChannel })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                  >
                    <option value="Transfer">Bank Transfer</option>
                    <option value="Cash">Cash Offering</option>
                    <option value="POS">POS Terminal</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Bank Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. TRX-938210"
                    value={givingForm.reference}
                    onChange={e => setGivingForm({ ...givingForm, reference: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes or purpose"
                  value={givingForm.notes}
                  onChange={e => setGivingForm({ ...givingForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'var(--blue)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Confirm & Add to Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: RECORD EXPENSE (OUTFLOW)                                      */}
      {/* ==================================================================== */}
      {showRecordExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--card)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '28px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="font-serif" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                Record Church Expense
              </h2>
              <button onClick={() => setShowRecordExpenseModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Beneficiary / Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Total Energies Nsukka / Sound Directorate"
                  value={expenseForm.beneficiary}
                  onChange={e => setExpenseForm({ ...expenseForm, beneficiary: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                  >
                    <option value="Operations">Operations (Fuel/Power)</option>
                    <option value="Outreach & Missions">Outreach & Missions</option>
                    <option value="Honorarium & Welfare">Honorarium & Welfare</option>
                    <option value="Equipment & Media">Equipment & Media</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 35000"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diesel fuel for main generator for Sunday Service"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Authorized By</label>
                <input
                  type="text"
                  placeholder="e.g. Pastor Tony Ubagu"
                  value={expenseForm.approvedBy}
                  onChange={e => setExpenseForm({ ...expenseForm, approvedBy: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text)', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Record Paid Disbursement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DONOR FOLDER (INDIVIDUAL STATEMENT)                           */}
      {/* ==================================================================== */}
      {selectedDonorFolder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--card)', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '28px', border: '1px solid var(--border)', maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase' }}>DONOR PROFILE FOLDER</span>
                <h2 className="font-serif" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                  {selectedDonorFolder.donor_name}
                </h2>
              </div>
              <button onClick={() => setSelectedDonorFolder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'var(--navy-soft)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Lifetime Giving Recorded</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>
                  {formatNaira(selectedDonorFolder.total_giving || 0)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Contact Information</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedDonorFolder.email || selectedDonorFolder.phone || 'Alumni Partner'}</div>
              </div>
            </div>

            <h3 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: '10px' }}>Contribution History:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions
                .filter(t => t.donor_name === selectedDonorFolder.donor_name)
                .map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', background: 'var(--blue-soft)', color: 'var(--blue)' }}>{t.category}</span>
                        <strong style={{ fontSize: '13px' }}>{t.transaction_date}</strong>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.reference || t.channel} &bull; {t.notes || 'Covenant giving'}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a' }}>
                      {formatNaira(t.amount)}
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={15} /> Print Statement
              </button>
              <button
                onClick={() => setSelectedDonorFolder(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--blue)', color: '#ffffff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
