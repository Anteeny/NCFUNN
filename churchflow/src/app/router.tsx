import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { MembersPage } from '../features/members/MembersPage';
import { AttendancePage } from '../features/attendance/AttendancePage';
import { DiscipleshipPage } from '../features/discipleship/DiscipleshipPage';
import { SoulWinningPage } from '../features/soulwinning/SoulWinningPage';
import { G12ManagementPage } from '../features/g12/G12ManagementPage';
import { ConnectGroupsPage } from '../features/connect/ConnectGroupsPage';
import { DepartmentsUnitsPage } from '../features/departments/DepartmentsUnitsPage';
import { FinancePage } from '../features/finance/FinancePage';
import { AboutUsPage } from '../features/about/AboutUsPage';
import { SettingsAdminPage } from '../features/settings/SettingsAdminPage';

// Auth & Protection
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Report Workflows
import { G12ReportPage } from '../features/reports/G12ReportPage';
import { DepartmentReportPage } from '../features/reports/DepartmentReportPage';
import { CellReportPage } from '../features/reports/CellReportPage';
import { MvpPage } from '../features/mvp/MvpPage';
import { ProfileUpdatePage } from '../features/members/ProfileUpdatePage';

export const router = createBrowserRouter([
  // Public Routes (Intake slips, visitor registration, officer sign-in)
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/mvp',
    element: <MvpPage />,
  },
  {
    path: '/u/:token',
    element: <ProfileUpdatePage />,
  },
  {
    path: '/update/:token',
    element: <ProfileUpdatePage />,
  },

  // Legacy Public URL redirects
  { path: 'mvp.html', element: <Navigate to="/mvp" replace /> },
  { path: 'update-profile.html', element: <Navigate to="/u/preview" replace /> },

  // Protected Operating System Routes (Requires Supabase Authenticated Session)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Primary Flowchart Modules & About Us
      { index: true, element: <DashboardPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'discipleship', element: <DiscipleshipPage /> },
      { path: 'soul-winning', element: <SoulWinningPage /> },
      { path: 'g12', element: <G12ManagementPage /> },
      { path: 'connect', element: <ConnectGroupsPage /> },
      { path: 'departments', element: <DepartmentsUnitsPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'about', element: <AboutUsPage /> },
      { path: 'settings', element: <SettingsAdminPage /> },

      // Reporting View-Only Pages
      { path: 'reports/g12', element: <G12ReportPage /> },
      { path: 'reports/department', element: <DepartmentReportPage /> },
      { path: 'reports/cell', element: <CellReportPage /> },

      // Legacy Internal Redirects
      { path: 'G12report.html', element: <Navigate to="/reports/g12" replace /> },
      { path: 'Department.html', element: <Navigate to="/reports/department" replace /> },
      { path: 'connect.html', element: <Navigate to="/reports/cell" replace /> },
      { path: 'cellreport.html', element: <Navigate to="/reports/cell" replace /> },
      { path: 'tracker.html', element: <Navigate to="/attendance" replace /> },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
