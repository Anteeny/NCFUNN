import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../hooks/useBranding';
import { organisationService } from '../../services/organisation.service';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  Building2,
  Sparkles,
  Globe,
  Check,
} from 'lucide-react';

interface ChurchWorkspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  logoEmoji: string;
  domain: string;
  isFlagship?: boolean;
}

const REGISTERED_WORKSPACES: ChurchWorkspace[] = [
  {
    id: 'ncfunn',
    name: 'NCF UNN',
    slug: 'ncfunn',
    logoUrl: '/images.png',
    logoEmoji: '🕊️',
    domain: 'ncfunn.site',
    isFlagship: true,
  },
  {
    id: 'dc-campus',
    name: 'Dominion City Campus',
    slug: 'dc-campus',
    logoEmoji: '⛪',
    domain: 'campus.dominioncity.org',
  },
  {
    id: 'gracecity',
    name: 'Grace City Church',
    slug: 'gracecity',
    logoEmoji: '🔥',
    domain: 'gracecity.churchflow.site',
  },
];

export const LoginPage: React.FC = () => {
  const { user, signIn, signUp } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect immediately
  const from = (location.state as any)?.from?.pathname || '/';

  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Multi-Tenant Workspace State (defaults to current organization branding)
  const [activeWorkspace, setActiveWorkspace] = useState<ChurchWorkspace>(() => ({
    id: branding.workspaceSlug || 'ncfunn',
    name: branding.organizationName || 'NCF UNN',
    slug: branding.workspaceSlug || 'ncfunn',
    logoUrl: branding.logoType === 'image' ? branding.logoUrl : undefined,
    logoEmoji: branding.logoEmoji || '🕊️',
    domain: 'ncfunn.site',
    isFlagship: true,
  }));
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);
  const [customSlugInput, setCustomSlugInput] = useState('');

  // Mode: signin vs signup vs church onboarding
  const [mode, setMode] = useState<'signin' | 'signup' | 'onboard'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Editor');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Church Onboarding Form State (SaaS Master Plan Phase 0)
  const [newChurchForm, setNewChurchForm] = useState({
    churchName: '',
    workspaceSlug: '',
    headquartersAddress: '',
    timezone: 'Africa/Lagos (WAT)',
    leadPastorEmail: '',
    password: '',
  });

  const handleSelectWorkspace = (ws: ChurchWorkspace) => {
    setActiveWorkspace(ws);
    setShowWorkspaceSwitcher(false);
    setErrorMsg(null);
  };

  const handleApplyCustomSlug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSlugInput.trim()) return;
    const cleanSlug = customSlugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const customWs: ChurchWorkspace = {
      id: cleanSlug,
      name: `${cleanSlug.toUpperCase()} Church`,
      slug: cleanSlug,
      logoEmoji: '⛪',
      domain: `${cleanSlug}.churchflow.site`,
    };
    setActiveWorkspace(customWs);
    setShowWorkspaceSwitcher(false);
    setCustomSlugInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'onboard') {
      // Handle Multi-Tenant Church Onboarding Submission
      if (!newChurchForm.churchName || !newChurchForm.workspaceSlug || !newChurchForm.leadPastorEmail || !newChurchForm.password) {
        setErrorMsg('Please complete all required church profile and administrator fields.');
        return;
      }
      setSubmitting(true);
      try {
        await organisationService.createOrganisation({
          name: newChurchForm.churchName,
          slug: newChurchForm.workspaceSlug,
          custom_domain: `${newChurchForm.workspaceSlug}.churchflow.site`,
          timezone: newChurchForm.timezone,
          branding: {
            logoType: 'emoji',
            logoEmoji: '⛪',
            portalTitle: `${newChurchForm.churchName} Portal`,
            portalSubtitle: 'ChurchFlow Operating System',
            contactEmail: newChurchForm.leadPastorEmail,
          },
        });

        const { error } = await signUp(newChurchForm.leadPastorEmail, newChurchForm.password, `${newChurchForm.churchName} Lead Pastor`);
        if (error) {
          setErrorMsg(error.message || 'Failed to initialize church workspace.');
        } else {
          setSuccessMsg(`Workspace "${newChurchForm.workspaceSlug}.churchflow.site" provisioned! Check email for activation.`);
          setTimeout(() => {
            setMode('signin');
          }, 2500);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'An error occurred during church provisioning.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message || 'Invalid email or password. Please try again.');
        } else {
          navigate(from, { replace: true });
        }
      } else {
        // Operator creation / registration for current workspace
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setErrorMsg(error.message || 'Unable to register operator account.');
        } else {
          setSuccessMsg(`Operator account created for ${activeWorkspace.name}! Confirmation link sent.`);
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1500);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 8%, #132238 0%, #080d18 100%)',
        padding: '24px 16px',
        color: '#f8fafc',
      }}
    >
      <div
        className="portal-card animate-scale-in"
        style={{
          width: '100%',
          maxWidth: mode === 'onboard' ? '540px' : '450px',
          padding: '36px 32px',
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.75)',
          borderRadius: '24px',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Top Platform Identity & SaaS Cloud Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Sparkles size={16} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: '#ffffff' }}>
                CHURCHFLOW
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px', fontWeight: 600 }}>
                CLOUD OS
              </span>
            </div>
          </div>

          <span
            className="badge badge-blue"
            style={{ fontSize: '10.5px', padding: '3px 8px', letterSpacing: '0.02em' }}
          >
            Multi-Tenant Edition
          </span>
        </div>

        {/* Workspace Context Selector Pill */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '8px 12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Building2 size={15} style={{ color: '#38bdf8', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: '#94a3b8' }}>Workspace: </span>
              <strong style={{ color: '#ffffff' }}>{activeWorkspace.name}</strong>
              <span style={{ color: '#64748b', marginLeft: '4px', fontSize: '11px' }}>
                ({activeWorkspace.slug})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWorkspaceSwitcher(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '3px 6px',
              borderRadius: '6px',
            }}
          >
            {showWorkspaceSwitcher ? 'Close' : 'Switch'}
          </button>
        </div>

        {/* Expandable Workspace Switcher Drawer */}
        {showWorkspaceSwitcher && (
          <div
            className="animate-fade-in"
            style={{
              background: 'rgba(10, 16, 30, 0.98)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
              SELECT CHURCH WORKSPACE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {REGISTERED_WORKSPACES.map(ws => {
                const isSelected = ws.id === activeWorkspace.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => handleSelectWorkspace(ws)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: isSelected ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{ws.logoEmoji}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{ws.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{ws.domain}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} style={{ color: '#38bdf8' }} />}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleApplyCustomSlug} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Custom slug (e.g. gracecity)"
                value={customSlugInput}
                onChange={e => setCustomSlugInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                }}
              />
              <button
                type="submit"
                className="btn btn-outline"
                style={{ fontSize: '11.5px', padding: '7px 12px' }}
              >
                Connect
              </button>
            </form>
          </div>
        )}

        {/* Church Crest & Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.45)',
              marginBottom: '14px',
              overflow: 'hidden',
              padding: activeWorkspace.logoUrl ? '6px' : 0,
            }}
          >
            {activeWorkspace.logoUrl ? (
              <img
                src={activeWorkspace.logoUrl}
                alt={activeWorkspace.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = '/images.png';
                }}
              />
            ) : (
              <span>{activeWorkspace.logoEmoji || '⛪'}</span>
            )}
          </div>

          <h1
            className="font-serif"
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            {mode === 'onboard'
              ? 'Onboard New Ministry'
              : `${activeWorkspace.name} Portal`}
          </h1>

          <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
            {mode === 'onboard'
              ? 'Initialize an isolated multi-tenant ChurchFlow workspace'
              : mode === 'signin'
              ? 'Authorized Leadership & Staff Authentication'
              : `Register Operator for ${activeWorkspace.name}`}
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div
            className="animate-fade-in"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '11px 14px',
              borderRadius: '10px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12.5px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            className="animate-fade-in"
            style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              color: '#86efac',
              padding: '11px 14px',
              borderRadius: '10px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12.5px',
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= MODE: CHURCH ONBOARDING (SAAS MASTER PLAN) ================= */}
        {mode === 'onboard' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>
                CHURCH / MINISTRY NAME *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Grace City Global Church"
                value={newChurchForm.churchName}
                onChange={e => setNewChurchForm({ ...newChurchForm, churchName: e.target.value })}
                required
                style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', fontSize: '13px', padding: '9px 12px', borderRadius: '10px', width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>
                WORKSPACE SUBDOMAIN SLUG *
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="gracecity"
                  value={newChurchForm.workspaceSlug}
                  onChange={e => setNewChurchForm({ ...newChurchForm, workspaceSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                  style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', fontSize: '13px', padding: '9px 12px', borderRadius: '10px 0 0 10px', width: '100%' }}
                />
                <span style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', borderLeft: 'none', color: '#94a3b8', fontSize: '12px', padding: '9px 12px', borderRadius: '0 10px 10px 0', whiteSpace: 'nowrap' }}>
                  .churchflow.site
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>
                LEAD PASTOR / ADMIN EMAIL *
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="pastor@yourchurch.org"
                value={newChurchForm.leadPastorEmail}
                onChange={e => setNewChurchForm({ ...newChurchForm, leadPastorEmail: e.target.value })}
                required
                style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', fontSize: '13px', padding: '9px 12px', borderRadius: '10px', width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>
                MASTER PASSWORD *
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••••••"
                value={newChurchForm.password}
                onChange={e => setNewChurchForm({ ...newChurchForm, password: e.target.value })}
                required
                style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', fontSize: '13px', padding: '9px 12px', borderRadius: '10px', width: '100%' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '12px',
                marginTop: '6px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#2563eb',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
              }}
            >
              {submitting ? 'Initializing Workspace...' : 'Deploy Church Workspace ✦'}
            </button>
          </form>
        ) : (
          /* ================= MODE: SIGN IN / OPERATOR REGISTRATION ================= */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Officer Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Pastor Tony / Bro. Samuel"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Ministry Role Assignment
                  </label>
                  <select
                    className="form-control"
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Super Admin" style={{ background: '#0f172a' }}>Super Admin / Pastoral Head</option>
                    <option value="Editor" style={{ background: '#0f172a' }}>Secretariat / Department Head</option>
                    <option value="Viewer" style={{ background: '#0f172a' }}>Cell Shepherd / Desk Usher</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                Portal Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder={`officer@${activeWorkspace.slug}.org`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '10px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    padding: '10px 40px 10px 38px',
                    borderRadius: '10px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '12px',
                marginTop: '6px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#2563eb',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? (
                <span>Authenticating with {activeWorkspace.name}...</span>
              ) : mode === 'signin' ? (
                <>
                  <LogIn size={16} /> Sign In to {activeWorkspace.name}
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Register Officer Account
                </>
              )}
            </button>
          </form>
        )}

        {/* Multi-Tenant Navigation Actions */}
        <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
          {mode === 'onboard' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '12.5px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Return to Officer Sign In
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode(m => (m === 'signin' ? 'signup' : 'signin'));
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {mode === 'signin'
                  ? `New officer for ${activeWorkspace.name}? Create credentials`
                  : 'Already have credentials? Return to Sign In'}
              </button>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('onboard');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Globe size={13} style={{ color: '#38bdf8' }} /> Want to power your church? Onboard New Ministry →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Security Notice */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <ShieldCheck size={14} style={{ color: '#22c55e' }} />
          <span>Enterprise Multi-Tenant Isolation · Row-Level Security</span>
        </div>
      </div>
    </div>
  );
};
