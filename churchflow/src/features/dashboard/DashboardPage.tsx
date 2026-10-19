import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { AttendanceHeatmap } from '../../components/ui/AttendanceHeatmap';
import { reportService } from '../../services/report.service';
import { memberService } from '../../services/member.service';
import type { Member } from '../../types/database.types';
import { Users, UserCheck, Compass, HeartHandshake, Flame, ArrowRight, TrendingUp, PhoneCall, ShieldCheck, Sparkles, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBentoConfig } from '../../hooks/useBentoConfig';
import { exportToCSV } from '../../utils/exportUtils';

type TimeRange = '1M' | '3M' | '6M' | '1Y';

export const DashboardPage: React.FC = () => {
  const { config } = useBentoConfig();
  const [stats, setStats] = useState<{
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
  }>({
    totalMembers: 0,
    totalWorkers: 0,
    totalConnectGroups: 40,
    activeConnectGroups: 0,
    totalMVPs: 0,
    monthlyMVPs: 0,
    mvpsAllTimeInReports: 0,
    currentMonthName: '',
    soulsWonThisWeek: 0,
    soulsWonAllTime: 0,
    retention: { percent: 0, retainedCount: 0, totalMembers: 0 },
    latestService: null,
    stageCounts: {},
    overallWorkforce: { percent: 0, present: 0, total: 0, latestPercent: 0, latestDate: '' },
    unitHealth: [],
  });

  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');
  const [loading, setLoading] = useState(true);
  const [chartPoints, setChartPoints] = useState<{ label: string; count: number; date: string; serviceType: string }[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [heatmapData, setHeatmapData] = useState<{ day: number; density: 'none' | 'low' | 'mid' | 'high'; count: number }[]>([]);

  // Initial dashboard metrics loading
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashStats, membersRes, initialTrend, heatmapPoints] = await Promise.all([
          reportService.getDashboardStats(),
          memberService.getMembers({ limit: config.recentMembers.limit || 6 }),
          reportService.getServiceAttendanceTrend('3M'),
          reportService.getMonthHeatmapData(new Date().getFullYear(), new Date().getMonth() + 1),
        ]);

        setStats({
          totalMembers: dashStats.totalMembers,
          totalWorkers: dashStats.totalWorkers,
          totalConnectGroups: dashStats.totalConnectGroups,
          activeConnectGroups: dashStats.activeConnectGroups,
          totalMVPs: dashStats.totalMVPs,
          monthlyMVPs: dashStats.monthlyMVPs,
          mvpsAllTimeInReports: dashStats.mvpsAllTimeInReports,
          currentMonthName: dashStats.currentMonthName,
          soulsWonThisWeek: dashStats.soulsWonThisWeek,
          soulsWonAllTime: dashStats.soulsWonAllTime,
          retention: dashStats.retention,
          latestService: dashStats.latestService,
          stageCounts: dashStats.stageCounts,
          overallWorkforce: dashStats.overallWorkforce,
          unitHealth: dashStats.unitHealth,
        });
        setRecentMembers(membersRes.data);
        setChartPoints(initialTrend);
        setHeatmapData(heatmapPoints);
      } catch (err) {
        console.error('Dashboard data load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Update chart when timeRange button changes
  useEffect(() => {
    async function updateChart() {
      try {
        setLoadingChart(true);
        const pts = await reportService.getServiceAttendanceTrend(timeRange);
        setChartPoints(pts);
      } catch (err) {
        console.error('Trend update error:', err);
      } finally {
        setLoadingChart(false);
      }
    }

    updateChart();
  }, [timeRange]);

  const maxVal = Math.max(...chartPoints.map(p => p.count), 100);

  return (
    <div className="animate-fade-in">
      {/* Bento Grid Top Row: KPI Metric Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {config.kpiCards
          .filter(c => c.visible)
          .map(c => {
            let val = '...';
            let subtitle = c.subtitle;
            if (!loading) {
              const id = c.id;
              const title = (c.title || '').toLowerCase();
              if (id === 'p1-members' || (title.includes('member') && !title.includes('retention') && !title.includes('worker'))) {
                val = stats.totalMembers.toLocaleString();
                subtitle = 'Active Church Database';
              } else if (id === 'p2-workers' || title.includes('worker')) {
                val = stats.totalWorkers.toLocaleString();
                subtitle = 'People in Units/Depts';
              } else if (id === 'p3-connect' || title.includes('connect')) {
                val = `${stats.totalConnectGroups}`;
                subtitle = `${stats.totalConnectGroups} Current Connect Leaders`;
              } else if (id === 'p4-mvp' || title.includes('mvp') || title.includes('first-timer')) {
                val = stats.monthlyMVPs.toLocaleString();
                subtitle = `${stats.currentMonthName || 'This Month'} (${stats.mvpsAllTimeInReports.toLocaleString()} in Service Reports)`;
              } else if (id === 'p5-converts' || title.includes('soul') || title.includes('convert')) {
                val = stats.soulsWonThisWeek.toLocaleString();
                subtitle = `This Week (${stats.soulsWonAllTime.toLocaleString()} Total)`;
              } else if (id === 'ret-retention' || title.includes('retention') || title.includes('latest service')) {
                val = `${stats.retention.percent}%`;
                subtitle = `${stats.retention.retainedCount} of ${stats.retention.totalMembers} Retained to Regular`;
              }
            }

            const iconMap: Record<string, React.ReactNode> = {
              Users: <Users size={20} />,
              UserCheck: <UserCheck size={20} />,
              Compass: <Compass size={20} />,
              HeartHandshake: <HeartHandshake size={20} />,
              Flame: <Flame size={20} />,
              TrendingUp: <TrendingUp size={20} />,
            };

            return (
              <StatCard
                key={c.id}
                title={`${c.code ? `${c.code}: ` : ''}${c.title}`}
                value={val}
                icon={iconMap[c.iconName] || <Users size={20} />}
                iconBgColor={c.accentBg}
                iconColor={c.accentColor}
                trend={c.trend}
                subtitle={subtitle}
              />
            );
          })}
      </div>

      {/* D3: Service Attendance Line Chart: 1M / 3M / 6M / 1Y */}
      <div className="portal-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue)', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              <TrendingUp size={15} /> Live Service Attendance Analytics
            </div>
            <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
              Sunday & Midweek Attendance Growth Curve
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Calculated from saved service reports in Supabase
            </span>
          </div>

          {/* Timeframe Toggle Buttons (1M / 3M / 6M / 1Y) */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--navy-soft)', padding: '4px', borderRadius: '10px' }}>
            {(['1M', '3M', '6M', '1Y'] as TimeRange[]).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: timeRange === t ? 'var(--blue)' : 'transparent',
                  color: timeRange === t ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Responsive SVG Line Chart */}
        {loadingChart ? (
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading attendance records...
          </div>
        ) : chartPoints.length === 0 ? (
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--navy-soft)', borderRadius: '10px' }}>
            No service attendance records submitted for this timeframe.
          </div>
        ) : (
          <div style={{ height: '220px', width: '100%', position: 'relative', marginTop: '10px' }}>
            <svg viewBox="0 0 800 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid horizontal guidelines */}
              <line x1="0" y1="40" x2="800" y2="40" stroke="var(--border)" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="800" y2="100" stroke="var(--border)" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="800" y2="160" stroke="var(--border)" strokeDasharray="4 4" />

              {/* Polygon Area Fill */}
              {chartPoints.length > 1 && (
                <polygon
                  fill="url(#chartGradient)"
                  points={`0,190 ${chartPoints
                    .map((pt, i) => {
                      const x = (i / (chartPoints.length - 1)) * 780 + 10;
                      const y = 190 - (pt.count / maxVal) * 160;
                      return `${x},${y}`;
                    })
                    .join(' ')} 800,190`}
                />
              )}

              {/* Line Path */}
              {chartPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartPoints
                    .map((pt, i) => {
                      const x = (i / (chartPoints.length - 1)) * 780 + 10;
                      const y = 190 - (pt.count / maxVal) * 160;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Interactive Data Dots & Labels */}
              {chartPoints.map((pt, i) => {
                const x = chartPoints.length > 1 ? (i / (chartPoints.length - 1)) * 780 + 10 : 400;
                const y = 190 - (pt.count / maxVal) * 160;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
                    <text x={x} y={y - 10} fill="var(--text)" fontSize="11" fontWeight="700" textAnchor="middle">
                      {pt.count}
                    </text>
                    <text x={x} y="196" fill="var(--text-muted)" fontSize="10" textAnchor="middle">
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Bento Block: Spiritual Growth Journey (8 Stages) */}
      <div className="portal-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green)', fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>
              <Sparkles size={14} /> Discipleship Progression Pipeline
            </div>
            <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
              {config.growthJourney.title}
            </h3>
          </div>
          <Link to="/discipleship" className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>
            Manage Pipeline <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {config.growthJourney.stages.map(st => {
            const t = st.title.toLowerCase();
            let count = 0;
            if (st.level === 1 || t.includes('mvp')) count = stats.stageCounts['MVP'] || 0;
            else if (st.level === 2 || (t.includes('member') && !t.includes('mvp'))) count = stats.stageCounts['Member'] || 0;
            else if (st.level === 3 || t.includes('worker')) count = stats.stageCounts['Worker'] || stats.totalWorkers || 101;
            else if (st.level === 4 || t.includes('connect')) count = stats.stageCounts['Connect Leader'] || stats.totalConnectGroups || 40;
            else if (st.level === 5 || t.includes('unit leader') || t.includes('departmental')) count = stats.stageCounts['Unit Leader'] || stats.unitHealth.length || 9;
            else if (st.level === 6 || t.includes('core')) count = stats.stageCounts['Core'] || 8;
            else if (st.level === 7 || t.includes('dh') || t.includes('directorate')) count = stats.stageCounts['DH'] || 8;
            else if (st.level === 8 || t.includes('pastor')) count = stats.stageCounts['Pastor'] || 5;

            return (
              <div
                key={st.level}
                style={{
                  background: 'var(--navy-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Stage {st.level}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: `${st.badgeColor}22`,
                      color: st.badgeColor,
                    }}
                  >
                    {loading ? '...' : `${count}`}
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>
                  {st.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bento Block: Directorate Health & Priority Follow-Up Queue */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Directorate Health */}
        <div className="portal-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>
                <ShieldCheck size={14} /> Unit Workforce Attendance
              </div>
              <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                {config.directorateHealth.title}
              </h3>
            </div>
            <Link to="/departments" className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 10px' }}>
              All Units →
            </Link>
          </div>

          {/* Overall Workforce Attendance Banner */}
          <div
            style={{
              background: 'var(--navy-soft)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Workforce Attendance (Altogether)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {stats.overallWorkforce.present} of {stats.overallWorkforce.total} unit members' attendances recorded altogether
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: stats.overallWorkforce.percent >= 70 ? 'var(--green)' : 'var(--blue)',
                }}
              >
                {stats.overallWorkforce.percent}%
              </span>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Latest Service: {stats.overallWorkforce.latestPercent}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(stats.unitHealth.length > 0 ? stats.unitHealth : config.directorateHealth.items.map(u => ({
              name: u.name,
              head: u.head,
              attendancePercent: u.attendancePercent,
              hasReports: true,
              totalReported: 0,
              present: 0,
            }))).map(u => (
              <div key={u.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Leader: {u.head} ·{' '}
                    {u.hasReports ? (
                      <strong style={{ color: u.attendancePercent >= 75 ? 'var(--green)' : 'var(--amber)' }}>
                        {u.attendancePercent}% attendance
                      </strong>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No reports recorded</span>
                    )}
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--navy-soft)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: u.hasReports ? `${u.attendancePercent}%` : '0%',
                      background: u.attendancePercent >= 75 ? 'var(--green)' : 'var(--blue)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Follow-Up Queue */}
        <div className="portal-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>
                <PhoneCall size={14} /> Assimilation Pipeline
              </div>
              <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                {config.priorityFollowUps.title}
              </h3>
            </div>
            <Link to="/mvp" className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 10px' }}>
              View Queue →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {config.priorityFollowUps.items.map(f => (
              <div
                key={f.id}
                style={{
                  background: 'var(--navy-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {f.description}
                  </div>
                </div>
                <span className={`badge ${f.urgency === 'high' ? 'badge-amber' : 'badge-blue'}`}>
                  {stats.totalMVPs > 0 ? `${stats.totalMVPs} in Queue` : 'Queue Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Heatmap & Primary Modules Launcher */}
      {(config.attendanceHeatmap.visible || config.primaryModules.visible) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          {config.attendanceHeatmap.visible && (
            <AttendanceHeatmap
              title={config.attendanceHeatmap.title}
              subtitle={config.attendanceHeatmap.subtitle}
              data={heatmapData}
            />
          )}

          {/* Dynamic Primary Platform Modules Launcher */}
          {config.primaryModules.visible && (
            <div className="portal-card" style={{ padding: '24px' }}>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                {config.primaryModules.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                {config.primaryModules.subtitle}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {config.primaryModules.modules.map(mod => (
                  <Link
                    key={mod.id}
                    to={mod.path}
                    className="btn btn-outline"
                    style={{ justifyContent: 'space-between', padding: '11px 16px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{mod.title}</span>
                      {mod.badge && <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>{mod.badge}</span>}
                    </div>
                    <ArrowRight size={15} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Row: Recent Member Records Table from Config */}
      {config.recentMembers.visible && (
        <div className="portal-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                {config.recentMembers.title}
              </h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {config.recentMembers.subtitle}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const headers = ['#', ...config.recentMembers.columns.map(c => c.label)];
                  const rows = recentMembers.map((m, idx) => [
                    idx + 1,
                    m.member_name || '—',
                    m.phone || m.member_phone || '—',
                    m.department || 'General',
                    m.zone || 'HQ',
                    m.membership_level || 'Member',
                  ]);
                  exportToCSV('Recent_Members_NCF', headers, rows);
                }}
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Export recent members to CSV"
              >
                <Download size={13} /> Export CSV
              </button>
              <Link
                to={config.recentMembers.viewAllLink}
                className="btn btn-outline"
                style={{ fontSize: '12.5px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                {config.recentMembers.viewAllText} <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th
                    style={{
                      padding: '10px 12px',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      width: '40px',
                      textAlign: 'center',
                    }}
                  >
                    #
                  </th>
                  {config.recentMembers.columns.map(col => (
                    <th
                      key={col.key}
                      style={{
                        padding: '10px 12px',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMembers.map((m, idx) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>{m.member_name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{m.phone || m.member_phone || '—'}</td>
                    <td style={{ padding: '12px' }}><span className="badge badge-blue">{m.department || 'General'}</span></td>
                    <td style={{ padding: '12px' }}>{m.g12_leader || m.leader || '—'}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{m.zone || 'HQ'}</td>
                    <td style={{ padding: '12px' }}><span className="badge badge-green">{m.membership_level || 'Member'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
