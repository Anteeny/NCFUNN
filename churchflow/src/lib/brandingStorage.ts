export interface ChurchBrandingConfig {
  workspaceSlug?: string; // e.g. 'ncfunn', 'gracecity'
  organizationName?: string; // e.g. 'NCF UNN', 'Grace City Church'
  logoType: 'image' | 'emoji';
  logoUrl: string; // e.g. '/images.png', base64 data URL, or external link
  logoEmoji: string; // e.g. '🕊️', '⛪'
  portalTitle: string;
  portalSubtitle: string;
}

export const defaultBrandingConfig: ChurchBrandingConfig = {
  workspaceSlug: 'ncfunn',
  organizationName: 'NCF UNN',
  logoType: 'image',
  logoUrl: '/images.png',
  logoEmoji: '🕊️',
  portalTitle: 'NCF UNN Admin Portal',
  portalSubtitle: 'ChurchFlow Ministry & Attendance System',
};

const STORAGE_KEY = 'churchflow_branding_config';

/**
 * Retrieves the active church branding configuration from localStorage,
 * falling back to default Dominion City / NCF UNN settings.
 */
export function getBrandingConfig(): ChurchBrandingConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultBrandingConfig,
        ...parsed,
      };
    }
  } catch (err) {
    console.error('Error reading church branding config from storage:', err);
  }
  return defaultBrandingConfig;
}

/**
 * Saves church branding config to localStorage and broadcasts an event
 * so all components (e.g. ExecutiveHeader, Sidebar) instantly re-render.
 */
export function saveBrandingConfig(config: ChurchBrandingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('churchflow_branding_updated', { detail: config }));
  } catch (err) {
    console.error('Error saving church branding config:', err);
  }
}

/**
 * Resets church branding back to defaults.
 */
export function resetBrandingConfig(): ChurchBrandingConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('churchflow_branding_updated', { detail: defaultBrandingConfig }));
  } catch (err) {
    console.error('Error resetting church branding config:', err);
  }
  return defaultBrandingConfig;
}
