import React, { useState, useEffect } from 'react';
import { formatWATDateString } from '../../lib/date';
import { reportService } from '../../services/report.service';
import type { CellReportRecord } from '../../types/database.types';
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  Compass,
  FileText,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  Download,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportToCSV, printTable } from '../../utils/exportUtils';

const ZONES = ['ALL', 'HQ', 'Odenigwe', 'Odim', 'Hilltop', 'Franco', 'JSQ', 'Greenhouse', 'Ede-Oballa'];

export const CellReportPage: React.FC = () => {
  // Mode: 'view' (read submitted feedback) vs 'submit' (manual submission form)
  const [activeMode, setActiveMode] = useState<'view' | 'submit'>('view');

  // ================= VIEW SUBMITTED REPORTS STATE =================
  const [reportDates, setReportDates] = useState<{
    date: string;
    reportsCount: number;
    totalAttendance: number;
    totalConverts: number;
    totalOffering: number;
  }[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [cellReports, setCellReports] = useState<CellReportRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchLeader, setSearchLeader] = useState<string>('');

  // ================= SUBMIT REPORT STATE =================
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    zone: 'HQ',
    leaderName: '',
    location: '',
    timeIn: '17:00',
    timeOut: '18:30',
    attendance: '',
    newConverts: '0',
    offering: '0',
    refreshments: false,
    notes: '',
    reportDate: formatWATDateString(),
  });

  const loadDates = async () => {
    try {
      setLoadingDates(true);
      const dates = await reportService.getCellReportDates();
      setReportDates(dates);
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0].date);
      }
    } catch (err) {
      console.error('Error loading cell report dates:', err);
    } finally {
      setLoadingDates(false);
    }
  };

  useEffect(() => {
    loadDates();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const fetchReportsForDate = async () => {
      try {
        setLoadingReports(true);
        const reports = await reportService.getCellReportsForDate(selectedDate);
        setCellReports(reports);
      } catch (err) {
        console.error('Error loading cell reports for date:', err);
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReportsForDate();
  }, [selectedDate]);

  // Overall date metrics
  const activeDateSummary = reportDates.find(d => d.date === selectedDate) || {
    reportsCount: cellReports.length,
    totalAttendance: cellReports.reduce((acc, r) => acc + Number(r.attendance || 0), 0),
    totalConverts: cellReports.reduce((acc, r) => acc + Number(r.new_converts || 0), 0),
    totalOffering: cellReports.reduce((acc, r) => acc + Number(r.offering || 0), 0),
  };

  // Filter cell reports by Zone & Leader Search
  const filteredCellReports = cellReports.filter(r => {
    const matchesZone = selectedZone === 'ALL' || (r.location || '').toLowerCase().includes(selectedZone.toLowerCase());
    const matchesSearch = !searchLeader || (r.leader_name || '').toLowerCase().includes(searchLeader.toLowerCase());
    return matchesZone && matchesSearch;
  });

  const exportCellReportsCSV = () => {
    if (filteredCellReports.length === 0) return;
    const headers = ['#', 'Group Leader', 'Location / Venue', 'Meeting Time', 'Attendance', 'New Converts', 'Offering (NGN)', 'Report Date'];
    const rows = filteredCellReports.map((r, idx) => [
      idx + 1,
      r.leader_name,
      r.location || 'Campus Venue',
      r.time_in || '5:00 PM',
      r.attendance,
      r.new_converts,
      r.offering,
      r.report_date,
    ]);
    exportToCSV(`Connect_Reports_${selectedDate}_${selectedZone}`, headers, rows);
  };

  const printCellReports = () => {
    if (filteredCellReports.length === 0) return;
    const headers = ['#', 'Group Leader', 'Location / Venue', 'Attendance', 'Converts', 'Offering (NGN)'];
    const rows = filteredCellReports.map((r, idx) => [
      idx + 1,
      r.leader_name,
      r.location || 'Campus Venue',
      r.attendance,
      r.new_converts,
      `₦${Number(r.offering || 0).toLocaleString()}`,
    ]);
    printTable(
      `Saturday Connect Reports · ${selectedDate}`,
      [
        { label: 'Date', value: selectedDate },
        { label: 'Zone Filter', value: selectedZone === 'ALL' ? 'All Zones' : `${selectedZone} Zone` },
        { label: 'Reports Submitted', value: filteredCellReports.length },
      ],
      headers,
      rows
    );
  };

  // ================= SUBMIT HANDLERS =================
  const handleChange = (field: string, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.leaderName.trim() || !form.location.trim() || !form.attendance) {
      setErrorMsg('Please fill in the leader name, cell venue/location, and attendance count.');
      return;
    }

    setSubmitting(true);
    try {
      const record: CellReportRecord = {
        leader_name: form.leaderName.trim(),
        location: `${form.zone} - ${form.location.trim()}`,
        time_in: form.timeIn,
        time_out: form.timeOut,
        attendance: parseInt(form.attendance, 10) || 0,
        new_converts: parseInt(form.newConverts, 10) || 0,
        offering: parseFloat(form.offering) || 0,
        refreshments: form.refreshments,
        notes: form.notes.trim(),
        report_date: form.reportDate,
      };

      await reportService.submitCellReport(record);

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (_) {}

      setSubmitted(true);
      loadDates();
    } catch (err: any) {
      setErrorMsg('Error submitting report: ' + err.message);
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#06b6d4', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            <Compass size={15} /> 5. Saturday Connect Group Reports
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            Saturday Connect Group Feedback
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Submitted cell meeting records across campus zones: leader, location, attendance, converts, and offering.
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
              setSubmitted(false);
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
            <Plus size={14} /> Submit Cell Report
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
                <Calendar size={14} style={{ color: '#06b6d4' }} /> Select Saturday Meeting Date
              </span>
              <button onClick={loadDates} className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }}>
                <RefreshCw size={12} className={loadingDates ? 'animate-spin' : ''} /> Refresh Dates
              </button>
            </div>

            {loadingDates ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading recorded Saturday dates...
              </div>
            ) : reportDates.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No Connect Group reports recorded in Supabase yet.
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
                        border: isSelected ? '2px solid #06b6d4' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--navy-soft)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#06b6d4' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {dayName || 'Saturday'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
                        {d.date}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px' }}>
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>{d.totalAttendance} Attend.</span>
                        <span style={{ color: '#06b6d4' }}>{d.reportsCount} Reports</span>
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
                  Total Attendance
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)', marginTop: '4px' }}>
                  {activeDateSummary.totalAttendance}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Members gathered in cells
                </div>
              </div>

              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Reports Received
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
                  {activeDateSummary.reportsCount} Groups
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Cell leaders reporting
                </div>
              </div>

              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  New Converts
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--amber)', marginTop: '4px' }}>
                  {activeDateSummary.totalConverts}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Souls won at Saturday cells
                </div>
              </div>

              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Offering
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                  ₦{activeDateSummary.totalOffering.toLocaleString()}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Collected at meetings
                </div>
              </div>
            </div>
          )}

          {/* 3. Connect Groups Table View (Zone -> Leader Report) */}
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            {/* Zone Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'thin' }}>
                {ZONES.map(z => {
                  const isCurrent = selectedZone === z;
                  return (
                    <button
                      key={z}
                      onClick={() => setSelectedZone(z)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: isCurrent ? '1px solid #06b6d4' : '1px solid var(--border)',
                        background: isCurrent ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        color: isCurrent ? '#06b6d4' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: isCurrent ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {z === 'ALL' ? 'All Zones' : `${z} Zone`}
                    </button>
                  );
                })}
              </div>

              {/* Search Leader & Export Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: '200px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Filter by leader name..."
                    value={searchLeader}
                    onChange={e => setSearchLeader(e.target.value)}
                    style={{ paddingLeft: '32px', fontSize: '12.5px', padding: '6px 12px 6px 32px' }}
                  />
                </div>
                {filteredCellReports.length > 0 && (
                  <>
                    <button
                      onClick={exportCellReportsCSV}
                      className="btn btn-outline"
                      style={{ fontSize: '11.5px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Export these connect reports to CSV"
                    >
                      <Download size={12} /> CSV
                    </button>
                    <button
                      onClick={printCellReports}
                      className="btn btn-outline"
                      style={{ fontSize: '11.5px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Print these connect reports"
                    >
                      <Printer size={12} /> Print
                    </button>
                  </>
                )}
              </div>
            </div>

            {loadingReports ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading Connect Group reports for {selectedDate}...
              </div>
            ) : filteredCellReports.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No Connect Group reports match the selected zone and search filters.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy-soft)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '45px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        #
                      </th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Group Leader
                      </th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Venue / Location
                      </th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '120px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Meeting Time
                      </th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '100px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Attendance
                      </th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '90px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Converts
                      </th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '100px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Offering
                      </th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '90px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Refreshment
                      </th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Notes / Observations
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCellReports.map((r, idx) => (
                      <tr
                        key={r.id || idx}
                        style={{
                          borderBottom: idx === filteredCellReports.length - 1 ? 'none' : '1px solid var(--border)',
                          transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-soft)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>
                          {r.leader_name}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} style={{ color: '#06b6d4' }} /> {r.location}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {r.time_in && r.time_out ? `${r.time_in} - ${r.time_out}` : r.time_in || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span className="badge badge-green" style={{ fontWeight: 700 }}>
                            {r.attendance}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: Number(r.new_converts || 0) > 0 ? 'var(--amber)' : 'var(--text-muted)' }}>
                          {r.new_converts || 0}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>
                          ₦{Number(r.offering || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {r.refreshments ? (
                            <span style={{ color: 'var(--green)', fontSize: '11px', fontWeight: 700 }}>✓ Yes</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {r.notes ? (
                            <span style={{ fontStyle: 'italic' }}>"{r.notes}"</span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODE 2: SUBMIT REPORT FORM ================= */}
      {activeMode === 'submit' && (
        <>
          {submitted ? (
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
                Connect Group Report Submitted!
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 28px' }}>
                Thank you. Saturday meeting attendance for <strong>{form.leaderName}</strong> on {form.reportDate} has been recorded.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => {
                    setActiveMode('view');
                    setSelectedDate(form.reportDate);
                  }}
                  className="btn btn-primary"
                >
                  View Submitted Reports
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({
                      zone: 'HQ',
                      leaderName: '',
                      location: '',
                      timeIn: '17:00',
                      timeOut: '18:30',
                      attendance: '',
                      newConverts: '0',
                      offering: '0',
                      refreshments: false,
                      notes: '',
                      reportDate: formatWATDateString(),
                    });
                  }}
                  className="btn btn-outline"
                >
                  Submit Another Cell Report
                </button>
              </div>
            </div>
          ) : (
            <div className="portal-card" style={{ padding: '32px 28px' }}>
              <h3 className="font-serif" style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Submit Saturday Connect Group Report
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Reports can also be submitted at <strong>reports.ncfun.site</strong>. Fill out the cell meeting feedback below.
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
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={15} /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      MEETING DATE *
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.reportDate}
                      onChange={e => handleChange('reportDate', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      CAMPUS ZONE *
                    </label>
                    <select
                      className="form-control"
                      value={form.zone}
                      onChange={e => handleChange('zone', e.target.value)}
                    >
                      {ZONES.filter(z => z !== 'ALL').map(z => (
                        <option key={z} value={z}>
                          {z} Zone
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      CELL LEADER NAME *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Bro. Emmanuel"
                      value={form.leaderName}
                      onChange={e => handleChange('leaderName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    CELL VENUE / LOCATION *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Flat 14 Quad, Franco Hostel Common Room"
                    value={form.location}
                    onChange={e => handleChange('location', e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      TIME IN *
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={form.timeIn}
                      onChange={e => handleChange('timeIn', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      TIME OUT *
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={form.timeOut}
                      onChange={e => handleChange('timeOut', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      TOTAL ATTENDANCE *
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      placeholder="Count present"
                      value={form.attendance}
                      onChange={e => handleChange('attendance', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      NEW CONVERTS (SOULS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={form.newConverts}
                      onChange={e => handleChange('newConverts', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      OFFERING (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={form.offering}
                      onChange={e => handleChange('offering', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={form.refreshments}
                      onChange={e => handleChange('refreshments', e.target.checked)}
                      style={{ accentColor: '#06b6d4', width: '16px', height: '16px' }}
                    />
                    Were refreshments served at this meeting?
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    NOTES & OBSERVATIONS
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="General feedback, prayer requests, or cell growth notes..."
                    value={form.notes}
                    onChange={e => handleChange('notes', e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '6px' }}
                >
                  {submitting ? 'Submitting Connect Group Report...' : 'Submit Cell Report ✦'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};
