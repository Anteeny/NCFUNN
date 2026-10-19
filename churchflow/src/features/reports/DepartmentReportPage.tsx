import React, { useState, useEffect } from 'react';
import { formatWATDateString } from '../../lib/date';
import { memberService } from '../../services/member.service';
import { reportService } from '../../services/report.service';
import type { Member, DepartmentReportRecord } from '../../types/database.types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  FileText,
  Download,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLeadership } from '../../hooks/useLeadership';
import { exportToCSV, printTable } from '../../utils/exportUtils';

const DEFAULT_FALLBACK_DEPTS = [
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

interface NewJoiner {
  name: string;
  phone: string;
  address: string;
}

export const DepartmentReportPage: React.FC = () => {
  const { departmentLeaders } = useLeadership();
  const availableDepts = departmentLeaders.length > 0
    ? departmentLeaders.map(dl => dl.department_name)
    : DEFAULT_FALLBACK_DEPTS;

  // Mode: 'view' (read submitted feedback) vs 'submit' (manual submission form)
  const [activeMode, setActiveMode] = useState<'view' | 'submit'>('view');

  // ================= VIEW SUBMITTED REPORTS STATE =================
  const [reportDates, setReportDates] = useState<{
    date: string;
    totalReported: number;
    unitsCount: number;
    present: number;
    absent: number;
  }[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [dateUnits, setDateUnits] = useState<{
    dept_name: string;
    presentCount: number;
    absentCount: number;
    totalReported: number;
    records: DepartmentReportRecord[];
  }[]>([]);
  const [loadingUnitReports, setLoadingUnitReports] = useState(false);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);
  const [workerSearch, setWorkerSearch] = useState<string>('');

  // ================= SUBMIT REPORT STATE =================
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [department, setDepartment] = useState<string>('');
  const [submitReportDate, setSubmitReportDate] = useState<string>(formatWATDateString());
  const [zoneFilter, setZoneFilter] = useState<'ALL' | 'HQ'>('ALL');
  const [workers, setWorkers] = useState<{ member: Member; status: 'Present' | 'Absent'; reason: string }[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [newJoiners, setNewJoiners] = useState<NewJoiner[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load available report dates
  const loadDates = async () => {
    try {
      setLoadingDates(true);
      const dates = await reportService.getDepartmentReportDates();
      setReportDates(dates);
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0].date);
      }
    } catch (err) {
      console.error('Error loading department report dates:', err);
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
        setLoadingUnitReports(true);
        const units = await reportService.getDepartmentReportsForDate(selectedDate);
        setDateUnits(units);
        setSelectedUnitIndex(0);
      } catch (err) {
        console.error('Error loading unit reports for date:', err);
      } finally {
        setLoadingUnitReports(false);
      }
    };
    fetchReportsForDate();
  }, [selectedDate]);

  // Current active unit in drilldown
  const activeUnit = dateUnits[selectedUnitIndex] || null;

  // Filter workers in active unit by search
  const filteredWorkers = (activeUnit?.records || []).filter(r =>
    r.member_name.toLowerCase().includes(workerSearch.toLowerCase())
  );

  // Metrics for selected date
  const overallDateSummary = reportDates.find(d => d.date === selectedDate) || {
    present: dateUnits.reduce((acc, u) => acc + u.presentCount, 0),
    absent: dateUnits.reduce((acc, u) => acc + u.absentCount, 0),
    totalReported: dateUnits.reduce((acc, u) => acc + u.totalReported, 0),
    unitsCount: dateUnits.length,
  };

  const attendancePercent = overallDateSummary.totalReported > 0
    ? Math.round((overallDateSummary.present / overallDateSummary.totalReported) * 100)
    : 0;

  // Navigation handlers
  const handlePrevUnit = () => {
    if (selectedUnitIndex > 0) {
      setSelectedUnitIndex(prev => prev - 1);
    }
  };

  const handleNextUnit = () => {
    if (selectedUnitIndex < dateUnits.length - 1) {
      setSelectedUnitIndex(prev => prev + 1);
    }
  };

  const exportCurrentDeptReportCSV = () => {
    if (!activeUnit) return;
    const filtered = (activeUnit.workers || []).filter(w =>
      w.worker_name.toLowerCase().includes(workerSearch.toLowerCase())
    );
    const headers = ['#', 'Worker Name', 'Status', 'Absence Reason', 'Department', 'Service Date', 'Service Type'];
    const rows = filtered.map((w, idx) => [
      idx + 1,
      w.worker_name,
      w.status,
      w.absence_reason || '—',
      activeUnit.dept_name,
      selectedDate,
      selectedServiceType,
    ]);
    exportToCSV(`Dept_Report_${activeUnit.dept_name.replace(/\s+/g, '_')}_${selectedDate}`, headers, rows);
  };

  const printCurrentDeptReport = () => {
    if (!activeUnit) return;
    const filtered = (activeUnit.workers || []).filter(w =>
      w.worker_name.toLowerCase().includes(workerSearch.toLowerCase())
    );
    const headers = ['#', 'Worker Name', 'Status', 'Absence Reason'];
    const rows = filtered.map((w, idx) => [
      idx + 1,
      w.worker_name,
      w.status,
      w.absence_reason || '—',
    ]);
    printTable(
      `Department Attendance Report · ${activeUnit.dept_name}`,
      [
        { label: 'Department', value: activeUnit.dept_name },
        { label: 'Date', value: selectedDate },
        { label: 'Meeting', value: selectedServiceType },
        { label: 'Attendance', value: `${activeUnit.presentCount} / ${activeUnit.totalReported} Present` },
      ],
      headers,
      rows
    );
  };

  const exportAllDeptsDateCSV = () => {
    if (!dateUnits || dateUnits.length === 0) return;
    const allWorkers = dateUnits.flatMap(u =>
      (u.workers || []).map(w => ({ ...w, dept: u.dept_name }))
    );
    const headers = ['#', 'Worker Name', 'Status', 'Department', 'Absence Reason', 'Service Date', 'Service Type'];
    const rows = allWorkers.map((w, idx) => [
      idx + 1,
      w.worker_name,
      w.status,
      w.dept,
      w.absence_reason || '—',
      selectedDate,
      selectedServiceType,
    ]);
    exportToCSV(`Dept_Full_Date_Report_${selectedDate}`, headers, rows);
  };

  // ================= SUBMIT HANDLERS =================
  const handleLoadWorkers = async () => {
    if (!department) {
      setErrorMsg('Please select your department.');
      return;
    }
    setErrorMsg(null);
    setLoadingWorkers(true);

    try {
      const data = await memberService.getMembersByDepartment(department);
      const filtered = zoneFilter === 'HQ' ? data.filter(m => (m.zone || 'HQ').toUpperCase() === 'HQ') : data;

      setWorkers(
        filtered.map(m => ({
          member: m,
          status: 'Present',
          reason: '',
        }))
      );
      setStep(2);
    } catch (err: any) {
      setErrorMsg('Failed to load department roster: ' + err.message);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleStatusChange = (index: number, status: 'Present' | 'Absent') => {
    setWorkers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status };
      return copy;
    });
  };

  const handleReasonChange = (index: number, reason: string) => {
    setWorkers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], reason };
      return copy;
    });
  };

  const handleAddNewJoiner = () => {
    setNewJoiners(prev => [...prev, { name: '', phone: '', address: '' }]);
  };

  const handleRemoveNewJoiner = (index: number) => {
    setNewJoiners(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewJoinerChange = (index: number, field: keyof NewJoiner, val: string) => {
    setNewJoiners(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const recordsToInsert: DepartmentReportRecord[] = workers.map(w => ({
        dept_name: department,
        report_date: submitReportDate,
        member_name: w.member.member_name,
        status: w.status,
        reason_for_absence: w.status === 'Absent' ? w.reason : undefined,
      }));

      await reportService.submitDepartmentReport(recordsToInsert);

      for (const j of newJoiners) {
        if (j.name.trim()) {
          await memberService.createMember({
            member_name: j.name.trim(),
            phone: j.phone.trim(),
            school_address: j.address.trim(),
            department: department,
            membership_level: 'Worker',
            joined_date: submitReportDate,
          });
        }
      }

      setStep(3);
      try {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      } catch (_) {}
      loadDates();
    } catch (err: any) {
      setErrorMsg('Failed to submit department report: ' + err.message);
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            <Layers size={15} /> 5. Department & Unit Reports
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            Department Attendance Feedback
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Authoritative feedback submitted by unit leaders for Wednesday & Sunday services.
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
                No department reports have been recorded in Supabase yet.
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
                  Present Workers
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
                  Absent Workers
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--rose, #f43f5e)', marginTop: '4px' }}>
                  {overallDateSummary.absent}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  With documented reasons
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
                  Workers accounted for
                </div>
              </div>

              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Report Coverage
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
                  {overallDateSummary.unitsCount} / 12
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Executive units reporting
                </div>
              </div>

              <div className="portal-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Workforce Attendance
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue)', marginTop: '4px' }}>
                  {attendancePercent}%
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Attendance yield
                </div>
              </div>
            </div>
          )}

          {/* 3. Unit Drilldown View (One Unit at a Time with Prev / Next Navigation) */}
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            {loadingUnitReports ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading unit attendance records for {selectedDate}...
              </div>
            ) : dateUnits.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No unit submissions found for {selectedDate}.
              </div>
            ) : (
              <>
                {/* Unit Carousel Header with Prev / Next Controls */}
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
                    <span className="badge badge-blue" style={{ fontSize: '11px', marginBottom: '6px' }}>
                      Unit {selectedUnitIndex + 1} of {dateUnits.length}
                    </span>
                    <h3 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                      {activeUnit?.dept_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      <span>Report Date: <strong>{selectedDate}</strong></span>
                      <span>·</span>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>{activeUnit?.presentCount} Present</span>
                      <span>·</span>
                      <span style={{ color: 'var(--rose, #f43f5e)', fontWeight: 600 }}>{activeUnit?.absentCount} Absent</span>
                      <span>·</span>
                      <span>
                        Attendance: <strong>{activeUnit && activeUnit.totalReported > 0 ? Math.round((activeUnit.presentCount / activeUnit.totalReported) * 100) : 0}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Navigation controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={handlePrevUnit}
                      disabled={selectedUnitIndex === 0}
                      className="btn btn-outline"
                      style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ChevronLeft size={16} /> Previous Unit
                    </button>

                    <button
                      onClick={handleNextUnit}
                      disabled={selectedUnitIndex >= dateUnits.length - 1}
                      className="btn btn-outline"
                      style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Next Unit <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Quick Unit Pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '16px', scrollbarWidth: 'thin' }}>
                  {dateUnits.map((u, idx) => {
                    const isCurrent = idx === selectedUnitIndex;
                    return (
                      <button
                        key={u.dept_name}
                        onClick={() => setSelectedUnitIndex(idx)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isCurrent ? '1px solid var(--blue)' : '1px solid var(--border)',
                          background: isCurrent ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                          color: isCurrent ? 'var(--blue)' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: isCurrent ? 700 : 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {u.dept_name} ({u.presentCount}/{u.totalReported})
                      </button>
                    );
                  })}
                </div>

                {/* Worker Search Bar & Export Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Search workers in ${activeUnit?.dept_name}...`}
                      value={workerSearch}
                      onChange={e => setWorkerSearch(e.target.value)}
                      style={{ paddingLeft: '36px', fontSize: '13px' }}
                    />
                  </div>
                  <button
                    onClick={exportCurrentDeptReportCSV}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Export this department report to CSV"
                  >
                    <Download size={13} /> Export CSV
                  </button>
                  <button
                    onClick={printCurrentDeptReport}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Print this department report"
                  >
                    <Printer size={13} /> Print
                  </button>
                  <button
                    onClick={exportAllDeptsDateCSV}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Export all departments report for this date to CSV"
                  >
                    <Download size={13} /> Export All Units CSV
                  </button>
                </div>

                {/* Submitted Workers Table */}
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy-soft)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '45px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          #
                        </th>
                        <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          Worker Name
                        </th>
                        <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '130px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          Status
                        </th>
                        <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          Reason for Absence
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {workerSearch ? 'No workers match search criteria.' : 'No workers listed in this report.'}
                          </td>
                        </tr>
                      ) : (
                        filteredWorkers.map((w, idx) => {
                          const isPresent = w.status === 'Present';
                          return (
                            <tr
                              key={w.id || idx}
                              style={{
                                borderBottom: idx === filteredWorkers.length - 1 ? 'none' : '1px solid var(--border)',
                                transition: 'background 0.12s ease',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-soft)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>
                                {w.member_name}
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
                                {w.reason_for_absence ? (
                                  <span style={{ color: 'var(--amber)', fontStyle: 'italic' }}>
                                    "{w.reason_for_absence}"
                                  </span>
                                ) : isPresent ? (
                                  '—'
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>No reason provided</span>
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
                Submit Department Attendance
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>
                Reports can also be submitted at <strong>reports.ncfun.site</strong>. Choose your department and service date to load your active roster.
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

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  DEPARTMENT *
                </label>
                <select
                  className="form-control"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                >
                  <option value="">— Select Department —</option>
                  {availableDepts.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '26px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    REPORT DATE *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={submitReportDate}
                    onChange={e => setSubmitReportDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    ZONE FILTER
                  </label>
                  <select
                    className="form-control"
                    value={zoneFilter}
                    onChange={e => setZoneFilter(e.target.value as any)}
                  >
                    <option value="ALL">All Campus Zones</option>
                    <option value="HQ">HQ Workers Only</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleLoadWorkers}
                disabled={loadingWorkers}
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px' }}
              >
                {loadingWorkers ? 'Loading Department Roster...' : 'Load Worker Attendance Roster →'}
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
                    {department}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {submitReportDate} · {zoneFilter === 'HQ' ? 'HQ Only' : 'All Zones'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {workers.map((w, idx) => (
                  <div
                    key={w.member.id}
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
                          {idx + 1}. {w.member.member_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {w.member.phone || 'No phone'} · {w.member.zone || 'HQ'}
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
                            background: w.status === 'Present' ? 'var(--green)' : 'transparent',
                            color: w.status === 'Present' ? '#fff' : 'var(--text-muted)',
                            border: `1px solid ${w.status === 'Present' ? 'var(--green)' : 'var(--border)'}`,
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
                            background: w.status === 'Absent' ? 'var(--rose, #f43f5e)' : 'transparent',
                            color: w.status === 'Absent' ? '#fff' : 'var(--text-muted)',
                            border: `1px solid ${w.status === 'Absent' ? 'var(--rose, #f43f5e)' : 'var(--border)'}`,
                          }}
                        >
                          Absent
                        </button>
                      </div>
                    </div>

                    {w.status === 'Absent' && (
                      <div style={{ marginTop: '10px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Reason for absence (e.g. sick, exams, traveled)..."
                          value={w.reason}
                          onChange={e => handleReasonChange(idx, e.target.value)}
                          style={{ fontSize: '12.5px', padding: '6px 10px' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* New Joiners Section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    New Joiners / New Recruits ({newJoiners.length})
                  </span>
                  <button
                    onClick={handleAddNewJoiner}
                    className="btn btn-outline"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    <Plus size={12} /> Add New Joiner
                  </button>
                </div>

                {newJoiners.map((j, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full Name"
                      value={j.name}
                      onChange={e => handleNewJoinerChange(i, 'name', e.target.value)}
                      style={{ fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Phone"
                      value={j.phone}
                      onChange={e => handleNewJoinerChange(i, 'phone', e.target.value)}
                      style={{ fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="School Address"
                      value={j.address}
                      onChange={e => handleNewJoinerChange(i, 'address', e.target.value)}
                      style={{ fontSize: '12px' }}
                    />
                    <button
                      onClick={() => handleRemoveNewJoiner(i)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--rose, #f43f5e)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {submitting ? 'Submitting Department Report...' : 'Confirm & Submit Report ✦'}
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
                Department Report Submitted!
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 28px' }}>
                Thank you. Worker attendance for <strong>{department}</strong> on {submitReportDate} has been recorded.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => {
                    setActiveMode('view');
                    setSelectedDate(submitReportDate);
                  }}
                  className="btn btn-primary"
                >
                  View Submitted Reports
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setDepartment('');
                    setWorkers([]);
                    setNewJoiners([]);
                  }}
                  className="btn btn-outline"
                >
                  Submit Another Department
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
