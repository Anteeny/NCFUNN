import { useState, useEffect } from 'react';
import {
  getBrandingConfig,
  saveBrandingConfig,
  resetBrandingConfig,
  defaultBrandingConfig,
  type ChurchBrandingConfig,
} from '../lib/brandingStorage';
import { settingsService } from '../services/settings.service';

export function useBranding() {
  const [branding, setBranding] = useState<ChurchBrandingConfig>(getBrandingConfig);

  useEffect(() => {
    // 1. Fetch latest shared branding from Supabase if available
    settingsService.getSetting<ChurchBrandingConfig>('churchflow_branding_config', defaultBrandingConfig)
      .then(remote => {
        if (remote && JSON.stringify(remote) !== JSON.stringify(branding)) {
          setBranding(remote);
          localStorage.setItem('churchflow_branding_config', JSON.stringify(remote));
        }
      })
      .catch(() => {});

    // 2. React to local window broadcast events
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ChurchBrandingConfig>;
      if (customEvent.detail) {
        setBranding(customEvent.detail);
      } else {
        setBranding(getBrandingConfig());
      }
    };

    window.addEventListener('churchflow_branding_updated', handleUpdate);
    return () => window.removeEventListener('churchflow_branding_updated', handleUpdate);
  }, []);

  const updateBranding = (next: ChurchBrandingConfig) => {
    saveBrandingConfig(next);
    settingsService.saveSetting('churchflow_branding_config', next);
    setBranding(next);
  };

  const resetDefaults = () => {
    const def = resetBrandingConfig();
    settingsService.saveSetting('churchflow_branding_config', def);
    setBranding(def);
  };

  return { branding, updateBranding, resetDefaults };
}
