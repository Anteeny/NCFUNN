import React, { useState } from 'react';
import { Flame, MapPin, Plus, Search, Download, Printer } from 'lucide-react';
import { exportToCSV, printTable } from '../../utils/exportUtils';

type SubSection = 'campaigns' | 'souls' | 'teams' | 'pipeline';

export const SoulWinningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubSection>('souls');
  const [search, setSearch] = useState('');

  // Sample data based on NCF contact logs
  const campaigns = [
    { id: 1, title: 'Mega Campus Invasion 2026', zone: 'Franco / Mary Slessor', date: 'Oct 24, 2026', target: 200, soulsWon: 84 },
    { id: 2, title: 'Hilltop Hostel Outreach', zone: 'Hilltop Enclave', date: 'Oct 17, 2026', target: 150, soulsWon: 62 },
    { id: 3, title: 'Medical Hostel Gospel Storm', zone: 'College of Medicine', date: 'Nov 07, 2026', target: 100, soulsWon: 30 },
  ];

  const fieldSouls = [
    { id: 1, name: 'Chukwudi Obi', phone: '08149201928', location: 'Franco Hostel A-Block', category: 'S.W', dateWon: 'Oct 12, 2026', assignedCounselor: 'Bro. Winner' },
    { id: 2, name: 'Somtochukwu Ani', phone: '07039281920', location: 'Alvan Hostel Room 12', category: 'Mob', dateWon: 'Oct 14, 2026', assignedCounselor: 'Sis. Onyinye' },
    { id: 3, name: 'Adaeze Igwe', phone: '08038192019', location: 'Hilltop Peace Lodge', category: 'S.W', dateWon: 'Oct 14, 2026', assignedCounselor: 'Bro. Francis' },
  ];

  const mobilizationTeams = [
    { id: 1, team: 'Franco Squad 1', captain: 'Winner Richards', membersCount: 14, targetZone: 'Franco Hostels' },
    { id: 2, team: 'Hilltop Squad Alpha', captain: 'Kene Offiah', membersCount: 18, targetZone: 'Hilltop & Odenigwe' },
    { id: 3, team: 'Odim Evangelism Unit', captain: 'Ebuka Aziekwe', membersCount: 12, targetZone: 'Odim Hostels' },
  ];

  const filteredSouls = fieldSouls.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.location.toLowerCase().includes(search.toLowerCase())
  );

  const exportSoulsCSV = () => {
    const headers = ['#', 'Soul Name', 'Phone Number', 'Hostel / Location', 'Category', 'Assigned Leader'];
    const rows = filteredSouls.map((s, idx) => [
      idx + 1,
      s.name,
      s.phone,
      s.location,
      s.category,
      s.assignedCounselor,
    ]);
    exportToCSV('Soul_Winning_Outreach_Roster', headers, rows);
  };

  const printSoulsRoster = () => {
    const headers = ['#', 'Soul Name', 'Phone Number', 'Hostel / Location', 'Category', 'Assigned Leader'];
    const rows = filteredSouls.map((s, idx) => [
      idx + 1,
      s.name,
      s.phone,
      s.location,
      s.category,
      s.assignedCounselor,
    ]);
    printTable(
      'Soul Winning Outreach Roster',
      [
        { label: 'Total Intake', value: filteredSouls.length },
        { label: 'Outreach Unit', value: 'Evangelism & Soul Winning' },
      ],
      headers,
      rows
    );
  };

  return (
    <div className="animate-fade-in">
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            <Flame size={15} /> 5. Soul Winning & Field Mobilization
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            Evangelism, Outreach & Harvest Hub
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Outreach campaigns, field intake logs, mobilization team rosters, and follow-up assignments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--navy-soft)', padding: '4px', borderRadius: '10px' }}>
          {[
            { id: 'souls', label: 'SW2: Soul Tracker' },
            { id: 'campaigns', label: 'SW1: Outreaches' },
            { id: 'teams', label: 'SW3: Mobilization Teams' },
            { id: 'pipeline', label: 'SW4: Follow-Up Pipeline' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as SubSection)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === t.id ? 'var(--blue)' : 'transparent',
                color: activeTab === t.id ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SW2: Soul Tracker */}
      {activeTab === 'souls' && (
        <div className="portal-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search name, phone or hostel..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={exportSoulsCSV}
                className="btn btn-outline"
                style={{ fontSize: '13px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Export souls roster to CSV"
              >
                <Download size={13} /> Export CSV
              </button>
              <button
                onClick={printSoulsRoster}
                className="btn btn-outline"
                style={{ fontSize: '13px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Print souls roster"
              >
                <Printer size={13} /> Print
              </button>
              <button className="btn btn-primary" style={{ fontSize: '13px' }}>
                <Plus size={15} /> Intake New Soul
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '40px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Soul Name</th>
                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Phone Number</th>
                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Hostel / Location</th>
                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Category</th>
                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Assigned Leader</th>
              </tr>
            </thead>
            <tbody>
              {filteredSouls.map((s, idx) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{s.phone}</td>
                  <td style={{ padding: '12px' }}>{s.location}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${s.category === 'S.W' ? 'badge-amber' : 'badge-blue'}`}>{s.category}</span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--blue)', fontWeight: 500 }}>{s.assignedCounselor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SW1: Campaigns */}
      {activeTab === 'campaigns' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {campaigns.map(c => (
            <div key={c.id} className="portal-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-green"><MapPin size={12} /> {c.zone}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.date}</span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{c.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Harvest Target: <strong>{c.target} Souls</strong> · Won: <strong style={{ color: 'var(--green)' }}>{c.soulsWon}</strong>
              </p>
              <div style={{ height: '6px', background: 'var(--navy-soft)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(c.soulsWon / c.target) * 100}%`, height: '100%', background: 'var(--green)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SW3: Mobilization Teams */}
      {activeTab === 'teams' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {mobilizationTeams.map(t => (
            <div key={t.id} className="portal-card" style={{ padding: '22px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{t.team}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Captain: <strong>{t.captain}</strong></p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>Coverage: {t.targetZone}</p>
              <span className="badge badge-blue">{t.membersCount} Soul Winners</span>
            </div>
          ))}
        </div>
      )}

      {/* SW4: Follow-up Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="portal-card" style={{ padding: '24px' }}>
          <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
            Follow-Up & Soul Retention Pipeline
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Track converts through Day 1 Call, Day 3 Visitation, and Sunday First Service Integration.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'var(--navy-soft)', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Stage 1: Day 1 Phone Call</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>18 pending calls this week</p>
            </div>
            <div style={{ background: 'var(--navy-soft)', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Stage 2: Hostel Visit</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>12 confirmed visits booked</p>
            </div>
            <div style={{ background: 'var(--navy-soft)', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Stage 3: Cell Integration</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>24 assigned to Saturday cells</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
