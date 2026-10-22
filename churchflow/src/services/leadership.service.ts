import { supabase } from '../lib/supabase';
import { getBentoConfig, saveBentoConfig } from '../lib/bentoStorage';
import { getActiveOrganisationId, NCF_UNN_ID } from './organisation.service';

export interface DepartmentLeader {
  id: string;
  department_name: string;
  leader_name: string;
  phone?: string;
  created_at?: string;
}

export interface CellLeaderRecord {
  id: string;
  zone: string;
  cell_name: string;
  cell_leader: string;
  cell_address?: string;
  assistant?: string;
  schedule?: string | null;
}

export interface CampusZoneRecord {
  id: string;
  name: string;
  campus_area: string;
  leader: string;
}

export const DEFAULT_CAMPUS_ZONES: CampusZoneRecord[] = [
  { id: 'z1', name: 'HQ', campus_area: 'Fellowship Center / Freedom Square', leader: 'Pastor Tony Ubagu' },
  { id: 'z2', name: 'Franco', campus_area: 'Franco Hostel Cluster / Mary Slessor', leader: 'Pastor Kene Offiah' },
  { id: 'z3', name: 'Hilltop', campus_area: 'Hilltop Enclave / Behind Flat', leader: 'Pastor Royal Iroh' },
  { id: 'z4', name: 'Odenigwe', campus_area: 'Odenigwe Road & Environs', leader: 'Pastor Promise Okeke' },
  { id: 'z5', name: 'Odim', campus_area: 'Odim Gate & Staff Quarters', leader: 'Pastor Francis Ogbozor' },
  { id: 'z6', name: 'JSQ', campus_area: 'Junior Staff Quarters / Vet Mountain', leader: 'Winner Richards' },
  { id: 'z7', name: 'Greenhouse', campus_area: 'Greenhouse Lodge & Environs', leader: 'Kene Offiah' },
  { id: 'z8', name: 'Campus Hostels', campus_area: 'Bello, Alvan, Eni Njoku, Okpara', leader: 'Mmesoma Ozor' },
  { id: 'z9', name: 'Ede-Oballa', campus_area: 'Township / Off-Campus Extension', leader: 'Noble Onwuka' },
];

// Default fallback units matching database & bento grid
export const DEFAULT_DEPARTMENT_LEADERS: DepartmentLeader[] = [
  { id: 'b030aa95-f05c-45f6-a1b0-65d1fdff14ed', department_name: 'Administration', leader_name: 'Emmanuella Okonkwo', phone: '07019319034' },
  { id: '04c9549f-8b09-4a16-bdd6-14a192cb3deb', department_name: 'Ushering', leader_name: 'Kosisochukwu Mbamalu', phone: '08119513436' },
  { id: '1243104e-3cd7-4a29-9fbf-135883114ab1', department_name: 'MVP', leader_name: 'Janefrancis Igwilo', phone: '07046716901' },
  { id: '08fb112b-5474-4e74-9058-528766fb6b39', department_name: 'NCF Angels', leader_name: 'Kosisochukwu Onyibor', phone: '07072136541' },
  { id: '6258f029-7d4d-461e-b1df-da53d0dfb8ae', department_name: 'Temple tenders', leader_name: 'Ifeyinwa Umeadi', phone: '09130530238' },
  { id: 'db8b9973-7ee6-4633-b6a3-8238ca7d7572', department_name: 'Technical Unit', leader_name: 'Udochukwu Aneke', phone: '08104697634' },
  { id: '3876bd8a-96c2-4f34-81be-518b544e8dad', department_name: 'Finances', leader_name: 'Faithfulness Onu', phone: '08140286257' },
  { id: 'ad6cd0f7-f6aa-4ce3-a36d-15dcb2eb1081', department_name: 'Media Unit', leader_name: 'Nelson Okeke', phone: '08124498675' },
  { id: 'cda35ff5-3f94-439b-b413-0c2f160e81f2', department_name: 'Intercessory', leader_name: 'Godreigns Anyachebelu', phone: '09161975291' },
];

export const leadershipService = {
  /**
   * Fetch all department leaders from Supabase with fallback to cache
   */
  async getDepartmentLeaders(organisationId?: string): Promise<DepartmentLeader[]> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      const { data, error } = await supabase
        .from('department_leaders')
        .select('*')
        .eq('organisation_id', orgId)
        .order('department_name', { ascending: true });

      if (error || !data || data.length === 0) {
        return orgId === NCF_UNN_ID ? DEFAULT_DEPARTMENT_LEADERS : [];
      }

      return data as DepartmentLeader[];
    } catch (err) {
      console.error('Error fetching department leaders:', err);
      return orgId === NCF_UNN_ID ? DEFAULT_DEPARTMENT_LEADERS : [];
    }
  },

  /**
   * Update department leader and sync across bento grid and app state
   */
  async updateDepartmentLeader(
    id: string,
    updates: Partial<DepartmentLeader>,
    oldDeptName?: string,
    organisationId?: string
  ): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      // 1. Update in Supabase scoped to active org
      const { error } = await supabase
        .from('department_leaders')
        .update({
          department_name: updates.department_name,
          leader_name: updates.leader_name,
          phone: updates.phone,
        })
        .eq('id', id)
        .eq('organisation_id', orgId);

      if (error) {
        console.error('Supabase update department_leaders error:', error);
      }
    } catch (err) {
      console.error('Failed to update Supabase department_leaders:', err);
    }

    // 2. Synchronize with Bento Grid Dashboard config
    try {
      const bentoCfg = getBentoConfig();
      const targetName = oldDeptName || updates.department_name;
      let matched = false;

      const updatedItems = bentoCfg.directorateHealth.items.map(item => {
        if (
          (targetName && item.name.toLowerCase() === targetName.toLowerCase()) ||
          (updates.department_name && item.name.toLowerCase() === updates.department_name.toLowerCase())
        ) {
          matched = true;
          return {
            ...item,
            name: updates.department_name || item.name,
            head: updates.leader_name || item.head,
          };
        }
        return item;
      });

      if (!matched && updates.department_name && updates.leader_name) {
        updatedItems.push({
          name: updates.department_name,
          head: updates.leader_name,
          attendancePercent: 90,
        });
      }

      saveBentoConfig({
        ...bentoCfg,
        directorateHealth: {
          ...bentoCfg.directorateHealth,
          items: updatedItems,
        },
      });
    } catch (err) {
      console.error('Failed to sync Bento config:', err);
    }

    // 3. Dispatch global events
    window.dispatchEvent(new CustomEvent('churchflow_leadership_updated'));
  },

  /**
   * Add a new department/unit leader scoped to active organisation
   */
  async createDepartmentLeader(leader: {
    department_name: string;
    leader_name: string;
    phone?: string;
    organisation_id?: string;
  }): Promise<DepartmentLeader> {
    const orgId = leader.organisation_id || getActiveOrganisationId();
    const newId = crypto.randomUUID ? crypto.randomUUID() : `dept-${Date.now()}`;
    const newRecord: DepartmentLeader = {
      id: newId,
      department_name: leader.department_name.trim(),
      leader_name: leader.leader_name.trim(),
      phone: leader.phone?.trim() || '',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('department_leaders')
        .insert([{
          id: newRecord.id,
          organisation_id: orgId,
          department_name: newRecord.department_name,
          leader_name: newRecord.leader_name,
          phone: newRecord.phone,
        }])
        .select()
        .single();

      if (!error && data) {
        newRecord.id = data.id;
      }
    } catch (err) {
      console.error('Failed to insert department_leaders in Supabase:', err);
    }

    // Add to Bento config
    try {
      const bentoCfg = getBentoConfig();
      saveBentoConfig({
        ...bentoCfg,
        directorateHealth: {
          ...bentoCfg.directorateHealth,
          items: [
            ...bentoCfg.directorateHealth.items,
            {
              name: newRecord.department_name,
              head: newRecord.leader_name,
              attendancePercent: 90,
            },
          ],
        },
      });
    } catch (err) {
      console.error('Failed to sync Bento config:', err);
    }

    window.dispatchEvent(new CustomEvent('churchflow_leadership_updated'));
    return newRecord;
  },

  /**
   * Delete a department leader scoped to active org
   */
  async deleteDepartmentLeader(id: string, departmentName: string, organisationId?: string): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      await supabase.from('department_leaders').delete().eq('id', id).eq('organisation_id', orgId);
    } catch (err) {
      console.error('Failed to delete department leader from Supabase:', err);
    }

    try {
      const bentoCfg = getBentoConfig();
      saveBentoConfig({
        ...bentoCfg,
        directorateHealth: {
          ...bentoCfg.directorateHealth,
          items: bentoCfg.directorateHealth.items.filter(
            item => item.name.toLowerCase() !== departmentName.toLowerCase()
          ),
        },
      });
    } catch (err) {
      console.error('Failed to remove from Bento config:', err);
    }

    window.dispatchEvent(new CustomEvent('churchflow_leadership_updated'));
  },

  /**
   * Fetch all cell leaders from Supabase scoped to active org
   */
  async getCellLeaders(organisationId?: string): Promise<CellLeaderRecord[]> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      const { data, error } = await supabase
        .from('cell_leaders')
        .select('*')
        .eq('organisation_id', orgId)
        .order('cell_name', { ascending: true });

      if (error || !data) return [];
      return data as CellLeaderRecord[];
    } catch (err) {
      console.error('Error fetching cell leaders:', err);
      return [];
    }
  },

  /**
   * Update cell leader scoped to active org
   */
  async updateCellLeader(id: string, updates: Partial<CellLeaderRecord>, organisationId?: string): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      await supabase
        .from('cell_leaders')
        .update({
          cell_name: updates.cell_name,
          cell_leader: updates.cell_leader,
          assistant: updates.assistant,
          cell_address: updates.cell_address,
          zone: updates.zone,
          schedule: updates.schedule,
        })
        .eq('id', id)
        .eq('organisation_id', orgId);

      window.dispatchEvent(new CustomEvent('churchflow_leadership_updated'));
    } catch (err) {
      console.error('Error updating cell leader:', err);
    }
  },

  /**
   * Create a new cell leader record scoped to active org
   */
  async createCellLeader(cell: Partial<CellLeaderRecord> & { organisation_id?: string }): Promise<void> {
    const orgId = cell.organisation_id || getActiveOrganisationId();
    try {
      const newId = cell.id || `c${Date.now()}`;
      await supabase.from('cell_leaders').insert([{
        id: newId,
        organisation_id: orgId,
        cell_name: cell.cell_name,
        cell_leader: cell.cell_leader,
        assistant: cell.assistant || '—',
        cell_address: cell.cell_address || 'Campus Venue',
        zone: cell.zone || 'HQ',
        schedule: cell.schedule || 'Saturday 5:00 PM',
      }]);

      window.dispatchEvent(new CustomEvent('churchflow_leadership_updated'));
    } catch (err) {
      console.error('Error creating cell leader:', err);
    }
  },

  /**
   * Delete a cell leader record scoped to active org
   */
  async deleteCellLeader(id: string, organisationId?: string): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    try {
      await supabase.from('cell_leaders').delete().eq('id', id).eq('organisation_id', orgId);
      window.dispatchEvent(new CustomEvent('churchflow_leadership_updated'));
    } catch (err) {
      console.error('Error deleting cell leader:', err);
    }
  },

  /**
   * Fetch all campus zones with fallback to DEFAULT_CAMPUS_ZONES for NCF UNN
   */
  getCampusZones(organisationId?: string): CampusZoneRecord[] {
    const orgId = organisationId || getActiveOrganisationId();
    const storageKey = `churchflow_campus_zones_${orgId}`;
    try {
      const stored = localStorage.getItem(storageKey) || (orgId === NCF_UNN_ID ? localStorage.getItem('churchflow_campus_zones') : null);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read stored campus zones', e);
    }
    return orgId === NCF_UNN_ID
      ? DEFAULT_CAMPUS_ZONES
      : [{ id: 'z1', name: 'Main Campus', campus_area: 'Auditorium / Worship Center', leader: 'Lead Pastor' }];
  },

  /**
   * Save all campus zones to storage and dispatch event scoped to org
   */
  saveCampusZones(zones: CampusZoneRecord[], organisationId?: string): void {
    const orgId = organisationId || getActiveOrganisationId();
    const storageKey = `churchflow_campus_zones_${orgId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(zones));
      if (orgId === NCF_UNN_ID) {
        localStorage.setItem('churchflow_campus_zones', JSON.stringify(zones));
      }
      window.dispatchEvent(new CustomEvent('churchflow_leadership_updated'));
      window.dispatchEvent(new CustomEvent('churchflow_zones_updated'));
    } catch (e) {
      console.error('Failed to save campus zones', e);
    }
  },

  /**
   * Update a specific campus zone
   */
  updateCampusZone(id: string, updates: Partial<CampusZoneRecord>, organisationId?: string): void {
    const list = this.getCampusZones(organisationId);
    const updated = list.map(z => (z.id === id ? { ...z, ...updates } : z));
    this.saveCampusZones(updated, organisationId);
  },

  /**
   * Create a new campus zone
   */
  createCampusZone(zone: Omit<CampusZoneRecord, 'id'>, organisationId?: string): CampusZoneRecord {
    const list = this.getCampusZones(organisationId);
    const created: CampusZoneRecord = {
      ...zone,
      id: `z-${Date.now()}`,
    };
    this.saveCampusZones([...list, created], organisationId);
    return created;
  },

  /**
   * Delete a campus zone
   */
  deleteCampusZone(id: string, organisationId?: string): void {
    const list = this.getCampusZones(organisationId);
    this.saveCampusZones(list.filter(z => z.id !== id), organisationId);
  },
};
