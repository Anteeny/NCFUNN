import { supabase } from '../lib/supabase';
import type { Organisation } from '../types/organisation.types';

export const NCF_UNN_ID = '00000000-0000-0000-0000-000000000001';

export const NCF_UNN_FLAGSHIP_ORG: Organisation = {
  id: NCF_UNN_ID,
  name: 'NCF UNN',
  slug: 'ncfunn',
  custom_domain: 'ncfunn.site',
  timezone: 'Africa/Lagos',
  base_currency: 'NGN',
  branding: {
    logoType: 'image',
    logoUrl: '/images.png',
    logoEmoji: '🕊️',
    portalTitle: 'NCF UNN Admin Portal',
    portalSubtitle: 'ChurchFlow Ministry & Attendance System',
    contactEmail: 'admin@ncfunn.org',
  },
  terminology: {
    groupSingular: 'Connect Group',
    groupPlural: 'Connect Groups',
    territoryLabel: 'Campus Zone',
    discipleshipModel: 'G12',
    departmentLabel: 'Department',
    serviceSingular: 'Service',
  },
  meeting_schedules: {
    services: [
      { name: 'Sunday Celebration Service', days: ['Sunday'], time: '08:00', venue: 'Fellowship Center / Freedom Square' },
      { name: 'Midweek Communion Service', days: ['Wednesday'], time: '17:00', venue: 'Fellowship Center / Freedom Square' },
    ],
    connectGroups: {
      day: 'Saturday',
      window: '19:00 - 22:00',
    },
  },
  enabled_modules: {
    attendance: true,
    members: true,
    connect: true,
    departments: true,
    g12: true,
    reports: true,
    finance: false,
    foundation_school: false,
    soul_winning: true,
  },
  status: 'active',
};

const ORGANISATIONS_TABLE = 'organisations';
const CACHED_ORG_KEY = 'churchflow_active_organisation';

export const organisationService = {
  /**
   * Resolves the active church organisation by hostname, slug, or local fallback.
   */
  async resolveActiveOrganisation(slugOverride?: string): Promise<Organisation> {
    const hostname = window.location.hostname.toLowerCase();

    // 1. If explicit slug is requested (e.g. from switcher or URL parameter)
    if (slugOverride) {
      const org = await this.getOrganisationBySlug(slugOverride);
      if (org) {
        this.cacheOrganisation(org);
        return org;
      }
    }

    // 2. Check if hostname matches custom domain (e.g. "ncfunn.site")
    if (hostname && hostname !== 'localhost' && !hostname.endsWith('vercel.app')) {
      const orgByDomain = await this.getOrganisationByDomain(hostname);
      if (orgByDomain) {
        this.cacheOrganisation(orgByDomain);
        return orgByDomain;
      }
    }

    // 3. Check cached active organisation
    try {
      const cached = localStorage.getItem(CACHED_ORG_KEY);
      if (cached) {
        return JSON.parse(cached) as Organisation;
      }
    } catch (e) {
      // ignore
    }

    // 4. Default to NCF UNN flagship
    this.cacheOrganisation(NCF_UNN_FLAGSHIP_ORG);
    return NCF_UNN_FLAGSHIP_ORG;
  },

  /**
   * Fetches an organisation by its unique subdomain slug.
   */
  async getOrganisationBySlug(slug: string): Promise<Organisation | null> {
    try {
      const { data, error } = await supabase
        .from(ORGANISATIONS_TABLE)
        .select('*')
        .eq('slug', slug.toLowerCase())
        .eq('status', 'active')
        .maybeSingle();

      if (!error && data) {
        return data as Organisation;
      }
    } catch (err) {
      console.warn(`[organisationService] Remote read failed for slug "${slug}":`, err);
    }
    return null;
  },

  /**
   * Fetches an organisation by its custom domain.
   */
  async getOrganisationByDomain(domain: string): Promise<Organisation | null> {
    try {
      const { data, error } = await supabase
        .from(ORGANISATIONS_TABLE)
        .select('*')
        .eq('custom_domain', domain.toLowerCase())
        .eq('status', 'active')
        .maybeSingle();

      if (!error && data) {
        return data as Organisation;
      }
    } catch (err) {
      console.warn(`[organisationService] Remote read failed for domain "${domain}":`, err);
    }
    return null;
  },

  /**
   * Lists all registered active organisations.
   */
  async listOrganisations(): Promise<Organisation[]> {
    try {
      const { data, error } = await supabase
        .from(ORGANISATIONS_TABLE)
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (!error && data && data.length > 0) {
        return data as Organisation[];
      }
    } catch (err) {
      console.warn('[organisationService] Failed to list remote organisations:', err);
    }

    return [NCF_UNN_FLAGSHIP_ORG];
  },

  /**
   * Provisions a new church organisation (SaaS Phase 0 onboarding).
   */
  async createOrganisation(payload: Partial<Organisation>): Promise<Organisation> {
    const slug = (payload.slug || payload.name?.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'church').toLowerCase();
    
    const newOrg: Partial<Organisation> = {
      name: payload.name || 'New Church Workspace',
      slug,
      custom_domain: payload.custom_domain || `${slug}.churchflow.site`,
      timezone: payload.timezone || 'Africa/Lagos',
      base_currency: payload.base_currency || 'NGN',
      branding: payload.branding || {
        logoType: 'emoji',
        logoEmoji: '⛪',
        portalTitle: `${payload.name || 'Church'} Portal`,
        portalSubtitle: 'ChurchFlow Operating System',
      },
      terminology: payload.terminology || {
        groupSingular: 'Connect Group',
        groupPlural: 'Connect Groups',
        territoryLabel: 'Campus Zone',
        discipleshipModel: 'G12',
        departmentLabel: 'Department',
        serviceSingular: 'Service',
      },
      meeting_schedules: payload.meeting_schedules || {
        services: [{ name: 'Sunday Service', days: ['Sunday'], time: '09:00' }],
      },
      enabled_modules: payload.enabled_modules || {
        attendance: true,
        members: true,
        connect: true,
        departments: true,
        g12: true,
        reports: true,
        finance: false,
        foundation_school: false,
        soul_winning: true,
      },
      status: 'active',
    };

    try {
      const { data, error } = await supabase
        .from(ORGANISATIONS_TABLE)
        .insert(newOrg)
        .select()
        .single();

      if (!error && data) {
        this.cacheOrganisation(data as Organisation);
        return data as Organisation;
      }
    } catch (err) {
      console.warn('[organisationService] Remote create organisation failed:', err);
    }

    // Local simulated creation for pre-migration/offline preview
    const localOrg: Organisation = {
      ...(newOrg as any),
      id: String(Date.now()),
    };
    this.cacheOrganisation(localOrg);
    return localOrg;
  },

  cacheOrganisation(org: Organisation) {
    try {
      localStorage.setItem(CACHED_ORG_KEY, JSON.stringify(org));
      window.dispatchEvent(new CustomEvent('churchflow_organisation_changed', { detail: org }));
    } catch (e) {
      // ignore
    }
  },
};

/**
 * Returns the currently active organisation ID with instant fallback to NCF UNN flagship ID.
 */
export function getActiveOrganisationId(): string {
  try {
    const cached = localStorage.getItem(CACHED_ORG_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.id) return parsed.id;
    }
  } catch (e) {
    // ignore
  }
  return '00000000-0000-0000-0000-000000000001';
}
