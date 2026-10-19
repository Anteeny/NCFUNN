import React, { useState, useEffect, useMemo } from 'react';
import { getMostRecentServiceDate } from '../../lib/date';
import { memberService } from '../../services/member.service';
import { attendanceService, type ServiceSummary } from '../../services/attendance.service';
import type { Member, ServiceAttendanceRecord } from '../../types/database.types';
import {
  Search,
  Check,
  MessageSquare,
  Sparkles,
  UserPlus,
  Calendar,
  History,
  RefreshCw,
  X,
  Phone,
  MapPin,
  User,
  Users,
  CheckCircle2,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportToCSV } from '../../utils/exportUtils';

/**
 * Extracts the member's true first name from database records formatted as [Surname] [First Name] ...
 * Examples:
 * - "Meniru Chioma" -> "Chioma"
 * - "Akande Esther" -> "Esther"
 * - "Okafor Mmesoma Favour" -> "Mmesoma"
 * - "Xavier" -> "Xavier"
 */
function extractFirstName(fullName: string): string {
  if (!fullName) return 'there';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }
  // In NCF database records, parts[0] is surname, parts[1] is the first name
  const candidate = parts[1] || parts[0];
  return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
}

/**
 * Formats check-in timestamp cleanly as 12-hour local time (e.g. 09:15 AM)
 */
function formatTimeIn(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return isoString;
  }
}

/**
 * Exports a service attendance roster to an Excel-compatible CSV file
 */
// Export/print only require member_name; every other column has a fallback.
// This lets both live check-ins and history-folder records be exported.
type ExportableAttendance = Pick<ServiceAttendanceRecord, 'member_name'> &
  Partial<Omit<ServiceAttendanceRecord, 'member_name'>>;

function exportAttendanceCSV(date: string, type: string, records: ExportableAttendance[]) {
  if (!records || records.length === 0) {
    alert('No attendance records available to export for this service session.');
    return;
  }

  const headers = ['#', 'Member Name', 'Time In', 'Zone', 'Department', 'Service Date', 'Service Type'];
  const rows = records.map((r, idx) => [
    idx + 1,
    `"${(r.member_name || '').replace(/"/g, '""')}"`,
    `"${formatTimeIn(r.checked_in_at)}"`,
    `"${(r.zone || 'HQ').replace(/"/g, '""')}"`,
    `"${(r.department || 'General').replace(/"/g, '""')}"`,
    `"${r.service_date || date}"`,
    `"${r.service_type || type}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanDate = date.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanType = type.replace(/\s+/g, '_');
  link.setAttribute('download', `NCF_Attendance_${cleanDate}_${cleanType}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Opens a clean, print-ready document / PDF dialog for an attendance roster
 */
function printAttendanceRoster(date: string, type: string, records: ExportableAttendance[]) {
  if (!records || records.length === 0) {
    alert('No attendance records available to print.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rowsHtml = records
    .map(
      (r, idx) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px 10px; text-align: center; font-weight: 600; color: #6b7280;">${idx + 1}</td>
      <td style="padding: 8px 10px; font-weight: 600; color: #111827;">${r.member_name}</td>
      <td style="padding: 8px 10px; color: #374151;">${formatTimeIn(r.checked_in_at)}</td>
      <td style="padding: 8px 10px; color: #4b5563;">${r.zone || 'HQ'}</td>
      <td style="padding: 8px 10px; color: #4b5563;">${r.department || 'General'}</td>
    </tr>
  `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Attendance Roster - ${date} (${type})</title>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 32px;
            color: #111827;
            background: #ffffff;
          }
          .header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 18px;
          }
          h2 { margin: 0 0 4px; font-size: 20px; color: #1e3a8a; }
          .meta { font-size: 13px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 14px; }
          th {
            background: #f1f5f9;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 2px solid #cbd5e1;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: #475569;
          }
          .footer {
            margin-top: 24px;
            font-size: 11px;
            color: #9ca3af;
            text-align: right;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Dominion City UNN (NCF) — Service Attendance Roster</h2>
          <div class="meta">
            <strong>Service Date:</strong> ${date} &nbsp;|&nbsp;
            <strong>Service Type:</strong> ${type} &nbsp;|&nbsp;
            <strong>Total Checked In:</strong> ${records.length} Present
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">#</th>
              <th>Member Name</th>
              <th style="width: 120px;">Time In</th>
              <th style="width: 110px;">Zone</th>
              <th style="width: 140px;">Department</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          Generated via ChurchFlow Attendance Engine &nbsp;·&nbsp; ${new Date().toLocaleString()}
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

export const AttendancePage: React.FC = () => {
  const initialService = getMostRecentServiceDate();
  const [serviceDate, setServiceDate] = useState<string>(initialService.date);
  const [serviceType, setServiceType] = useState<string>(initialService.serviceType);

  // Active View Tab: 'tracker' | 'history'
  const [activeTab, setActiveTab] = useState<'tracker' | 'history'>('tracker');

  // Member Directory State (Full Roster without 100-member cap)
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Checked-In State from Supabase service_attendance
  const [savedCheckIns, setSavedCheckIns] = useState<ServiceAttendanceRecord[]>([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | number | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // MVP Fast Registration Modal
  const [showMvpModal, setShowMvpModal] = useState(false);
  const [mvpName, setMvpName] = useState('');
  const [mvpPhone, setMvpPhone] = useState('');
  const [mvpSchoolAddress, setMvpSchoolAddress] = useState('');
  const [savingMvp, setSavingMvp] = useState(false);
  const [mvpError, setMvpError] = useState<string | null>(null);

  // Past Service Summaries History & Folders
  const [historySummaries, setHistorySummaries] = useState<ServiceSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [historySearch, setHistorySearch] = useState<string>('');

  // 1. Load full member directory (Full database, no 100 cap)
  const loadFullRoster = async () => {
    try {
      setLoadingMembers(true);
      const res = await memberService.getMembers({ limit: 2000 });
      setMembers(res.data);
    } catch (err) {
      console.error('Error loading members for tracker:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadFullRoster();
  }, []);

  // 2. Load saved check-ins from Supabase for selected date & service type
  const loadSavedCheckIns = async () => {
    try {
      setLoadingCheckIns(true);
      const records = await attendanceService.getServiceAttendance(serviceDate, serviceType);
      setSavedCheckIns(records);
    } catch (err) {
      console.error('Error loading saved check-ins:', err);
    } finally {
      setLoadingCheckIns(false);
    }
  };

  useEffect(() => {
    loadSavedCheckIns();
  }, [serviceDate, serviceType]);

  // 3. Load past service history summaries when history tab is opened
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const summaries = await attendanceService.getServiceAttendanceHistory();
      setHistorySummaries(summaries);
      // Auto-expand all folders so ushers immediately see attendee lists
      const openMap: Record<string, boolean> = {};
      summaries.forEach(s => {
        openMap[s.id] = true;
      });
      setExpandedFolders(openMap);
    } catch (err) {
      console.error('Error loading service attendance history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const expandAllFolders = () => {
    const allOpen: Record<string, boolean> = {};
    historySummaries.forEach(s => (allOpen[s.id] = true));
    setExpandedFolders(allOpen);
  };

  const collapseAllFolders = () => {
    setExpandedFolders({});
  };

  // Filter service folders and records based on search term
  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return historySummaries;
    return historySummaries
      .map(folder => {
        const matchesDateOrType =
          folder.service_date.toLowerCase().includes(q) ||
          folder.service_type.toLowerCase().includes(q);
        const matchingRecords = folder.records.filter(r =>
          r.member_name.toLowerCase().includes(q)
        );
        if (matchesDateOrType) return folder;
        if (matchingRecords.length > 0) {
          return {
            ...folder,
            records: matchingRecords,
          };
        }
        return null;
      })
      .filter((f): f is ServiceSummary => f !== null);
  }, [historySummaries, historySearch]);

  // Map of checked-in member IDs to their attendance record
  const checkedInMap = useMemo(() => {
    const map = new Map<string, ServiceAttendanceRecord>();
    savedCheckIns.forEach(record => {
      map.set(String(record.member_id), record);
    });
    return map;
  }, [savedCheckIns]);

  // Handle Frictionless Check-in / Undo Toggle
  const handleToggleCheckIn = async (member: Member) => {
    const memberIdStr = String(member.id);
    const isCurrentlyChecked = checkedInMap.has(memberIdStr);

    try {
      setSubmittingId(member.id);

      if (isCurrentlyChecked) {
        // Undo Check-in
        await attendanceService.undoCheckIn(member.id, serviceDate, serviceType);
        setSavedCheckIns(prev => prev.filter(r => String(r.member_id) !== memberIdStr));
      } else {
        // Optimistic UI & Save to Supabase
        const newRecord = await attendanceService.checkInMember({
          member_id: member.id,
          member_name: member.member_name,
          service_date: serviceDate,
          service_type: serviceType,
          zone: member.zone || 'HQ',
          department: member.department || null,
        });

        setSavedCheckIns(prev => [newRecord, ...prev.filter(r => String(r.member_id) !== memberIdStr)]);

        try {
          confetti({
            particleCount: 22,
            spread: 45,
            origin: { y: 0.8 },
          });
        } catch (_) {}
      }
    } catch (err) {
      console.error('Check-in toggle failed:', err);
      // Reload from DB in case of desync
      loadSavedCheckIns();
    } finally {
      setSubmittingId(null);
    }
  };

  // Handle Instant MVP Registration & Check-in
  const handleRegisterAndCheckInMVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mvpName.trim()) {
      setMvpError('Please provide the full name.');
      return;
    }
    if (!mvpPhone.trim()) {
      setMvpError('Please provide a phone number.');
      return;
    }

    try {
      setSavingMvp(true);
      setMvpError(null);

      const { member: newMember, attendance } = await attendanceService.registerAndCheckInMVP({
        name: mvpName,
        phone: mvpPhone,
        schoolAddress: mvpSchoolAddress,
        serviceDate,
        serviceType,
      });

      // Add new member to local list and mark checked-in
      setMembers(prev => [newMember, ...prev]);
      setSavedCheckIns(prev => [attendance, ...prev]);

      // Reset & close modal
      setMvpName('');
      setMvpPhone('');
      setMvpSchoolAddress('');
      setShowMvpModal(false);

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (_) {}
    } catch (err: any) {
      console.error('Error saving MVP:', err);
      setMvpError(err.message || 'Failed to register MVP. Please try again.');
    } finally {
      setSavingMvp(false);
    }
  };

  // Filtered members roster
  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return members.filter(m => {
      // Zone filter
      if (selectedZone !== 'ALL' && (m.zone || '') !== selectedZone) {
        return false;
      }
      // Department filter
      if (selectedDept !== 'ALL' && (m.department || '') !== selectedDept) {
        return false;
      }
      // Text search
      if (!q) return true;
      const name = (m.member_name || '').toLowerCase();
      const phone = (m.phone || m.member_phone || '').toLowerCase();
      const dept = (m.department || '').toLowerCase();
      const zone = (m.zone || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || dept.includes(q) || zone.includes(q);
    });
  }, [members, search, selectedZone, selectedDept]);

  // Unique Zones & Departments for filtering
  const zones = useMemo(() => {
    const s = new Set<string>();
    members.forEach(m => {
      if (m.zone && m.zone.trim()) s.add(m.zone.trim());
    });
    return Array.from(s).sort();
  }, [members]);

  const departments = useMemo(() => {
    const s = new Set<string>();
    members.forEach(m => {
      if (m.department && m.department.trim()) s.add(m.department.trim());
    });
    return Array.from(s).sort();
  }, [members]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header Info & Mode Switcher */}
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--blue)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '4px',
            }}
          >
            <Sparkles size={14} /> Persistent Gate Check-In Engine
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            Service Gate & Attendance Tracker
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Directly records arrival timestamps and persists all check-ins to Supabase.
          </p>
        </div>

        {/* Counter Stats & Tab Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Live Synchronized Counters */}
          <div
            style={{
              background: 'var(--navy-soft)',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>
                {loadingCheckIns ? '...' : savedCheckIns.length}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Checked In
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '18px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                {loadingMembers ? '...' : members.length}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Full Roster
              </div>
            </div>
          </div>

          {/* Tab Toggle Buttons */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--navy-soft)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setActiveTab('tracker')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'tracker' ? 'var(--blue)' : 'transparent',
                color: activeTab === 'tracker' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={14} /> Live Check-In
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'history' ? 'var(--blue)' : 'transparent',
                color: activeTab === 'history' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              <History size={14} /> Service History
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: LIVE CHECK-IN TRACKER */}
      {activeTab === 'tracker' && (
        <>
          {/* Controls Bar: Date, Service Type, Search, Zone/Dept Filters, and Fast Add MVP */}
          <div
            className="portal-card"
            style={{
              padding: '18px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Top Row: Service Date, Service Type, Sync Status, and + Add MVP Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} style={{ color: 'var(--blue)' }} />
                  <input
                    type="date"
                    className="form-control"
                    value={serviceDate}
                    onChange={e => setServiceDate(e.target.value)}
                    style={{ fontSize: '13px', padding: '6px 10px', width: 'auto' }}
                  />
                </div>

                <select
                  className="form-control"
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  style={{ fontSize: '13px', padding: '6px 12px', width: 'auto' }}
                >
                  <option value="Sunday Service">Sunday Service</option>
                  <option value="Midweek Service">Midweek Service</option>
                  <option value="Special Meeting">Special Meeting</option>
                </select>

                <button
                  onClick={loadSavedCheckIns}
                  className="btn btn-outline"
                  title="Refresh saved check-ins"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <RefreshCw size={13} className={loadingCheckIns ? 'animate-spin' : ''} />
                </button>

                <button
                  onClick={() => exportAttendanceCSV(serviceDate, serviceType, savedCheckIns)}
                  className="btn btn-outline"
                  title="Export attendance roster to CSV / Excel"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Download size={13} /> Export CSV
                </button>

                <button
                  onClick={() => printAttendanceRoster(serviceDate, serviceType, savedCheckIns)}
                  className="btn btn-outline"
                  title="Print attendance roster / Save to PDF"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Printer size={13} /> Print Roster
                </button>
              </div>

              {/* Fast Add MVP Action */}
              <button
                onClick={() => {
                  setMvpName(search); // Pre-fill with searched name if applicable
                  setMvpError(null);
                  setShowMvpModal(true);
                }}
                className="btn btn-primary"
                style={{
                  fontSize: '12.5px',
                  padding: '7px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <UserPlus size={15} /> + Add Member (MVP)
              </button>
            </div>

            {/* Bottom Row: Full Search Bar & Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search full 358+ roster by name or phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: '36px', fontSize: '13px' }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Zone Filter */}
              <select
                className="form-control"
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                style={{ fontSize: '13px' }}
              >
                <option value="ALL">All Zones ({zones.length})</option>
                {zones.map(z => (
                  <option key={z} value={z}>
                    Zone: {z}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                className="form-control"
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                style={{ fontSize: '13px' }}
              >
                <option value="ALL">All Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d} value={d}>
                    Unit: {d}
                  </option>
                ))}
              </select>

              {/* Quick Export Filtered Roster Button */}
              <button
                onClick={() => {
                  const headers = ['#', 'Full Name', 'Phone', 'Gender', 'Department', 'Campus Zone', 'G12 Leader', 'Status Today'];
                  const rows = filteredMembers.map((m, idx) => [
                    idx + 1,
                    m.member_name,
                    m.phone || m.member_phone || '—',
                    m.gender || '—',
                    m.department || 'General',
                    m.zone || 'HQ',
                    m.g12_leader || m.leader || '—',
                    checkedInMap.has(String(m.id)) ? 'Checked In' : 'Not Checked In',
                  ]);
                  exportToCSV(`Live_Tracker_Roster_${serviceDate}`, headers, rows);
                }}
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                title="Export current filtered roster to CSV"
              >
                <Download size={13} /> Export Roster CSV
              </button>
            </div>
          </div>

          {/* Live Roster Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '14px',
            }}
          >
            {loadingMembers ? (
              <div className="portal-card" style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', display: 'block' }} />
                Loading complete member database...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div
                className="portal-card"
                style={{
                  gridColumn: '1 / -1',
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: 'var(--navy-soft)',
                }}
              >
                <UserPlus size={36} style={{ color: 'var(--blue)', margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  No member found matching "{search}"
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
                  If this person is a first-time visitor or not yet in the church registry, add them as an MVP now.
                </p>
                <button
                  onClick={() => {
                    setMvpName(search);
                    setMvpError(null);
                    setShowMvpModal(true);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', padding: '8px 20px' }}
                >
                  <UserPlus size={15} /> Add "{search || 'New MVP'}"
                </button>
              </div>
            ) : (
              filteredMembers.map(m => {
                const checkedRecord = checkedInMap.get(String(m.id));
                const isChecked = !!checkedRecord;
                const isBusy = submittingId === m.id;

                // Format time in if checked
                const timeInStr = checkedRecord?.checked_in_at
                  ? new Date(checkedRecord.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : null;

                return (
                  <div
                    key={m.id}
                    className="portal-card"
                    style={{
                      padding: '16px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      border: isChecked ? '1px solid var(--green)' : '1px solid var(--border)',
                      background: isChecked ? 'var(--green-bg)' : 'var(--card)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '14.5px',
                            fontWeight: 700,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {m.member_name}
                        </span>
                        {m.membership_level === 'MVP' && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'var(--amber-bg)',
                              color: 'var(--amber)',
                            }}
                          >
                            MVP
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {m.department || 'General'} · {m.zone || 'HQ'}
                        {timeInStr && (
                          <span style={{ color: 'var(--green)', fontWeight: 600, marginLeft: '6px' }}>
                            · In: {timeInStr}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* WhatsApp Greeting Action */}
                      {(m.phone || m.member_phone) && (() => {
                        const rawPhone = (m.phone || m.member_phone || '').replace(/[^0-9]/g, '');
                        const phone = rawPhone.startsWith('0') ? `234${rawPhone.slice(1)}` : rawPhone;
                        const firstName = extractFirstName(m.member_name);
                        const welcomeMsg = `Hey ${firstName}!  So good having you in church with us today😊! Hope you enjoyed the service!  We’d love to see you again next Sunday🗓️. Have an amazing week ahead! 💪✨`;

                        return (
                          <a
                            href={`https://wa.me/${phone}?text=${encodeURIComponent(welcomeMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                            style={{
                              padding: '6px 9px',
                              fontSize: '11px',
                              color: '#25D366',
                              borderColor: 'rgba(37, 211, 102, 0.3)',
                            }}
                            title={`Send WhatsApp welcome to ${m.member_name}`}
                          >
                            <MessageSquare size={13} />
                          </a>
                        );
                      })()}

                      {/* Frictionless Check-In Button */}
                      <button
                        onClick={() => handleToggleCheckIn(m)}
                        disabled={isBusy}
                        className={`btn ${isChecked ? 'btn-primary' : 'btn-outline'}`}
                        style={{
                          padding: '7px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: isChecked ? 'var(--green)' : 'transparent',
                          borderColor: isChecked ? 'var(--green)' : 'var(--border)',
                          minWidth: '100px',
                        }}
                      >
                        {isBusy ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : isChecked ? (
                          <>
                            <Check size={14} /> Checked
                          </>
                        ) : (
                          'Check In'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* VIEW 2: PREVIOUS SERVICE ATTENDANCE FOLDERS */}
      {activeTab === 'history' && (
        <div className="portal-card animate-fade-in" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontSize: '12px', fontWeight: 600 }}>
                <History size={14} /> Service Records
              </div>
              <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
                Service Attendance History
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Recorded service folders showing names present and time in.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={expandAllFolders}
                className="btn btn-outline"
                style={{ fontSize: '11.5px', padding: '5px 10px' }}
                title="Expand all service folders"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllFolders}
                className="btn btn-outline"
                style={{ fontSize: '11.5px', padding: '5px 10px' }}
                title="Collapse all service folders"
              >
                Collapse All
              </button>
              <button
                onClick={loadHistory}
                className="btn btn-outline"
                style={{ fontSize: '11.5px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} /> Refresh
              </button>
              <button
                onClick={() => {
                  const allRecords = historySummaries.flatMap(f => f.records);
                  exportAttendanceCSV('All_Services', 'Full_History', allRecords);
                }}
                className="btn btn-outline"
                style={{ fontSize: '11.5px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Export complete attendance history to CSV"
              >
                <Download size={13} /> Export All CSV
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search attendees or service dates..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              style={{ paddingLeft: '36px', fontSize: '13px' }}
            />
          </div>

          {loadingHistory ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading recorded service history...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {historySearch ? 'No attendance records matched your search.' : 'No service check-in sessions recorded yet. Check in members on the Live Check-In tab!'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredHistory.map(folder => {
                const isOpen = expandedFolders[folder.id] ?? true;
                return (
                  <div
                    key={folder.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'var(--navy-soft)',
                    }}
                  >
                    {/* Folder Header Banner */}
                    <div
                      onClick={() => toggleFolder(folder.id)}
                      style={{
                        padding: '14px 18px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isOpen ? (
                          <FolderOpen size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        ) : (
                          <Folder size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                            {folder.service_date}
                          </span>
                          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                            · {folder.service_type}
                          </span>
                          <span className="badge badge-green" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {folder.records.length} Present
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            exportAttendanceCSV(folder.service_date, folder.service_type, folder.records);
                          }}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Export this service roster to CSV"
                        >
                          <Download size={12} /> CSV
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            printAttendanceRoster(folder.service_date, folder.service_type, folder.records);
                          }}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Print this service session roster"
                        >
                          <Printer size={12} /> Print
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setServiceDate(folder.service_date);
                            setServiceType(folder.service_type);
                            setActiveTab('tracker');
                          }}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '4px 9px' }}
                          title="Open this date in the live check-in tracker"
                        >
                          Open in Tracker →
                        </button>
                        <div style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                      </div>
                    </div>

                    {/* Folder Table: Names Present & Time In */}
                    {isOpen && (
                      <div style={{ overflowX: 'auto' }}>
                        {folder.records.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                            No attendees recorded for this service session.
                          </div>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0, 0, 0, 0.15)', textAlign: 'left' }}>
                                <th style={{ padding: '10px 14px', color: 'var(--text-muted)', width: '45px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                                  #
                                </th>
                                <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                                  Names Present
                                </th>
                                <th style={{ padding: '10px 14px', color: 'var(--text-muted)', width: '160px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                                  Time In
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {folder.records.map((r, idx) => (
                                <tr
                                  key={r.id}
                                  style={{
                                    borderBottom: idx === folder.records.length - 1 ? 'none' : '1px solid var(--border)',
                                    transition: 'background 0.12s ease',
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-soft)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    {idx + 1}
                                  </td>
                                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text)' }}>
                                    {r.member_name}
                                  </td>
                                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontVariantNumeric: 'tabular-nums' }}>
                                      <Clock size={13} style={{ color: 'var(--blue)' }} />
                                      {formatTimeIn(r.checked_in_at)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FAST ADD MVP MODAL (ONLY 3 ESSENTIAL QUESTIONS) */}
      {showMvpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="portal-card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px 28px',
              border: '1px solid var(--border)',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber)', fontSize: '12px', fontWeight: 600 }}>
                  <UserPlus size={14} /> Gate Registration
                </div>
                <h3 className="font-serif" style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
                  Add Member (MVP)
                </h3>
              </div>
              <button
                onClick={() => setShowMvpModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Enter the 3 essential details. The member will be saved as an MVP and immediately checked in for {serviceDate}.
            </p>

            {mvpError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--red)',
                  color: 'var(--red)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                }}
              >
                {mvpError}
              </div>
            )}

            <form onSubmit={handleRegisterAndCheckInMVP} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Question 1: Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  1. Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Ebubechukwu Emmanuel"
                    className="form-control"
                    value={mvpName}
                    onChange={e => setMvpName(e.target.value)}
                    style={{ paddingLeft: '36px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Question 2: Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  2. Phone Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08123456789"
                    className="form-control"
                    value={mvpPhone}
                    onChange={e => setMvpPhone(e.target.value)}
                    style={{ paddingLeft: '36px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Question 3: School Address / Hostel */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  3. School Address / Hostel *
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 204, Alvan Hostel / Hilltop"
                    className="form-control"
                    value={mvpSchoolAddress}
                    onChange={e => setMvpSchoolAddress(e.target.value)}
                    style={{ paddingLeft: '36px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowMvpModal(false)}
                  className="btn btn-outline"
                  style={{ fontSize: '12.5px', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMvp}
                  className="btn btn-primary"
                  style={{ fontSize: '12.5px', padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {savingMvp ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving & Checking In...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Save & Check In
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
