import React, { useState, useEffect } from 'react';
import { memberService } from '../../services/member.service';
import type { Member } from '../../types/database.types';
import { Network, PlusCircle, ArrowRight, Search, Download, Printer, Users, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportToCSV } from '../../utils/exportUtils';

export const G12ManagementPage: React.FC = () => {
  const [leaders, setLeaders] = useState<string[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [leaderMembers, setLeaderMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [search, setSearch] = useState('');
  const [discipleSearch, setDiscipleSearch] = useState('');

  useEffect(() => {
    async function loadLeaders() {
      try {
        const list = await memberService.getActiveLeaders();
        setLeaders(list);
        if (list.length > 0) {
          handleSelectLeader(list[0]);
        }
      } catch (err) {
        console.error('Failed to load leaders:', err);
      }
    }
    loadLeaders();
  }, []);

  const handleSelectLeader = async (name: string) => {
    setSelectedLeader(name);
    setLoadingMembers(true);
    setDiscipleSearch('');
    try {
      const mems = await memberService.getMembersByLeader(name);
      setLeaderMembers(mems);
    } catch (err) {
      console.error('Failed to load leader members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const exportLeadersCSV = () => {
    const headers = ['#', 'G12 Leader Name', 'Role'];
    const rows = filteredLeaders.map((name, idx) => [idx + 1, name, 'G12 Network Leader']);
    exportToCSV('NCFUNN_G12_Leaders', headers, rows);
  };

  const exportDisciplesCSV = (leaderName: string, members: Member[]) => {
    if (!members || members.length === 0) {
      alert(`No disciples found for ${leaderName} to export.`);
      return;
    }
    const headers = ['#', 'Full Name', 'Phone', 'Gender', 'Department', 'Campus Zone', 'G12 Leader', 'Membership Level'];
    const rows = members.map((m, idx) => [
      idx + 1,
      `"${(m.member_name || '').replace(/"/g, '""')}"`,
      `"${(m.phone || m.member_phone || '').replace(/"/g, '""')}"`,
      `"${(m.gender || '').replace(/"/g, '""')}"`,
      `"${(m.department || '').replace(/"/g, '""')}"`,
      `"${(m.zone || '').replace(/"/g, '""')}"`,
      `"${(m.g12_leader || leaderName).replace(/"/g, '""')}"`,
      `"${(m.membership_level || 'Member').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `G12_Disciples_${leaderName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printDisciplesRoster = (leaderName: string, members: Member[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the discipleship roster.');
      return;
    }

    const tableRows = members.map((m, idx) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; width: 40px;">${idx + 1}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${m.member_name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${m.phone || m.member_phone || '—'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${m.gender || '—'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${m.department || 'General'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${m.zone || 'HQ'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${m.membership_level || 'Member'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>G12 Discipleship Roster - ${leaderName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 24px; margin: 0; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
            h1 { margin: 0 0 6px 0; font-size: 22px; color: #0f172a; }
            .meta { font-size: 13px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 8px 12px; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            @media print {
              body { padding: 12px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NCF ChurchFlow · G12 Discipleship Roster</h1>
            <div class="meta">
              <strong>G12 Leader:</strong> ${leaderName} &nbsp;|&nbsp;
              <strong>Total Disciples:</strong> ${members.length} / 12 target &nbsp;|&nbsp;
              <strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">#</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Department</th>
                <th>Campus Zone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="padding: 20px; text-align: center;">No disciples mapped to this leader yet.</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const filteredLeaders = leaders.filter(l => l.toLowerCase().includes(search.toLowerCase()));

  const filteredDisciples = leaderMembers.filter(m => {
    const q = discipleSearch.toLowerCase();
    return (
      (m.member_name || '').toLowerCase().includes(q) ||
      (m.department || '').toLowerCase().includes(q) ||
      (m.zone || '').toLowerCase().includes(q) ||
      (m.phone || m.member_phone || '').includes(q)
    );
  });

  const capacityPct = Math.min(100, Math.round((leaderMembers.length / 12) * 100));

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            <Network size={15} /> 6. G12 Discipleship Architecture
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            G12 Network Management & Discipleship Tree
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Review G12 network hierarchies, leader trees, and member discipleship status.
          </p>
        </div>

        {/* G3 Action: Open G12 Report Form */}
        <Link to="/reports/g12" className="btn btn-primary" style={{ padding: '9px 18px' }}>
          <PlusCircle size={15} /> Open G12 Report Form
        </Link>
      </div>

      {/* Main 2-Column Layout: Left Leader Grid, Right Member Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* G1: 12-Leader Network Tree */}
        <div className="portal-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Users size={18} style={{ color: 'var(--blue)' }} /> G12 Leaders ({leaders.length})
            </h3>
            <button
              onClick={exportLeadersCSV}
              className="btn btn-outline"
              style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Export leaders list to CSV"
            >
              <Download size={12} /> CSV
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search leader..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '12.5px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '540px', overflowY: 'auto' }}>
            {filteredLeaders.map(name => {
              const isSelected = selectedLeader === name;
              return (
                <div
                  key={name}
                  onClick={() => handleSelectLeader(name)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: isSelected ? '1.5px solid var(--blue)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--blue-soft)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--blue)' : 'var(--navy-soft)',
                        color: isSelected ? '#fff' : 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    >
                      👑
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>G12 Network Leader</div>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: isSelected ? 'var(--blue)' : 'var(--text-muted)' }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* G2: Member Level Attendance Snapshot */}
        <div className="portal-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} style={{ color: '#10b981' }} />
                {selectedLeader ? `${selectedLeader}'s Disciples` : 'Discipleship Roster'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {leaderMembers.length} assigned of 12 goal
                </span>
                <span className={`badge ${capacityPct >= 100 ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '10.5px' }}>
                  {capacityPct}% Capacity ({leaderMembers.length}/12)
                </span>
              </div>
            </div>

            {selectedLeader && leaderMembers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => exportDisciplesCSV(selectedLeader, leaderMembers)}
                  className="btn btn-outline"
                  style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  title="Export discipleship roster to CSV"
                >
                  <Download size={12} /> CSV
                </button>
                <button
                  onClick={() => printDisciplesRoster(selectedLeader, leaderMembers)}
                  className="btn btn-outline"
                  style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  title="Print discipleship roster"
                >
                  <Printer size={12} /> Print
                </button>
              </div>
            )}
          </div>

          {/* Quick Disciple Search */}
          {leaderMembers.length > 0 && (
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search disciples by name, department, or zone..."
                value={discipleSearch}
                onChange={e => setDiscipleSearch(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '12px' }}
              />
            </div>
          )}

          {loadingMembers ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading discipleship roster...
            </div>
          ) : leaderMembers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No members currently mapped to {selectedLeader}.
            </div>
          ) : filteredDisciples.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
              No disciples matched "{discipleSearch}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '490px', overflowY: 'auto' }}>
              {filteredDisciples.map((m, idx) => (
                <div
                  key={m.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, width: '22px' }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)' }}>{m.member_name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {m.department || 'General'} · {m.zone || 'HQ'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-green">{m.membership_level || 'Member'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
