import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  organisationService,
  NCF_UNN_FLAGSHIP_ORG,
} from '../services/organisation.service';
import type {
  Organisation,
  OrganisationTerminology,
  OrganisationBranding,
  OrganisationMeetingSchedules,
  OrganisationEnabledModules,
} from '../types/organisation.types';

interface TenantContextType {
  organisation: Organisation;
  isLoading: boolean;
  switchOrganisation: (slug: string) => Promise<void>;
  refreshOrganisation: () => Promise<void>;
  terminology: OrganisationTerminology;
  branding: OrganisationBranding;
  meetingSchedules: OrganisationMeetingSchedules;
  enabledModules: OrganisationEnabledModules;
  isModuleEnabled: (moduleName: keyof OrganisationEnabledModules) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organisation, setOrganisation] = useState<Organisation>(NCF_UNN_FLAGSHIP_ORG);
  const [isLoading, setIsLoading] = useState(true);

  // Initial tenant resolution by domain, query param, or cached slug
  const loadTenant = useCallback(async (slugOverride?: string) => {
    setIsLoading(true);
    try {
      // Check URL search parameters (e.g. ?org=gracecity) for instant workspace preview
      const urlParams = new URLSearchParams(window.location.search);
      const queryOrg = urlParams.get('org');
      const targetSlug = slugOverride || queryOrg || undefined;

      const resolved = await organisationService.resolveActiveOrganisation(targetSlug);
      setOrganisation(resolved);
    } catch (err) {
      console.warn('[TenantProvider] Resolution failed, using fallback:', err);
      setOrganisation(NCF_UNN_FLAGSHIP_ORG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenant();

    // Listen to custom cross-component broadcast events
    const handleOrgChanged = (e: CustomEvent<Organisation>) => {
      if (e.detail) {
        setOrganisation(e.detail);
      }
    };

    window.addEventListener('churchflow_organisation_changed' as any, handleOrgChanged);
    return () => {
      window.removeEventListener('churchflow_organisation_changed' as any, handleOrgChanged);
    };
  }, [loadTenant]);

  const switchOrganisation = async (slug: string) => {
    await loadTenant(slug);
  };

  const refreshOrganisation = async () => {
    await loadTenant(organisation.slug);
  };

  const isModuleEnabled = useCallback(
    (moduleName: keyof OrganisationEnabledModules): boolean => {
      return !!organisation.enabled_modules[moduleName];
    },
    [organisation]
  );

  const value: TenantContextType = {
    organisation,
    isLoading,
    switchOrganisation,
    refreshOrganisation,
    terminology: organisation.terminology,
    branding: organisation.branding,
    meetingSchedules: organisation.meeting_schedules,
    enabledModules: organisation.enabled_modules,
    isModuleEnabled,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
