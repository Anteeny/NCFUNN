import React, { useState, useEffect } from 'react';
import { memberService } from '../../services/member.service';
import { useLeadership } from '../../hooks/useLeadership';
import type { Member } from '../../types/database.types';
import {
  Building2,
  Users,
  ArrowRight,
  ArrowLeft,
  Search,
  BookOpen,
  FileText,
  MoreVertical,
  X,
  MapPin,
  Shield,
  Clock,
  Phone,
  CheckCircle2,
  Download,
  Printer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportToCSV, printTable } from '../../utils/exportUtils';

interface UnitInfo {
  id?: string;
  name: string;
  lead: string;
  phone?: string;
  assistant: string;
  description: string;
  meetingSchedule: string;
  responsibilities: string[];
  requirements: string[];
}

interface UnitProfileDetails {
  description: string;
  meetingSchedule: string;
  responsibilities: string[];
  requirements: string[];
  assistant?: string;
}

const UNIT_PROFILES_KNOWLEDGE: Record<string, UnitProfileDetails> = {
  'Administration': {
    description: 'Executive administration, church secretariat, member records, official correspondence & institutional coordination.',
    meetingSchedule: 'Sundays 7:00 AM & Midweek Planning',
    responsibilities: [
      'Maintaining centralized membership archives and database records',
      'Drafting official pastoral bulletins, letters, and announcements',
      'Coordinating ministerial rosters across Sunday and midweek services',
      'Managing administrative logistics for campus conferences and conventions',
    ],
    requirements: ['High confidentiality & organizational diligence', 'Proficiency with spreadsheets and digital tools', 'Punctuality and spiritual integrity'],
  },
  'Ushering': {
    description: 'Congregational hospitality, guest reception, orderly seating coordination, offering stewardship & sanctuary decorum.',
    meetingSchedule: 'Sundays 6:30 AM & Wednesdays 4:45 PM',
    responsibilities: [
      'Warm reception and welcoming of members and guests at entrance gates',
      'Orderly seating arrangement and auditorium crowd flow control',
      'Dignified offering basket collection and prompt remittance to Finance',
      'Distributing communion elements, bulletins, and attendance tracking slips',
    ],
    requirements: ['Friendly, cheerful disposition', 'Neat ceremonial attire & badge compliance', 'Alertness and attention to sanctuary order'],
  },
  'MVP': {
    description: 'Most Valuable Persons (First-Timers) ministry, VIP red-carpet reception, welcoming hospitality & 24h-72h assimilation care.',
    meetingSchedule: 'Sundays 6:30 AM & Tuesdays 5:00 PM (Follow-up)',
    responsibilities: [
      'Receiving first-time visitors with warm hospitality at the MVP reception lounge',
      'Guiding new attendees through first-timer welcome cards and gifts',
      'Initiating 24-hour appreciation calls and 72-hour personal care touchpoints',
      'Facilitating first-timers integration into Saturday Connect Groups and Foundation School',
    ],
    requirements: ['Warm interpersonal empathy', 'Phone call follow-up discipline', 'Genuine passion for member retention'],
  },
  'NCF Angels': {
    description: 'The ministry choir, vocal praise and worship team, musical instrumentation & prophetic worship ministrations.',
    meetingSchedule: 'Saturdays 4:00 PM & Sundays 6:00 AM',
    responsibilities: [
      'Leading high-energy congregational praise and deep prophetic worship',
      'Weekly vocal sectional rehearsals (Soprano, Alto, Tenor)',
      'Special choral anthems for thanksgiving, conferences, and Sunday services',
      'Spiritual consecrated prayer before altar ministrations',
    ],
    requirements: ['Faithful rehearsal attendance', 'Vocal pitch accuracy & musical discipline', 'Modesty in stage appearance'],
  },
  'Temple tenders': {
    description: 'Sanctuary keeping, auditorium aesthetics, altar drapery, stage arrangement & ensuring an immaculate house of God.',
    meetingSchedule: 'Saturdays 9:00 AM & Sundays 6:00 AM',
    responsibilities: [
      'Sweeping, mopping, and vacuuming the auditorium and fellowship quads',
      'Arranging sanctuary seating, stage podium, and rostrum aesthetic drape',
      'Auditorium sanitation, waste clearance, and air freshening before services',
      'Post-service audit to secure forgotten personal belongings',
    ],
    requirements: ['Sacrificial servant heart', 'Attention to sanitation and beauty', 'Willingness to serve in the background'],
  },
  'Technical Unit': {
    description: 'Sound engineering, acoustic management, microphone balancing, mixer consoles, lighting & electrical safety.',
    meetingSchedule: 'Sundays 6:00 AM & Wednesdays 4:00 PM',
    responsibilities: [
      'Sound console mixing, EQ balancing, acoustic feedback suppression',
      'Microphone allocation, stage cabling, and stage monitor tuning',
      'Auditorium lighting, power generators monitoring, and UPS failover',
      'Preventive equipment maintenance and hardware inventory care',
    ],
    requirements: ['Basic audio engineering knowledge', 'Electrical safety compliance', 'Ear for sound balance'],
  },
  'Finances': {
    description: 'Kingdom financial stewardship, treasury accounting, tithes and offerings counting, ledger reconciliation & financial reporting.',
    meetingSchedule: 'Sundays Post-Service & Midweek',
    responsibilities: [
      'Strict two-person verification and counting of congregational tithes and offerings',
      'Accurate cash, transfer, and POS reconciliations with official bank records',
      'Disbursing approved operational reimbursements and keeping audit receipts',
      'Preparing monthly executive income/expenditure statements for pastoral oversight',
    ],
    requirements: ['Proven absolute financial integrity & godliness', 'Bookkeeping/accounting competence', 'Discretion and confidentiality'],
  },
  'Media Unit': {
    description: 'Multi-platform live broadcasting, cinematography, multi-camera switching, high-resolution photography & digital reels.',
    meetingSchedule: 'Wednesdays 4:30 PM & Sundays 6:15 AM',
    responsibilities: [
      'Multi-platform livestreaming on YouTube & social channels',
      'High-resolution service photography and archive curation',
      'Sermon slide projection and lyric display during worship',
      'Weekly sermon reels and announcements graphics production',
    ],
    requirements: ['Punctuality 30 mins before call time', 'Proficiency with OBS/vMix/camera gear', 'Creative dedication'],
  },
  'Intercessory': {
    description: 'Spiritual prayer cover, pre-service prayer watches, campus spiritual warfare, prayer vigils & retreats.',
    meetingSchedule: 'Fridays 10:00 PM (Vigil) & Sundays 6:00 AM',
    responsibilities: [
      'Anchoring pre-service spiritual prayer watches before each service',
      'Weekly intercessory petitions for church growth and university revival',
      'Organizing termly prayer and fasting retreats',
      'Altar ministry counseling and personal prayer support',
    ],
    requirements: ['Consecrated personal prayer life', 'Faithfulness in secret intercession', 'Biblical grounding'],
  },
};

function getUnitDetails(name: string, leadName: string, phone?: string, id?: string): UnitInfo {
  const profile = UNIT_PROFILES_KNOWLEDGE[name] || {
    description: `Ministry operations, discipleship, and workforce service for ${name}.`,
    meetingSchedule: 'Sundays 6:30 AM & Midweek Services',
    responsibilities: [
      `Directing and coordinating all operations for ${name}`,
      'Mobilizing assigned workers and conducting weekly attendance reviews',
      'Submitting Wednesday and Sunday workforce attendance reports',
      'Spiritual mentorship and welfare care for unit members',
    ],
    requirements: ['Commitment to regular attendance', 'Spiritual dedication & teachability', 'Punctuality'],
  };

  return {
    id,
    name,
    lead: leadName,
    assistant: profile.assistant || 'Assigned Deputy',
    phone: phone || '',
    description: profile.description,
    meetingSchedule: profile.meetingSchedule,
    responsibilities: profile.responsibilities,
    requirements: profile.requirements,
  };
}

export const DepartmentsUnitsPage: React.FC = () => {
  const { departmentLeaders, loading: loadingLeaders } = useLeadership();
  const [selectedUnit, setSelectedUnit] = useState<UnitInfo | null>(null);
  const [roster, setRoster] = useState<Member[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [searchWorker, setSearchWorker] = useState('');

  // Department counts mapped live from database
  const [deptMemberCounts, setDeptMemberCounts] = useState<Record<string, number>>({});
  const [totalWorkersAll, setTotalWorkersAll] = useState<number>(0);
  const [activeJobDescUnit, setActiveJobDescUnit] = useState<UnitInfo | null>(null);
  const [activeMenuUnit, setActiveMenuUnit] = useState<string | null>(null);

  // Load real member assignments across departments
  useEffect(() => {
    const loadDeptCounts = async () => {
      try {
        const res = await memberService.getMembers({ limit: 2000 });
        const counts: Record<string, number> = {};
        let workerCount = 0;

        (res.data || []).forEach(m => {
          const d = (m.department || '').trim();
          if (d) {
            workerCount++;
            counts[d] = (counts[d] || 0) + 1;
          }
        });

        setDeptMemberCounts(counts);
        setTotalWorkersAll(workerCount);
      } catch (err) {
        console.error('Error loading department member counts:', err);
      }
    };
    loadDeptCounts();
  }, []);

  // Compute live UnitInfo items from departmentLeaders
  const units: UnitInfo[] = departmentLeaders.map(dl =>
    getUnitDetails(dl.department_name, dl.leader_name, dl.phone, dl.id)
  );

  // Helper to compute total assigned members for a given unit
  const getAssignedCount = (unitName: string): number => {
    let sum = 0;
    const lower = unitName.toLowerCase();
    Object.entries(deptMemberCounts).forEach(([dept, count]) => {
      const dLower = dept.toLowerCase();
      if (dLower === lower) {
        sum += count;
      } else if (lower.includes('angel') && (dLower.includes('angel') || dLower.includes('choir') || dLower.includes('praise'))) {
        sum += count;
      } else if (lower.includes('usher') && dLower.includes('usher')) {
        sum += count;
      } else if (lower.includes('tender') && (dLower.includes('tender') || dLower.includes('decorat'))) {
        sum += count;
      } else if (lower.includes('intercess') && (dLower.includes('intercess') || dLower.includes('prayer'))) {
        sum += count;
      } else if (lower.includes('tech') && dLower.includes('tech')) {
        sum += count;
      } else if (lower.includes('media') && dLower.includes('media')) {
        sum += count;
      } else if (lower.includes('admin') && dLower.includes('admin')) {
        sum += count;
      } else if (lower.includes('financ') && dLower.includes('financ')) {
        sum += count;
      } else if (lower.includes('mvp') && dLower.includes('mvp')) {
        sum += count;
      }
    });
    return sum;
  };

  const handleSelectUnit = async (unit: UnitInfo) => {
    setSelectedUnit(unit);
    setActiveMenuUnit(null);
    setSearchWorker('');
    setLoadingRoster(true);
    try {
      const mems = await memberService.getMembersByDepartment(unit.name);
      setRoster(mems);
    } catch (err) {
      console.error('Failed to load department roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const filteredRoster = roster.filter(w =>
    w.member_name.toLowerCase().includes(searchWorker.toLowerCase()) ||
    (w.phone || w.member_phone || '').includes(searchWorker) ||
    (w.zone || '').toLowerCase().includes(searchWorker.toLowerCase())
  );

  const exportAllUnitsCSV = () => {
    const headers = ['#', 'Department / Unit Name', 'Head of Unit', 'Phone Number', 'Assigned Workers', 'Meeting Schedule'];
    const rows = units.map((u, idx) => [
      idx + 1,
      u.name,
      u.lead,
      u.phone || '—',
      getAssignedCount(u.name),
      u.meetingSchedule,
    ]);
    exportToCSV('NCFUNN_Departments_Summary', headers, rows);
  };

  const exportWorkerRosterCSV = () => {
    if (!selectedUnit || filteredRoster.length === 0) return;
    const headers = ['#', 'Worker Name', 'Phone Number', 'Hostel / Campus Zone', 'G12 Leader', 'Status'];
    const rows = filteredRoster.map((w, idx) => [
      idx + 1,
      w.member_name || '—',
      w.phone || w.member_phone || '—',
      w.zone || 'HQ',
      w.g12_leader || w.leader || '—',
      'Worker',
    ]);
    exportToCSV(`Department_Roster_${selectedUnit.name.replace(/\s+/g, '_')}`, headers, rows);
  };

  const printWorkerRoster = () => {
    if (!selectedUnit || filteredRoster.length === 0) return;
    const headers = ['#', 'Worker Name', 'Phone Number', 'Hostel / Campus Zone', 'G12 Leader', 'Status'];
    const rows = filteredRoster.map((w, idx) => [
      idx + 1,
      w.member_name || '—',
      w.phone || w.member_phone || '—',
      w.zone || 'HQ',
      w.g12_leader || w.leader || '—',
      'Worker',
    ]);
    printTable(
      `${selectedUnit.name} · Worker Roster`,
      [
        { label: 'Department', value: selectedUnit.name },
        { label: 'Head of Unit', value: selectedUnit.lead },
        { label: 'Total Workers', value: filteredRoster.length },
      ],
      headers,
      rows
    );
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1150px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div
        className="portal-card"
        style={{
          padding: '24px 28px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#9333ea', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            <Building2 size={15} /> 6. Departmental Directorate & Organizational Structure
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            Departments & Ministry Units Directory
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Organizational hierarchy, job descriptions, ministerial duty charters & assigned worker rosters.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/reports/department" className="btn btn-outline" style={{ fontSize: '12.5px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> View Submitted Reports
          </Link>
          <Link to="/members" className="btn btn-primary" style={{ fontSize: '12.5px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} /> Assign New Worker
          </Link>
        </div>
      </div>

      {/* Page-Level KPI Cards (Section 6 Requirement) */}
      {!selectedUnit && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <div className="portal-card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Assigned Workers
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--blue)', marginTop: '4px' }}>
              {totalWorkersAll}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Distinct members assigned to units
            </div>
          </div>

          <div className="portal-card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Executive Units
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#9333ea', marginTop: '4px' }}>
              {loadingLeaders ? '...' : `${units.length} Units`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Full directorates active in portal
            </div>
          </div>

          <div className="portal-card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Average Unit Strength
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--green)', marginTop: '4px' }}>
              {totalWorkersAll > 0 ? Math.round(totalWorkersAll / (units.length || 1)) : 0} Workers
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Mean headcount per unit
            </div>
          </div>

          <div className="portal-card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Reporting Protocol
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
              Wed & Sun
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              7:00 – 9:00 PM submission window
            </div>
          </div>
        </div>
      )}

      {/* Main Area: If NO unit selected -> show Grid of Actual Units */}
      {!selectedUnit ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                Work Units & Service Directorates ({units.length} Units)
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Click any department to inspect assigned workers or tap the menu for job descriptions
              </span>
            </div>

            <button
              onClick={exportAllUnitsCSV}
              className="btn btn-outline"
              style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="Export all departments summary to CSV"
            >
              <Download size={13} /> Export Units CSV
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '16px',
            }}
          >
            {units.map((unit, idx) => {
              const assignedCount = getAssignedCount(unit.name);
              const isMenuOpen = activeMenuUnit === unit.name;

              return (
                <div
                  key={unit.id || idx}
                  className="portal-card"
                  style={{
                    padding: '22px',
                    position: 'relative',
                    border: '1px solid var(--border)',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Top Row: Badge & Hamburger Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span className="badge badge-blue" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={12} /> {assignedCount} Assigned Workers
                      </span>

                      {/* Hamburger Button (Section 6 Requirement) */}
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setActiveMenuUnit(prev => (prev === unit.name ? null : unit.name));
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                          }}
                          title="Department actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              background: 'var(--navy-card)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                              minWidth: '160px',
                              zIndex: 50,
                              padding: '6px 0',
                            }}
                          >
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setActiveJobDescUnit(unit);
                                setActiveMenuUnit(null);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 14px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text)',
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--navy-soft)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <BookOpen size={13} style={{ color: 'var(--blue)' }} /> Job Description
                            </button>

                            <Link
                              to="/reports/department"
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 14px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text)',
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textDecoration: 'none',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--navy-soft)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <FileText size={13} style={{ color: 'var(--green)' }} /> View Reports
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    <h4
                      onClick={() => handleSelectUnit(unit)}
                      style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px', cursor: 'pointer' }}
                    >
                      {unit.name}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '16px' }}>
                      {unit.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        Head: <strong>{unit.lead}</strong>
                        {unit.phone && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                            <Phone size={10} style={{ display: 'inline', marginRight: '3px' }} />
                            {unit.phone}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleSelectUnit(unit)}
                        className="btn btn-outline"
                        style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Inspect Roster <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Selected Unit Detail View (Section 6 Requirement) */
        <div>
          <button
            onClick={() => setSelectedUnit(null)}
            className="btn btn-outline"
            style={{ fontSize: '12.5px', padding: '6px 14px', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to All Departments
          </button>

          {/* Unit Overview Header */}
          <div className="portal-card" style={{ padding: '26px 28px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Building2 size={12} /> Ministerial Unit Detail
                </span>
                <h3 className="font-serif" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
                  {selectedUnit.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px' }}>
                  {selectedUnit.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', fontSize: '12.5px', color: 'var(--text)', flexWrap: 'wrap' }}>
                  <span>Head of Unit: <strong>{selectedUnit.lead}</strong></span>
                  {selectedUnit.phone && (
                    <span>· <span><Phone size={11} style={{ display: 'inline', marginRight: '4px' }} />{selectedUnit.phone}</span></span>
                  )}
                  <span>·</span>
                  <span style={{ color: 'var(--blue)' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{selectedUnit.meetingSchedule}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveJobDescUnit(selectedUnit)}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <BookOpen size={14} /> Job Description
                </button>
                <Link
                  to="/reports/department"
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileText size={14} /> View Submitted Reports
                </Link>
              </div>
            </div>

            {/* Unit KPI Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Assigned Workers
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--blue)', marginTop: '2px' }}>
                  {roster.length}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Campus Zone Dispersion
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green)', marginTop: '2px' }}>
                  {new Set(roster.map(w => w.zone || 'HQ')).size} Zones
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  G12 Leaders Represented
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--amber)', marginTop: '2px' }}>
                  {new Set(roster.map(w => w.g12_leader || w.leader).filter(Boolean)).size} Leaders
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Worker Roster Table with strict # numbering */}
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h4 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                Assigned Workers Roster ({filteredRoster.length})
              </h4>

              {/* Search worker within unit & Export Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search worker by name, phone, or zone..."
                    value={searchWorker}
                    onChange={e => setSearchWorker(e.target.value)}
                    style={{ paddingLeft: '32px', fontSize: '12.5px', padding: '6px 12px 6px 32px' }}
                  />
                </div>
                {filteredRoster.length > 0 && (
                  <>
                    <button
                      onClick={exportWorkerRosterCSV}
                      className="btn btn-outline"
                      style={{ fontSize: '11.5px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Export this department roster to CSV"
                    >
                      <Download size={12} /> CSV
                    </button>
                    <button
                      onClick={printWorkerRoster}
                      className="btn btn-outline"
                      style={{ fontSize: '11.5px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Print this department roster"
                    >
                      <Printer size={12} /> Print
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy-soft)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '40px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>#</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Worker Name</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Phone Number</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Hostel / Campus Zone</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>G12 Leader</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRoster ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '35px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading department worker roster from database...
                      </td>
                    </tr>
                  ) : filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '35px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {searchWorker ? 'No workers match search criteria.' : `No members currently mapped to ${selectedUnit.name} in the database.`}
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((w, idx) => (
                      <tr
                        key={w.id}
                        style={{ borderBottom: idx === filteredRoster.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.12s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-soft)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>
                          {w.member_name}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                          {w.phone || w.member_phone || '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} style={{ color: 'var(--blue)' }} /> {w.zone || 'HQ'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                          {w.g12_leader || w.leader || '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span className="badge badge-green" style={{ fontSize: '11px' }}>
                            Worker
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= JOB DESCRIPTION MODAL (Section 6 Requirement) ================= */}
      {activeJobDescUnit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setActiveJobDescUnit(null)}
        >
          <div
            className="portal-card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px 32px',
              position: 'relative',
              border: '1px solid var(--border)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div>
                <span className="badge badge-blue" style={{ fontSize: '11px', marginBottom: '4px' }}>
                  Ministerial Duty Charter
                </span>
                <h3 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                  {activeJobDescUnit.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveJobDescUnit(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Description & Schedule */}
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
              {activeJobDescUnit.description}
            </p>

            <div style={{ background: 'var(--navy-soft)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                Official Meeting Schedule
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blue)', marginTop: '2px' }}>
                {activeJobDescUnit.meetingSchedule}
              </div>
            </div>

            {/* Core Responsibilities */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Core Ministerial Responsibilities
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeJobDescUnit.responsibilities.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements & Qualifications */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Standards & Qualifications
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeJobDescUnit.requirements.map((req, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Shield size={15} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <Link
                to="/reports/department"
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '7px 14px' }}
                onClick={() => setActiveJobDescUnit(null)}
              >
                Open Submitted Reports →
              </Link>
              <button
                onClick={() => setActiveJobDescUnit(null)}
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '7px 18px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
