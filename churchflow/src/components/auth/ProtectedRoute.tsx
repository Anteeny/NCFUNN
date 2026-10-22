import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../hooks/useBranding';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { branding } = useBranding();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-app)',
          color: 'var(--text)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1.5px solid rgba(255, 255, 255, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            marginBottom: '16px',
            animation: 'pulse 1.8s infinite ease-in-out',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            padding: branding.logoType === 'image' ? '8px' : 0,
          }}
        >
          {branding.logoType === 'image' && branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Church Crest"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = '/images.png';
              }}
            />
          ) : (
            <span>{branding.logoEmoji || '🕊️'}</span>
          )}
        </div>
        <div
          className="font-serif"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            marginBottom: '6px',
          }}
        >
          {branding.portalTitle}
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Verifying security credentials...
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and preserve requested destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
