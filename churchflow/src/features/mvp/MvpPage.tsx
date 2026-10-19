import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatWATDateString } from '../../lib/date';
import { CheckCircle2, AlertCircle, HeartHandshake } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLeadership } from '../../hooks/useLeadership';

const DEFAULT_DEPTS = [
  'Administration',
  'Ushering',
  'MVP',
  'NCF Angels',
  'Temple tenders',
  'Technical Unit',
  'Finances',
  'Media Unit',
  'Intercessory',
];

export const MvpPage: React.FC = () => {
  const { departmentLeaders } = useLeadership();
  const availableDepts = departmentLeaders.length > 0
    ? departmentLeaders.map(dl => dl.department_name)
    : DEFAULT_DEPTS;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    visitation: 'Yes',
    deptInterest: '',
    comments: '',
  });

  const handleChange = (field: string, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setErrorMsg('Please fill in the full name, phone number, and address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    const today = formatWATDateString();

    try {
      // 1. Insert into mvps table
      const mvpPayload = {
        'Name': form.name.trim(),
        'Phone Number': form.phone.trim(),
        'Address': form.address.trim(),
        'Open to Visitation': form.visitation,
        'Dept Interest': form.deptInterest,
        'Complains / Comments': form.comments.trim(),
        'Date Visited': today,
      };

      const { error: mvpErr } = await supabase.from('mvps').insert([mvpPayload]);
      if (mvpErr) throw mvpErr;

      // 2. Also insert into members table so they immediately exist in church directory
      await supabase.from('members').insert([
        {
          member_name: form.name.trim(),
          phone: form.phone.trim(),
          member_phone: form.phone.trim(),
          school_address: form.address.trim(),
          department: form.deptInterest || 'General',
          membership_level: 'MVP',
          joined_date: today,
        },
      ]);

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg('Failed to register MVP: ' + (err.message || 'Please check your connection.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="portal-card animate-fade-in" style={{ maxWidth: '600px', margin: '40px auto', padding: '50px 32px', textAlign: 'center' }}>
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'var(--green-bg)',
            color: 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <h2 className="font-serif" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
          Welcome to the Family!
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 28px' }}>
          {form.name} has been successfully registered as a Most Valuable Person (MVP) in the NCF UNN database.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ name: '', phone: '', address: '', visitation: 'Yes', deptInterest: '', comments: '' });
            }}
            className="btn btn-outline"
          >
            Register Another MVP
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-card animate-fade-in" style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 28px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
          <HeartHandshake size={15} /> First-Timer Onboarding
        </div>
        <h2 className="font-serif" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
          MVP Registration Form
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Register first-time visitors and new souls joining the fellowship.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            background: 'var(--red-bg)',
            color: 'var(--red-text)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              FULL NAME *
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Sister Grace"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              PHONE NUMBER *
            </label>
            <input
              type="tel"
              className="form-control"
              placeholder="e.g. 08123456789"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            RESIDENCE / HOSTEL & ROOM NO *
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Room 204, Bello Hostel, UNN"
            value={form.address}
            onChange={e => handleChange('address', e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              OPEN TO VISITATION?
            </label>
            <select
              className="form-control"
              value={form.visitation}
              onChange={e => handleChange('visitation', e.target.value)}
            >
              <option value="Yes">Yes, gladly</option>
              <option value="No">No, phone call only</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              DEPARTMENT OF INTEREST
            </label>
            <select
              className="form-control"
              value={form.deptInterest}
              onChange={e => handleChange('deptInterest', e.target.value)}
            >
              <option value="">— Select if interested —</option>
              {availableDepts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '26px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            PRAYER REQUESTS / REMARKS
          </label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Any specific prayer needs, spiritual background, or questions..."
            value={form.comments}
            onChange={e => handleChange('comments', e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '15px' }}
        >
          {submitting ? 'Registering MVP...' : 'Register MVP Believer ✦'}
        </button>
      </form>
    </div>
  );
};
