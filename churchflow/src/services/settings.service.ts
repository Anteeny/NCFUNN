import { supabase } from '../lib/supabase';

export interface AdminProfile {
  id: string;
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
   * Retrieves a setting by key. Checks Supabase first; if table exists and returns
   * data, updates local cache. If network/table is missing, falls back to localStorage.
   */
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const { data, error } = await supabase
        .from(SETTINGS_TABLE)
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!error && data?.value) {
        // Cache to localStorage for offline / instant fast startup
        localStorage.setItem(key, JSON.stringify(data.value));
        return data.value as T;
      }
    } catch (err) {
      console.warn(`[settingsService] Remote read failed for ${key}, using cached fallback:`, err);
    }

    // Local fallback
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (e) {
      // ignore
    }

    return defaultValue;
  },

  /**
   * Saves a setting both locally (immediate reactive broadcast) and to Supabase (shared sync).
   */
  async saveSetting<T>(key: string, value: T): Promise<void> {
    // 1. Save to local storage and broadcast immediately
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[settingsService] Local storage write failed for ${key}:`, e);
    }

    // 2. Persist to Supabase so all administrators and devices see it
    try {
      await supabase
        .from(SETTINGS_TABLE)
        .upsert(
          {
            key,
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
   * Fetches the list of authorized admin operators from Supabase admin_profiles.
   * If table is not yet configured, returns the local initial list.
   */
  async getAdminProfiles(): Promise<AdminProfile[]> {
    try {
      const { data, error } = await supabase
        .from(ADMIN_PROFILES_TABLE)
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as AdminProfile[];
      }
    } catch (err) {
      console.warn('[settingsService] Failed to fetch admin_profiles:', err);
    }

    // Fallback to locally stored operators
    const cached = localStorage.getItem('churchflow_admin_profiles');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }

    return [
      { id: '1', name: 'Lead Pastor / Secretariat', full_name: 'Lead Pastor / Secretariat', email: 'admin@ncfunn.org', role: 'Super Admin', status: 'Active' },
      { id: '2', name: 'Media Director', full_name: 'Media Director', email: 'media@ncfunn.org', role: 'Editor', status: 'Active' },
      { id: '3', name: 'Secretariat Lead', full_name: 'Secretariat Lead', email: 'secretary@ncfunn.org', role: 'Viewer', status: 'Active' },
    ];
  },

  /**
   * Saves/updates an admin operator profile.
   */
  async saveAdminProfile(profile: AdminProfile): Promise<void> {
    try {
      await supabase.from(ADMIN_PROFILES_TABLE).upsert(profile, { onConflict: 'id' });
    } catch (err) {
      console.warn('[settingsService] Remote save admin_profile failed:', err);
    }

    // Local cache update
    const current = await this.getAdminProfiles();
    const updated = current.some(p => p.id === profile.id)
      ? current.map(p => (p.id === profile.id ? profile : p))
      : [...current, profile];
    localStorage.setItem('churchflow_admin_profiles', JSON.stringify(updated));
  },

  /**
   * Deletes an admin operator profile.
   */
  async deleteAdminProfile(id: string): Promise<void> {
    try {
      await supabase.from(ADMIN_PROFILES_TABLE).delete().eq('id', id);
    } catch (err) {
      console.warn('[settingsService] Remote delete admin_profile failed:', err);
    }

    const current = await this.getAdminProfiles();
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem('churchflow_admin_profiles', JSON.stringify(updated));
  },
};
