import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import type { Member } from '../../types/database.types';
import { useLeadership } from '../../hooks/useLeadership';
import type { CellLeaderRecord } from '../../services/leadership.service';
import {
  Compass,
  MapPin,
  ArrowRight,
  ArrowLeft,
  FileText,
  Clock,
  Search,
  Users,
  ShieldCheck,
  Download,
  Printer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportToCSV, printTable } from '../../utils/exportUtils';

interface GroupedZone {
  name: string;
  campusArea: string;
  leader: string;
  cells: CellLeaderRecord[];
  memberCount: number;
}

export const ConnectGroupsPage: React.FC = () => {
  // Navigation levels: 1 = Zones Grid, 2 = Saturday Cells in Zone, 3 = Read-Only Member Roster
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [selectedZone, setSelectedZone] = useState<GroupedZone | null>(null);
  const [selectedCell, setSelectedCell] = useState<CellLeaderRecord | null>(null);

  const [zoneMembers, setZoneMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [cellSearchQuery, setCellSearchQuery] = useState('');

  // Live real-time cells and campus zones from useLeadership hook
  const { cellLeaders, campusZones } = useLeadership();
  const [zoneMemberCounts, setZoneMemberCounts] = useState<Record<string, number>>({});

  // Fetch live member counts grouped by zone from Supabase
  useEffect(() => {
    async function fetchZoneMemberCounts() {
      try {
        const { data, error } = await supabase.from('members').select('id, zone');
        if (error || !data) return;

        const counts: Record<string, number> = {};
        data.forEach(m => {
          const z = (m.zone || 'HQ').trim();
          counts[z] = (counts[z] || 0) + 1;
        });
        setZoneMemberCounts(counts);
      } catch (err) {
        console.error('Error fetching zone member counts:', err);
      }
    }
    fetchZoneMemberCounts();
  }, []);

  // Group live cells by Zone dynamically using campusZones metadata
  const groupedZones: GroupedZone[] = useMemo(() => {
    const map: Record<string, CellLeaderRecord[]> = {};

    // Initialize all zones from dynamic campusZones configuration
    campusZones.forEach(z => {
      map[z.name] = [];
    });

    // Populate with real cells from Supabase cell_leaders
    cellLeaders.forEach(cell => {
      const z = (cell.zone || 'HQ').trim();
      if (!map[z]) {
        map[z] = [];
      }
      map[z].push(cell);
    });

    const metaMap = new Map(campusZones.map(z => [z.name.toLowerCase().trim(), z]));

    // Map into displayable GroupedZone objects
    const list: GroupedZone[] = Object.keys(map).map(zoneName => {
      const meta = metaMap.get(zoneName.toLowerCase().trim());
      return {
        name: zoneName,
        campusArea: meta?.campus_area || 'Campus Zone & Surrounding Areas',
        leader: meta?.leader || 'Assigned Zonal Pastor',
        cells: map[zoneName],
        memberCount: zoneMemberCounts[zoneName] || 0,
      };
    });

    // Filter out zones with 0 cells unless they are standard campus zones
    return list.filter(z => z.cells.length > 0 || ['HQ', 'Hilltop', 'JSQ', 'Franco', 'Odenigwe', 'Greenhouse', 'Odim'].includes(z.name));
  }, [cellLeaders, campusZones, zoneMemberCounts]);

  // Compute KPI metrics for Section 7 target (50 Connect Groups Benchmark)
  const totalCells = cellLeaders.length;
  const activeZonesCount = groupedZones.filter(z => z.cells.length > 0).length;
  const totalConnectedMembers = useMemo(() => {
    return Object.values(zoneMemberCounts).reduce((acc, c) => acc + c, 0);
  }, [zoneMemberCounts]);

  const handleSelectZone = (zone: GroupedZone) => {
    setSelectedZone(zone);
    setLevel(2);
  };

  const handleSelectCell = async (cell: CellLeaderRecord) => {
    setSelectedCell(cell);
    setLevel(3);
    setLoadingMembers(true);
    setMemberSearch('');
    try {
      const zoneClean = (cell.zone || selectedZone?.name || 'HQ').trim();
      const { data } = await supabase
        .from('members')
        .select('*')
        .ilike('zone', `%${zoneClean}%`)
        .limit(100);
      setZoneMembers((data as Member[]) || []);
    } catch (err) {
      console.error('Failed to load cell members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const exportAllConnectGroupsCSV = () => {
    const headers = ['#', 'Cell Name', 'Campus Zone', 'Cell Leader', 'Assistant Leader', 'Venue / Address'];
    const rows = cellLeaders.map((c, idx) => [
      idx + 1,
      c.cell_name,
      c.zone,
      c.cell_leader,
      c.assistant || '—',
      c.cell_address || 'Campus Venue',
    ]);
    exportToCSV('NCFUNN_All_Connect_Groups', headers, rows);
  };

  const exportCellRosterCSV = () => {
    if (!selectedCell) return;
    const filtered = zoneMembers.filter(m => (m.member_name || '').toLowerCase().includes(memberSearch.toLowerCase()));
    const headers = ['#', 'Member Name', 'Phone Number', 'Address / Hostel', 'Department', 'Discipleship Level'];
    const rows = filtered.map((m, idx) => [
      idx + 1,
      m.member_name || '—',
      m.phone || m.member_phone || '—',
      m.school_address || m.School_Address || '—',
      m.department || 'General',
      m.membership_level || 'Member',
    ]);
    exportToCSV(`Connect_Group_Roster_${selectedCell.cell_name.replace(/\s+/g, '_')}`, headers, rows);
  };

  const printCellRoster = () => {
    if (!selectedCell) return;
    const filtered = zoneMembers.filter(m => (m.member_name || '').toLowerCase().includes(memberSearch.toLowerCase()));
    const headers = ['#', 'Member Name', 'Phone Number', 'Address / Hostel', 'Department', 'Discipleship Level'];
    const rows = filtered.map((m, idx) => [
      idx + 1,
      m.member_name || '—',
      m.phone || m.member_phone || '—',
      m.school_address || m.School_Address || '—',
      m.department || 'General',
      m.membership_level || 'Member',
    ]);
    printTable(
      `${selectedCell.cell_name} · Member Roster`,
      [
        { label: 'Zone', value: selectedCell.zone },
        { label: 'Leader', value: selectedCell.cell_leader },
        { label: 'Total Members', value: filtered.length },
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#06b6d4', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            <Compass size={15} /> 7. Connect Groups Architecture & Campus Zones
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            Saturday Connect Groups (Live {totalCells} Cells across {activeZonesCount} Zones)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Authoritative campus zone network tracking church target of 50 Connect Groups (Target: 10–15 members per group). Fully editable in Settings.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={exportAllConnectGroupsCSV}
            className="btn btn-outline"
            style={{ fontSize: '12.5px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Export all 40 Connect Groups directory to CSV"
          >
            <Download size={14} /> Export 40 Groups CSV
          </button>
          <Link to="/settings" className="btn btn-outline" style={{ fontSize: '12.5px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> Manage in Settings
          </Link>
          <Link to="/reports/cell" className="btn btn-outline" style={{ fontSize: '12.5px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> View Submitted Reports
          </Link>
          <Link to="/reports/cell" className="btn btn-primary" style={{ fontSize: '12.5px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            + Submit Cell Report
          </Link>
        </div>
      </div>

      {/* Section 7 KPI Cards: 50 Connect Groups Target & Health Distribution */}
      {level === 1 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
            marginBottom: '22px',
          }}
        >
          <div className="portal-card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Connect Groups
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
              {totalCells} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>/ 50 Target</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {Math.round((totalCells / 50) * 100)}% of 50 groups benchmark
            </div>
          </div>

          <div className="portal-card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Campus Zones
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--green)', marginTop: '4px' }}>
              {activeZonesCount} Zones
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              HQ, Hilltop, JSQ, Franco, Odenigwe...
            </div>
          </div>

          <div className="portal-card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Connected Members
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--blue)', marginTop: '4px' }}>
              {totalConnectedMembers} Members
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Mapped to campus residential zones
            </div>
          </div>

          <div className="portal-card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Meeting Benchmark
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--amber)', marginTop: '4px' }}>
              Saturdays 5:00 PM
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Weekly fellowship & discipleship
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 1: C1 [3x3 ZONES GRID] */}
      {level === 1 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                Campus Zones Directory (3x3 Grid)
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Click any zone card to inspect its Saturday Connect Groups and live member roster.
              </p>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search cell or leader..."
                value={cellSearchQuery}
                onChange={e => setCellSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '12.5px', height: '34px' }}
              />
            </div>
          </div>

          {/* Quick Search Results if search query is active */}
          {cellSearchQuery.trim() !== '' && (
            <div className="portal-card" style={{ padding: '18px 20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>
                Search Results matching "{cellSearchQuery}" ({cellLeaders.filter(c => c.cell_name.toLowerCase().includes(cellSearchQuery.toLowerCase()) || c.cell_leader.toLowerCase().includes(cellSearchQuery.toLowerCase()) || (c.assistant || '').toLowerCase().includes(cellSearchQuery.toLowerCase()) || (c.cell_address || '').toLowerCase().includes(cellSearchQuery.toLowerCase())).length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {cellLeaders
                  .filter(c =>
                    c.cell_name.toLowerCase().includes(cellSearchQuery.toLowerCase()) ||
                    c.cell_leader.toLowerCase().includes(cellSearchQuery.toLowerCase()) ||
                    (c.assistant || '').toLowerCase().includes(cellSearchQuery.toLowerCase()) ||
                    (c.cell_address || '').toLowerCase().includes(cellSearchQuery.toLowerCase())
                  )
                  .map(cell => (
                    <div
                      key={cell.id}
                      onClick={() => handleSelectCell(cell)}
                      style={{
                        background: 'var(--navy-soft)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#06b6d4')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{cell.cell_name}</span>
                        <span className="badge badge-blue" style={{ fontSize: '10px' }}>{cell.zone}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Leader: <strong>{cell.cell_leader}</strong></div>
                      {cell.assistant && cell.assistant !== '—' && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Assistant: {cell.assistant}</div>
                      )}
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={11} style={{ color: '#06b6d4' }} /> {cell.cell_address || 'Campus Venue'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '16px',
            }}
          >
            {groupedZones.map((zone, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectZone(zone)}
                className="portal-card"
                style={{
                  padding: '22px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#06b6d4';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Compass size={12} /> {zone.cells.length} Connect Groups
                    </span>
                    <ArrowRight size={15} style={{ color: '#06b6d4' }} />
                  </div>

                  <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                    {zone.name} Zone
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} style={{ color: '#06b6d4', flexShrink: 0 }} /> {zone.campusArea}
                  </p>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Zonal Lead: <strong>{zone.leader}</strong></span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Users size={12} /> {zone.memberCount} members
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 2: C2 [SATURDAY CELLS IN ZONE] */}
      {level === 2 && selectedZone && (
        <div>
          <button
            onClick={() => setLevel(1)}
            className="btn btn-outline"
            style={{ fontSize: '12.5px', padding: '6px 14px', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to 3x3 Zones Grid
          </button>

          <div className="portal-card" style={{ padding: '24px 28px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: '6px' }}>Zone Overview</span>
                <h3 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                  {selectedZone.name} Zone — Saturday Connect Groups ({selectedZone.cells.length})
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Zonal Lead: <strong>{selectedZone.leader}</strong> · Coverage: <strong>{selectedZone.campusArea}</strong> · Total Roster: <strong>{selectedZone.memberCount} Members</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/settings" className="btn btn-outline" style={{ fontSize: '12px' }}>
                  Edit in Settings
                </Link>
                <Link to="/reports/cell" className="btn btn-primary" style={{ fontSize: '12.5px' }}>
                  View Zone Reports
                </Link>
              </div>
            </div>
          </div>

          {selectedZone.cells.length === 0 ? (
            <div className="portal-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Compass size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#06b6d4' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No Connect Groups currently mapped to {selectedZone.name} Zone</h4>
              <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 16px' }}>
                Connect Groups can be assigned or created for this zone anytime in Settings under the Leadership Architecture tab.
              </p>
              <Link to="/settings" className="btn btn-primary" style={{ fontSize: '12.5px' }}>
                Open Settings to Add Cell
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {selectedZone.cells.map((cell, idx) => (
                <div
                  key={cell.id || idx}
                  onClick={() => handleSelectCell(cell)}
                  className="portal-card"
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#06b6d4';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span
                        className="badge badge-green"
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: 'var(--green)',
                        }}
                      >
                        Active Connect Cell #{idx + 1}
                      </span>
                      <ArrowRight size={14} style={{ color: '#06b6d4' }} />
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                      {cell.cell_name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} style={{ color: '#06b6d4', flexShrink: 0 }} /> {cell.cell_address || 'Campus Venue'}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text)' }}>
                      Cell Leader: <strong>{cell.cell_leader}</strong>
                    </p>
                    {cell.assistant && cell.assistant !== '—' && (
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Assistant: <strong>{cell.assistant}</strong>
                      </p>
                    )}
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> Saturday 5:00 PM
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEVEL 3: C3 [READ-ONLY MEMBER ROSTER WITH ROW NUMBERING #] */}
      {level === 3 && selectedCell && (
        <div className="portal-card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <button
                onClick={() => setLevel(2)}
                className="btn btn-outline"
                style={{ fontSize: '11.5px', padding: '4px 10px', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={13} /> Back to {selectedZone?.name} Cells
              </button>
              <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
                {selectedCell.cell_name} — Member Roster ({zoneMembers.filter(m => (m.member_name || '').toLowerCase().includes(memberSearch.toLowerCase())).length})
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Zone: <strong>{selectedCell.zone}</strong> · Leader: <strong>{selectedCell.cell_leader}</strong>
                {selectedCell.assistant && selectedCell.assistant !== '—' ? ` · Assistant: ${selectedCell.assistant}` : ''}
                {' '}· Venue: {selectedCell.cell_address || 'Campus Venue'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search roster..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '32px', fontSize: '12.5px', height: '34px' }}
                />
              </div>
              <button
                onClick={exportCellRosterCSV}
                className="btn btn-outline"
                style={{ fontSize: '11.5px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '34px' }}
                title="Export this cell roster to CSV"
              >
                <Download size={12} /> CSV
              </button>
              <button
                onClick={printCellRoster}
                className="btn btn-outline"
                style={{ fontSize: '11.5px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '34px' }}
                title="Print this cell roster"
              >
                <Printer size={12} /> Print
              </button>
              <Link to="/reports/cell" className="btn btn-primary" style={{ fontSize: '12px', padding: '7px 14px' }}>
                Submit Today's Cell Report
              </Link>
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy-soft)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '40px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>#</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Member Name</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Phone Number</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Address / Hostel</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Department</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Discipleship Level</th>
                </tr>
              </thead>
              <tbody>
                {loadingMembers ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading cell member roster...
                    </td>
                  </tr>
                ) : zoneMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No members currently mapped to this zone in the database.
                    </td>
                  </tr>
                ) : (
                  zoneMembers
                    .filter(m => (m.member_name || '').toLowerCase().includes(memberSearch.toLowerCase()))
                    .map((m, idx) => (
                      <tr
                        key={m.id}
                        style={{ borderBottom: idx === zoneMembers.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.12s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-soft)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>{m.member_name}</td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{m.phone || m.member_phone || '—'}</td>
                        <td style={{ padding: '12px' }}>{m.school_address || m.School_Address || '—'}</td>
                        <td style={{ padding: '12px' }}><span className="badge badge-blue">{m.department || 'General'}</span></td>
                        <td style={{ padding: '12px' }}><span className="badge badge-green">{m.membership_level || 'Member'}</span></td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
