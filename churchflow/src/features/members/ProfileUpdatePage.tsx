import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { memberService } from '../../services/member.service';
import { searchLeaderDictionary, normalizeLeaderName } from '../../lib/leader-dictionary';
import type { Member } from '../../types/database.types';
import { CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
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

const ZONES = ['HQ', 'Odenigwe', 'Odim', 'Hilltop', 'Franco', 'JSQ', 'Greenhouse'];

export const ProfileUpdatePage: React.FC = () => {
  const { departmentLeaders } = useLeadership();
  const availableDepts = departmentLeaders.length > 0
    ? departmentLeaders.map(dl => dl.department_name)
    : DEFAULT_DEPTS;

  const { token } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();

  // Resolve token from path (/u/:token) or fallback to ?id=... or ?token=...
  const recordId = token || searchParams.get('token') || searchParams.get('id');

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Leader Autocomplete state
  const [leaderSearch, setLeaderSearch] = useState('');
  const [leaderSuggestions, setLeaderSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form State
  const [form, setForm] = useState({
    member_name: '',
    phone: '',
    gender: 'Male',
    birthday: '',
    department: '',
    g12_leader: '',
    membership_level: 'Committed Member',
    zone: 'HQ',
    school_address: '',
    home_address: '',
    dc_trainings: '',
    fellowship_status: 'Active',
  });

  useEffect(() => {
    async function loadMember() {
      if (!recordId || recordId === 'preview') {
        // If preview mode, load first member for demonstration
        try {
          const res = await memberService.getMembers({ limit: 1 });
          if (res.data.length > 0) {
            initForm(res.data[0]);
          } else {
            setErrorMsg('No member record specified.');
          }
        } catch (e) {
          setErrorMsg('No member record specified.');
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const data = await memberService.getMemberById(recordId);
        if (!data) {
          setErrorMsg('Member record not found. Please verify the link you were given.');
        } else {
          initForm(data);
        }
      } catch (err: any) {
        setErrorMsg('Error loading profile: ' + (err.message || 'Please check your connection.'));
      } finally {
        setLoading(false);
      }
    }

    loadMember();
  }, [recordId]);

  const initForm = (data: Member) => {
    setMember(data);
    setForm({
      member_name: data.member_name || '',
      phone: data.phone || data.member_phone || '',
      gender: data.gender || 'Male',
      birthday: data.birthday || '',
      department: data.department || '',
      g12_leader: data.g12_leader || data.leader || '',
      membership_level: (data.membership_level as string) || 'Committed Member',
      zone: data.zone || 'HQ',
      school_address: data.school_address || data.School_Address || '',
      home_address: data.home_address || data.Home_Address || '',
      dc_trainings: data.dc_trainings || '',
      fellowship_status: data.fellowship_status || 'Active',
    });
    setLeaderSearch(data.g12_leader || data.leader || '');
  };

  const handleLeaderSearch = (val: string) => {
    setLeaderSearch(val);
    setForm(prev => ({ ...prev, g12_leader: val }));
    if (val.trim()) {
      setLeaderSuggestions(searchLeaderDictionary(val));
      setShowDropdown(true);
    } else {
      setLeaderSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelectLeader = (name: string) => {
    const canonical = normalizeLeaderName(name);
    setLeaderSearch(canonical);
    setForm(prev => ({ ...prev, g12_leader: canonical }));
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setSaving(true);
    setErrorMsg(null);
    try {
      await memberService.updateMemberProfile(member.id, form);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      setSavedSuccess(true);
    } catch (err: any) {
      setErrorMsg('Failed to update profile: ' + (err.message || 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="portal-card" style={{ maxWidth: '640px', margin: '40px auto', padding: '50px 30px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading verified member record...</p>
      </div>
    );
  }

  if (errorMsg && !member) {
    return (
      <div className="portal-card" style={{ maxWidth: '600px', margin: '40px auto', padding: '40px 30px', textAlign: 'center' }}>
        <AlertCircle size={36} style={{ color: 'var(--red)', margin: '0 auto 16px' }} />
        <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Unable to Open Link</h3>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>{errorMsg}</p>
        <button onClick={() => (window.location.href = '/')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (savedSuccess) {
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
          Profile Updated Successfully!
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 28px' }}>
          Thank you, {form.member_name}. Your information has been securely updated in the church registry.
        </p>
        <button onClick={() => setSavedSuccess(false)} className="btn btn-outline">
          Edit Again
        </button>
      </div>
    );
  }

  return (
    <div className="portal-card animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 28px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
          <ShieldCheck size={15} /> Verified Member Self-Service
        </div>
        <h2 className="font-serif" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
          Update Member Profile
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Keep your discipleship, contact, and residency information up to date.
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
              value={form.member_name}
              onChange={e => setForm({ ...form, member_name: e.target.value })}
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
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              GENDER
            </label>
            <select
              className="form-control"
              value={form.gender}
              onChange={e => setForm({ ...form, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              BIRTHDAY (MM-DD)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 10-15 or Oct 15"
              value={form.birthday}
              onChange={e => setForm({ ...form, birthday: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              ZONE
            </label>
            <select
              className="form-control"
              value={form.zone}
              onChange={e => setForm({ ...form, zone: e.target.value })}
            >
              {ZONES.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              DEPARTMENT / WORK UNIT
            </label>
            <select
              className="form-control"
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
            >
              <option value="">— Select Department —</option>
              {availableDepts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              G12 LEADER
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Type leader name..."
              value={leaderSearch}
              onChange={e => handleLeaderSearch(e.target.value)}
              onFocus={() => setShowDropdown(true)}
            />

            {showDropdown && leaderSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-hover)',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  zIndex: 200,
                  marginTop: '4px',
                }}
              >
                {leaderSuggestions.map((leader, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectLeader(leader)}
                    style={{
                      padding: '10px 14px',
                      fontSize: '13px',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-soft)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    👑 {leader}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            SCHOOL ADDRESS (Hostel & Room Number)
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Room 12, Presidential Hostel"
            value={form.school_address}
            onChange={e => setForm({ ...form, school_address: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            HOME / OFF-CAMPUS ADDRESS
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. 15 Odenigwe Road, Nsukka"
            value={form.home_address}
            onChange={e => setForm({ ...form, home_address: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '15px' }}
        >
          {saving ? 'Saving Changes...' : 'Save Profile Changes ✦'}
        </button>
      </form>
    </div>
  );
};
