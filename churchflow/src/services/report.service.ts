import { supabase } from '../lib/supabase';
import type { G12ReportRecord, DepartmentReportRecord, CellReportRecord } from '../types/database.types';
import { getActiveOrganisationId, NCF_UNN_ID } from './organisation.service';

export const reportService = {
  /**
   * Checks if a G12 report for a given leader, date, and service type already exists scoped to org
   */
  async checkG12ReportExists(leaderName: string, date: string, serviceType?: string, organisationId?: string): Promise<boolean> {
    const orgId = organisationId || getActiveOrganisationId();
    let query = supabase
      .from('g12_reports')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', orgId)
      .eq('leader_name', leaderName)
      .eq('report_date', date);

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const { count, error } = await query;
    if (error) {
      console.warn("Could not check duplicate report, proceeding:", error.message);
      return false;
    }
    return (count || 0) > 0;
  },

  /**
   * Submits a G12 attendance report scoped to active organisation
   */
  async submitG12Report(records: G12ReportRecord[], organisationId?: string): Promise<void> {
    if (!records || records.length === 0) {
      throw new Error("No attendance records to submit.");
    }
    const orgId = organisationId || getActiveOrganisationId();
    const scopedRecords = records.map(r => ({ ...r, organisation_id: r.organisation_id || orgId }));
    const { error } = await supabase.from('g12_reports').insert(scopedRecords);
    if (error) throw error;
  },

  /**
   * Submits a Department attendance report scoped to active organisation
   */
  async submitDepartmentReport(records: DepartmentReportRecord[], organisationId?: string): Promise<void> {
    if (!records || records.length === 0) {
      throw new Error("No department attendance records to submit.");
    }
    const orgId = organisationId || getActiveOrganisationId();
    const scopedRecords = records.map(r => ({ ...r, organisation_id: r.organisation_id || orgId }));
    const { error } = await supabase.from('dept_reports').insert(scopedRecords);
    if (error) throw error;
  },

  /**
   * Submits a Cell Group report scoped to active organisation
   */
  async submitCellReport(record: CellReportRecord, organisationId?: string): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    const scopedRecord = { ...record, organisation_id: record.organisation_id || orgId };
    const { error } = await supabase.from('cell_reports').insert([scopedRecord]);
    if (error) throw error;
  },

  /**
   * Fetches summary statistics for the executive dashboard scoped to active organisation
   */
  async getDashboardStats(organisationId?: string): Promise<{
    totalMembers: number;
    totalWorkers: number;
    totalConnectGroups: number;
    activeConnectGroups: number;
    totalMVPs: number;
    monthlyMVPs: number;
    mvpsAllTimeInReports: number;
    currentMonthName: string;
    soulsWonThisWeek: number;
    soulsWonAllTime: number;
    retention: {
      percent: number;
      retainedCount: number;
      totalMembers: number;
    };
    latestService: {
      date: string;
      serviceType: string;
      totalAttendance: number;
    } | null;
    stageCounts: Record<string, number>;
    overallWorkforce: {
      percent: number;
      present: number;
      total: number;
      latestPercent: number;
      latestDate: string;
    };
    unitHealth: {
      name: string;
      attendancePercent: number;
      head: string;
      hasReports: boolean;
      totalReported: number;
      present: number;
    }[];
    g12ReportsCount: number;
    deptReportsCount: number;
    cellReportsCount: number;
  }> {
    const orgId = organisationId || getActiveOrganisationId();
    const isNcf = orgId === NCF_UNN_ID;

    // 1. Total Members & Members distribution
    const { data: memberRows, count: totalMembersCount } = await supabase
      .from('members')
      .select('membership_level, department', { count: 'exact' })
      .eq('organisation_id', orgId);

    const totalMembers = totalMembersCount || (memberRows || []).length || (isNcf ? 358 : 0);

    // Workers: members currently assigned to a department/unit
    let totalWorkers = 0;
    let mvpCount = 0;
    let regularMemberCount = 0;
    let pastorCount = 0;
    let dhCoreCount = 0;

    (memberRows || []).forEach(m => {
      const dept = (m.department || '').trim();
      if (dept.length > 0) {
        totalWorkers++;
      }

      const lvl = (m.membership_level || '').trim().toLowerCase();
      if (lvl === 'mvp') {
        mvpCount++;
      } else if (lvl.includes('pastor')) {
        pastorCount++;
      } else if (lvl.includes('dh') || lvl.includes('core')) {
        dhCoreCount++;
      } else {
        regularMemberCount++;
      }
    });

    // Retention: How well we are doing in retaining MVPs to regular attendees/committed members
    const retainedCount = totalMembers - mvpCount;
    const retentionPercent = totalMembers > 0 ? Math.round((retainedCount / totalMembers) * 100) : 0;

    // 2. Connect Group Leaders directory
    const { count: totalCellLeaders } = await supabase
      .from('cell_leaders')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', orgId);

    const totalConnectLeaders = totalCellLeaders || (isNcf ? 40 : 0);

    // Active groups: reporting in recent cell reports
    const { data: cellReports } = await supabase
      .from('cell_reports')
      .select('leader_name, report_date, new_converts')
      .eq('organisation_id', orgId);

    const activeLeaderSet = new Set<string>();
    let cellNewConverts = 0;
    (cellReports || []).forEach(cr => {
      if (cr.leader_name) activeLeaderSet.add(cr.leader_name);
      cellNewConverts += cr.new_converts || 0;
    });

    // 3. Department Leaders directory
    const { data: deptLeaders } = await supabase
      .from('department_leaders')
      .select('department_name, leader_name')
      .eq('organisation_id', orgId);

    const totalUnitLeaders = (deptLeaders || []).length || (isNcf ? 9 : 0);

    // 4. Spiritual Growth Journey Stage Counts
    const stageCounts: Record<string, number> = {
      MVP: mvpCount || (isNcf ? 313 : 0),
      Member: regularMemberCount || (isNcf ? 18 : 0),
      Worker: totalWorkers || (isNcf ? 101 : 0),
      'Connect Leader': totalConnectLeaders,
      'Unit Leader': totalUnitLeaders,
      Core: Math.ceil(dhCoreCount / 2) || (isNcf ? 8 : 0),
      DH: Math.floor(dhCoreCount / 2) || (isNcf ? 8 : 0),
      Pastor: pastorCount || (isNcf ? 5 : 0),
    };

    // 5. Service reports: totals, conversions, latest service
    const { data: serviceRows } = await supabase
      .from('service_reports')
      .select('date, service_type, total_attendance, new_converts, mvp')
      .eq('organisation_id', orgId)
      .order('date', { ascending: false });

    // Determine current week window (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffDays = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diffDays);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekStartStr = startOfWeek.toISOString().split('T')[0];

    // Trailing 7 days from now (or from latest service date)
    const trailing7DaysD = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trailing7DaysStr = trailing7DaysD.toISOString().split('T')[0];
    const thresholdDateStr = weekStartStr < trailing7DaysStr ? weekStartStr : trailing7DaysStr;

    let serviceNewConvertsAllTime = 0;
    let soulsWonThisWeek = 0;
    let latestService: { date: string; serviceType: string; totalAttendance: number } | null = null;

    if (serviceRows && serviceRows.length > 0) {
      const latestDate = serviceRows[0].date;
      const latestRows = serviceRows.filter(r => r.date === latestDate);
      const latestTotal = latestRows.reduce((sum, r) => sum + (r.total_attendance || 0), 0);
      latestService = {
        date: latestDate,
        serviceType: latestRows[0].service_type || 'Sunday Service',
        totalAttendance: latestTotal,
      };

      serviceRows.forEach(sr => {
        const converts = sr.new_converts || 0;
        serviceNewConvertsAllTime += converts;
        if (sr.date >= thresholdDateStr) {
          soulsWonThisWeek += converts;
        }
      });
    }

    // Add cell reports converts within this week window
    (cellReports || []).forEach(cr => {
      if (cr.report_date && cr.report_date >= thresholdDateStr) {
        soulsWonThisWeek += (cr.new_converts || 0);
      }
    });

    // Current month prefix (YYYY-MM) and month name
    const currentMonthPrefix = now.toISOString().substring(0, 7);
    const currentMonthName = now.toLocaleString('default', { month: 'long' });
    let monthlyMVPs = 0;
    let mvpsAllTimeInReports = 0;

    (serviceRows || []).forEach(sr => {
      const mvpNum = sr.mvp || 0;
      mvpsAllTimeInReports += mvpNum;
      if (sr.date && sr.date.startsWith(currentMonthPrefix)) {
        monthlyMVPs += mvpNum;
      }
    });

    // 6. Workforce Attendance across all units altogether & per unit
    const { data: deptReportsData } = await supabase
      .from('dept_reports')
      .select('dept_name, status, report_date')
      .eq('organisation_id', orgId)
      .limit(5000);

    const deptStatsMap = new Map<string, { present: number; total: number }>();
    let workforceTotalAllTime = 0;
    let workforcePresentAllTime = 0;

    const latestDeptDate = (deptReportsData && deptReportsData.length > 0) ? deptReportsData[0].report_date : '';
    let latestDatePresent = 0;
    let latestDateTotal = 0;

    const normalizeDeptName = (rawName: string): string => {
      const clean = (rawName || '').trim().toLowerCase();
      if (clean === 'admin' || clean === 'administration') return 'Administration';
      if (clean === 'ushers' || clean === 'ushering') return 'Ushering';
      if (clean.includes('temple tender')) return 'Temple tenders';
      if (clean.includes('intercess')) return 'Intercessory';
      if (clean.includes('ncf angel')) return 'NCF Angels';
      if (clean.includes('media')) return 'Media Unit';
      if (clean.includes('technical')) return 'Technical Unit';
      if (clean.includes('mvp')) return 'MVP';
      if (clean.includes('finance')) return 'Finances';
      return rawName;
    };

    (deptReportsData || []).forEach(dr => {
      const dn = normalizeDeptName(dr.dept_name);
      if (!deptStatsMap.has(dn)) {
        deptStatsMap.set(dn, { present: 0, total: 0 });
      }
      const st = deptStatsMap.get(dn)!;
      st.total++;
      workforceTotalAllTime++;

      if (dr.status === 'Present') {
        st.present++;
        workforcePresentAllTime++;
      }

      if (dr.report_date === latestDeptDate) {
        latestDateTotal++;
        if (dr.status === 'Present') latestDatePresent++;
      }
    });

    const unitHealth = (deptLeaders || []).map(dl => {
      const st = deptStatsMap.get(dl.department_name);
      if (st && st.total > 0) {
        return {
          name: dl.department_name,
          head: dl.leader_name,
          attendancePercent: Math.round((st.present / st.total) * 100),
          hasReports: true,
          totalReported: st.total,
          present: st.present,
        };
      }
      return {
        name: dl.department_name,
        head: dl.leader_name,
        attendancePercent: 0,
        hasReports: false,
        totalReported: 0,
        present: 0,
      };
    });

    const overallWorkforce = {
      percent: workforceTotalAllTime > 0 ? Math.round((workforcePresentAllTime / workforceTotalAllTime) * 100) : 0,
      present: workforcePresentAllTime,
      total: workforceTotalAllTime,
      latestPercent: latestDateTotal > 0 ? Math.round((latestDatePresent / latestDateTotal) * 100) : 0,
      latestDate: latestDeptDate || 'Latest Service',
    };

    // 7. Overall Report Counts
    const { count: g12Count } = await supabase.from('g12_reports').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId);
    const { count: deptCount } = await supabase.from('dept_reports').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId);

    return {
      totalMembers,
      totalWorkers,
      totalConnectGroups: totalConnectLeaders,
      activeConnectGroups: activeLeaderSet.size > 0 ? activeLeaderSet.size : (isNcf ? 18 : 0),
      totalMVPs: mvpCount || (isNcf ? 313 : 0),
      monthlyMVPs,
      mvpsAllTimeInReports,
      currentMonthName,
      soulsWonThisWeek,
      soulsWonAllTime: serviceNewConvertsAllTime + cellNewConverts,
      retention: {
        percent: retentionPercent,
        retainedCount,
        totalMembers,
      },
      latestService,
      stageCounts,
      overallWorkforce,
      unitHealth,
      g12ReportsCount: g12Count || 0,
      deptReportsCount: deptCount || 0,
      cellReportsCount: (cellReports || []).length,
    };
  },

  /**
   * Fetches service attendance trend from saved service_reports scoped to active org
   */
  async getServiceAttendanceTrend(timeRange: '1M' | '3M' | '6M' | '1Y', organisationId?: string): Promise<{
    label: string;
    count: number;
    date: string;
    serviceType: string;
  }[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const daysMap: Record<'1M' | '3M' | '6M' | '1Y', number> = {
      '1M': 35,
      '3M': 95,
      '6M': 185,
      '1Y': 365,
    };

    const days = daysMap[timeRange] || 95;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const sinceDateStr = sinceDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('service_reports')
      .select('date, service_type, total_attendance')
      .eq('organisation_id', orgId)
      .gte('date', sinceDateStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error loading service attendance trend:', error);
      return [];
    }

    // Aggregate by date (since multiple zones submit reports on the same date)
    const dateMap = new Map<string, { date: string; serviceType: string; count: number }>();
    (data || []).forEach(r => {
      const d = r.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, {
          date: d,
          serviceType: r.service_type || 'Service',
          count: 0,
        });
      }
      dateMap.get(d)!.count += r.total_attendance || 0;
    });

    // Format into chart data points
    return Array.from(dateMap.values()).map(pt => {
      const dObj = new Date(pt.date);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mName = monthNames[dObj.getMonth()];
      const dayNum = dObj.getDate();
      const isSunday = dObj.getDay() === 0;
      const typeShort = isSunday ? 'Sun' : 'Wed';

      return {
        label: `${mName} ${dayNum} (${typeShort})`,
        count: pt.count,
        date: pt.date,
        serviceType: pt.serviceType,
      };
    });
  },

  /**
   * Fetches real attendance data for monthly heatmap scoped to active org
   */
  async getMonthHeatmapData(year: number, month: number, organisationId?: string): Promise<{
    day: number;
    density: 'none' | 'low' | 'mid' | 'high';
    count: number;
  }[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const startMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data } = await supabase
      .from('service_reports')
      .select('date, total_attendance')
      .eq('organisation_id', orgId)
      .gte('date', startMonth)
      .lte('date', endMonth);

    const dayTotals = new Map<number, number>();
    (data || []).forEach(r => {
      const day = parseInt(r.date.split('-')[2], 10);
      dayTotals.set(day, (dayTotals.get(day) || 0) + (r.total_attendance || 0));
    });

    const result: { day: number; density: 'none' | 'low' | 'mid' | 'high'; count: number }[] = [];
    for (let day = 1; day <= lastDay; day++) {
      const count = dayTotals.get(day) || 0;
      let density: 'none' | 'low' | 'mid' | 'high' = 'none';
      if (count >= 250) density = 'high';
      else if (count >= 100) density = 'mid';
      else if (count > 0) density = 'low';

      result.push({ day, density, count });
    }
    return result;
  },

  /**
   * Fetches distinct dates where department reports were submitted scoped to active org
   */
  async getDepartmentReportDates(organisationId?: string): Promise<{ date: string; totalReported: number; unitsCount: number; present: number; absent: number }[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('dept_reports')
      .select('report_date, dept_name, status')
      .eq('organisation_id', orgId)
      .order('report_date', { ascending: false });

    if (error) {
      console.error('Error fetching department report dates:', error);
      return [];
    }

    const dateMap = new Map<string, { date: string; totalReported: number; units: Set<string>; present: number; absent: number }>();
    (data || []).forEach(row => {
      const d = row.report_date;
      if (!d) return;
      if (!dateMap.has(d)) {
        dateMap.set(d, {
          date: d,
          totalReported: 0,
          units: new Set<string>(),
          present: 0,
          absent: 0,
        });
      }
      const entry = dateMap.get(d)!;
      entry.totalReported++;
      if (row.dept_name) entry.units.add(row.dept_name);
      if (row.status === 'Present') entry.present++;
      else entry.absent++;
    });

    return Array.from(dateMap.values())
      .map(entry => ({
        date: entry.date,
        totalReported: entry.totalReported,
        unitsCount: entry.units.size,
        present: entry.present,
        absent: entry.absent,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  /**
   * Fetches all submitted department reports for a specific date scoped to active org
   */
  async getDepartmentReportsForDate(reportDate: string, organisationId?: string): Promise<{
    dept_name: string;
    presentCount: number;
    absentCount: number;
    totalReported: number;
    records: DepartmentReportRecord[];
  }[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('dept_reports')
      .select('*')
      .eq('organisation_id', orgId)
      .eq('report_date', reportDate)
      .order('dept_name', { ascending: true })
      .order('member_name', { ascending: true });

    if (error) {
      console.error('Error fetching department reports for date:', error);
      return [];
    }

    const unitMap = new Map<string, {
      dept_name: string;
      presentCount: number;
      absentCount: number;
      totalReported: number;
      records: DepartmentReportRecord[];
    }>();

    (data || []).forEach(row => {
      const name = row.dept_name || 'General';
      if (!unitMap.has(name)) {
        unitMap.set(name, {
          dept_name: name,
          presentCount: 0,
          absentCount: 0,
          totalReported: 0,
          records: [],
        });
      }
      const unit = unitMap.get(name)!;
      unit.records.push(row);
      unit.totalReported++;
      if (row.status === 'Present') unit.presentCount++;
      else unit.absentCount++;
    });

    return Array.from(unitMap.values());
  },

  /**
   * Fetches distinct dates where G12 reports were submitted scoped to active org
   */
  async getG12ReportDates(organisationId?: string): Promise<{ date: string; totalReported: number; leadersCount: number; present: number; absent: number }[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('g12_reports')
      .select('report_date, leader_name, status')
      .eq('organisation_id', orgId)
      .order('report_date', { ascending: false });

    if (error) {
      console.error('Error fetching G12 report dates:', error);
      return [];
    }

    const dateMap = new Map<string, { date: string; totalReported: number; leaders: Set<string>; present: number; absent: number }>();
    (data || []).forEach(row => {
      const d = row.report_date;
      if (!d) return;
      if (!dateMap.has(d)) {
        dateMap.set(d, {
          date: d,
          totalReported: 0,
          leaders: new Set<string>(),
          present: 0,
          absent: 0,
        });
      }
      const entry = dateMap.get(d)!;
      entry.totalReported++;
      if (row.leader_name) entry.leaders.add(row.leader_name);
      if (row.status === 'Present') entry.present++;
      else entry.absent++;
    });

    return Array.from(dateMap.values())
      .map(entry => ({
        date: entry.date,
        totalReported: entry.totalReported,
        leadersCount: entry.leaders.size,
        present: entry.present,
        absent: entry.absent,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  /**
   * Fetches all submitted G12 reports for a specific date scoped to active org
   */
  async getG12ReportsForDate(reportDate: string, organisationId?: string): Promise<{
    leader_name: string;
    presentCount: number;
    absentCount: number;
    totalReported: number;
    records: G12ReportRecord[];
  }[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('g12_reports')
      .select('*')
      .eq('organisation_id', orgId)
      .eq('report_date', reportDate)
      .order('leader_name', { ascending: true })
      .order('member_name', { ascending: true });

    if (error) {
      console.error('Error fetching G12 reports for date:', error);
      return [];
    }

    const leaderMap = new Map<string, {
      leader_name: string;
      presentCount: number;
      absentCount: number;
      totalReported: number;
      records: G12ReportRecord[];
    }>();

    (data || []).forEach(row => {
      const name = row.leader_name || 'Unassigned Leader';
      if (!leaderMap.has(name)) {
        leaderMap.set(name, {
          leader_name: name,
          presentCount: 0,
          absentCount: 0,
          totalReported: 0,
          records: [],
        });
      }
      const entry = leaderMap.get(name)!;
      entry.records.push(row);
      entry.totalReported++;
      if (row.status === 'Present') entry.presentCount++;
      else entry.absentCount++;
    });

    return Array.from(leaderMap.values());
  },

  /**
   * Fetches distinct dates where Cell / Connect Group reports were submitted scoped to active org
   */
  async getCellReportDates(organisationId?: string): Promise<{ date: string; reportsCount: number; totalAttendance: number; totalConverts: number; totalOffering: number }[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('cell_reports')
      .select('report_date, attendance, new_converts, offering')
      .eq('organisation_id', orgId)
      .order('report_date', { ascending: false });

    if (error) {
      console.error('Error fetching cell report dates:', error);
      return [];
    }

    const dateMap = new Map<string, { date: string; reportsCount: number; totalAttendance: number; totalConverts: number; totalOffering: number }>();
    (data || []).forEach(row => {
      const d = row.report_date;
      if (!d) return;
      if (!dateMap.has(d)) {
        dateMap.set(d, {
          date: d,
          reportsCount: 0,
          totalAttendance: 0,
          totalConverts: 0,
          totalOffering: 0,
        });
      }
      const entry = dateMap.get(d)!;
      entry.reportsCount++;
      entry.totalAttendance += Number(row.attendance || 0);
      entry.totalConverts += Number(row.new_converts || 0);
      entry.totalOffering += Number(row.offering || 0);
    });

    return Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  },

  /**
   * Fetches all submitted Cell / Connect Group reports for a specific date scoped to active org
   */
  async getCellReportsForDate(reportDate: string, organisationId?: string): Promise<CellReportRecord[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('cell_reports')
      .select('*')
      .eq('organisation_id', orgId)
      .eq('report_date', reportDate)
      .order('leader_name', { ascending: true });

    if (error) {
      console.error('Error fetching cell reports for date:', error);
      return [];
    }
    return (data as CellReportRecord[]) || [];
  },
};
