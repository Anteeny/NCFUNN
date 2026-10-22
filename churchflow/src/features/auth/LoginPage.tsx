import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { organisationService } from '../../services/organisation.service';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Building2,
  Sparkles,
  UserPlus,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, signIn, signUp } = useAuth();
  const { organisation, switchOrganisation, refreshOrganisation } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  const from = (location.state as any)?.from?.pathname || '/';
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // View state: 'signin' | 'register'
  const [tab, setTab] = useState<'signin' | 'register'>('signin');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Church state
  const [churchName, setChurchName] = useState(organisation.name || 'NCF UNN');
  const [slug, setSlug] = useState(organisation.slug || 'ncfunn');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signIn(cleanEmail, password);
      if (error) {
        setErrorMsg('Invalid login credentials. No record found for this account.');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Register your Church submission
  const handleRegisterChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = churchName.trim();
    const cleanSlug = (slug || cleanName.toLowerCase().replace(/[^a-z0-9-]/g, '')).toLowerCase().trim();
    const cleanEmail = adminEmail.trim();

    if (!cleanName) {
      setErrorMsg('Please provide your church / ministry name.');
      return;
    }
    if (!cleanEmail || !adminPassword) {
      setErrorMsg('Please enter an administrator email and password.');
      return;
    }
    if (adminPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Provision / Register Organisation in database
      const createdOrg = await organisationService.createOrganisation({
        name: cleanName,
        slug: cleanSlug,
        custom_domain: `${cleanSlug}.churchflow.site`,
        branding: {
          logoType: 'emoji',
          logoEmoji: '⛪',
          portalTitle: `${cleanName} Portal`,
          portalSubtitle: 'ChurchFlow Operating System',
          contactEmail: cleanEmail,
        },
        status: 'active',
      });

      // 2. Sign up master administrator in Supabase auth
      const { error: authError } = await signUp(cleanEmail, adminPassword, `${cleanName} Administrator`);
      if (authError) {
        // If user already exists in auth, attempt sign-in
        if (authError.message?.toLowerCase().includes('already registered')) {
          const { error: loginErr } = await signIn(cleanEmail, adminPassword);
          if (loginErr) {
            setErrorMsg('An account with this email already exists. Please switch to Sign In.');
            setSubmitting(false);
            return;
          }
        } else {
          setErrorMsg(authError.message || 'Could not register administrator account.');
          setSubmitting(false);
          return;
        }
      }

      // 3. Switch workspace context to newly registered church
      await switchOrganisation(createdOrg.slug);
      await refreshOrganisation();

      setSuccessMsg(`Welcome! Workspace "${createdOrg.name}" initialized.`);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete church registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '32px 16px',
        color: '#0f172a',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Main Login / Register Card */}
      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
          padding: '40px 36px',
        }}
      >
        {/* Brand Icon & Welcome Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '26px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)',
            }}
          >
            {organisation.branding?.logoType === 'image' && organisation.branding?.logoUrl ? (
              <img
                src={organisation.branding.logoUrl}
                alt={organisation.name}
                style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              />
            ) : (
              <span>{organisation.branding?.logoEmoji || '🕊️'}</span>
            )}
          </div>

          <h1
            className="font-serif"
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome to ChurchFlow
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            {tab === 'signin' ? 'Sign in to access your church database' : 'Initialize a new church workspace in seconds'}
          </p>
        </div>

        {/* Clean Segmented Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            style={{
              flex: 1,
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: tab === 'signin' ? 600 : 500,
              cursor: 'pointer',
              background: tab === 'signin' ? '#ffffff' : 'transparent',
              color: tab === 'signin' ? '#0f172a' : '#64748b',
              boxShadow: tab === 'signin' ? '0 2px 6px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <LogIn size={14} /> Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            style={{
              flex: 1,
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: tab === 'register' ? 600 : 500,
              cursor: 'pointer',
              background: tab === 'register' ? '#ffffff' : 'transparent',
              color: tab === 'register' ? '#0f172a' : '#64748b',
              boxShadow: tab === 'register' ? '0 2px 6px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Building2 size={14} /> Register your Church
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#15803d',
              fontSize: '13px',
            }}
          >
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* ================= TAB 1: SIGN IN ================= */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '6px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@ncfunn.org"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#2563eb')}
                  onBlur={e => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#475569',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#2563eb')}
                  onBlur={e => (e.target.style.borderColor = '#cbd5e1')}
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
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error with Direct Action to Register */}
            {errorMsg && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px' }}>
                  <AlertCircle size={15} /> Authentication Failed
                </div>
                <p style={{ margin: '0 0 8px 0', color: '#b91c1c' }}>
                  {errorMsg}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #fee2e2', paddingTop: '8px' }}>
                  <span style={{ color: '#7f1d1d', fontSize: '11.5px' }}>
                    No record found?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('register');
                      setAdminEmail(email);
                      setErrorMsg(null);
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #f87171',
                      color: '#b91c1c',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <UserPlus size={12} /> Register your Church
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '14px',
                fontWeight: 600,
                marginTop: '4px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              }}
            >
              <LogIn size={16} />
              {submitting ? 'Verifying Credentials...' : 'Sign In & Open Database'}
            </button>
          </form>
        )}

        {/* ================= TAB 2: REGISTER YOUR CHURCH ================= */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterChurch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '5px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Church / Ministry Name *
              </label>
              <input
                type="text"
                value={churchName}
                onChange={e => {
                  const val = e.target.value;
                  setChurchName(val);
                  setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
                }}
                placeholder="e.g. NCF UNN or Grace City Church"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '5px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Workspace Subdomain *
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="ncfunn"
                  required
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderTopLeftRadius: '10px',
                    borderBottomLeftRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
                <span
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderLeft: 'none',
                    padding: '9px 12px',
                    fontSize: '12px',
                    color: '#64748b',
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  .churchflow.site
                </span>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '5px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Administrator Email *
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="admin@ncfunn.org"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '5px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Admin Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Create master password (min 6 chars)"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 36px 9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showAdminPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={15} /> {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '14px',
                fontWeight: 600,
                marginTop: '6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Sparkles size={16} />
              {submitting ? 'Creating Workspace...' : 'Register Church & Open Workspace'}
            </button>
          </form>
        )}

        {/* Footer Active Church Indicator */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          <span>Active Ministry Workspace: </span>
          <strong style={{ color: '#0f172a' }}>{organisation.name}</strong>
          {organisation.custom_domain && (
            <span style={{ color: '#2563eb', marginLeft: '4px' }}>
              ({organisation.custom_domain})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
