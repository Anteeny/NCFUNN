import { useState, useEffect, useCallback } from 'react';
import { getBentoConfig, saveBentoConfig, resetBentoConfig } from '../lib/bentoStorage';
import { defaultBentoConfig, type BentoGridDashboardConfig } from '../config/bentoGrid.config';
import { settingsService } from '../services/settings.service';

export function useBentoConfig() {
  const [config, setConfig] = useState<BentoGridDashboardConfig>(getBentoConfig);

  useEffect(() => {
    // 1. Fetch remote shared dashboard config from Supabase if available
    settingsService.getSetting<BentoGridDashboardConfig>('churchflow_bento_config', defaultBentoConfig)
      .then(remote => {
        if (remote && JSON.stringify(remote) !== JSON.stringify(config)) {
          setConfig(remote);
          localStorage.setItem('churchflow_bento_config', JSON.stringify(remote));
        }
      })
      .catch(() => {});

    // 2. React to local window broadcast events
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<BentoGridDashboardConfig>;
      setConfig(customEvt.detail || getBentoConfig());
    };

    window.addEventListener('churchflow_bento_updated', handleUpdate);
    return () => window.removeEventListener('churchflow_bento_updated', handleUpdate);
  }, []);

  const updateConfig = useCallback((newConfig: BentoGridDashboardConfig) => {
    saveBentoConfig(newConfig);
    settingsService.saveSetting('churchflow_bento_config', newConfig);
    setConfig(newConfig);
  }, []);

  const resetDefaults = useCallback(() => {
    const def = resetBentoConfig();
    settingsService.saveSetting('churchflow_bento_config', def);
    setConfig(def);
  }, []);

  return {
    config,
    updateConfig,
    resetDefaults,
  };
}
