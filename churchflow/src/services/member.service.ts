export interface G12LeaderStats {
  name: string;
  count: number;
  leaderName: string;
  discipleCount: number;
  phone?: string;
  department?: string;
  zone?: string;
  memberId?: number | string;
}

import { supabase } from '../lib/supabase';
import type { Member } from '../types/database.types';
import { getActiveOrganisationId } from './organisation.service';

export const memberService = {
  /**
   * Fetches members scoped to the active church organisation
   */
  async getMembers(params?: {
    search?: string;
    zone?: string;
    department?: string;
    leader?: string;
    limit?: number;
    offset?: number;
    organisation_id?: string;
  }): Promise<{ data: Member[]; count: number }> {
    const orgId = params?.organisation_id || getActiveOrganisationId();
    let query = supabase
      .from('members')
      .select('*', { count: 'exact' })
      .eq('organisation_id', orgId);

    if (params?.search && params.search.trim().length > 0) {
      const term = `%${params.search.trim()}%`;
      query = query.or(`member_name.ilike.${term},phone.ilike.${term},member_phone.ilike.${term}`);
    }
    if (params?.zone && params.zone !== 'ALL') {
      query = query.eq('zone', params.zone);
    }
    if (params?.department && params.department !== 'ALL') {
      query = query.eq('department', params.department);
    }
    if (params?.leader && params.leader !== 'ALL') {
      query = query.eq('g12_leader', params.leader);
    }

    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    query = query.range(offset, offset + limit - 1).order('member_name', { ascending: true });

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data as Member[]) || [], count: count || 0 };
  },

  /**
   * Fetches a single member by ID / Token scoped to the active organisation
   */
  async getMemberById(id: string | number, organisationId?: string): Promise<Member | null> {
    const orgId = organisationId || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .eq('organisation_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return (data as Member) || null;
  },

  /**
   * Updates a member's profile safely (only allowed editable fields)
   */
  async updateMemberProfile(id: string | number, payload: Partial<Member>): Promise<Member> {
    // Whitelist allowed fields to prevent arbitrary column injection
    const allowedUpdates: Record<string, any> = {};
    if (payload.member_name !== undefined) allowedUpdates.member_name = payload.member_name;
    if (payload.phone !== undefined) {
      allowedUpdates.phone = payload.phone;
      allowedUpdates.member_phone = payload.phone;
    }
    if (payload.gender !== undefined) allowedUpdates.gender = payload.gender;
    if (payload.birthday !== undefined) allowedUpdates.birthday = payload.birthday;
    if (payload.department !== undefined) allowedUpdates.department = payload.department;
    if (payload.g12_leader !== undefined) allowedUpdates.g12_leader = payload.g12_leader;
    if (payload.membership_level !== undefined) allowedUpdates.membership_level = payload.membership_level;
    if (payload.zone !== undefined) allowedUpdates.zone = payload.zone;
    if (payload.school_address !== undefined) {
      allowedUpdates.school_address = payload.school_address;
      allowedUpdates.School_Address = payload.school_address;
    }
    if (payload.home_address !== undefined) {
      allowedUpdates.home_address = payload.home_address;
      allowedUpdates.Home_Address = payload.home_address;
    }
    if (payload.dc_trainings !== undefined) allowedUpdates.dc_trainings = payload.dc_trainings;
    if (payload.fellowship_status !== undefined) allowedUpdates.fellowship_status = payload.fellowship_status;

    const { data, error } = await supabase
      .from('members')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Member;
  },

  /**
   * Loads all active G12 Leaders scoped to the active organisation
   */
  async getActiveLeaders(organisationId?: string): Promise<string[]> {
    const orgId = organisationId || getActiveOrganisationId();
    const set = new Set<string>();

    const { data: tagged, error: err1 } = await supabase
      .from('members')
      .select('member_name')
      .eq('organisation_id', orgId)
      .or('membership_level.ilike.%dh%,membership_level.ilike.%core%,membership_level.ilike.%pastor%');

    if (!err1 && tagged) {
      tagged.forEach(m => {
        const name = (m.member_name || '').trim();
        if (name) set.add(name);
      });
    }

    const { data: assigned, error: err2 } = await supabase
      .from('members')
      .select('g12_leader')
      .eq('organisation_id', orgId)
      .not('g12_leader', 'is', null);

    if (!err2 && assigned) {
      assigned.forEach(m => {
        const name = (m.g12_leader || '').trim();
        if (name && name !== '-' && name !== 'None' && name.toLowerCase() !== 'null') {
          set.add(name);
        }
      });
    }

    return Array.from(set).sort();
  },

  /**
   * Loads members belonging to a specific G12 leader in the active organisation
   */
  async getMembersByLeader(leaderName: string, organisationId?: string): Promise<Member[]> {
    const orgId = organisationId || getActiveOrganisationId();
    let query = supabase
      .from('members')
      .select('*')
      .ilike('g12_leader', leaderName.trim())
      .order('member_name', { ascending: true });

    if (orgId) {
      query = query.or('organisation_id.eq.' + orgId + ',organisation_id.is.null');
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as Member[]) || [];
  },

  /**
   * Loads members belonging to a department scoped to the active organisation
   */
  async getMembersByDepartment(deptName: string, organisationId?: string): Promise<Member[]> {
    const orgId = organisationId || getActiveOrganisationId();
    let query = supabase.from('members').select('*').eq('organisation_id', orgId);
    const lower = deptName.toLowerCase();

    if (lower.includes('choir') || lower.includes('praise') || lower.includes('angels')) {
      query = query.or('department.ilike.%Choir%,department.ilike.%Praise%,department.ilike.%Angels%');
    } else if (lower.includes('usher')) {
      query = query.or('department.ilike.%Usher%');
    } else if (lower.includes('prayer') || lower.includes('intercess')) {
      query = query.or('department.ilike.%Prayer%,department.ilike.%Intercess%');
    } else if (lower.includes('decorat') || lower.includes('tender')) {
      query = query.or('department.ilike.%Decorat%,department.ilike.%Temple tenders%');
    } else if (lower.includes('media')) {
      query = query.ilike('department', '%Media%');
    } else if (lower.includes('tech')) {
      query = query.ilike('department', '%Tech%');
    } else if (lower.includes('admin')) {
      query = query.ilike('department', '%Admin%');
    } else {
      query = query.ilike('department', `%${deptName.trim()}%`);
    }

    const { data, error } = await query.order('member_name', { ascending: true });
    if (error) throw error;
    return (data as Member[]) || [];
  },

  /**
   * Inserts a new member record with organisation ownership
   */
  async createMember(payload: Partial<Member>): Promise<Member> {
    const orgId = payload.organisation_id || getActiveOrganisationId();
    const { data, error } = await supabase
      .from('members')
      .insert([{ ...payload, organisation_id: orgId }])
      .select()
      .single();

    if (error) throw error;
    return data as Member;
  },

  /**
   * Reassigns a list of members to a new G12 leader
   */
  async reassignMembers(
    memberIds: (string | number)[],
    newLeaderName: string,
    organisationId?: string
  ): Promise<number> {
    const orgId = organisationId || getActiveOrganisationId();
    if (!memberIds || memberIds.length === 0) return 0;
    const { data, error } = await supabase
      .from('members')
      .update({ g12_leader: newLeaderName.trim() })
      .in('id', memberIds)
      .eq('organisation_id', orgId)
      .select('id');

    if (error) throw error;
    return data ? data.length : 0;
  },

  /**
   * Assigns a single member to a G12 leader
   */
  async addMemberToLeader(
    memberId: string | number,
    leaderName: string,
    organisationId?: string
  ): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    const { error } = await supabase
      .from('members')
      .update({ g12_leader: leaderName.trim() })
      .eq('id', memberId)
      .eq('organisation_id', orgId);

    if (error) throw error;
  },

  /**
   * Removes/unassigns a member from their G12 leader
   */
  async removeMemberFromLeader(
    memberId: string | number,
    organisationId?: string
  ): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    const { error } = await supabase
      .from('members')
      .update({ g12_leader: null })
      .eq('id', memberId)
      .eq('organisation_id', orgId);

    if (error) throw error;
  },

  /**
   * Updates a leader's details and, if the name changed, cascades to all their disciples
   */
  async updateLeaderProfileAndCascade(
    oldLeaderName: string,
    updates: {
      newName?: string;
      phone?: string;
      department?: string;
      zone?: string;
    },
    organisationId?: string
  ): Promise<void> {
    const orgId = organisationId || getActiveOrganisationId();
    const trimmedOld = oldLeaderName.trim();
    const trimmedNew = (updates.newName || trimmedOld).trim();

    // 1. If leader's own row exists, update their profile
    const { data: leaderRows } = await supabase
      .from('members')
      .select('id')
      .eq('organisation_id', orgId)
      .eq('member_name', trimmedOld);

    if (leaderRows && leaderRows.length > 0) {
      const leaderPayload: Record<string, any> = {};
      if (trimmedNew !== trimmedOld) leaderPayload.member_name = trimmedNew;
      if (updates.phone !== undefined) {
        leaderPayload.member_phone = updates.phone;
      }
      if (updates.department !== undefined) leaderPayload.department = updates.department;
      if (updates.zone !== undefined) leaderPayload.zone = updates.zone;

      if (Object.keys(leaderPayload).length > 0) {
        await supabase
          .from('members')
          .update(leaderPayload)
          .eq('id', leaderRows[0].id)
          .eq('organisation_id', orgId);
      }
    }

    // 2. Cascade rename across all disciples where g12_leader = oldLeaderName
    if (trimmedNew !== trimmedOld) {
      const { error: cascadeError } = await supabase
        .from('members')
        .update({ g12_leader: trimmedNew })
        .eq('organisation_id', orgId)
        .eq('g12_leader', trimmedOld);

      if (cascadeError) {
        console.warn('Cascade g12_leader rename warning:', cascadeError);
      }
    }
  },

  /**
   * Loads all active G12 Leaders along with their disciple counts and profile data
   */
  async getG12LeadersWithStats(organisationId?: string): Promise<G12LeaderStats[]> {
    const orgId = organisationId || getActiveOrganisationId();
    let query = supabase
      .from('members')
      .select('id, member_name, member_phone, department, zone, g12_leader, membership_level');

    if (orgId) {
      query = query.or('organisation_id.eq.' + orgId + ',organisation_id.is.null');
    }

    const { data: allMembers, error } = await query;
    if (error) {
      console.error('getG12LeadersWithStats error:', error);
      throw error;
    }
    const members = (allMembers as Member[]) || [];

    const statsMap: Record<string, { count: number; profile?: Member }> = {};

    members.forEach(m => {
      // Disciple counts
      const lName = (m.g12_leader || '').trim();
      if (lName && lName !== '-' && lName !== 'None' && lName.toLowerCase() !== 'unassigned' && lName.toLowerCase() !== 'null') {
        if (!statsMap[lName]) {
          statsMap[lName] = { count: 0 };
        }
        statsMap[lName].count += 1;
      }

      // Leader profile detection
      const mName = (m.member_name || '').trim();
      const level = (m.membership_level || '').toLowerCase();
      const isLeader = level.includes('dh') || level.includes('core') || level.includes('pastor');
      if (isLeader && mName) {
        if (!statsMap[mName]) {
          statsMap[mName] = { count: 0 };
        }
        statsMap[mName].profile = m;
      }
    });

    return Object.keys(statsMap)
      .map(name => {
        const item = statsMap[name];
        const prof = item.profile;
        return {
          name,
          leaderName: name,
          count: item.count,
          discipleCount: item.count,
          phone: prof?.member_phone || undefined,
          department: prof?.department || undefined,
          zone: prof?.zone || undefined,
          memberId: prof?.id,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Searches members available to be assigned to a G12 leader
   */
  async searchMembersForAssignment(
    searchTerm: string,
    currentLeaderName?: string,
    organisationId?: string
  ): Promise<Member[]> {
    const orgId = organisationId || getActiveOrganisationId();
    if (!searchTerm || searchTerm.trim().length < 2) return [];

    const term = '%' + searchTerm.trim() + '%';
    let query = supabase
      .from('members')
      .select('id, member_name, member_phone, department, zone, g12_leader, membership_level')
      .or('member_name.ilike.' + term + ',member_phone.ilike.' + term);

    if (orgId) {
      query = query.or('organisation_id.eq.' + orgId + ',organisation_id.is.null');
    }

    const { data, error } = await query.limit(20);
    if (error) throw error;
    const results = (data as Member[]) || [];

    if (currentLeaderName) {
      return results.filter(m => (m.g12_leader || '').trim().toLowerCase() !== currentLeaderName.trim().toLowerCase());
    }
    return results;
  },
};
