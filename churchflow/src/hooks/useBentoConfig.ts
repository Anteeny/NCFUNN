import { useState, useEffect, useCallback } from 'react';
import { getBentoConfig, saveBentoConfig, resetBentoConfig } from '../lib/bentoStorage';
import type { BentoGridDashboardConfig } from '../config/bentoGrid.config';

export function useBentoConfig() {
  const [config, setConfig] = useState<BentoGridDashboardConfig>(getBentoConfig);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<BentoGridDashboardConfig>;
      setConfig(customEvt.detail || getBentoConfig());
    };

    window.addEventListener('churchflow_bento_updated', handleUpdate);
    return () => window.removeEventListener('churchflow_bento_updated', handleUpdate);
  }, []);

  const updateConfig = useCallback((newConfig: BentoGridDashboardConfig) => {
    saveBentoConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const resetDefaults = useCallback(() => {
    const def = resetBentoConfig();
    setConfig(def);
  }, []);

  return {
    config,
    updateConfig,
    resetDefaults,
  };
}
