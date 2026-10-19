import { useState, useEffect, useCallback } from 'react';
import {
  leadershipService,
  type DepartmentLeader,
  type CellLeaderRecord,
  type CampusZoneRecord,
  DEFAULT_DEPARTMENT_LEADERS,
  DEFAULT_CAMPUS_ZONES,
} from '../services/leadership.service';

export function useLeadership() {
  const [departmentLeaders, setDepartmentLeaders] = useState<DepartmentLeader[]>(DEFAULT_DEPARTMENT_LEADERS);
  const [cellLeaders, setCellLeaders] = useState<CellLeaderRecord[]>([]);
  const [campusZones, setCampusZones] = useState<CampusZoneRecord[]>(DEFAULT_CAMPUS_ZONES);
  const [loading, setLoading] = useState(true);

  const fetchLeaders = useCallback(async () => {
    try {
      setLoading(true);
      const [deptList, cellList] = await Promise.all([
        leadershipService.getDepartmentLeaders(),
        leadershipService.getCellLeaders(),
      ]);
      setDepartmentLeaders(deptList);
      setCellLeaders(cellList);
      setCampusZones(leadershipService.getCampusZones());
    } catch (err) {
      console.error('Error in useLeadership fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaders();

    const handleUpdate = () => {
      fetchLeaders();
    };

    window.addEventListener('churchflow_leadership_updated', handleUpdate);
    window.addEventListener('churchflow_zones_updated', handleUpdate);
    return () => {
      window.removeEventListener('churchflow_leadership_updated', handleUpdate);
      window.removeEventListener('churchflow_zones_updated', handleUpdate);
    };
  }, [fetchLeaders]);

  const updateDepartment = async (id: string, updates: Partial<DepartmentLeader>, oldName?: string) => {
    await leadershipService.updateDepartmentLeader(id, updates, oldName);
    fetchLeaders();
  };

  const createDepartment = async (leader: { department_name: string; leader_name: string; phone?: string }) => {
    await leadershipService.createDepartmentLeader(leader);
    fetchLeaders();
  };

  const deleteDepartment = async (id: string, name: string) => {
    await leadershipService.deleteDepartmentLeader(id, name);
    fetchLeaders();
  };

  const updateCell = async (id: string, updates: Partial<CellLeaderRecord>) => {
    await leadershipService.updateCellLeader(id, updates);
    fetchLeaders();
  };

  const createCell = async (cell: Partial<CellLeaderRecord>) => {
    await leadershipService.createCellLeader(cell);
    fetchLeaders();
  };

  const deleteCell = async (id: string) => {
    await leadershipService.deleteCellLeader(id);
    fetchLeaders();
  };

  const updateZone = (id: string, updates: Partial<CampusZoneRecord>) => {
    leadershipService.updateCampusZone(id, updates);
    setCampusZones(leadershipService.getCampusZones());
  };

  const createZone = (zone: Omit<CampusZoneRecord, 'id'>) => {
    const created = leadershipService.createCampusZone(zone);
    setCampusZones(leadershipService.getCampusZones());
    return created;
  };

  const deleteZone = (id: string) => {
    leadershipService.deleteCampusZone(id);
    setCampusZones(leadershipService.getCampusZones());
  };

  return {
    departmentLeaders,
    cellLeaders,
    campusZones,
    loading,
    refresh: fetchLeaders,
    updateDepartment,
    createDepartment,
    deleteDepartment,
    updateCell,
    createCell,
    deleteCell,
    updateZone,
    createZone,
    deleteZone,
  };
}
