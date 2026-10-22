export interface OrganisationTerminology {
  groupSingular: string; // e.g. "Connect Group", "Life Group", "Cell"
  groupPlural: string; // e.g. "Connect Groups", "Life Groups", "Cells"
  territoryLabel: string; // e.g. "Campus Zone", "District", "Region"
  discipleshipModel: string; // e.g. "G12", "Discipleship Circles", "One-on-One"
  departmentLabel: string; // e.g. "Department", "Ministry Unit"
  serviceSingular: string; // e.g. "Service", "Gathering"
}

export interface OrganisationScheduleItem {
  name: string;
  days: string[]; // e.g. ["Sunday"], ["Wednesday"]
  time: string; // e.g. "08:00", "17:00"
  venue?: string;
}

export interface OrganisationMeetingSchedules {
  services: OrganisationScheduleItem[];
  connectGroups?: {
    day: string;
    window: string;
  };
}

export interface OrganisationEnabledModules {
  attendance: boolean;
  members: boolean;
  connect: boolean;
  departments: boolean;
  g12: boolean;
  reports: boolean;
  finance: boolean;
  foundation_school: boolean;
  soul_winning: boolean;
}

export interface OrganisationBranding {
  logoType: 'image' | 'emoji';
  logoUrl?: string;
  logoEmoji?: string;
  primaryColor?: string;
  portalTitle: string;
  portalSubtitle: string;
  contactEmail?: string;
  primaryPhone?: string;
}

export interface Organisation {
  id: string; // UUID
  name: string; // e.g. "NCF UNN", "Grace City Global"
  slug: string; // unique workspace identifier e.g. "ncfunn", "gracecity"
  custom_domain?: string | null; // e.g. "ncfunn.site"
  timezone: string; // IANA e.g. "Africa/Lagos"
  base_currency: string; // e.g. "NGN", "USD"
  branding: OrganisationBranding;
  terminology: OrganisationTerminology;
  meeting_schedules: OrganisationMeetingSchedules;
  enabled_modules: OrganisationEnabledModules;
  status: 'active' | 'suspended' | 'onboarding';
  created_at?: string;
  updated_at?: string;
}

export interface OrganisationMember {
  id: string;
  organisation_id: string;
  user_id: string;
  role: 'Owner' | 'Super Admin' | 'Pastor' | 'Editor' | 'Viewer';
  permissions: string[];
  created_at?: string;
}
