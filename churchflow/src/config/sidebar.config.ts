/**
 * ChurchFlow Sidebar Drawer Navigation Configuration
 * 
 * You can edit, reorder, toggle visibility, add or rename nav links,
 * action form shortcuts, and brand labels in this file.
 */

export type SidebarIconName =
  | 'LayoutDashboard'
  | 'Users'
  | 'CalendarCheck'
  | 'GraduationCap'
  | 'Flame'
  | 'Network'
  | 'Compass'
  | 'Building2'
  | 'BookOpen'
  | 'Landmark'
  | 'Sparkles'
  | 'Settings'
  | 'FileSpreadsheet'
  | 'PlusCircle'
  | 'HeartHandshake'
  | 'Shield'
  | 'Bell';

export interface SidebarNavItem {
  id: string;
  to: string;
  label: string;
  iconName: SidebarIconName;
  badge?: string;
  visible: boolean;
}

export interface SidebarActionItem {
  id: string;
  to: string;
  label: string;
  iconName: SidebarIconName;
  color?: string;
  badge?: string;
  visible: boolean;
}

export interface SidebarConfig {
  brand: {
    symbol: string;
    appName: string;
    portalName: string;
  };
  primaryNav: {
    sectionLabel: string;
    items: SidebarNavItem[];
  };
  actionForms: {
    sectionLabel: string;
    items: SidebarActionItem[];
  };
  userProfile: {
    initials: string;
    name: string;
    role: string;
  };
}

export const defaultSidebarConfig: SidebarConfig = {
  brand: {
    symbol: '✦',
    appName: 'ChurchFlow',
    portalName: 'NCF UNN MAIN PORTAL',
  },
  primaryNav: {
    sectionLabel: 'Primary Modules',
    items: [
      { id: 'dashboard', to: '/', label: 'Executive Dashboard', iconName: 'LayoutDashboard', visible: true },
      { id: 'members', to: '/members', label: 'Membership Database', iconName: 'Users', visible: true },
      { id: 'attendance', to: '/attendance', label: 'Attendance Tracker', iconName: 'CalendarCheck', visible: true },
      { id: 'discipleship', to: '/discipleship', label: 'Foundation School', iconName: 'GraduationCap', visible: true },
      { id: 'soul-winning', to: '/soul-winning', label: 'Soul Winning & Mob', iconName: 'Flame', visible: true },
      { id: 'g12', to: '/g12', label: 'G12 Management', iconName: 'Network', visible: true },
      { id: 'connect', to: '/connect', label: 'Connect Groups', iconName: 'Compass', visible: true },
      { id: 'departments', to: '/departments', label: 'Departments & Units', iconName: 'Building2', visible: true },
      { id: 'finance', to: '/finance', label: 'Finance & Giving', iconName: 'Landmark', visible: true },
      { id: 'about', to: '/about', label: 'About Us', iconName: 'BookOpen', visible: true },
      { id: 'settings', to: '/settings', label: 'Settings & Admin', iconName: 'Settings', visible: true },
    ],
  },
  actionForms: {
    sectionLabel: 'Reporting & Feedback',
    items: [
      { id: 'report-g12', to: '/reports/g12', label: 'G12 Discipleship Reports', iconName: 'FileSpreadsheet', color: '#38bdf8', visible: true },
      { id: 'report-dept', to: '/reports/department', label: 'Department Unit Reports', iconName: 'Building2', color: '#a78bfa', visible: true },
      { id: 'report-cell', to: '/reports/cell', label: 'Connect Group Reports', iconName: 'Compass', color: '#34d399', visible: true },
      { id: 'mvp-register', to: '/mvp', label: 'Register First-Timer (MVP)', iconName: 'PlusCircle', color: '#fbbf24', visible: true },
    ],
  },
  userProfile: {
    initials: 'AD',
    name: 'NCF Administrator',
    role: 'Executive Super Admin',
  },
   

};
