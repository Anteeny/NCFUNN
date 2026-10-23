-- ==============================================================================
-- CHURCHFLOW MULTI-TENANT FINANCE & TREASURY ENGINE (004)
-- Conforms strictly to ChurchFlow Framework Section 11: Giving, Donations & Expenses
-- ==============================================================================

-- 1. FINANCE DONOR DIRECTORY (Decoupled from public members list)
CREATE TABLE IF NOT EXISTS public.finance_donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    donor_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GIVING & DONATIONS (INFLOWS / TITHES / OFFERINGS)
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES public.finance_donors(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('Tithe', 'Offering', 'Thanksgiving', 'Seed', 'Building/Pledge', 'Other')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    channel TEXT NOT NULL DEFAULT 'Transfer' CHECK (channel IN ('Transfer', 'Cash', 'POS', 'Cheque', 'Online')),
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Pending Reconciliation', 'Flagged')),
    source TEXT NOT NULL DEFAULT 'Manual Entry' CHECK (source IN ('Manual Entry', 'Bank Statement Import', 'Google Sheet Sync')),
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXPENSES & DISBURSEMENTS (OUTFLOWS)
CREATE TABLE IF NOT EXISTS public.finance_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('Operations', 'Outreach & Missions', 'Honorarium & Welfare', 'Equipment & Media', 'Logistics', 'Utilities', 'Other')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    beneficiary TEXT NOT NULL,
    description TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Transfer' CHECK (payment_method IN ('Transfer', 'Cash', 'Cheque')),
    status TEXT NOT NULL DEFAULT 'Paid' CHECK (status IN ('Requested', 'Approved', 'Paid', 'Rejected')),
    approved_by TEXT,
    receipt_url TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RECONCILIATION QUEUE (Bank statement imports & draft matches)
CREATE TABLE IF NOT EXISTS public.finance_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    import_batch_id UUID NOT NULL,
    raw_date DATE NOT NULL,
    raw_description TEXT NOT NULL,
    raw_amount NUMERIC(14, 2) NOT NULL,
    suggested_category TEXT DEFAULT 'Offering',
    suggested_donor_name TEXT,
    matched_donor_id UUID REFERENCES public.finance_donors(id) ON DELETE SET NULL,
    is_pooled_deposit BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Discarded')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_finance_trans_org ON public.finance_transactions(organisation_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_exp_org ON public.finance_expenses(organisation_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_donors_org ON public.finance_donors(organisation_id);
CREATE INDEX IF NOT EXISTS idx_finance_recon_org ON public.finance_reconciliations(organisation_id, status);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.finance_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_reconciliations ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR FINANCE_DONORS
DROP POLICY IF EXISTS "finance_donors_isolation" ON public.finance_donors;
CREATE POLICY "finance_donors_isolation" ON public.finance_donors
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        organisation_id = public.current_org_id()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        organisation_id = public.current_org_id()
    );

-- POLICIES FOR FINANCE_TRANSACTIONS
DROP POLICY IF EXISTS "finance_transactions_isolation" ON public.finance_transactions;
CREATE POLICY "finance_transactions_isolation" ON public.finance_transactions
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        organisation_id = public.current_org_id()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        organisation_id = public.current_org_id()
    );

-- POLICIES FOR FINANCE_EXPENSES
DROP POLICY IF EXISTS "finance_expenses_isolation" ON public.finance_expenses;
CREATE POLICY "finance_expenses_isolation" ON public.finance_expenses
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        organisation_id = public.current_org_id()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        organisation_id = public.current_org_id()
    );

-- POLICIES FOR FINANCE_RECONCILIATIONS
DROP POLICY IF EXISTS "finance_reconciliations_isolation" ON public.finance_reconciliations;
CREATE POLICY "finance_reconciliations_isolation" ON public.finance_reconciliations
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        organisation_id = public.current_org_id()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        organisation_id = public.current_org_id()
    );

-- ENABLE FINANCE MODULE IN NCF UNN SETTINGS
UPDATE public.organisations
SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    '{modules_enabled,finance}',
    'true'::jsonb,
    true
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ==============================================================================
-- INITIAL SEED RECORDS FOR NCF UNN (Deterministic Sample Data)
-- ==============================================================================
DO $$
DECLARE
    v_ncf_id UUID := '00000000-0000-0000-0000-000000000001';
    v_donor1 UUID;
    v_donor2 UUID;
    v_donor3 UUID;
    v_batch UUID := gen_random_uuid();
BEGIN
    -- Seed Sample Donors
    INSERT INTO public.finance_donors (organisation_id, donor_name, email, phone, notes)
    VALUES (v_ncf_id, 'Faithfulness Onu', 'faithfulness@ncfunn.site', '08140286257', 'Finance Directorate Head')
    RETURNING id INTO v_donor1;

    INSERT INTO public.finance_donors (organisation_id, donor_name, email, phone, notes)
    VALUES (v_ncf_id, 'Pastor Ubagu Tony', 'tony@ncfunn.site', '08031234567', 'Resident Chapter Pastor')
    RETURNING id INTO v_donor2;

    INSERT INTO public.finance_donors (organisation_id, donor_name, email, phone, notes)
    VALUES (v_ncf_id, 'Sister Amaka Obi', 'amaka.obi@gmail.com', '08059876543', 'Dedicated Alumni Covenant Partner')
    RETURNING id INTO v_donor3;

    -- Seed Sample Inflows
    INSERT INTO public.finance_transactions (organisation_id, donor_id, transaction_date, category, amount, currency, channel, reference, status, source)
    VALUES 
        (v_ncf_id, v_donor1, CURRENT_DATE - INTERVAL '3 days', 'Tithe', 50000.00, 'NGN', 'Transfer', 'TRX-948291', 'Confirmed', 'Manual Entry'),
        (v_ncf_id, v_donor2, CURRENT_DATE - INTERVAL '5 days', 'Tithe', 80000.00, 'NGN', 'Transfer', 'TRX-103948', 'Confirmed', 'Manual Entry'),
        (v_ncf_id, v_donor3, CURRENT_DATE - INTERVAL '2 days', 'Building/Pledge', 150000.00, 'NGN', 'Transfer', 'TRX-847291', 'Confirmed', 'Manual Entry'),
        (v_ncf_id, NULL, CURRENT_DATE - INTERVAL '1 day', 'Offering', 125400.00, 'NGN', 'Cash', 'COL-SUN-MAIN', 'Confirmed', 'Manual Entry'),
        (v_ncf_id, NULL, CURRENT_DATE - INTERVAL '4 days', 'Thanksgiving', 45000.00, 'NGN', 'Transfer', 'TRX-392817', 'Confirmed', 'Manual Entry');

    -- Seed Sample Expenses
    INSERT INTO public.finance_expenses (organisation_id, expense_date, category, amount, currency, beneficiary, description, payment_method, status, approved_by)
    VALUES
        (v_ncf_id, CURRENT_DATE - INTERVAL '2 days', 'Operations', 35000.00, 'NGN', 'Total Filling Station', 'Diesel fuel for main generator during Sunday Service', 'Transfer', 'Paid', 'Pastor Tony Ubagu'),
        (v_ncf_id, CURRENT_DATE - INTERVAL '4 days', 'Equipment & Media', 48000.00, 'NGN', 'AudioPro Solutions', 'Replacement XLR cables, microphone batteries, and DI boxes', 'Transfer', 'Paid', 'Faithfulness Onu'),
        (v_ncf_id, CURRENT_DATE - INTERVAL '6 days', 'Honorarium & Welfare', 60000.00, 'NGN', 'Visiting Speaker Hospitality', 'Guest minister transportation & accommodation honorarium', 'Transfer', 'Paid', 'Pastor Tony Ubagu'),
        (v_ncf_id, CURRENT_DATE - INTERVAL '1 day', 'Outreach & Missions', 25000.00, 'NGN', 'Evangelism Directorate', 'Campus-wide tract printing & Soul Winning water bottles', 'Cash', 'Approved', 'Pastor Tony Ubagu');

    -- Seed Sample Draft Reconciliations
    INSERT INTO public.finance_reconciliations (organisation_id, import_batch_id, raw_date, raw_description, raw_amount, suggested_category, suggested_donor_name, is_pooled_deposit, status)
    VALUES
        (v_ncf_id, v_batch, CURRENT_DATE - INTERVAL '1 day', 'NIP/AMAKA OBI/TITHE-OCT', 35000.00, 'Tithe', 'Amaka Obi', FALSE, 'Pending'),
        (v_ncf_id, v_batch, CURRENT_DATE - INTERVAL '2 days', 'SUNDAY BASKET POOLED TELLER DEPOSIT', 98500.00, 'Offering', 'Anonymous / Congregational', TRUE, 'Pending');
END $$;
