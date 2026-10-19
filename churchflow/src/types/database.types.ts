export type MembershipLevel =
  | 'Pastor'
  | 'DH'
  | 'Core'
  | 'Unit Leader'
  | 'Connect Leader'
  | 'Worker'
  | 'Member'
  | 'MVP'
  | 'DH/Core' // Legacy support for existing DB records
  | 'Committed Member' // Legacy support
  | 'Occasional Member'; // Legacy support

export type AttendanceStatus = 'Present' | 'Absent';

export type ServiceType = 'Sunday Service' | 'Midweek Service' | 'Special Meeting';

export interface Member {
  id: number;
  member_name: string;
  member_phone?: string | null;
  phone?: string | null; // Compatibility alias
  gender?: string | null;
  birthday?: string | null;
  department?: string | null;
  g12_leader?: string | null;
  g12_phone?: string | null;
  g12_leader_id?: string | null;
  leader?: string | null;
  membership_level?: MembershipLevel | string | null;
  zone?: string | null;
  school_address?: string | null;
  home_address?: string | null;
  School_Address?: string | null;
  Home_Address?: string | null;
  course_of_study?: string | null;
  level?: string | null;
  dc_trainings?: string | null;
  fellowship_status?: string | null;
  joined_date?: string | null;
  created_at?: string | null;
}

export interface ServiceAttendanceRecord {
  id?: string;
  member_id: string | number;
  member_name: string;
  service_date: string;
  service_type: string;
  time_in?: string;
  checked_in_at?: string;
  zone?: string | null;
  department?: string | null;
  marked_by?: string;
  notes?: string;
  created_at?: string;
}

export interface ServiceReportRecord {
  id?: number | string;
  date: string;
  service_type: string;
  zone: string;
  zonal_pastor?: string;
  topic?: string;
  preacher?: string;
  male?: number;
  female?: number;
  children?: number;
  total_attendance: number;
  offering_transferred?: number;
  offering?: number;
  tithe_transferred?: number;
  tithe?: number;
  finance_total?: number;
  mvp?: number;
  second_timers?: number;
  new_converts?: number;
  holy_ghost_baptism?: number;
  created_at?: string;
}

export interface G12ReportRecord {
  id?: string | number;
  report_date: string;
  leader_name: string;
  member_name: string;
  status: AttendanceStatus;
  notes?: string;
  zone?: string;
  service_type?: string;
  created_at?: string;
}

export interface DepartmentReportRecord {
  id?: string | number;
  dept_name: string;
  report_date: string;
  member_name: string;
  status: AttendanceStatus;
  reason_for_absence?: string;
  created_at?: string;
}

// Alias for exact table name alignment
export type DeptReportRecord = DepartmentReportRecord;

export interface CellReportRecord {
  id?: string | number;
  leader_name: string;
  location: string;
  time_in: string;
  time_out: string;
  attendance: number;
  new_converts: number;
  offering: number;
  refreshments: boolean;
  notes?: string;
  report_date: string;
  created_at?: string;
}

export interface CellLeaderRecord {
  id: string;
  zone: string;
  cell_name: string;
  cell_leader: string;
  cell_address: string;
  assistant?: string | null;
  schedule?: string | null;
  created_at?: string;
}

export interface DepartmentLeaderRecord {
  id: string;
  department_name: string;
  leader_name: string;
  phone: string;
  created_at: string;
}

export interface MVPRecord {
  id?: string | number;
  Name?: string;
  member_name?: string;
  'Phone Number'?: string;
  member_phone?: string;
  Address?: string;
  'Open to Visitation'?: string;
  'Dept Interest'?: string;
  'Complains / Comments'?: string;
  'Date Visited'?: string;
}

