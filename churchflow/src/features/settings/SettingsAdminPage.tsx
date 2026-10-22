import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  MessageSquare,
  Shield,
  CheckCircle2,
  RotateCcw,
  Copy,
  Plus,
  Trash2,
  Megaphone,
  Layers,
  Building2,
  Compass,
  MapPin,
  Network,
  Search,
  X,
  Download,
  Sparkles,
  Upload,
  Check,
} from 'lucide-react';
import { useBentoConfig } from '../../hooks/useBentoConfig';
import { useLeadership } from '../../hooks/useLeadership';
import { useBranding } from '../../hooks/useBranding';
import { useTenant } from '../../context/TenantContext';
import { defaultBrandingConfig } from '../../lib/brandingStorage';
import { exportToCSV } from '../../utils/exportUtils';
import {
  leadershipService,
  type DepartmentLeader,
  type CellLeaderRecord,
  type CampusZoneRecord,
} from '../../services/leadership.service';
import { settingsService, type AdminProfile } from '../../services/settings.service';
import { organisationService, NCF_UNN_ID } from '../../services/organisation.service';
import type { Organisation } from '../../types/organisation.types';
import type { BentoGridDashboardConfig } from '../../config/bentoGrid.config';

export const SettingsAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'ticker' | 'units' | 'branding' | 'users' | 'workspace'>('units');
  const [leadershipSubTab, setLeadershipSubTab] = useState<'depts' | 'cells' | 'zones' | 'g12'>('depts');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Changes saved successfully! Dashboard, Departments, and Connect pages have updated.');

  const { config, updateConfig, resetDefaults } = useBentoConfig();
  const [localConfig, setLocalConfig] = useState<BentoGridDashboardConfig>(config);

  const { branding, updateBranding, resetDefaults: resetBrandingDefaults } = useBranding();
  const [draftBranding, setDraftBranding] = useState(branding);

  const {
    departmentLeaders,
    cellLeaders,
    campusZones,
    createDepartment,
    deleteDepartment,
    createCell,
    deleteCell,
    createZone,
    deleteZone,
    refresh: refreshLeadership,
  } = useLeadership();

  // Local draft state for Department Leaders
  const [draftDepts, setDraftDepts] = useState<DepartmentLeader[]>([]);
  // Local draft state for Cell Leaders
  const [draftCells, setDraftCells] = useState<CellLeaderRecord[]>([]);
  const [cellSearch, setCellSearch] = useState('');
  // Local draft state for Campus Zones
  const [draftZones, setDraftZones] = useState<CampusZoneRecord[]>([]);

  // Modals for adding
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({ department_name: '', leader_name: '', phone: '', targetPercent: 90 });

  const [showAddCellModal, setShowAddCellModal] = useState(false);
  const [newCellForm, setNewCellForm] = useState({ cell_name: '', cell_leader: '', assistant: '', zone: 'HQ', cell_address: '' });

  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [newZoneForm, setNewZoneForm] = useState({ name: '', campus_area: '', leader: '' });

  // Sync draft state from useLeadership
  useEffect(() => {
    setDraftDepts(departmentLeaders);
  }, [departmentLeaders]);

  useEffect(() => {
    setDraftCells(cellLeaders);
  }, [cellLeaders]);

  useEffect(() => {
    setDraftZones(campusZones);
  }, [campusZones]);

  // Sync local draft when external bento config changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Sync draft branding when branding changes
  useEffect(() => {
    setDraftBranding(branding);
  }, [branding]);

  // Multi-tenant Workspace state
  const { organisation, switchOrganisation, refreshOrganisation } = useTenant();
  const [allOrgs, setAllOrgs] = useState<Organisation[]>([]);
  const [orgDraft, setOrgDraft] = useState<Organisation>(organisation);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    slug: '',
    custom_domain: '',
    discipleshipModel: 'G12',
    groupSingular: 'Connect Group',
    groupPlural: 'Connect Groups',
    territoryLabel: 'Campus Zone',
  });
  const [copiedOrgUrl, setCopiedOrgUrl] = useState<string | null>(null);

  useEffect(() => {
    setOrgDraft(organisation);
  }, [organisation]);

  useEffect(() => {
    organisationService.listOrganisations().then(setAllOrgs);
  }, [organisation]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrgUrl(key);
    setTimeout(() => setCopiedOrgUrl(null), 2500);
  };

  const handleSaveWorkspace = async () => {
    if (!orgDraft.id) return;
    try {
      const updated = await organisationService.updateOrganisation(orgDraft.id, {
        name: orgDraft.name,
        slug: orgDraft.slug,
        custom_domain: orgDraft.custom_domain,
        timezone: orgDraft.timezone,
        base_currency: orgDraft.base_currency,
        terminology: orgDraft.terminology,
      });
      if (updated) {
        setOrgDraft(updated);
        await refreshOrganisation();
      }
      setSaveMessage('Church workspace configuration updated!');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      const list = await organisationService.listOrganisations();
      setAllOrgs(list);
    } catch (err) {
      console.error('Failed to update organisation:', err);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgForm.name.trim()) return;
    const slug = (newOrgForm.slug || newOrgForm.name.toLowerCase().replace(/[^a-z0-9-]/g, '')).toLowerCase();
    try {
      const created = await organisationService.createOrganisation({
        name: newOrgForm.name.trim(),
        slug,
        custom_domain: newOrgForm.custom_domain.trim() || `${slug}.churchflow.site`,
        terminology: {
          groupSingular: newOrgForm.groupSingular,
          groupPlural: newOrgForm.groupPlural,
          territoryLabel: newOrgForm.territoryLabel,
          discipleshipModel: newOrgForm.discipleshipModel,
          departmentLabel: 'Department',
          serviceSingular: 'Service',
        },
      });
      setShowAddOrgModal(false);
      setNewOrgForm({
        name: '',
        slug: '',
        custom_domain: '',
        discipleshipModel: 'G12',
        groupSingular: 'Connect Group',
        groupPlural: 'Connect Groups',
        territoryLabel: 'Campus Zone',
      });
      const list = await organisationService.listOrganisations();
      setAllOrgs(list);
      setSaveMessage(`New ministry "${created.name}" onboarded successfully!`);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      await switchOrganisation(created.slug);
    } catch (err) {
      console.error('Failed to create new organisation:', err);
    }
  };

  const handleSave = async () => {
    // 1. Save Bento Grid config
    updateConfig(localConfig);

    // 2. Save Branding & Logo config
    updateBranding(draftBranding);

    // 3. Save any edited department leaders to Supabase and Bento items
    for (const d of draftDepts) {
      await leadershipService.updateDepartmentLeader(d.id, {
        department_name: d.department_name,
        leader_name: d.leader_name,
        phone: d.phone,
      });
    }

    // 4. Save any edited cell leaders
    for (const c of draftCells) {
      await leadershipService.updateCellLeader(c.id, {
        cell_name: c.cell_name,
        cell_leader: c.cell_leader,
        assistant: c.assistant,
        cell_address: c.cell_address,
        zone: c.zone,
      });
    }

    // 5. Save any edited campus zones
    leadershipService.saveCampusZones(draftZones);

    refreshLeadership();
    setSaveMessage('All system settings, church branding, department units, connect group leaders, and campus zones saved! Applied across the entire system.');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleSaveBrandingOnly = () => {
    updateBranding(draftBranding);
    setSaveMessage('Church logo and branding saved! Header and portal have updated.');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetBrandingOnly = () => {
    resetBrandingDefaults();
    setDraftBranding(defaultBrandingConfig);
    setSaveMessage('Logo and branding reset to default Dominion City / NCF UNN settings.');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit. Please upload a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = {
          ...draftBranding,
          logoType: 'image' as const,
          logoUrl: reader.result,
        };
        setDraftBranding(updated);
        updateBranding(updated);
        setSaveMessage('New church logo uploaded and applied successfully!');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    if (window.confirm('Reset all dashboard grids, ticker, and announcement settings back to code defaults?')) {
      resetDefaults();
      setSaveMessage('Dashboard settings reset to defaults.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(localConfig, null, 2));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Add new department handler
  const handleAddNewDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptForm.department_name.trim() || !newDeptForm.leader_name.trim()) return;

    await createDepartment({
      department_name: newDeptForm.department_name.trim(),
      leader_name: newDeptForm.leader_name.trim(),
      phone: newDeptForm.phone.trim(),
    });

    setNewDeptForm({ department_name: '', leader_name: '', phone: '', targetPercent: 90 });
    setShowAddDeptModal(false);
    setSaveMessage(`New unit "${newDeptForm.department_name}" added and synced!`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Delete department handler
  const handleDeleteDept = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove the "${name}" unit from the directory?`)) {
      await deleteDepartment(id, name);
      setSaveMessage(`Unit "${name}" removed from directory.`);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Add new cell handler
  const handleAddNewCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCellForm.cell_name.trim() || !newCellForm.cell_leader.trim()) return;

    await createCell({
      cell_name: newCellForm.cell_name.trim(),
      cell_leader: newCellForm.cell_leader.trim(),
      assistant: newCellForm.assistant.trim() || '—',
      zone: newCellForm.zone,
      cell_address: newCellForm.cell_address.trim() || 'Campus Venue',
    });

    setNewCellForm({ cell_name: '', cell_leader: '', assistant: '', zone: 'HQ', cell_address: '' });
    setShowAddCellModal(false);
    setSaveMessage(`New Connect Group "${newCellForm.cell_name}" added and synced!`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Delete cell handler
  const handleDeleteCell = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove the Connect Group "${name}"?`)) {
      await deleteCell(id);
      setSaveMessage(`Connect Group "${name}" removed.`);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Add new campus zone handler
  const handleAddNewZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneForm.name.trim() || !newZoneForm.leader.trim()) return;

    createZone({
      name: newZoneForm.name.trim(),
      leader: newZoneForm.leader.trim(),
      campus_area: newZoneForm.campus_area.trim() || 'Campus Zone & Surrounding Areas',
    });

    setNewZoneForm({ name: '', campus_area: '', leader: '' });
    setShowAddZoneModal(false);
    setSaveMessage(`New Campus Zone "${newZoneForm.name}" created and synced!`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Delete campus zone handler
  const handleDeleteZone = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove the Campus Zone "${name}"?`)) {
      deleteZone(id);
      setSaveMessage(`Campus Zone "${name}" removed.`);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // S4: Backend Admin Users
  const [adminUsers, setAdminUsers] = useState<AdminProfile[]>([
    { id: '1', name: 'Lead Pastor / Admin', full_name: 'Lead Pastor / Admin', email: 'admin@ncfunn.org', role: 'Super Admin', status: 'Active' },
    { id: '2', name: 'Media Director', full_name: 'Media Director', email: 'media@ncfunn.org', role: 'Editor', status: 'Active' },
    { id: '3', name: 'Secretariat Lead', full_name: 'Secretariat Lead', email: 'secretary@ncfunn.org', role: 'Viewer', status: 'Active' },
  ]);

  useEffect(() => {
    settingsService.getAdminProfiles().then(profiles => {
      if (profiles && profiles.length > 0) {
        setAdminUsers(profiles);
      }
    });
  }, []);

  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'Editor' });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email) return;
    const newProfile: AdminProfile = {
      id: String(Date.now()),
      name: newAdmin.name,
      full_name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      status: 'Active',
    };
    setAdminUsers(prev => [...prev, newProfile]);
    await settingsService.saveAdminProfile(newProfile);
    setNewAdmin({ name: '', email: '', role: 'Editor' });
    setSaveMessage(`Operator "${newProfile.name}" authorized.`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRemoveUser = async (id: string | number) => {
    const strId = String(id);
    setAdminUsers(prev => prev.filter(u => String(u.id) !== strId));
    await settingsService.deleteAdminProfile(strId);
  };

  // Helper to update a KPI card
  const updateKpiCard = (id: string, updates: Partial<typeof localConfig.kpiCards[0]>) => {
    setLocalConfig(prev => ({
      ...prev,
      kpiCards: prev.kpiCards.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  // Helper to add a new ticker item
  const [newTickerText, setNewTickerText] = useState('');
  const addTickerItem = () => {
    if (!newTickerText.trim()) return;
    setLocalConfig(prev => ({
      ...prev,
      liveTicker: {
        ...prev.liveTicker,
        items: [...prev.liveTicker.items, newTickerText.trim()],
      },
    }));
    setNewTickerText('');
  };

  const removeTickerItem = (idx: number) => {
    setLocalConfig(prev => ({
      ...prev,
      liveTicker: {
        ...prev.liveTicker,
        items: prev.liveTicker.items.filter((_, i) => i !== idx),
      },
    }));
  };

  const filteredCells = draftCells.filter(c =>
    c.cell_name.toLowerCase().includes(cellSearch.toLowerCase()) ||
    c.cell_leader.toLowerCase().includes(cellSearch.toLowerCase()) ||
    c.zone.toLowerCase().includes(cellSearch.toLowerCase())
  );

  const exportSettingsDeptsCSV = () => {
    const headers = ['#', 'Department / Unit Name', 'Head of Unit', 'Phone Number', 'ID'];
    const rows = draftDepts.map((d, idx) => [
      idx + 1,
      d.department_name,
      d.leader_name,
      d.phone || '—',
      d.id,
    ]);
    exportToCSV('Settings_Departments_Config', headers, rows);
  };

  const exportSettingsCellsCSV = () => {
    const headers = ['#', 'Cell Name', 'Cell Leader', 'Assistant Leader', 'Campus Zone', 'Venue / Address', 'ID'];
    const rows = filteredCells.map((c, idx) => [
      idx + 1,
      c.cell_name,
      c.cell_leader,
      c.assistant || '—',
      c.zone,
      c.cell_address || 'Campus Venue',
      c.id,
    ]);
    exportToCSV('Settings_Connect_Groups_Config', headers, rows);
  };

  const exportSettingsZonesCSV = () => {
    const headers = ['#', 'Zone Name', 'Zonal Pastor / Lead', 'Campus Coverage Area', 'ID'];
    const rows = draftZones.map((z, idx) => [
      idx + 1,
      z.name,
      z.leader,
      z.campus_area,
      z.id,
    ]);
    exportToCSV('Settings_Campus_Zones_Config', headers, rows);
  };

  const exportAdminUsersCSV = () => {
    const headers = ['#', 'Name', 'Email', 'Role', 'ID'];
    const rows = adminUsers.map((u, idx) => [
      idx + 1,
      u.name || u.full_name,
      u.email,
      u.role,
      u.id,
    ]);
    exportToCSV('Settings_Admin_Users', headers, rows);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div
        className="portal-card"
        style={{
          padding: '24px 28px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            <Settings size={15} /> 9. Settings & Admin Controls
          </div>
          <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            System Settings & Leadership Architecture
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage actual department unit names and heads, Saturday Connect Group leaders, dashboard bento widgets, and portal access.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyJSON}
            className="btn btn-outline"
            style={{ fontSize: '12.5px', padding: '8px 14px' }}
            title="Copy current config as JSON"
          >
            <Copy size={14} /> {copiedSuccess ? 'JSON Copied!' : 'Copy Config JSON'}
          </button>

          <button
            onClick={handleReset}
            className="btn btn-outline"
            style={{ fontSize: '12.5px', padding: '8px 14px', color: 'var(--amber)' }}
            title="Reset to code defaults"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>

          <button onClick={handleSave} className="btn btn-primary" style={{ fontSize: '13px', padding: '9px 18px' }}>
            <CheckCircle2 size={15} /> Save All Changes
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div
          className="animate-fade-in"
          style={{
            background: 'var(--green-bg)',
            color: 'var(--green-text)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            border: '1px solid var(--green)',
          }}
        >
          <CheckCircle2 size={16} /> {saveMessage}
        </div>
      )}

      {/* Main Tab Switcher */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--navy-soft)', padding: '4px', borderRadius: '10px', marginBottom: '20px', width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'units', label: 'S1: Units & Leadership Architecture', icon: <Layers size={14} /> },
          { id: 'cards', label: 'S2: Bento Grid Cards', icon: <Sliders size={14} /> },
          { id: 'ticker', label: 'S3: Announcement & Ticker', icon: <MessageSquare size={14} /> },
          { id: 'branding', label: 'S4: Church Logo & Branding', icon: <Sparkles size={14} /> },
          { id: 'users', label: 'S5: User Permissions', icon: <Shield size={14} /> },
          { id: 'workspace', label: 'S6: Multi-Tenant & Workspace', icon: <Building2 size={14} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === t.id ? 'var(--blue)' : 'transparent',
              color: activeTab === t.id ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ================= S1: UNITS & LEADERSHIP ARCHITECTURE ================= */}
      {activeTab === 'units' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sub-Tabs for Units, Connect Groups, and G12 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setLeadershipSubTab('depts')}
                className={`btn ${leadershipSubTab === 'depts' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '12.5px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Building2 size={14} /> Department Units ({draftDepts.length})
              </button>
              <button
                onClick={() => setLeadershipSubTab('cells')}
                className={`btn ${leadershipSubTab === 'cells' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '12.5px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Compass size={14} /> Connect Group Leaders ({draftCells.length})
              </button>
              <button
                onClick={() => setLeadershipSubTab('zones')}
                className={`btn ${leadershipSubTab === 'zones' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '12.5px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <MapPin size={14} /> Campus Zones ({draftZones.length})
              </button>
              <button
                onClick={() => setLeadershipSubTab('g12')}
                className={`btn ${leadershipSubTab === 'g12' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '12.5px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Network size={14} /> G12 Discipleship Shepherds
              </button>
            </div>

            {leadershipSubTab === 'depts' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={exportSettingsDeptsCSV}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  title="Export departments to CSV"
                >
                  <Download size={13} /> Export CSV
                </button>
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add New Department Unit
                </button>
              </div>
            )}

            {leadershipSubTab === 'cells' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={exportSettingsCellsCSV}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  title="Export connect groups to CSV"
                >
                  <Download size={13} /> Export CSV
                </button>
                <button
                  onClick={() => setShowAddCellModal(true)}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Connect Group Cell
                </button>
              </div>
            )}

            {leadershipSubTab === 'zones' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={exportSettingsZonesCSV}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  title="Export campus zones to CSV"
                >
                  <Download size={13} /> Export Zones CSV
                </button>
                <button
                  onClick={() => setShowAddZoneModal(true)}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Campus Zone
                </button>
              </div>
            )}
          </div>

          {/* SUBTAB 1: DEPARTMENT UNITS EDITOR */}
          {leadershipSubTab === 'depts' && (
            <div className="portal-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  Actual Department Units & Assigned Leaders Directory
                </h3>
                <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                  {draftDepts.length} Active Production Units
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                Any modifications here immediately update the <strong>Dashboard BentoGrid card</strong>, the <strong>Departments Directory</strong>, and the <strong>Report Submission forms</strong>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {draftDepts.map((d, idx) => (
                  <div
                    key={d.id || idx}
                    style={{
                      background: 'var(--navy-soft)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>
                          Unit #{idx + 1}
                        </span>
                        <button
                          onClick={() => handleDeleteDept(d.id, d.department_name)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--rose, #f43f5e)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title={`Delete ${d.department_name} unit`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                          UNIT / DEPARTMENT NAME
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={d.department_name}
                          onChange={e => {
                            const newDepts = [...draftDepts];
                            newDepts[idx].department_name = e.target.value;
                            setDraftDepts(newDepts);
                          }}
                          style={{ fontSize: '13px', fontWeight: 600 }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                            HEAD OF UNIT (LEADER)
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={d.leader_name}
                            onChange={e => {
                              const newDepts = [...draftDepts];
                              newDepts[idx].leader_name = e.target.value;
                              setDraftDepts(newDepts);
                            }}
                            style={{ fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                            PHONE NUMBER
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={d.phone || ''}
                            placeholder="080..."
                            onChange={e => {
                              const newDepts = [...draftDepts];
                              newDepts[idx].phone = e.target.value;
                              setDraftDepts(newDepts);
                            }}
                            style={{ fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Status: <strong style={{ color: 'var(--green)' }}>Active in Database</strong></span>
                      <span style={{ color: 'var(--blue)' }}>ID: {d.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                  <CheckCircle2 size={14} /> Save Department Changes
                </button>
              </div>
            </div>
          )}

          {/* SUBTAB 2: CONNECT GROUP CELLS EDITOR */}
          {leadershipSubTab === 'cells' && (
            <div className="portal-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    Saturday Connect Group Leaders (40 Cells)
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Live synchronization with the <code>cell_leaders</code> table across all campus zones.
                  </p>
                </div>

                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search cell or leader..."
                    value={cellSearch}
                    onChange={e => setCellSearch(e.target.value)}
                    style={{ paddingLeft: '32px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px', marginTop: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy-soft)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '35px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Cell Name</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Cell Leader</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Assistant</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '120px' }}>Campus Zone</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Address / Venue</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '60px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCells.map((c, idx) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="form-control"
                            value={c.cell_name}
                            onChange={e => {
                              const newCells = [...draftCells];
                              const targetIdx = newCells.findIndex(item => item.id === c.id);
                              if (targetIdx !== -1) {
                                newCells[targetIdx].cell_name = e.target.value;
                                setDraftCells(newCells);
                              }
                            }}
                            style={{ fontSize: '12.5px', padding: '5px 8px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="form-control"
                            value={c.cell_leader}
                            onChange={e => {
                              const newCells = [...draftCells];
                              const targetIdx = newCells.findIndex(item => item.id === c.id);
                              if (targetIdx !== -1) {
                                newCells[targetIdx].cell_leader = e.target.value;
                                setDraftCells(newCells);
                              }
                            }}
                            style={{ fontSize: '12.5px', padding: '5px 8px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="form-control"
                            value={c.assistant || ''}
                            onChange={e => {
                              const newCells = [...draftCells];
                              const targetIdx = newCells.findIndex(item => item.id === c.id);
                              if (targetIdx !== -1) {
                                newCells[targetIdx].assistant = e.target.value;
                                setDraftCells(newCells);
                              }
                            }}
                            style={{ fontSize: '12.5px', padding: '5px 8px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <select
                            className="form-control"
                            value={c.zone}
                            onChange={e => {
                              const newCells = [...draftCells];
                              const targetIdx = newCells.findIndex(item => item.id === c.id);
                              if (targetIdx !== -1) {
                                newCells[targetIdx].zone = e.target.value;
                                setDraftCells(newCells);
                              }
                            }}
                            style={{ fontSize: '12px', padding: '5px 8px' }}
                          >
                            {['HQ', 'Hilltop', 'JSQ', 'Franco', 'Odenigwe', 'Greenhouse', 'Odim', 'Ede-Oballa', 'Campus Hostels'].map(z => (
                              <option key={z} value={z}>{z}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="form-control"
                            value={c.cell_address || ''}
                            onChange={e => {
                              const newCells = [...draftCells];
                              const targetIdx = newCells.findIndex(item => item.id === c.id);
                              if (targetIdx !== -1) {
                                newCells[targetIdx].cell_address = e.target.value;
                                setDraftCells(newCells);
                              }
                            }}
                            style={{ fontSize: '12px', padding: '5px 8px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteCell(c.id, c.cell_name)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--rose, #f43f5e)', cursor: 'pointer', padding: '4px' }}
                            title="Delete cell"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                  <CheckCircle2 size={14} /> Save Connect Group Changes
                </button>
              </div>
            </div>
          )}

          {/* SUBTAB 3: CAMPUS ZONES ARCHITECTURE */}
          {leadershipSubTab === 'zones' && (
            <div className="portal-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    Campus Residential Zones & Zonal Pastors Directory
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
                    Manage territorial campus zones, coverage areas, and assigned zonal pastoral leaders. Changes immediately update the <strong>Connect Groups 3x3 Grid</strong>.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddZoneModal(true)}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Campus Zone
                </button>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy-soft)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '40px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>#</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, width: '160px' }}>Zone Name</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, width: '220px' }}>Zonal Pastor / Lead</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Campus Coverage Area</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted)', width: '60px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftZones.map((z, idx) => (
                      <tr
                        key={z.id || idx}
                        style={{ borderBottom: idx === draftZones.length - 1 ? 'none' : '1px solid var(--border)' }}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="form-control"
                            value={z.name}
                            onChange={e => {
                              const newZones = [...draftZones];
                              newZones[idx].name = e.target.value;
                              setDraftZones(newZones);
                            }}
                            style={{ fontSize: '13px', fontWeight: 600, padding: '6px 10px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="form-control"
                            value={z.leader}
                            onChange={e => {
                              const newZones = [...draftZones];
                              newZones[idx].leader = e.target.value;
                              setDraftZones(newZones);
                            }}
                            style={{ fontSize: '13px', padding: '6px 10px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="form-control"
                            value={z.campus_area}
                            onChange={e => {
                              const newZones = [...draftZones];
                              newZones[idx].campus_area = e.target.value;
                              setDraftZones(newZones);
                            }}
                            style={{ fontSize: '13px', padding: '6px 10px' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteZone(z.id, z.name)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--rose, #f43f5e)', cursor: 'pointer', padding: '4px' }}
                            title={`Delete ${z.name} zone`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                  <CheckCircle2 size={14} /> Save Campus Zone Changes
                </button>
              </div>
            </div>
          )}

          {/* SUBTAB 4: G12 SHEPHERDS ROSTER */}
          {leadershipSubTab === 'g12' && (
            <div className="portal-card" style={{ padding: '24px' }}>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                G12 Discipleship Shepherds & Hierarchy
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                Review active G12 network leaders mapped from discipleship report logs and member hierarchy.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {[
                  'Emmanuella Okonkwo', 'Favour Nsoke', 'Cynthia Edeh', 'Ifeyinwa Umeadi',
                  'Ebube Wilfred', 'Vivian Nwolisa', 'Faithfulness Onu', 'Ebuka Aziekwe',
                  'Janefrancis Igwilo', 'Kenechukwu Offiah', 'Winner Richards', 'David Ugwu',
                ].map((name, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--navy-soft)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                      G12
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13.5px' }}>{name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Assigned G12 Shepherd</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spiritual Growth Stages Settings */}
          <div className="portal-card" style={{ padding: '24px' }}>
            <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
              {localConfig.growthJourney.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Configure the discipleship growth stages and labels shown on the executive dashboard.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {localConfig.growthJourney.stages.map((st, idx) => (
                <div
                  key={st.level}
                  style={{
                    background: 'var(--navy-soft)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase' }}>
                    Stage {st.level}
                  </span>
                  <div style={{ marginTop: '6px', marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
                      STAGE TITLE
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={st.title}
                      onChange={e => {
                        const newStages = [...localConfig.growthJourney.stages];
                        newStages[idx].title = e.target.value;
                        setLocalConfig({
                          ...localConfig,
                          growthJourney: { ...localConfig.growthJourney, stages: newStages },
                        });
                      }}
                      style={{ fontSize: '13px', padding: '6px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
                      METRIC LABEL
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={st.countLabel}
                      onChange={e => {
                        const newStages = [...localConfig.growthJourney.stages];
                        newStages[idx].countLabel = e.target.value;
                        setLocalConfig({
                          ...localConfig,
                          growthJourney: { ...localConfig.growthJourney, stages: newStages },
                        });
                      }}
                      style={{ fontSize: '13px', padding: '6px 10px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= S2: BENTO GRID CARDS SETTINGS ================= */}
      {activeTab === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top KPI Metric Cards */}
          <div className="portal-card" style={{ padding: '24px' }}>
            <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
              Top Row: KPI Metric Cards
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Toggle visibility, customize titles, and adjust subtitles for each metric card.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {localConfig.kpiCards.map(c => (
                <div
                  key={c.id}
                  style={{
                    background: 'var(--navy-soft)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: c.accentColor || 'var(--blue)' }}>
                      {c.code || c.id}
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={c.visible}
                        onChange={e => updateKpiCard(c.id, { visible: e.target.checked })}
                        style={{ accentColor: 'var(--blue)', width: '15px', height: '15px' }}
                      />
                      <span>Visible</span>
                    </label>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      TITLE
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.title}
                      onChange={e => updateKpiCard(c.id, { title: e.target.value })}
                      style={{ fontSize: '13px', padding: '6px 10px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      SUBTITLE
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.subtitle}
                      onChange={e => updateKpiCard(c.id, { subtitle: e.target.value })}
                      style={{ fontSize: '13px', padding: '6px 10px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= S3: ANNOUNCEMENT BANNER & LIVE TICKER ================= */}
      {activeTab === 'ticker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Announcement Banner Editor */}
          <div className="portal-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={18} style={{ color: 'var(--blue)' }} />
                <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                  Special Announcement Banner
                </h3>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={localConfig.announcementBanner.enabled}
                  onChange={e =>
                    setLocalConfig({
                      ...localConfig,
                      announcementBanner: { ...localConfig.announcementBanner, enabled: e.target.checked },
                    })
                  }
                  style={{ accentColor: 'var(--blue)', width: '16px', height: '16px' }}
                />
                <span>Banner Enabled</span>
              </label>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Broadcast top-level presidential or secretariat announcements across the entire platform.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  BADGE TEXT
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localConfig.announcementBanner.badge}
                  onChange={e =>
                    setLocalConfig({
                      ...localConfig,
                      announcementBanner: { ...localConfig.announcementBanner, badge: e.target.value },
                    })
                  }
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  ANNOUNCEMENT TITLE
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={localConfig.announcementBanner.title}
                  onChange={e =>
                    setLocalConfig({
                      ...localConfig,
                      announcementBanner: { ...localConfig.announcementBanner, title: e.target.value },
                    })
                  }
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                ANNOUNCEMENT MESSAGE
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={localConfig.announcementBanner.message}
                onChange={e =>
                  setLocalConfig({
                    ...localConfig,
                    announcementBanner: { ...localConfig.announcementBanner, message: e.target.value },
                  })
                }
                style={{ fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Sliding Ticker Feed Editor */}
          <div className="portal-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} style={{ color: '#06b6d4' }} />
                <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                  Sliding Ticker Feed Items
                </h3>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={localConfig.liveTicker.enabled}
                  onChange={e =>
                    setLocalConfig({
                      ...localConfig,
                      liveTicker: { ...localConfig.liveTicker, enabled: e.target.checked },
                    })
                  }
                  style={{ accentColor: 'var(--blue)', width: '16px', height: '16px' }}
                />
                <span>Ticker Enabled</span>
              </label>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Customize items scrolling across the marquee ticker below the header.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {localConfig.liveTicker.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={item}
                    onChange={e => {
                      const newItems = [...localConfig.liveTicker.items];
                      newItems[idx] = e.target.value;
                      setLocalConfig({
                        ...localConfig,
                        liveTicker: { ...localConfig.liveTicker, items: newItems },
                      });
                    }}
                    style={{ fontSize: '13px', padding: '6px 10px', flex: 1 }}
                  />
                  <button
                    onClick={() => removeTickerItem(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--rose, #e11d48)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Remove Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter new marquee feed item..."
                value={newTickerText}
                onChange={e => setNewTickerText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTickerItem()}
                style={{ fontSize: '13px' }}
              />
              <button onClick={addTickerItem} className="btn btn-outline" style={{ fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= S4: CHURCH LOGO & BRANDING ================= */}
      {activeTab === 'branding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Live Preview Card */}
          <div className="portal-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                  Live Header Brand Preview
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  This is how your church logo and portal title look on the Executive Dashboard header.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetBrandingOnly}
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Reset to Dominion City default"
              >
                <RotateCcw size={13} /> Reset to Default
              </button>
            </div>

            {/* Mock Header Preview Box */}
            <div
              style={{
                background: '#0b1320',
                borderRadius: '18px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                marginTop: '12px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.38)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  padding: draftBranding.logoType === 'image' ? '6px' : 0,
                }}
              >
                {draftBranding.logoType === 'image' && draftBranding.logoUrl ? (
                  <img
                    src={draftBranding.logoUrl}
                    alt="Logo Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = '/images.png';
                    }}
                  />
                ) : (
                  <span>{draftBranding.logoEmoji || '🕊️'}</span>
                )}
              </div>

              <div>
                <div
                  className="font-serif"
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.2,
                  }}
                >
                  {draftBranding.portalTitle || 'NCF UNN Admin Portal'}
                </div>
                <div style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px' }}>
                  {draftBranding.portalSubtitle || 'ChurchFlow Ministry & Attendance System'}
                </div>
              </div>
            </div>
          </div>

          {/* Logo Selection & Upload Card */}
          <div className="portal-card" style={{ padding: '24px' }}>
            <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
              Choose or Upload Church Logo
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Select a ready-made church preset, paste an image link, or upload your own PNG/JPG/SVG church crest.
            </p>

            {/* Quick Presets */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Preset Church Logos & Crests
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  {
                    id: 'dc-heart',
                    label: 'Dominion City Heart Crest',
                    type: 'image' as const,
                    url: '/images.png',
                    icon: <img src="/images.png" alt="DC" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />,
                  },
                  {
                    id: 'dove',
                    label: 'Peace Dove',
                    type: 'emoji' as const,
                    emoji: '🕊️',
                    icon: <span style={{ fontSize: '18px' }}>🕊️</span>,
                  },
                  {
                    id: 'church',
                    label: 'Sanctuary',
                    type: 'emoji' as const,
                    emoji: '⛪',
                    icon: <span style={{ fontSize: '18px' }}>⛪</span>,
                  },
                  {
                    id: 'flame',
                    label: 'Holy Spirit Flame',
                    type: 'emoji' as const,
                    emoji: '🔥',
                    icon: <span style={{ fontSize: '18px' }}>🔥</span>,
                  },
                  {
                    id: 'crown',
                    label: 'Crown of Dominion',
                    type: 'emoji' as const,
                    emoji: '👑',
                    icon: <span style={{ fontSize: '18px' }}>👑</span>,
                  },
                ].map(preset => {
                  const isSelected =
                    preset.type === 'image'
                      ? draftBranding.logoType === 'image' && draftBranding.logoUrl === preset.url
                      : draftBranding.logoType === 'emoji' && draftBranding.logoEmoji === preset.emoji;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const updated =
                          preset.type === 'image'
                            ? { ...draftBranding, logoType: 'image' as const, logoUrl: preset.url }
                            : { ...draftBranding, logoType: 'emoji' as const, logoEmoji: preset.emoji };
                        setDraftBranding(updated);
                        updateBranding(updated);
                        setSaveMessage(`Logo switched to "${preset.label}"!`);
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2500);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--blue)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--blue-soft)' : 'var(--navy-soft)',
                        color: isSelected ? 'var(--blue)' : 'var(--text)',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {preset.icon}
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Image Upload Dropzone & URL Input */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '22px' }}>
              {/* File Upload */}
              <div
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--navy-soft)',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                  title="Upload church logo from device"
                />
                <div style={{ pointerEvents: 'none' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--blue-soft)',
                      color: 'var(--blue)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <Upload size={20} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                    Upload Logo From Device
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    PNG, JPG, SVG, or WebP (Max 2MB)
                  </div>
                </div>
              </div>

              {/* Direct Image URL */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  background: 'var(--navy-soft)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Or Paste Logo Image URL / Path
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. /images.png or https://domain.org/logo.png"
                    value={draftBranding.logoType === 'image' ? draftBranding.logoUrl : ''}
                    onChange={e =>
                      setDraftBranding({
                        ...draftBranding,
                        logoType: 'image',
                        logoUrl: e.target.value,
                      })
                    }
                    style={{ fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateBranding(draftBranding);
                      setSaveMessage('Image URL applied to header!');
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 2500);
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: '12.5px', padding: '6px 12px', whiteSpace: 'nowrap' }}
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            </div>

            {/* Portal Titles Customization */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px', marginTop: '10px' }}>
              <h4 className="font-serif" style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>
                Header Portal Title & Subtitle
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    MAIN PORTAL TITLE
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NCF UNN Admin Portal"
                    value={draftBranding.portalTitle}
                    onChange={e =>
                      setDraftBranding({
                        ...draftBranding,
                        portalTitle: e.target.value,
                      })
                    }
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    MINISTRY SUBTITLE
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ChurchFlow Ministry & Attendance System"
                    value={draftBranding.portalSubtitle}
                    onChange={e =>
                      setDraftBranding({
                        ...draftBranding,
                        portalSubtitle: e.target.value,
                      })
                    }
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={handleSaveBrandingOnly}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={15} /> Save Church Branding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= S5: BACKEND ADMIN USERS ================= */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="portal-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                Authorized Portal Operators
              </h3>
              <button
                onClick={exportAdminUsersCSV}
                className="btn btn-outline"
                style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Export operators list to CSV"
              >
                <Download size={12} /> CSV
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Personnel authorized to inspect members, submit ministry reports, and manage access tokens.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', width: '35px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u, idx) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 600 }}>{u.name || u.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge ${u.role === 'Super Admin' ? 'badge-blue' : 'badge-amber'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {u.role !== 'Super Admin' && (
                        <button
                          onClick={() => handleRemoveUser(u.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--rose, #e11d48)',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="portal-card" style={{ padding: '24px' }}>
            <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
              Invite New Operator
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Grant administrative or editor access to authorized church officers.
            </p>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  OFFICER NAME
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sis. Grace"
                  value={newAdmin.name}
                  onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  PORTAL EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="officer@ncfunn.org"
                  value={newAdmin.email}
                  onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  ROLE PERMISSION
                </label>
                <select
                  className="form-control"
                  value={newAdmin.role}
                  onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  style={{ fontSize: '13px' }}
                >
                  <option value="Editor">Editor (Reports & Member Logs)</option>
                  <option value="Viewer">Viewer (Read-Only Portal View)</option>
                  <option value="Super Admin">Super Admin (Full Configuration)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', fontSize: '13px' }}>
                <Plus size={15} /> Add Operator
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= S6: MULTI-TENANT & WORKSPACE ================= */}
      {activeTab === 'workspace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Workspace Banner */}
          <div
            className="portal-card"
            style={{
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              borderLeft: '4px solid var(--blue)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '24px' }}>{orgDraft.branding?.logoEmoji || '🏢'}</span>
                <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                  {orgDraft.name}
                </h3>
                <span className="badge badge-blue" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                  {orgDraft.status || 'Active'}
                </span>
                {orgDraft.id === NCF_UNN_ID && (
                  <span className="badge badge-amber" style={{ fontSize: '11px' }}>
                    Flagship Church #1
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Workspace ID: <code style={{ fontSize: '11.5px', background: 'var(--navy-soft)', padding: '2px 6px', borderRadius: '4px' }}>{orgDraft.id}</code>
                {' • '}Subdomain: <code style={{ fontSize: '11.5px', color: 'var(--blue)' }}>{orgDraft.slug}.churchflow.site</code>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddOrgModal(true)}
                className="btn btn-primary"
                style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Onboard New Ministry
              </button>
            </div>
          </div>

          {/* Ministry Switcher & Tenant Directory */}
          <div className="portal-card" style={{ padding: '22px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>
                  Registered Church Workspaces
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                  Switch between ministries to verify complete Row-Level Security (RLS) data isolation.
                </p>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {allOrgs.length} {allOrgs.length === 1 ? 'Ministry' : 'Ministries'} Registered
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {allOrgs.map(org => {
                const isCurrent = org.id === organisation.id;
                return (
                  <div
                    key={org.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      background: isCurrent ? 'rgba(59, 130, 246, 0.08)' : 'var(--navy-soft)',
                      border: isCurrent ? '1.5px solid var(--blue)' : '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                          {org.name}
                        </span>
                        {isCurrent && (
                          <span className="badge badge-green" style={{ fontSize: '10.5px' }}>
                            <Check size={11} /> Active
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Domain: {org.custom_domain || `${org.slug}.churchflow.site`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Discipleship Model: {org.terminology?.discipleshipModel || 'G12'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {!isCurrent ? (
                        <button
                          type="button"
                          onClick={() => switchOrganisation(org.slug)}
                          className="btn btn-outline"
                          style={{ fontSize: '11.5px', padding: '5px 12px', flex: 1 }}
                        >
                          Switch to Workspace
                        </button>
                      ) : (
                        <div style={{ fontSize: '11.5px', color: 'var(--blue)', fontWeight: 600, padding: '5px 0' }}>
                          ✓ Currently Operating Here
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${window.location.origin}/?org=${org.slug}`, `org_url_${org.id}`)}
                        className="btn btn-outline"
                        style={{ fontSize: '11px', padding: '5px 8px' }}
                        title="Copy direct workspace link"
                      >
                        {copiedOrgUrl === `org_url_${org.id}` ? 'Copied!' : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Workspace Settings Form */}
          <div className="portal-card" style={{ padding: '24px 28px' }}>
            <h4 className="font-serif" style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
              Configure Active Church: {orgDraft.name}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Manage church legal name, subdomain slugs, custom domain bindings, and localized terminology.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  CHURCH / ORGANISATION NAME *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={orgDraft.name || ''}
                  onChange={e => setOrgDraft({ ...orgDraft, name: e.target.value })}
                  placeholder="e.g. NCF UNN or Grace City Church"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  SUBDOMAIN SLUG (CHURCHFLOW CLOUD) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={orgDraft.slug || ''}
                    onChange={e => setOrgDraft({ ...orgDraft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="ncfunn"
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  />
                  <span
                    style={{
                      background: 'var(--navy-soft)',
                      border: '1px solid var(--border)',
                      borderLeft: 'none',
                      padding: '9px 12px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      borderTopRightRadius: 'var(--radius-sm)',
                      borderBottomRightRadius: 'var(--radius-sm)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    .churchflow.site
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  DEDICATED CUSTOM DOMAIN
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={orgDraft.custom_domain || ''}
                  onChange={e => setOrgDraft({ ...orgDraft, custom_domain: e.target.value.toLowerCase().trim() })}
                  placeholder="e.g. ncfunn.site or church.org"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Point a CNAME record at your DNS provider to <code style={{ color: 'var(--blue)' }}>cname.vercel-dns.com</code>
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  TIMEZONE
                </label>
                <select
                  className="form-control"
                  value={orgDraft.timezone || 'Africa/Lagos'}
                  onChange={e => setOrgDraft({ ...orgDraft, timezone: e.target.value })}
                >
                  <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
                  <option value="UTC">UTC (Universal Time)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST, UTC+2)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  BASE CURRENCY
                </label>
                <select
                  className="form-control"
                  value={orgDraft.base_currency || 'NGN'}
                  onChange={e => setOrgDraft({ ...orgDraft, base_currency: e.target.value })}
                >
                  <option value="NGN">NGN (Nigerian Naira - ₦)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                  <option value="GBP">GBP (British Pound - £)</option>
                  <option value="EUR">EUR (Euro - €)</option>
                  <option value="GHS">GHS (Ghanaian Cedi - GH₵)</option>
                  <option value="KES">KES (Kenyan Shilling - KSh)</option>
                  <option value="ZAR">ZAR (South African Rand - R)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  DISCIPLESHIP & GROUP MODEL
                </label>
                <select
                  className="form-control"
                  value={orgDraft.terminology?.discipleshipModel || 'G12'}
                  onChange={e =>
                    setOrgDraft({
                      ...orgDraft,
                      terminology: {
                        ...(orgDraft.terminology || {
                          groupSingular: 'Connect Group',
                          groupPlural: 'Connect Groups',
                          territoryLabel: 'Campus Zone',
                          departmentLabel: 'Department',
                          serviceSingular: 'Service',
                        }),
                        discipleshipModel: e.target.value,
                      },
                    })
                  }
                >
                  <option value="G12">G12 Discipleship Model</option>
                  <option value="Discipleship Circles">Discipleship Circles</option>
                  <option value="Cell System">Traditional Cell System</option>
                  <option value="Life Groups">Life Group Fellowship</option>
                  <option value="Care Cells">Care Cell Network</option>
                </select>
              </div>
            </div>

            {/* Terminology Customization */}
            <div style={{ marginTop: '22px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                Localized Church Terminology
              </h5>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Customize labels across all menus and reports to match your church structure.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    GROUP SINGULAR LABEL
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={orgDraft.terminology?.groupSingular || 'Connect Group'}
                    onChange={e =>
                      setOrgDraft({
                        ...orgDraft,
                        terminology: {
                          ...(orgDraft.terminology || {
                            groupPlural: 'Connect Groups',
                            territoryLabel: 'Campus Zone',
                            discipleshipModel: 'G12',
                            departmentLabel: 'Department',
                            serviceSingular: 'Service',
                          }),
                          groupSingular: e.target.value,
                        },
                      })
                    }
                    placeholder="Connect Group / Life Group"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    GROUP PLURAL LABEL
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={orgDraft.terminology?.groupPlural || 'Connect Groups'}
                    onChange={e =>
                      setOrgDraft({
                        ...orgDraft,
                        terminology: {
                          ...(orgDraft.terminology || {
                            groupSingular: 'Connect Group',
                            territoryLabel: 'Campus Zone',
                            discipleshipModel: 'G12',
                            departmentLabel: 'Department',
                            serviceSingular: 'Service',
                          }),
                          groupPlural: e.target.value,
                        },
                      })
                    }
                    placeholder="Connect Groups / Life Groups"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    TERRITORY / ZONE LABEL
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={orgDraft.terminology?.territoryLabel || 'Campus Zone'}
                    onChange={e =>
                      setOrgDraft({
                        ...orgDraft,
                        terminology: {
                          ...(orgDraft.terminology || {
                            groupSingular: 'Connect Group',
                            groupPlural: 'Connect Groups',
                            discipleshipModel: 'G12',
                            departmentLabel: 'Department',
                            serviceSingular: 'Service',
                          }),
                          territoryLabel: e.target.value,
                        },
                      })
                    }
                    placeholder="Campus Zone / District / Parish"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={handleSaveWorkspace}
                className="btn btn-primary"
                style={{ fontSize: '13px', padding: '10px 22px' }}
              >
                <CheckCircle2 size={16} /> Save Workspace Settings
              </button>
            </div>
          </div>

          {/* Quick Access URLs Card */}
          <div className="portal-card" style={{ padding: '22px 26px' }}>
            <h4 className="font-serif" style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
              Church Direct Access URLs
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Share these URLs with your congregation, leaders, and ushers for instant portal routing.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--navy-soft)',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', display: 'block' }}>
                    Dedicated Custom Domain
                  </span>
                  <code style={{ fontSize: '13px', color: 'var(--text)' }}>
                    https://{orgDraft.custom_domain || `${orgDraft.slug}.site`}
                  </code>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`https://${orgDraft.custom_domain || `${orgDraft.slug}.site`}`, 'cust_url')}
                    className="btn btn-outline"
                    style={{ fontSize: '11.5px', padding: '5px 10px' }}
                  >
                    {copiedOrgUrl === 'cust_url' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--navy-soft)',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', display: 'block' }}>
                    Cloud Subdomain Route
                  </span>
                  <code style={{ fontSize: '13px', color: 'var(--text)' }}>
                    https://{orgDraft.slug}.churchflow.site
                  </code>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`https://${orgDraft.slug}.churchflow.site`, 'sub_url')}
                    className="btn btn-outline"
                    style={{ fontSize: '11.5px', padding: '5px 10px' }}
                  >
                    {copiedOrgUrl === 'sub_url' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--navy-soft)',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', display: 'block' }}>
                    Universal Query Param Link
                  </span>
                  <code style={{ fontSize: '13px', color: 'var(--text)' }}>
                    {window.location.origin}/?org={orgDraft.slug}
                  </code>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${window.location.origin}/?org=${orgDraft.slug}`, 'param_url')}
                    className="btn btn-outline"
                    style={{ fontSize: '11.5px', padding: '5px 10px' }}
                  >
                    {copiedOrgUrl === 'param_url' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ONBOARD NEW MINISTRY ================= */}
      {showAddOrgModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setShowAddOrgModal(false)}
        >
          <div
            className="portal-card animate-scale-in"
            style={{ width: '100%', maxWidth: '520px', padding: '26px 30px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⛪</span>
                <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  Onboard New Church / Ministry
                </h3>
              </div>
              <button onClick={() => setShowAddOrgModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  CHURCH / MINISTRY NAME *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Grace Sanctuary Church"
                  value={newOrgForm.name}
                  onChange={e => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setNewOrgForm({
                      ...newOrgForm,
                      name,
                      slug: newOrgForm.slug ? newOrgForm.slug : autoSlug,
                    });
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  WORKSPACE SLUG *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="gracesanctuary"
                    value={newOrgForm.slug}
                    onChange={e => setNewOrgForm({ ...newOrgForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    required
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  />
                  <span
                    style={{
                      background: 'var(--navy-soft)',
                      border: '1px solid var(--border)',
                      borderLeft: 'none',
                      padding: '9px 12px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      borderTopRightRadius: 'var(--radius-sm)',
                      borderBottomRightRadius: 'var(--radius-sm)',
                    }}
                  >
                    .churchflow.site
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  CUSTOM DOMAIN (OPTIONAL)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. gracesanctuary.org"
                  value={newOrgForm.custom_domain}
                  onChange={e => setNewOrgForm({ ...newOrgForm, custom_domain: e.target.value.toLowerCase().trim() })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    DISCIPLESHIP MODEL
                  </label>
                  <select
                    className="form-control"
                    value={newOrgForm.discipleshipModel}
                    onChange={e => setNewOrgForm({ ...newOrgForm, discipleshipModel: e.target.value })}
                  >
                    <option value="G12">G12 Discipleship</option>
                    <option value="Discipleship Circles">Discipleship Circles</option>
                    <option value="Cell System">Traditional Cell</option>
                    <option value="Life Groups">Life Groups</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    TERRITORY LABEL
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Campus Zone / District"
                    value={newOrgForm.territoryLabel}
                    onChange={e => setNewOrgForm({ ...newOrgForm, territoryLabel: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddOrgModal(false)} className="btn btn-outline" style={{ fontSize: '12.5px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '12.5px' }}>
                  Provision Ministry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD NEW DEPARTMENT UNIT ================= */}
      {showAddDeptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setShowAddDeptModal(false)}
        >
          <div
            className="portal-card animate-scale-in"
            style={{ width: '100%', maxWidth: '480px', padding: '26px 30px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Add New Department / Unit
              </h3>
              <button onClick={() => setShowAddDeptModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  UNIT NAME *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Welfare Unit"
                  value={newDeptForm.department_name}
                  onChange={e => setNewDeptForm({ ...newDeptForm, department_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  HEAD OF UNIT (LEADER) *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Bro. Samuel Eze"
                  value={newDeptForm.leader_name}
                  onChange={e => setNewDeptForm({ ...newDeptForm, leader_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  PHONE NUMBER
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="080..."
                  value={newDeptForm.phone}
                  onChange={e => setNewDeptForm({ ...newDeptForm, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddDeptModal(false)} className="btn btn-outline" style={{ fontSize: '12.5px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '12.5px' }}>
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD NEW CONNECT GROUP CELL ================= */}
      {showAddCellModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setShowAddCellModal(false)}
        >
          <div
            className="portal-card animate-scale-in"
            style={{ width: '100%', maxWidth: '480px', padding: '26px 30px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Add New Connect Group Cell
              </h3>
              <button onClick={() => setShowAddCellModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewCell} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  CELL NAME *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Hilltop Cell 3"
                  value={newCellForm.cell_name}
                  onChange={e => setNewCellForm({ ...newCellForm, cell_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    CELL LEADER *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Bro. Joshua"
                    value={newCellForm.cell_leader}
                    onChange={e => setNewCellForm({ ...newCellForm, cell_leader: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    ASSISTANT
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Sis. Joy"
                    value={newCellForm.assistant}
                    onChange={e => setNewCellForm({ ...newCellForm, assistant: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    CAMPUS ZONE *
                  </label>
                  <select
                    className="form-control"
                    value={newCellForm.zone}
                    onChange={e => setNewCellForm({ ...newCellForm, zone: e.target.value })}
                  >
                    {['HQ', 'Hilltop', 'JSQ', 'Franco', 'Odenigwe', 'Greenhouse', 'Odim', 'Ede-Oballa', 'Campus Hostels'].map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    VENUE / ADDRESS
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Grace Pavilion"
                    value={newCellForm.cell_address}
                    onChange={e => setNewCellForm({ ...newCellForm, cell_address: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddCellModal(false)} className="btn btn-outline" style={{ fontSize: '12.5px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '12.5px' }}>
                  Create Cell
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Campus Zone */}
      {showAddZoneModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowAddZoneModal(false)}
        >
          <div
            className="portal-card animate-scale-in"
            style={{ width: '100%', maxWidth: '480px', padding: '26px 30px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Add New Campus Zone
              </h3>
              <button onClick={() => setShowAddZoneModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewZone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  ZONE NAME *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Hilltop, Franco, Campus Hostels"
                  value={newZoneForm.name}
                  onChange={e => setNewZoneForm({ ...newZoneForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  ZONAL PASTOR / LEADER *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Pastor Tony Ubagu"
                  value={newZoneForm.leader}
                  onChange={e => setNewZoneForm({ ...newZoneForm, leader: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  CAMPUS COVERAGE AREA
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Fellowship Center / Freedom Square"
                  value={newZoneForm.campus_area}
                  onChange={e => setNewZoneForm({ ...newZoneForm, campus_area: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddZoneModal(false)} className="btn btn-outline" style={{ fontSize: '12.5px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '12.5px' }}>
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
