import { useState, useEffect } from 'react';
import {
  getBrandingConfig,
  saveBrandingConfig,
  resetBrandingConfig,
  type ChurchBrandingConfig,
} from '../lib/brandingStorage';

export function useBranding() {
  const [branding, setBranding] = useState<ChurchBrandingConfig>(getBrandingConfig);

  useEffect(() => {
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
    setBranding(next);
  };

  const resetDefaults = () => {
    const def = resetBrandingConfig();
    setBranding(def);
  };

  return { branding, updateBranding, resetDefaults };
}
