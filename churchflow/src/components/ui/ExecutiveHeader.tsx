import React from 'react';
import { formatWATReadable } from '../../lib/date';
import { Calendar, Sun, Moon, PlusCircle, Menu, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../hooks/useBranding';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

interface ExecutiveHeaderProps {
  onMenuToggle?: () => void;
  currentTheme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

export const ExecutiveHeader: React.FC<ExecutiveHeaderProps> = ({
  onMenuToggle,
  currentTheme = 'light',
  onThemeToggle,
}) => {
  const todayStr = formatWATReadable();
  const { branding } = useBranding();
  const { user, userDisplayName, signOut } = useAuth();
  const { organisation } = useTenant();

  return (
    <div
      style={{
        background: '#0b1320',
        borderRadius: '22px',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 10px 30px rgba(11, 19, 32, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
      }}
    >
      {/* Left Brand Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
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
            userSelect: 'none',
            overflow: 'hidden',
            padding: branding.logoType === 'image' ? '6px' : 0,
          }}
        >
          {branding.logoType === 'image' && branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Church Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={e => {
                const img = e.currentTarget;
                if (!img.src.includes('images.png')) {
                  img.src = '/images.png';
                }
              }}
            />
          ) : (
            <span>{branding.logoEmoji || '🕊️'}</span>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1
              className="font-serif"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {branding.portalTitle || `${organisation.name} Portal`}
            </h1>
            {organisation.slug && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  letterSpacing: '0.02em',
                }}
                title={`Multi-Tenant Workspace: ${organisation.name} (${organisation.slug})`}
              >
                🏢 {organisation.name}
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px', marginBottom: 0 }}>
            {branding.portalSubtitle || 'ChurchFlow Ministry & Attendance System'}
          </p>
        </div>
      </div>

      {/* Right / Actions Area: Evenly spread across the available width */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          flex: '1 1 540px',
        }}
      >
        {/* Date Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '38px',
            fontSize: '12.5px',
            fontWeight: 500,
            color: '#cbd5e1',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '0 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxSizing: 'border-box',
          }}
        >
          <Calendar size={14} style={{ color: '#94a3b8' }} />
          <span>{todayStr}</span>
        </div>

        {/* Action Controls Group: Submit Button & Quick Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/reports/g12"
            className="btn btn-primary"
            style={{
              height: '38px',
              padding: '0 18px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxSizing: 'border-box',
            }}
          >
            <PlusCircle size={15} /> Submit Report
          </Link>

          {onThemeToggle && (
            <button
              onClick={onThemeToggle}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}
              title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {currentTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}

          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}
              title="Toggle Navigation Menu"
            >
              <Menu size={18} />
            </button>
          )}

          {user && (
            <button
              onClick={signOut}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}
              title={`Sign Out (${userDisplayName})`}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
