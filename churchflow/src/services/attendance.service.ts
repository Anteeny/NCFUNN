import { supabase } from '../lib/supabase';
import type { Member, ServiceAttendanceRecord } from '../types/database.types';
import { getActiveOrganisationId } from './organisation.service';

export interface ServiceAttendeeRecord {
  id: string;
  member_id: string;
  member_name: string;
  checked_in_at: string;
}

export interface ServiceFolder {
  id: string;
  service_date: string;
  service_type: string;
  count: number;
  records: ServiceAttendeeRecord[];
}

export type ServiceSummary = ServiceFolder;

export const attendanceService = {
  /**
   * Fetches all saved check-ins for a specific service date and type
   */
  async getServiceAttendance(
    serviceDate: string,
    serviceType: string,
    organisationId?: string
  ): Promise<ServiceAttendanceRecord[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('service_attendance')
      .select('*')
      .eq('organisation_id', orgId)
      .eq('service_date', serviceDate)
      .eq('service_type', serviceType)
      .order('checked_in_at', { ascending: false });

    if (error) {
      console.error('Error fetching service attendance:', error);
      throw error;
    }
    return (data as ServiceAttendanceRecord[]) || [];
  },

  /**
   * Saves a member's check-in immediately to Supabase
   * Scoped to active organisation
   */
  async checkInMember(params: {
    member_id: string | number;
    member_name: string;
    service_date: string;
    service_type: string;
    zone?: string | null;
    department?: string | null;
    marked_by?: string;
    organisation_id?: string;
  }): Promise<ServiceAttendanceRecord> {
    const orgId = params.organisation_id || getActiveOrganisationId();
    const nowIso = new Date().toISOString();
    const payload = {
      organisation_id: orgId,
      member_id: String(params.member_id),
      member_name: params.member_name,
      service_date: params.service_date,
      service_type: params.service_type,
      zone: params.zone || 'HQ',
      department: params.department || null,
      checked_in_at: nowIso,
      marked_by: params.marked_by || 'Gate Usher',
    };

    const { data, error } = await supabase
      .from('service_attendance')
      .upsert(payload, { onConflict: 'member_id,service_date,service_type' })
      .select()
      .single();

    if (error) {
      console.error('Check-in error:', error);
      throw error;
    }
    return data as ServiceAttendanceRecord;
  },

  /**
   * Removes a check-in record (undo action for ushers)
   */
  async undoCheckIn(
    memberId: string | number,
    serviceDate: string,
    serviceType: string,
    organisationId?: string
  ): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    const { error } = await supabase
      .from('service_attendance')
      .delete()
      .eq('organisation_id', orgId)
      .eq('member_id', String(memberId))
      .eq('service_date', serviceDate)
      .eq('service_type', serviceType);

    if (error) {
      console.error('Undo check-in error:', error);
      throw error;
    }
  },

  /**
   * Registers a brand new MVP (using only the 3 essential fields)
   * and immediately marks them checked-in for the active service.
   */
  async registerAndCheckInMVP(params: {
    name: string;
    phone: string;
    schoolAddress: string;
    serviceDate: string;
    serviceType: string;
    zone?: string;
    department?: string;
    organisation_id?: string;
  }): Promise<{ member: Member; attendance: ServiceAttendanceRecord }> {
    const orgId = params.organisation_id || getActiveOrganisationId();
    const cleanName = params.name.trim();
    const cleanPhone = params.phone.trim();
    const cleanAddress = params.schoolAddress.trim();

    // 1. Create MVP record in members table scoped to org
    const { data: newMember, error: memberErr } = await supabase
      .from('members')
      .insert([
        {
          organisation_id: orgId,
          member_name: cleanName,
          member_phone: cleanPhone,
          phone: cleanPhone,
          school_address: cleanAddress,
          School_Address: cleanAddress,
          membership_level: 'MVP',
          zone: params.zone || 'HQ',
          department: params.department || null,
          joined_date: params.serviceDate,
        },
      ])
      .select()
      .single();

    if (memberErr) {
      console.error('Error registering MVP member:', memberErr);
      throw memberErr;
    }

    // 2. Immediately mark checked in
    const attendance = await this.checkInMember({
      organisation_id: orgId,
      member_id: newMember.id,
      member_name: cleanName,
      service_date: params.serviceDate,
      service_type: params.serviceType,
      zone: params.zone || 'HQ',
      department: params.department || null,
    });

    return {
      member: newMember as Member,
      attendance,
    };
  },

  /**
   * Fetches service attendance history grouped into service folders,
   * containing attendees with member_name and checked_in_at.
   */
  async getServiceAttendanceHistory(organisationId?: string): Promise<ServiceFolder[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('service_attendance')
      .select('id, member_id, member_name, service_date, service_type, checked_in_at')
      .eq('organisation_id', orgId)
      .order('service_date', { ascending: false })
      .order('checked_in_at', { ascending: true });

    if (error) {
      console.error('Error fetching service attendance history:', error);
      return [];
    }

    const map = new Map<string, ServiceFolder>();
    (data || []).forEach(row => {
      const key = `${row.service_date}__${row.service_type}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          service_date: row.service_date,
          service_type: row.service_type,
          count: 0,
          records: [],
        });
      }
      const folder = map.get(key)!;
      folder.records.push({
        id: String(row.id),
        member_id: String(row.member_id),
        member_name: row.member_name,
        checked_in_at: row.checked_in_at,
      });
      folder.count = folder.records.length;
    });

    return Array.from(map.values()).sort((a, b) => b.service_date.localeCompare(a.service_date));
  },
};
