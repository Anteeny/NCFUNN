import React, { useState, useEffect } from 'react';
import { getMostRecentServiceDate } from '../../lib/date';
import { searchLeaderDictionary, normalizeLeaderName } from '../../lib/leader-dictionary';
import { memberService } from '../../services/member.service';
import { reportService } from '../../services/report.service';
import type { Member, G12ReportRecord } from '../../types/database.types';
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Search,
  RefreshCw,
  FileText,
  Plus,
  Download,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportToCSV, printTable } from '../../utils/exportUtils';

interface MemberAttendanceState {
  member: Member;
  status: 'Present' | 'Absent';
  notes: string;
}

export const G12ReportPage: React.FC = () => {
  // Mode: 'view' (read submitted feedback) vs 'submit' (manual submission form)
  const [activeMode, setActiveMode] = useState<'view' | 'submit'>('view');

  // ================= VIEW SUBMITTED REPORTS STATE =================
  const [reportDates, setReportDates] = useState<{
    date: string;
    totalReported: number;
    leadersCount: number;
    present: number;
    absent: number;
  }[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [dateLeaders, setDateLeaders] = useState<{
    leader_name: string;
    presentCount: number;
    absentCount: number;
    totalReported: number;
    records: G12ReportRecord[];
  }[]>([]);
  const [loadingLeaderReports, setLoadingLeaderReports] = useState(false);
  const [selectedLeaderIndex, setSelectedLeaderIndex] = useState<number>(0);
  const [memberSearch, setMemberSearch] = useState<string>('');

  // ================= SUBMIT REPORT STATE =================
  const initialService = getMostRecentServiceDate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reportDate, setReportDate] = useState<string>(initialService.date);
  const [serviceType, setServiceType] = useState<string>(initialService.serviceType);
  const [leaderSearch, setLeaderSearch] = useState<string>('');
  const [selectedLeader, setSelectedLeader] = useState<string>('');
  const [leaderSuggestions, setLeaderSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [members, setMembers] = useState<MemberAttendanceState[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load available report dates
  const loadDates = async () => {
    try {
      setLoadingDates(true);
      const dates = await reportService.getG12ReportDates();
      setReportDates(dates);
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0].date);
      }
    } catch (err) {
      console.error('Error loading G12 report dates:', err);
    } finally {
      setLoadingDates(false);
    }
  };

  useEffect(() => {
    loadDates();
  }, []);

  // Load reports when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    const fetchReportsForDate = async () => {
      try {
        setLoadingLeaderReports(true);
        const leaders = await reportService.getG12ReportsForDate(selectedDate);
        setDateLeaders(leaders);
        setSelectedLeaderIndex(0);
      } catch (err) {
        console.error('Error loading leader reports for date:', err);
      } finally {
        setLoadingLeaderReports(false);
      }
    };
    fetchReportsForDate();
  }, [selectedDate]);

  // Current active leader in drilldown
  const activeLeader = dateLeaders[selectedLeaderIndex] || null;

  // Filter members under active leader by search
  const filteredDisciples = (activeLeader?.records || []).filter(r =>
    r.member_name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Overall metrics for selected date
  const overallDateSummary = reportDates.find(d => d.date === selectedDate) || {
    present: dateLeaders.reduce((acc, l) => acc + l.presentCount, 0),
    absent: dateLeaders.reduce((acc, l) => acc + l.absentCount, 0),
    totalReported: dateLeaders.reduce((acc, l) => acc + l.totalReported, 0),
    leadersCount: dateLeaders.length,
  };

  const attendancePercent = overallDateSummary.totalReported > 0
    ? Math.round((overallDateSummary.present / overallDateSummary.totalReported) * 100)
    : 0;

  // Navigation handlers
  const handlePrevLeader = () => {
    if (selectedLeaderIndex > 0) {
      setSelectedLeaderIndex(prev => prev - 1);
    }
  };

  const handleNextLeader = () => {
    if (selectedLeaderIndex < dateLeaders.length - 1) {
      setSelectedLeaderIndex(prev => prev + 1);
    }
  };

  // Service type for the selected date (taken from the submitted records)
  const selectedServiceType =
    dateLeaders.flatMap(l => l.records).find(r => r.service_type)?.service_type || 'G12 Meeting';

  const exportCurrentReportCSV = () => {
    if (!activeLeader) return;
    const filtered = (activeLeader.records || []).filter(d =>
      d.member_name.toLowerCase().includes(memberSearch.toLowerCase())
    );
    const headers = ['#', 'Disciple Name', 'Status', 'Notes / Reason', 'G12 Leader', 'Service Date', 'Service Type'];
    const rows = filtered.map((d, idx) => [
      idx + 1,
      d.member_name,
      d.status,
      d.notes || '—',
      activeLeader.leader_name,
      selectedDate,
      selectedServiceType,
    ]);
    exportToCSV(`G12_Report_${activeLeader.leader_name.replace(/\s+/g, '_')}_${selectedDate}`, headers, rows);
  };

  const printCurrentReport = () => {
    if (!activeLeader) return;
    const filtered = (activeLeader.records || []).filter(d =>
      d.member_name.toLowerCase().includes(memberSearch.toLowerCase())
    );
    const headers = ['#', 'Disciple Name', 'Status', 'Notes / Reason'];
    const rows = filtered.map((d, idx) => [
      idx + 1,
      d.member_name,
      d.status,
      d.notes || '—',
    ]);
    printTable(
      `G12 Discipleship Report · ${activeLeader.leader_name}`,
      [
        { label: 'Leader', value: activeLeader.leader_name },
        { label: 'Date', value: selectedDate },
        { label: 'Meeting', value: selectedServiceType },
        { label: 'Attendance', value: `${activeLeader.presentCount} / ${activeLeader.totalReported} Present` },
      ],
      headers,
      rows
    );
  };

  const exportAllLeadersDateCSV = () => {
    if (!dateLeaders || dateLeaders.length === 0) return;
    const allDisciples = dateLeaders.flatMap(l =>
      (l.records || []).map(d => ({ ...d, leader: l.leader_name }))
    );
    const headers = ['#', 'Disciple Name', 'Status', 'G12 Leader', 'Notes / Reason', 'Service Date', 'Service Type'];
    const rows = allDisciples.map((d, idx) => [
      idx + 1,
      d.member_name,
      d.status,
      d.leader,
      d.notes || '—',
      selectedDate,
      selectedServiceType,
    ]);
    exportToCSV(`G12_Full_Date_Report_${selectedDate}`, headers, rows);
  };

  // ================= SUBMIT HANDLERS =================
  useEffect(() => {
    if (leaderSearch.trim().length > 0) {
      const results = searchLeaderDictionary(leaderSearch);
      setLeaderSuggestions(results);
    } else {
      setLeaderSuggestions([]);
    }
  }, [leaderSearch]);

  const handleSelectLeader = (name: string) => {
    const canonical = normalizeLeaderName(name);
    setSelectedLeader(canonical);
    setLeaderSearch(canonical);
    setShowDropdown(false);
  };

  const handleLoadDisciples = async () => {
    if (!selectedLeader) {
      setErrorMsg('Please select a valid G12 Leader.');
      return;
    }
    setErrorMsg(null);
    setLoadingMembers(true);

    try {
      const disciples = await memberService.getMembersByLeader(selectedLeader);
      if (disciples.length === 0) {
        setErrorMsg(`No disciples found assigned to ${selectedLeader} in the members table.`);
        setLoadingMembers(false);
        return;
      }

      setMembers(
        disciples.map((m: Member) => ({
          member: m,
          status: 'Present',
          notes: '',
        }))
      );
      setStep(2);
    } catch (err: any) {
      setErrorMsg('Error loading disciples: ' + err.message);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleStatusChange = (index: number, status: 'Present' | 'Absent') => {
    setMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status };
      return updated;
    });
  };

  const handleNotesChange = (index: number, notes: string) => {
    setMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], notes };
      return updated;
    });
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const recordsToInsert: G12ReportRecord[] = members.map(m => ({
        report_date: reportDate,
        service_type: serviceType,
        leader_name: selectedLeader,
        member_name: m.member.member_name,
        status: m.status,
        notes: m.status === 'Absent' ? m.notes : undefined,
        zone: m.member.zone || undefined,
      }));

      await reportService.submitG12Report(recordsToInsert);
      setStep(3);
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (_) {}
      loadDates();
    } catch (err: any) {
      setErrorMsg('Failed to submit report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--amber)', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            <Users size={15} /> 5. G12 Discipleship Reports
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            G12 Cell Attendance Feedback
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Authoritative feedback submitted by G12 leaders for Wednesday & Sunday services.
          </p>
        </div>

        {/* View / Submit Mode Switcher */}
        <div style={{ display: 'flex', background: 'var(--navy-soft)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveMode('view')}
            className="btn"
            style={{
              padding: '7px 14px',
              fontSize: '12.5px',
              background: activeMode === 'view' ? 'var(--blue)' : 'transparent',
              color: activeMode === 'view' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '7px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={14} /> View Submitted Reports
          </button>
          <button
            onClick={() => {
              setActiveMode('submit');
              setStep(1);
            }}
            className="btn"
            style={{
              padding: '7px 14px',
              fontSize: '12.5px',
              background: activeMode === 'submit' ? 'var(--blue)' : 'transparent',
              color: activeMode === 'submit' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '7px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} /> Submit New Report
          </button>
        </div>
      </div>

      {/* ================= MODE 1: READ SUBMITTED FEEDBACK ================= */}
      {activeMode === 'view' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Date Selector Cards Carousel */}
          <div className="portal-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--blue)' }} /> Select Report Date (Wednesday / Sunday Schedule)
              </span>
              <button onClick={loadDates} className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }}>
                <RefreshCw size={12} className={loadingDates ? 'animate-spin' : ''} /> Refresh Dates
              </button>
            </div>

            {loadingDates ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading recorded report dates...
              </div>
            ) : reportDates.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No G12 reports have been recorded in Supabase yet.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  scrollbarWidth: 'thin',
                }}
              >
                {reportDates.map(d => {
                  const isSelected = d.date === selectedDate;
                  const dateObj = new Date(d.date);
                  const dayName = isNaN(dateObj.getTime())
                    ? ''
                    : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                  return (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDate(d.date)}
                      style={{
                        minWidth: '150px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--blue)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--navy-soft)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--blue)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {dayName || 'Service Date'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
                        {d.date}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px' }}>
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>{d.present} Pres.</span>
                        <span style={{ color: 'var(--rose, #f43f5e)' }}>{d.absent} Abs.</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Selected Date Overall Summary KPI Banner */}
          {selectedDate && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '14px',
              }}
            >
              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Present Disciples
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)', marginTop: '4px' }}>
                  {overallDateSummary.present}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Marked present on date
                </div>
              </div>

              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Absent Disciples
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--rose, #f43f5e)', marginTop: '4px' }}>
                  {overallDateSummary.absent}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  With documented notes
                </div>
              </div>

              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Reported
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                  {overallDateSummary.totalReported}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Disciples accounted for
                </div>
              </div>

              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Leaders Reporting
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                  {overallDateSummary.leadersCount} Leaders
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  G12 leaders submitted
                </div>
              </div>

              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  G12 Attendance Rate
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue)', marginTop: '4px' }}>
                  {attendancePercent}%
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Discipleship yield
                </div>
              </div>
            </div>
          )}

          {/* 3. Leader Drilldown View (One Leader at a Time with Prev / Next Navigation) */}
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            {loadingLeaderReports ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading G12 leader reports for {selectedDate}...
              </div>
            ) : dateLeaders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No leader submissions found for {selectedDate}.
              </div>
            ) : (
              <>
                {/* Leader Carousel Header with Prev / Next Controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <span className="badge badge-amber" style={{ fontSize: '11px', marginBottom: '6px' }}>
                      Leader {selectedLeaderIndex + 1} of {dateLeaders.length}
                    </span>
                    <h3 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                      {activeLeader?.leader_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      <span>Report Date: <strong>{selectedDate}</strong></span>
                      <span>·</span>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>{activeLeader?.presentCount} Present</span>
                      <span>·</span>
                      <span style={{ color: 'var(--rose, #f43f5e)', fontWeight: 600 }}>{activeLeader?.absentCount} Absent</span>
                      <span>·</span>
                      <span>
                        Attendance: <strong>{activeLeader && activeLeader.totalReported > 0 ? Math.round((activeLeader.presentCount / activeLeader.totalReported) * 100) : 0}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Navigation controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={handlePrevLeader}
                      disabled={selectedLeaderIndex === 0}
                      className="btn btn-outline"
                      style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ChevronLeft size={16} /> Previous Leader
                    </button>

                    <button
                      onClick={handleNextLeader}
                      disabled={selectedLeaderIndex >= dateLeaders.length - 1}
                      className="btn btn-outline"
                      style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Next Leader <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Quick Leader Pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '16px', scrollbarWidth: 'thin' }}>
                  {dateLeaders.map((l, idx) => {
                    const isCurrent = idx === selectedLeaderIndex;
                    return (
                      <button
                        key={l.leader_name}
                        onClick={() => setSelectedLeaderIndex(idx)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isCurrent ? '1px solid var(--amber)' : '1px solid var(--border)',
                          background: isCurrent ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                          color: isCurrent ? 'var(--amber)' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: isCurrent ? 700 : 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {l.leader_name} ({l.presentCount}/{l.totalReported})
                      </button>
                    );
                  })}
                </div>

                {/* Member Search Bar & Export Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Search disciples under ${activeLeader?.leader_name}...`}
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      style={{ paddingLeft: '36px', fontSize: '13px' }}
                    />
                  </div>
                  <button
                    onClick={exportCurrentReportCSV}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Export this leader's discipleship report to CSV"
                  >
                    <Download size={13} /> Export CSV
                  </button>
                  <button
                    onClick={printCurrentReport}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Print this leader's discipleship report"
                  >
                    <Printer size={13} /> Print
                  </button>
                  <button
                    onClick={exportAllLeadersDateCSV}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Export all leaders report for this date to CSV"
                  >
                    <Download size={13} /> Export All Leaders CSV
                  </button>
                </div>

                {/* Submitted Disciples Table */}
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy-soft)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '45px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          #
                        </th>
                        <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          Disciple Name
                        </th>
                        <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '130px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          Status
                        </th>
                        <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          Notes / Absence Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDisciples.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {memberSearch ? 'No disciples match search criteria.' : 'No disciples listed in this report.'}
                          </td>
                        </tr>
                      ) : (
                        filteredDisciples.map((d, idx) => {
                          const isPresent = d.status === 'Present';
                          return (
                            <tr
                              key={d.id || idx}
                              style={{
                                borderBottom: idx === filteredDisciples.length - 1 ? 'none' : '1px solid var(--border)',
                                transition: 'background 0.12s ease',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-soft)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>
                                {d.member_name}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span
                                  className={`badge ${isPresent ? 'badge-green' : 'badge-rose'}`}
                                  style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: isPresent ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                    color: isPresent ? 'var(--green)' : 'var(--rose, #f43f5e)',
                                    fontWeight: 700,
                                  }}
                                >
                                  {isPresent ? '✓ Present' : '✗ Absent'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                                {d.notes ? (
                                  <span style={{ color: 'var(--amber)', fontStyle: 'italic' }}>
                                    "{d.notes}"
                                  </span>
                                ) : isPresent ? (
                                  '—'
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>No note provided</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODE 2: SUBMIT REPORT WORKFLOW ================= */}
      {activeMode === 'submit' && (
        <>
          {step === 1 && (
            <div className="portal-card" style={{ padding: '32px 28px' }}>
              <h3 className="font-serif" style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Submit G12 Discipleship Report
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>
                Enter your service date and search for your name as the G12 Leader to load your assigned disciples.
              </p>

              {errorMsg && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid var(--red)',
                    color: 'var(--red)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={15} /> {errorMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    SERVICE DATE *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    SERVICE TYPE *
                  </label>
                  <select
                    className="form-control"
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value)}
                  >
                    <option value="Sunday Service">Sunday Service</option>
                    <option value="Wednesday Service">Wednesday Service</option>
                    <option value="Midweek Service">Midweek Service</option>
                    <option value="Special Service">Special Service</option>
                  </select>
                </div>
              </div>

              {/* Leader Autocomplete Search */}
              <div style={{ position: 'relative', marginBottom: '26px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  G12 LEADER NAME *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type your leader name..."
                  value={leaderSearch}
                  onChange={e => {
                    setLeaderSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />

                {showDropdown && leaderSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--navy-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 100,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                  >
                    {leaderSuggestions.map(l => (
                      <div
                        key={l}
                        onClick={() => handleSelectLeader(l)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: 'var(--text)',
                          borderBottom: '1px solid var(--border)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--navy-soft)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleLoadDisciples}
                disabled={loadingMembers}
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px' }}
              >
                {loadingMembers ? 'Loading Disciples...' : 'Load Assigned Disciples →'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="portal-card" style={{ padding: '32px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                    {selectedLeader}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {reportDate} · {serviceType}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {members.map((m, idx) => (
                  <div
                    key={m.member.id}
                    style={{
                      background: 'var(--navy-soft)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {idx + 1}. {m.member.member_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {m.member.phone || 'No phone'} · {m.member.zone || 'HQ'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, 'Present')}
                          className="btn"
                          style={{
                            fontSize: '12px',
                            padding: '6px 14px',
                            background: m.status === 'Present' ? 'var(--green)' : 'transparent',
                            color: m.status === 'Present' ? '#fff' : 'var(--text-muted)',
                            border: `1px solid ${m.status === 'Present' ? 'var(--green)' : 'var(--border)'}`,
                          }}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, 'Absent')}
                          className="btn"
                          style={{
                            fontSize: '12px',
                            padding: '6px 14px',
                            background: m.status === 'Absent' ? 'var(--rose, #f43f5e)' : 'transparent',
                            color: m.status === 'Absent' ? '#fff' : 'var(--text-muted)',
                            border: `1px solid ${m.status === 'Absent' ? 'var(--rose, #f43f5e)' : 'var(--border)'}`,
                          }}
                        >
                          Absent
                        </button>
                      </div>
                    </div>

                    {m.status === 'Absent' && (
                      <div style={{ marginTop: '10px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Reason for absence / notes..."
                          value={m.notes}
                          onChange={e => handleNotesChange(idx, e.target.value)}
                          style={{ fontSize: '12.5px', padding: '6px 10px' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {submitting ? 'Submitting G12 Report...' : 'Confirm & Submit G12 Report ✦'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="portal-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
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
                G12 Report Submitted!
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 28px' }}>
                Discipleship attendance for <strong>{selectedLeader}</strong> on {reportDate} ({serviceType}) has been recorded.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => {
                    setActiveMode('view');
                    setSelectedDate(reportDate);
                  }}
                  className="btn btn-primary"
                >
                  View Submitted Reports
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setLeaderSearch('');
                    setSelectedLeader('');
                    setMembers([]);
                  }}
                  className="btn btn-outline"
                >
                  Submit Another Report
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
