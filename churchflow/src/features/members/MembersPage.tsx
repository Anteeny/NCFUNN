import React, { useState, useEffect, useMemo, useRef } from 'react';
import { memberService } from '../../services/member.service';
import type { Member } from '../../types/database.types';
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  SlidersHorizontal,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  Users,
  X,
  Printer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLeadership } from '../../hooks/useLeadership';
import { printTable } from '../../utils/exportUtils';

const ZONES = ['ALL', 'HQ', 'Odenigwe', 'Odim', 'Hilltop', 'Franco', 'JSQ', 'Greenhouse'];
const DEFAULT_DEPTS = [
  'ALL',
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

interface ColumnMeta {
  id: string;
  label: string;
  defaultVisible: boolean;
  minWidth?: string;
}

const ALL_COLUMNS: ColumnMeta[] = [
  { id: 'member_name', label: 'Member Name', defaultVisible: true, minWidth: '170px' },
  { id: 'gender', label: 'Gender', defaultVisible: true, minWidth: '95px' },
  { id: 'phone', label: 'Phone', defaultVisible: true, minWidth: '125px' },
  { id: 'membership_level', label: 'Level', defaultVisible: true, minWidth: '120px' },
  { id: 'department', label: 'Department / Unit', defaultVisible: true, minWidth: '150px' },
  { id: 'zone', label: 'Zone', defaultVisible: true, minWidth: '100px' },
  { id: 'g12_leader', label: 'G12 Leader', defaultVisible: true, minWidth: '140px' },
  { id: 'course_of_study', label: 'Course of Study', defaultVisible: true, minWidth: '180px' },
  { id: 'level', label: 'Academic Level', defaultVisible: false, minWidth: '120px' },
  { id: 'g12_phone', label: 'G12 Phone', defaultVisible: false, minWidth: '130px' },
  { id: 'school_address', label: 'School Address / Hostel', defaultVisible: false, minWidth: '200px' },
  { id: 'home_address', label: 'Home Address', defaultVisible: false, minWidth: '200px' },
  { id: 'birthday', label: 'Birthday', defaultVisible: false, minWidth: '110px' },
  { id: 'dc_trainings', label: 'DC Trainings', defaultVisible: false, minWidth: '150px' },
  { id: 'joined_date', label: 'Joined Date', defaultVisible: false, minWidth: '110px' },
];

const COLUMNS_STORAGE_KEY = 'churchflow_members_columns_visibility';

export const MembersPage: React.FC = () => {
  const { departmentLeaders } = useLeadership();
  const availableDepts = ['ALL', ...(departmentLeaders.length > 0 ? departmentLeaders.map(d => d.department_name) : DEFAULT_DEPTS.slice(1))];

  const [members, setMembers] = useState<Member[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Column Visibility State
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    const defaults: Record<string, boolean> = {};
    ALL_COLUMNS.forEach(c => {
      defaults[c.id] = c.defaultVisible;
    });
    return defaults;
  });

  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Copy link feedback state
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowColumnDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (colId: string) => {
    if (colId === 'member_name') return; // Member name is permanently anchored
    setColumnVisibility(prev => {
      const next = { ...prev, [colId]: !prev[colId] };
      try {
        localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const handleSelectAllColumns = () => {
    const allOn: Record<string, boolean> = {};
    ALL_COLUMNS.forEach(c => (allOn[c.id] = true));
    setColumnVisibility(allOn);
    try {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(allOn));
    } catch (_) {}
  };

  const handleResetColumns = () => {
    const defaults: Record<string, boolean> = {};
    ALL_COLUMNS.forEach(c => (defaults[c.id] = c.defaultVisible));
    setColumnVisibility(defaults);
    try {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(defaults));
    } catch (_) {}
  };

  const fetchMembersList = async () => {
    try {
      setLoading(true);
      const res = await memberService.getMembers({
        search: searchTerm,
        zone: selectedZone,
        department: selectedDept,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setMembers(res.data);
      setTotalCount(res.count);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchMembersList();
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm, selectedZone, selectedDept, page]);

  const handleCopyProfileLink = (id: string | number) => {
    const origin = window.location.origin;
    const link = `${origin}/u/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Visible columns in order
  const activeColumns = useMemo(() => {
    return ALL_COLUMNS.filter(col => columnVisibility[col.id] !== false);
  }, [columnVisibility]);

  // Export visible data to CSV
  const handleExportCSV = () => {
    if (members.length === 0) return;
    const headers = activeColumns.map(c => `"${c.label}"`).concat('"Profile Link"');
    const rows = members.map(m => {
      const values = activeColumns.map(c => {
        let val: any = '';
        if (c.id === 'member_name') val = m.member_name;
        else if (c.id === 'gender') val = m.gender || '';
        else if (c.id === 'phone') val = m.phone || m.member_phone || '';
        else if (c.id === 'membership_level') val = m.membership_level || '';
        else if (c.id === 'department') val = m.department || '';
        else if (c.id === 'zone') val = m.zone || '';
        else if (c.id === 'g12_leader') val = m.g12_leader || m.leader || '';
        else if (c.id === 'g12_phone') val = m.g12_phone || '';
        else if (c.id === 'course_of_study') val = m.course_of_study || '';
        else if (c.id === 'level') val = m.level || '';
        else if (c.id === 'school_address') val = m.school_address || m.School_Address || '';
        else if (c.id === 'home_address') val = m.home_address || m.Home_Address || '';
        else if (c.id === 'birthday') val = m.birthday || '';
        else if (c.id === 'dc_trainings') val = m.dc_trainings || '';
        else if (c.id === 'joined_date') val = m.joined_date || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      values.push(`"${window.location.origin}/u/${m.id}"`);
      return values.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NCFUNN_Members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintDirectory = () => {
    if (members.length === 0) return;
    const headers = ['#', ...activeColumns.map(c => c.label)];
    const rows = members.map((m, idx) => {
      const vals: any[] = [idx + 1];
      activeColumns.forEach(c => {
        let val: any = '';
        if (c.id === 'member_name') val = m.member_name;
        else if (c.id === 'gender') val = m.gender || '—';
        else if (c.id === 'phone') val = m.phone || m.member_phone || '—';
        else if (c.id === 'membership_level') val = m.membership_level || 'Member';
        else if (c.id === 'department') val = m.department || '—';
        else if (c.id === 'zone') val = m.zone || '—';
        else if (c.id === 'g12_leader') val = m.g12_leader || m.leader || '—';
        else if (c.id === 'g12_phone') val = m.g12_phone || '—';
        else if (c.id === 'course_of_study') val = m.course_of_study || '—';
        else if (c.id === 'level') val = m.level || '—';
        else if (c.id === 'school_address') val = m.school_address || m.School_Address || '—';
        else if (c.id === 'home_address') val = m.home_address || m.Home_Address || '—';
        else if (c.id === 'birthday') val = m.birthday || '—';
        else if (c.id === 'dc_trainings') val = m.dc_trainings || '—';
        else if (c.id === 'joined_date') val = m.joined_date || '—';
        vals.push(val);
      });
      return vals;
    });

    printTable(
      'Membership Directory',
      [
        { label: 'Total Members', value: members.length },
        { label: 'Active Columns', value: activeColumns.length },
      ],
      headers,
      rows
    );
  };

  // Helper to render cell value
  const renderCellContent = (colId: string, m: Member) => {
    switch (colId) {
      case 'member_name':
        return (
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>
            {m.member_name}
          </span>
        );

      case 'gender': {
        const g = (m.gender || '').trim().toLowerCase();
        if (g === 'male' || g === 'm') {
          return (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
              }}
            >
              Male
            </span>
          );
        } else if (g === 'female' || g === 'f') {
          return (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
              }}
            >
              Female
            </span>
          );
        }
        return <span style={{ color: 'var(--text-muted)' }}>—</span>;
      }

      case 'phone':
        return (
          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>
            {m.phone || m.member_phone || '—'}
          </span>
        );

      case 'membership_level': {
        const lvl = (m.membership_level || '').trim();
        let badgeColor = 'var(--blue)';
        let badgeBg = 'var(--blue-soft)';
        if (lvl === 'MVP') {
          badgeColor = 'var(--amber)';
          badgeBg = 'var(--amber-bg)';
        } else if (lvl.toLowerCase().includes('pastor')) {
          badgeColor = '#ef4444';
          badgeBg = 'rgba(239, 68, 68, 0.15)';
        } else if (lvl.toLowerCase().includes('dh') || lvl.toLowerCase().includes('core')) {
          badgeColor = '#8b5cf6';
          badgeBg = 'rgba(139, 92, 246, 0.15)';
        } else if (lvl.toLowerCase().includes('worker')) {
          badgeColor = 'var(--green)';
          badgeBg = 'var(--green-bg)';
        }
        return lvl ? (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: badgeBg,
              color: badgeColor,
            }}
          >
            {lvl}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        );
      }

      case 'department':
        return m.department ? (
          <span className="badge badge-blue">{m.department}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>General</span>
        );

      case 'zone':
        return <span style={{ color: 'var(--text-muted)' }}>{m.zone || 'HQ'}</span>;

      case 'g12_leader':
        return <span style={{ color: 'var(--text)' }}>{m.g12_leader || m.leader || '—'}</span>;

      case 'g12_phone':
        return (
          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '11.5px' }}>
            {m.g12_phone || '—'}
          </span>
        );

      case 'course_of_study':
        return (
          <span style={{ color: 'var(--text-muted)', fontSize: '12.5px' }} title={m.course_of_study || ''}>
            {m.course_of_study || '—'}
          </span>
        );

      case 'level':
        return <span style={{ color: 'var(--text-muted)' }}>{m.level || '—'}</span>;

      case 'school_address':
        return (
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }} title={m.school_address || m.School_Address || ''}>
            {m.school_address || m.School_Address || '—'}
          </span>
        );

      case 'home_address':
        return (
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }} title={m.home_address || m.Home_Address || ''}>
            {m.home_address || m.Home_Address || '—'}
          </span>
        );

      case 'birthday':
        return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{m.birthday || '—'}</span>;

      case 'dc_trainings':
        return (
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {m.dc_trainings || '—'}
          </span>
        );

      case 'joined_date':
        return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{m.joined_date || '—'}</span>;

      default:
        return '—';
    }
  };

  return (
    <div className="portal-card animate-fade-in" style={{ padding: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            <Users size={14} /> Full Church Database (View Only)
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            Membership Directory
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {members.length} of {totalCount} members · {activeColumns.length} columns active
          </p>
        </div>

        {/* Action Buttons: Column Selector, Export CSV, and Register */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Column Toggle Popover */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setShowColumnDropdown(prev => !prev)}
              className="btn btn-outline"
              style={{
                fontSize: '12.5px',
                padding: '7px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
              }}
            >
              <SlidersHorizontal size={14} />
              Columns ({activeColumns.length}/{ALL_COLUMNS.length})
            </button>

            {showColumnDropdown && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  background: 'var(--navy-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.45)',
                  width: '260px',
                  padding: '12px 14px',
                  zIndex: 200,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                    Toggle Display Fields
                  </span>
                  <button
                    onClick={() => setShowColumnDropdown(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Quick actions */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <button
                    onClick={handleSelectAllColumns}
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: '10.5px', padding: '4px 6px' }}
                  >
                    Show All
                  </button>
                  <button
                    onClick={handleResetColumns}
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: '10.5px', padding: '4px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>

                {/* Column Checkboxes List */}
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {ALL_COLUMNS.map(col => {
                    const isVisible = columnVisibility[col.id] !== false;
                    const isLocked = col.id === 'member_name';

                    return (
                      <label
                        key={col.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: isLocked ? 'var(--text-muted)' : 'var(--text)',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={e => {
                          if (!isLocked) e.currentTarget.style.background = 'var(--navy-soft)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          disabled={isLocked}
                          onChange={() => toggleColumn(col.id)}
                          style={{ accentColor: 'var(--blue)', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ flex: 1 }}>{col.label}</span>
                        {isVisible ? (
                          <Eye size={12} style={{ color: 'var(--blue)' }} />
                        ) : (
                          <EyeOff size={12} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Export to CSV Button */}
          <button
            onClick={handleExportCSV}
            className="btn btn-outline"
            style={{
              fontSize: '12.5px',
              padding: '7px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Download visible records as CSV"
          >
            <Download size={14} /> Export CSV
          </button>

          {/* Print Directory Button */}
          <button
            onClick={handlePrintDirectory}
            className="btn btn-outline"
            style={{
              fontSize: '12.5px',
              padding: '7px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Print membership roster or save to PDF"
          >
            <Printer size={14} /> Print
          </button>

          {/* Register New Member Button */}
          <Link to="/mvp" className="btn btn-primary" style={{ fontSize: '12.5px', padding: '7px 16px' }}>
            + Register New MVP
          </Link>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, phone, or course..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            style={{ paddingLeft: '36px', fontSize: '13px' }}
          />
        </div>

        <div>
          <select
            className="form-control"
            value={selectedZone}
            onChange={e => {
              setSelectedZone(e.target.value);
              setPage(1);
            }}
            style={{ fontSize: '13px' }}
          >
            {ZONES.map(z => (
              <option key={z} value={z}>
                Zone: {z}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            className="form-control"
            value={selectedDept}
            onChange={e => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            style={{ fontSize: '13px' }}
          >
            {availableDepts.map(d => (
              <option key={d} value={d}>
                Dept: {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Data Table with Horizontal Scroll & Responsive Columns */}
      <div style={{ overflowX: 'auto', marginBottom: '20px', border: '1px solid var(--border)', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy-soft)', textAlign: 'left' }}>
              <th
                style={{
                  padding: '12px 10px',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: '45px',
                  textAlign: 'center',
                }}
              >
                #
              </th>
              {activeColumns.map(col => (
                <th
                  key={col.id}
                  style={{
                    padding: '12px 14px',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    minWidth: col.minWidth || '120px',
                  }}
                >
                  {col.label}
                </th>
              ))}
              <th
                style={{
                  padding: '12px 14px',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: '90px',
                  textAlign: 'right',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={activeColumns.length + 2} style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading member directory...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length + 2} style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No members matched your search criteria.
                </td>
              </tr>
            ) : (
              members.map((m, idx) => (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-soft)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  {activeColumns.map(col => (
                    <td key={col.id} style={{ padding: '12px 14px' }}>
                      {renderCellContent(col.id, m)}
                    </td>
                  ))}
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Link
                        to={`/u/${m.id}`}
                        className="btn btn-outline"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        title="View & Edit profile"
                      >
                        <ExternalLink size={12} /> View
                      </Link>

                      <button
                        onClick={() => handleCopyProfileLink(m.id)}
                        className="btn btn-outline"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        title="Copy self-service WhatsApp profile update link"
                      >
                        {copiedId === m.id ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} registered members
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', marginRight: '6px' }}>
            Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}
          </span>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline"
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * pageSize >= totalCount}
            className="btn btn-outline"
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
