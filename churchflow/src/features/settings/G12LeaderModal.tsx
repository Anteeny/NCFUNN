import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from 'lucide-react';
import { memberService, type G12LeaderStats } from '../../services/member.service';
import type { Member } from '../../types/database.types';

export interface G12LeaderModalProps {
  leader: G12LeaderStats;
  allLeaders: G12LeaderStats[];
  onClose: () => void;
  onUpdated: () => void;
}

export const G12LeaderModal: React.FC<G12LeaderModalProps> = ({
  leader,
  allLeaders,
  onClose,
  onUpdated,
}) => {
  const leaderName = leader.name || leader.leaderName;
  const leaderStats = leader;
  const [activeTab, setActiveTab] = useState<'members' | 'profile' | 'add'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [targetLeader, setTargetLeader] = useState<string>('');

  // Profile Edit State
  const [profileName, setProfileName] = useState(leaderName);
  const [profilePhone, setProfilePhone] = useState(leaderStats?.phone || '');
  const [profileDept, setProfileDept] = useState(leaderStats?.department || '');
  const [profileZone, setProfileZone] = useState(leaderStats?.zone || '');

  // Add Member Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load disciples of this leader
  const loadLeaderMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await memberService.getMembersByLeader(leaderName);
      setMembers(data);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load leader disciples:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadLeaderMembers();
  }, [leaderName]);

  // Handle Search for adding new members
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await memberService.searchMembersForAssignment(searchQuery, leaderName);
        setSearchResults(res);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, leaderName]);

  // Reassign selected disciples
  const handleReassign = async () => {
    if (!targetLeader) {
      setFeedback({ type: 'error', message: 'Please select a destination G12 Leader from the dropdown.' });
      return;
    }
    if (selectedIds.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one disciple to reassign.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const updatedCount = await memberService.reassignMembers(selectedIds, targetLeader);
      setFeedback({
        type: 'success',
        message: `Successfully reassigned ${updatedCount} disciple(s) to ${targetLeader}. The next G12 report will reflect this update.`,
      });
      await loadLeaderMembers();
      onUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reassign members' });
    } finally {
      setSaving(false);
    }
  };

  // Remove / unassign single disciple
  const handleRemoveMember = async (memberId: number | string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from ${leaderName}'s G12 network?`)) return;

    setSaving(true);
    setFeedback(null);
    try {
      await memberService.removeMemberFromLeader(memberId);
      setFeedback({ type: 'success', message: `Removed ${memberName} from this G12 network.` });
      await loadLeaderMembers();
      onUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove member' });
    } finally {
      setSaving(false);
    }
  };

  // Add member to this G12 leader
  const handleAddMember = async (member: Member) => {
    setSaving(true);
    setFeedback(null);
    try {
      await memberService.addMemberToLeader(member.id, leaderName);
      setFeedback({
        type: 'success',
        message: `Added ${member.member_name} to ${leaderName}'s G12 network. Will appear on upcoming G12 reports.`,
      });
      setSearchQuery('');
      setSearchResults([]);
      await loadLeaderMembers();
      onUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add member' });
    } finally {
      setSaving(false);
    }
  };

  // Save Leader Profile changes & cascade
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setFeedback({ type: 'error', message: 'Leader name cannot be empty.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await memberService.updateLeaderProfileAndCascade(leaderName, {
        newName: profileName.trim(),
        phone: profilePhone.trim() || undefined,
        department: profileDept.trim() || undefined,
        zone: profileZone.trim() || undefined,
      });

      setFeedback({
        type: 'success',
        message: profileName.trim() !== leaderName
          ? `Leader renamed to "${profileName.trim()}". All assigned disciples in Supabase updated to match.`
          : 'Leader profile details updated successfully!',
      });
      onUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update leader profile' });
    } finally {
      setSaving(false);
    }
  };

  const otherLeaders = allLeaders
    .map(l => (typeof l === 'string' ? l : (l.name || l.leaderName)))
    .filter(l => l && l.trim().toLowerCase() !== leaderName.trim().toLowerCase());

  const toggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map(m => m.id));
    }
  };

  const toggleSelectMember = (id: number | string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="portal-card animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          background: 'var(--navy-deep)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--navy-soft)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              G12
            </div>
            <div>
              <h2 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                {leaderName}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span>{members.length} Disciples Assigned</span>
                <span>•</span>
                <span style={{ color: members.length >= 12 ? '#34d399' : '#38bdf8' }}>
                  {members.length >= 12 ? 'Target Reached (12+)' : `${12 - members.length} to target`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              margin: '12px 24px 0 24px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: feedback.type === 'success' ? '#34d399' : '#f87171',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span style={{ flex: 1 }}>{feedback.message}</span>
          </div>
        )}

        {/* Action Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            padding: '0 24px',
            gap: '16px',
            marginTop: '8px',
          }}
        >
          <button
            onClick={() => { setActiveTab('members'); setFeedback(null); }}
            style={{
              padding: '12px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'members' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'members' ? '#38bdf8' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Users size={15} />
            <span>Disciples & Reassignment ({members.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('add'); setFeedback(null); }}
            style={{
              padding: '12px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'add' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'add' ? '#38bdf8' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UserPlus size={15} />
            <span>Add Disciples</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setFeedback(null); }}
            style={{
              padding: '12px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'profile' ? '#38bdf8' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UserCheck size={15} />
            <span>Leader Profile</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* TAB 1: DISCIPLES & REASSIGNMENT */}
          {activeTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Batch Reassignment Toolbar */}
              <div
                style={{
                  background: 'var(--navy-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={members.length > 0 && selectedIds.length === members.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    id="selectAllG12"
                  />
                  <label htmlFor="selectAllG12" style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                    {selectedIds.length > 0 ? `${selectedIds.length} of ${members.length} Selected` : 'Select All Disciples'}
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    className="form-control"
                    style={{ fontSize: '12px', padding: '6px 10px', width: '200px' }}
                    value={targetLeader}
                    onChange={e => setTargetLeader(e.target.value)}
                  >
                    <option value="">Reassign to G12 Leader...</option>
                    {otherLeaders.map((ldr, idx) => (
                      <option key={idx} value={ldr}>
                        {ldr}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleReassign}
                    disabled={saving || selectedIds.length === 0 || !targetLeader}
                    className="btn btn-primary"
                    style={{
                      fontSize: '12px',
                      padding: '6px 14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <ArrowRightLeft size={13} />}
                    <span>Reassign</span>
                  </button>
                </div>
              </div>

              {/* Disciples Table */}
              {loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Loading disciples...
                </div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--navy-soft)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                  <Users size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 12px 0' }}>
                    No disciples currently mapped to {leaderName}.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    Add Disciples from Church Directory
                  </button>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--navy-soft)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ width: '38px', padding: '10px 12px', textAlign: 'center' }}></th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Disciple Name</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Phone</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Department</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => {
                        const isChecked = selectedIds.includes(m.id);
                        return (
                          <tr
                            key={m.id}
                            style={{
                              borderBottom: '1px solid var(--border)',
                              background: isChecked ? 'rgba(56, 189, 248, 0.06)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectMember(m.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>
                              {m.member_name}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                              {m.phone || m.member_phone || '—'}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                              {m.department || 'General'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleRemoveMember(m.id, m.member_name)}
                                title="Unassign disciple from this leader"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#f87171',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '4px',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD DISCIPLES */}
          {activeTab === 'add' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  SEARCH CHURCH MEMBERS TO ADD TO {leaderName.toUpperCase()}
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '36px' }}
                    placeholder="Type member name or phone number..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                    <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8' }} />
                  )}
                </div>
              </div>

              {searchResults.length > 0 ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--navy-soft)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Member Name</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Current Leader</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Department</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map(m => (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>
                            {m.member_name}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                            {m.g12_leader || <span style={{ color: '#fbbf24' }}>Unassigned</span>}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                            {m.department || '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleAddMember(m)}
                              disabled={saving}
                              className="btn btn-primary"
                              style={{ fontSize: '11.5px', padding: '4px 10px' }}
                            >
                              Add to G12
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : searchQuery.trim().length >= 2 && !isSearching ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No members found matching "{searchQuery}".
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--navy-soft)', borderRadius: '10px' }}>
                  Type at least 2 characters to search for any church member and assign them to this G12 leader.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LEADER PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#93c5fd' }}>
                <strong>Automatic Reporting Synchronization:</strong> Updating this leader's name will automatically update all {members.length} disciples in Supabase so their next G12 report accurately links to this leader.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  LEADER FULL NAME *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="e.g. Winner Richards"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  PHONE NUMBER
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  placeholder="e.g. 08123456789"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    PRIMARY DEPARTMENT
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileDept}
                    onChange={e => setProfileDept(e.target.value)}
                    placeholder="e.g. Media / Praise"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    CAMPUS ZONE
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileZone}
                    onChange={e => setProfileZone(e.target.value)}
                    placeholder="e.g. Franco / Hilltop"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '13px' }}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>Save Profile & Cascade Changes</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--navy-soft)',
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Changes are saved to Supabase and immediately active on report forms.
          </span>
          <button onClick={onClose} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 16px' }}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
