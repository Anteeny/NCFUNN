/**
 * ChurchFlow Executive Dashboard Bento Grid Configuration
 * 
 * You can edit, reorder, toggle visibility, modify titles, subtitles,
 * and icons of any card in this Bento Grid.
 */

export interface BentoCardConfig {
  id: string;
  code?: string;
  title: string;
  subtitle?: string;
  colSpan: 'col-1' | 'col-2' | 'col-3' | 'col-full';
  visible: boolean;
  accentColor: string;
  accentBg: string;
  iconName: 'Users' | 'UserCheck' | 'Compass' | 'HeartHandshake' | 'Flame' | 'TrendingUp' | 'Calendar' | 'Layers';
  trend?: {
    value: string;
    isUp: boolean;
  };
  linkTarget?: string;
}

export interface GrowthJourneyStage {
  level: number;
  title: string;
  countLabel: string;
  badgeColor: string;
}

export interface DirectorateHealthItem {
  name: string;
  attendancePercent: number;
  head: string;
}

export interface FollowUpItem {
  id: number;
  title: string;
  description: string;
  count: number;
  urgency: 'high' | 'medium' | 'low';
}

export interface AnnouncementBannerConfig {
  enabled: boolean;
  badge: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionLink?: string;
}

export interface AttendanceHeatmapConfig {
  visible: boolean;
  title: string;
  subtitle: string;
}

export interface PrimaryModuleItem {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  badge?: string;
}

export interface PrimaryModulesConfig {
  visible: boolean;
  title: string;
  subtitle: string;
  modules: PrimaryModuleItem[];
}

export interface RecentMembersColumn {
  key: string;
  label: string;
}

export interface RecentMembersConfig {
  visible: boolean;
  title: string;
  subtitle: string;
  limit: number;
  viewAllText: string;
  viewAllLink: string;
  columns: RecentMembersColumn[];
}

export interface BentoGridDashboardConfig {
  announcementBanner: AnnouncementBannerConfig;
  liveTicker: {
    enabled: boolean;
    label: string;
    items: string[];
  };
  kpiCards: BentoCardConfig[];
  growthJourney: {
    title: string;
    stages: GrowthJourneyStage[];
  };
  directorateHealth: {
    title: string;
    items: DirectorateHealthItem[];
  };
  priorityFollowUps: {
    title: string;
    items: FollowUpItem[];
  };
  attendanceHeatmap: AttendanceHeatmapConfig;
  primaryModules: PrimaryModulesConfig;
  recentMembers: RecentMembersConfig;
}

export const defaultBentoConfig: BentoGridDashboardConfig = {
  announcementBanner: {
    enabled: true,
    badge: 'GENERAL ANNOUNCEMENT',
    title: 'Sunday Service Reports & Discipleship Week',
    message: 'All G12 shepherds and Directorate heads are reminded that weekly attendance and follow-up logs must be submitted by 2:00 PM WAT.',
    actionLabel: 'Submit G12 Report',
    actionLink: '/reports/g12',
  },
  
  liveTicker: {
    enabled: true,
    label: '🔴 Live Feed',
    items: [
      'NCF UNN Administrative Operating System connected to live Supabase records',
      'Wednesday & Sunday service attendance synchronized from service reports',
      'Connect Group leaders directory active across all 9 UNN campus zones',
    ],
  },
  kpiCards: [
    {
      id: 'p1-members',
      title: 'Registered Members',
      subtitle: 'Active Member Directory',
      colSpan: 'col-1',
      visible: true,
      accentColor: 'var(--blue)',
      accentBg: 'var(--blue-soft)',
      iconName: 'Users',
      trend: { value: 'Live', isUp: true },
      linkTarget: '/members',
    },
    {
      id: 'p2-workers',
      title: 'Active Workers',
      subtitle: 'Assigned Across Units',
      colSpan: 'col-1',
      visible: true,
      accentColor: 'var(--green)',
      accentBg: 'var(--green-bg)',
      iconName: 'UserCheck',
      trend: { value: 'Roster', isUp: true },
      linkTarget: '/departments',
    },
    {
      id: 'p3-connect',
      title: 'Connect Group Leaders',
      subtitle: 'Current Connect Leaders',
      colSpan: 'col-1',
      visible: true,
      accentColor: '#06b6d4',
      accentBg: 'rgba(6, 182, 212, 0.15)',
      iconName: 'Compass',
      trend: { value: '40 Leaders', isUp: true },
      linkTarget: '/connect',
    },
    {
      id: 'p4-mvp',
      title: 'Monthly MVPs',
      subtitle: 'From Service Reports',
      colSpan: 'col-1',
      visible: true,
      accentColor: 'var(--amber)',
      accentBg: 'var(--amber-bg)',
      iconName: 'HeartHandshake',
      trend: { value: 'Monthly', isUp: true },
      linkTarget: '/reports',
    },
    {
      id: 'p5-converts',
      title: 'Souls Won (This Week)',
      subtitle: 'Harvest This Week',
      colSpan: 'col-1',
      visible: true,
      accentColor: '#f43f5e',
      accentBg: 'rgba(244, 63, 94, 0.15)',
      iconName: 'Flame',
      trend: { value: 'Harvest', isUp: true },
      linkTarget: '/soul-winning',
    },
    {
      id: 'ret-retention',
      title: 'MVP Retention Rate',
      subtitle: 'MVP to Regular Member',
      colSpan: 'col-1',
      visible: true,
      accentColor: '#8b5cf6',
      accentBg: 'rgba(139, 92, 246, 0.15)',
      iconName: 'TrendingUp',
      trend: { value: 'Live', isUp: true },
      linkTarget: '/members',
    },
  ],
  growthJourney: {
    title: 'Spiritual Growth Journey (8 Stages)',
    stages: [
      { level: 1, title: 'MVP / First-Timer', countLabel: '0', badgeColor: '#10b981' },
      { level: 2, title: 'Member', countLabel: '0', badgeColor: '#06b6d4' },
      { level: 3, title: 'Worker', countLabel: '0', badgeColor: '#3b82f6' },
      { level: 4, title: 'Connect Leader', countLabel: '0', badgeColor: '#6366f1' },
      { level: 5, title: 'Unit Leader', countLabel: '0', badgeColor: '#8b5cf6' },
      { level: 6, title: 'Core Leader', countLabel: '0', badgeColor: '#ec4899' },
      { level: 7, title: 'Directorate Head', countLabel: '0', badgeColor: '#f59e0b' },
      { level: 8, title: 'Pastor', countLabel: '0', badgeColor: '#e11d48' },
    ],
  },
  directorateHealth: {
    title: 'Unit Workforce Attendance',
    items: [
      { name: 'Administration', attendancePercent: 92, head: 'Emmanuella Okonkwo' },
      { name: 'Ushering', attendancePercent: 92, head: 'Kosisochukwu Mbamalu' },
      { name: 'MVP', attendancePercent: 90, head: 'Janefrancis Igwilo' },
      { name: 'NCF Angels', attendancePercent: 94, head: 'Kosisochukwu Onyibor' },
      { name: 'Temple tenders', attendancePercent: 85, head: 'Ifeyinwa Umeadi' },
      { name: 'Technical Unit', attendancePercent: 88, head: 'Udochukwu Aneke' },
      { name: 'Finances', attendancePercent: 95, head: 'Faithfulness Onu' },
      { name: 'Media Unit', attendancePercent: 88, head: 'Nelson Okeke' },
      { name: 'Intercessory', attendancePercent: 94, head: 'Godreigns Anyachebelu' },
    ],
  },
  priorityFollowUps: {
    title: 'High-Priority Retention Pipeline',
    items: [
      { id: 1, title: '24hrs Appreciation message(Acknowledge)', description: 'Pending Sunday first-timers contact window', count: 18, urgency: 'high' },
      { id: 2, title: '72 Hrs Personal interaction(Care)', description: 'Assigned to Franco & Hilltop shepherds', count: 12, urgency: 'medium' },
      { id: 3, title: 'Saturday Cell Integration(Connect)', description: 'Matches pending for Saturday 5PM fellowships', count: 24, urgency: 'low' },
    ],
  },
  attendanceHeatmap: {
    visible: true,
    title: 'Monthly Attendance Heatmap',
    subtitle: '7-column weekly attendance frequency and consistency tracking',
  },
  primaryModules: {
    visible: true,
    title: 'Primary Platform Modules',
    subtitle: 'Select a ministry department or management tool to review rosters and submit reports.',
    modules: [
      { id: 'm4', title: '4. Discipleship & Foundation School', path: '/discipleship', badge: 'Active Cohort' },
      { id: 'm5', title: '5. Soul Winning & Field Mobilization', path: '/soul-winning', badge: 'Outreach Active' },
      { id: 'm6', title: '6. G12 Discipleship Network', path: '/g12', badge: '12 Shepherds' },
      { id: 'm7', title: '7. Connect Groups (3x3 Zones Grid)', path: '/connect', badge: '18 Cells' },
      { id: 'm8', title: '8. Departments & Units Directory', path: '/departments', badge: '8 Units' },
    ],
  },
  recentMembers: {
    visible: true,
    title: 'Recent Synchronized Members',
    subtitle: 'Latest profiles active in the NCF UNN membership database',
    limit: 6,
    viewAllText: 'Open Membership Database',
    viewAllLink: '/members',
    columns: [
      { key: 'member_name', label: 'Member Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'department', label: 'Department' },
      { key: 'g12_leader', label: 'G12 Leader' },
      { key: 'zone', label: 'Zone' },
      { key: 'membership_level', label: 'Status' },
    ],
  },
};
