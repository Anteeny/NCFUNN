import { supabase } from '../lib/supabase';
import { getActiveOrganisationId, NCF_UNN_ID } from './organisation.service';

export interface AdminProfile {
  id: string;
  organisation_id?: string;
  email: string;
  full_name: string;
  name?: string;
  role: string;
  status: string;
  created_at?: string;
}

const SETTINGS_TABLE = 'church_settings';
const ADMIN_PROFILES_TABLE = 'admin_profiles';

export const settingsService = {
  /**
   * Retrieves a setting by key scoped to active organisation. Checks Supabase first; if table exists and returns
   * data, updates local cache. If network/table is missing, falls back to localStorage.
   */
  async getSetting<T>(key: string, defaultValue: T, organisationId?: string): Promise<T> {
    const orgId = organisationId || getActiveOrganisationId();
    const isNcf = orgId === NCF_UNN_ID;
    const cacheKey = isNcf ? key : `${key}_${orgId}`;

    try {
      const { data, error } = await supabase
        .from(SETTINGS_TABLE)
        .select('value')
        .eq('organisation_id', orgId)
        .eq('key', key)
        .maybeSingle();

      if (!error && data?.value) {
        localStorage.setItem(cacheKey, JSON.stringify(data.value));
        return data.value as T;
      }

      // If NCF UNN and no row with orgId found, try legacy unscoped key
      if (isNcf) {
        const { data: legacyData } = await supabase
          .from(SETTINGS_TABLE)
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (legacyData?.value) {
          localStorage.setItem(cacheKey, JSON.stringify(legacyData.value));
          return legacyData.value as T;
        }
      }
    } catch (err) {
      console.warn(`[settingsService] Remote read failed for ${key}, using cached fallback:`, err);
    }

    // Local fallback
    try {
      const cached = localStorage.getItem(cacheKey) || (isNcf ? localStorage.getItem(key) : null);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (e) {
      // ignore
    }

    return defaultValue;
  },

  /**
   * Saves a setting scoped to active organisation both locally (immediate reactive broadcast) and to Supabase.
   */
  async saveSetting<T>(key: string, value: T, organisationId?: string): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    const isNcf = orgId === NCF_UNN_ID;
    const cacheKey = isNcf ? key : `${key}_${orgId}`;

    // 1. Save to local storage and broadcast immediately
    try {
      localStorage.setItem(cacheKey, JSON.stringify(value));
      if (isNcf) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`[settingsService] Local storage write failed for ${key}:`, e);
    }

    // 2. Persist to Supabase
    try {
      await supabase
        .from(SETTINGS_TABLE)
        .upsert(
          {
            organisation_id: orgId,
            key: isNcf ? key : `${key}_${orgId}`,
            value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
    } catch (err) {
      console.warn(`[settingsService] Remote save for ${key} queued or unavailable:`, err);
    }
  },

  /**
   * Fetches the list of authorized admin operators from Supabase admin_profiles scoped to active org.
   */
  async getAdminProfiles(organisationId?: string): Promise<AdminProfile[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const isNcf = orgId === NCF_UNN_ID;

    try {
      const { data, error } = await supabase
        .from(ADMIN_PROFILES_TABLE)
        .select('*')
        .eq('organisation_id', orgId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as AdminProfile[];
      }
    } catch (err) {
      console.warn('[settingsService] Failed to fetch admin_profiles:', err);
    }

    // Fallback to locally stored operators
    const storageKey = `churchflow_admin_profiles_${orgId}`;
    const cached = localStorage.getItem(storageKey) || (isNcf ? localStorage.getItem('churchflow_admin_profiles') : null);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }

    if (isNcf) {
      return [
        { id: '1', name: 'Lead Pastor / Secretariat', full_name: 'Lead Pastor / Secretariat', email: 'admin@ncfunn.org', role: 'Super Admin', status: 'Active' },
        { id: '2', name: 'Media Director', full_name: 'Media Director', email: 'media@ncfunn.org', role: 'Editor', status: 'Active' },
        { id: '3', name: 'Secretariat Lead', full_name: 'Secretariat Lead', email: 'secretary@ncfunn.org', role: 'Viewer', status: 'Active' },
      ];
    }

    return [];
  },

  /**
   * Saves/updates an admin operator profile.
   */
  async saveAdminProfile(profile: AdminProfile, organisationId?: string): Promise<void> {
    const orgId = organisationId || profile.organisation_id || getActiveOrganisationId();
    const scopedProfile = { ...profile, organisation_id: orgId };

    try {
      await supabase.from(ADMIN_PROFILES_TABLE).upsert(scopedProfile, { onConflict: 'id' });
    } catch (err) {
      console.warn('[settingsService] Remote save admin_profile failed:', err);
    }

    // Local cache update
    const storageKey = `churchflow_admin_profiles_${orgId}`;
    const current = await this.getAdminProfiles(orgId);
    const updated = current.some(p => p.id === profile.id)
      ? current.map(p => (p.id === profile.id ? scopedProfile : p))
      : [...current, scopedProfile];
    localStorage.setItem(storageKey, JSON.stringify(updated));
  },

  /**
   * Deletes an admin operator profile.
   */
  async deleteAdminProfile(id: string, organisationId?: string): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      await supabase.from(ADMIN_PROFILES_TABLE).delete().eq('id', id).eq('organisation_id', orgId);
    } catch (err) {
      console.warn('[settingsService] Remote delete admin_profile failed:', err);
    }

    const storageKey = `churchflow_admin_profiles_${orgId}`;
    const current = await this.getAdminProfiles(orgId);
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  },
};
