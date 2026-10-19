import { defaultBentoConfig, type BentoGridDashboardConfig } from '../config/bentoGrid.config';

const STORAGE_KEY = 'churchflow_bento_config';

/**
 * Retrieves the active Bento Grid configuration.
 * Merges localStorage overrides on top of defaultBentoConfig so that any newly
 * added fields in code are safely preserved with defaults.
 */
export function getBentoConfig(): BentoGridDashboardConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultBentoConfig,
        ...parsed,
        kpiCards: defaultBentoConfig.kpiCards.map(defCard => {
          const override = Array.isArray(parsed.kpiCards)
            ? parsed.kpiCards.find((c: { id: string }) => c.id === defCard.id)
            : null;
          return override
            ? { ...defCard, visible: override.visible ?? defCard.visible, colSpan: override.colSpan ?? defCard.colSpan }
            : defCard;
        }),
        announcementBanner: {
          ...defaultBentoConfig.announcementBanner,
          ...(parsed.announcementBanner || {}),
        },
        liveTicker: {
          ...defaultBentoConfig.liveTicker,
          ...(parsed.liveTicker || {}),
        },
        growthJourney: {
          ...defaultBentoConfig.growthJourney,
          ...(parsed.growthJourney || {}),
          stages: defaultBentoConfig.growthJourney.stages,
        },
        directorateHealth: {
          ...defaultBentoConfig.directorateHealth,
          ...(parsed.directorateHealth || {}),
        },
        priorityFollowUps: {
          ...defaultBentoConfig.priorityFollowUps,
          ...(parsed.priorityFollowUps || {}),
        },
        attendanceHeatmap: {
          ...defaultBentoConfig.attendanceHeatmap,
          ...(parsed.attendanceHeatmap || {}),
        },
        primaryModules: {
          ...defaultBentoConfig.primaryModules,
          ...(parsed.primaryModules || {}),
        },
        recentMembers: {
          ...defaultBentoConfig.recentMembers,
          ...(parsed.recentMembers || {}),
        },
      };
    }
  } catch (err) {
    console.error('Error reading saved bento configuration:', err);
  }
  return defaultBentoConfig;
}

/**
 * Saves updated Bento Grid configuration to localStorage and broadcasts
 * an event so all mounted components reactively update.
 */
export function saveBentoConfig(config: BentoGridDashboardConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('churchflow_bento_updated', { detail: config }));
  } catch (err) {
    console.error('Error saving bento configuration:', err);
  }
}

/**
 * Resets configuration back to code defaults.
 */
export function resetBentoConfig(): BentoGridDashboardConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('churchflow_bento_updated', { detail: defaultBentoConfig }));
  } catch (err) {
    console.error('Error resetting bento configuration:', err);
  }
  return defaultBentoConfig;
}
