import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../hooks/useBranding';
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
} from 'lucide-react';

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

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

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
        // Operator creation / registration
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setErrorMsg(error.message || 'Unable to register operator account.');
        } else {
          setSuccessMsg('Account registered! If confirmation is required, check your email inbox.');
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
        background: 'radial-gradient(circle at 50% 10%, #111c2e 0%, #090e1a 100%)',
        padding: '24px 16px',
        color: '#f8fafc',
      }}
    >
      <div
        className="portal-card animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
          borderRadius: '24px',
        }}
      >
        {/* Church Crest & Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
              marginBottom: '16px',
              overflow: 'hidden',
              padding: branding.logoType === 'image' ? '8px' : 0,
            }}
          >
            {branding.logoType === 'image' && branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Church Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = '/images.png';
                }}
              />
            ) : (
              <span>{branding.logoEmoji || '🕊️'}</span>
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
            {branding.portalTitle}
          </h1>

          <p style={{ fontSize: '12.5px', color: '#94a3b8' }}>
            {mode === 'signin'
              ? 'Authorized Administrative Operating System'
              : 'Register New Authorized System Operator'}
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

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'signup' && (
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
                placeholder="officer@ncfunn.org"
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
              <span>Authenticating...</span>
            ) : mode === 'signin' ? (
              <>
                <LogIn size={16} /> Sign In to Portal
              </>
            ) : (
              <>
                <UserPlus size={16} /> Register Officer Account
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode: Sign In vs Register Operator */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
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
              ? 'New authorized administrator? Create operator credentials'
              : 'Already have credentials? Return to Sign In'}
          </button>
        </div>

        {/* Security Notice */}
        <div
          style={{
            marginTop: '26px',
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
          <span>Protected by Supabase Auth & Row-Level Security</span>
        </div>
      </div>
    </div>
  );
};
