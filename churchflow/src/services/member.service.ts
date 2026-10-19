import { supabase } from '../lib/supabase';
import type { Member } from '../types/database.types';

export const memberService = {
  /**
   * Fetches members with optional filtering, search, and pagination
   */
  async getMembers(params?: {
    search?: string;
    zone?: string;
    department?: string;
    leader?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Member[]; count: number }> {
    let query = supabase.from('members').select('*', { count: 'exact' });

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
   * Fetches a single member by ID / Token
   */
  async getMemberById(id: string | number): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
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
   * Loads all active G12 Leaders (from members tagged as DH/Core or Pastor, plus all assigned G12 leaders)
   */
  async getActiveLeaders(): Promise<string[]> {
    const set = new Set<string>();

    const { data: tagged, error: err1 } = await supabase
      .from('members')
      .select('member_name')
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
   * Loads members belonging to a specific G12 leader
   */
  async getMembersByLeader(leaderName: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('g12_leader', leaderName)
      .order('member_name', { ascending: true });

    if (error) throw error;
    return (data as Member[]) || [];
  },

  /**
   * Loads members belonging to a department, supporting database aliases
   */
  async getMembersByDepartment(deptName: string): Promise<Member[]> {
    let query = supabase.from('members').select('*');
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
   * Inserts a new member record
   */
  async createMember(payload: Partial<Member>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data as Member;
  },
};
