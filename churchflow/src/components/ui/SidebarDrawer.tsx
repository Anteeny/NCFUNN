import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  GraduationCap,
  Flame,
  Network,
  Compass,
  Building2,
  Settings,
  X,
  FileSpreadsheet,
  PlusCircle,
  HeartHandshake,
  Shield,
  Bell,
  BookOpen,
  Sparkles,
  LogOut,
  Landmark,
} from 'lucide-react';
import { defaultSidebarConfig, type SidebarIconName } from '../../config/sidebar.config';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<SidebarIconName, (size?: number) => React.ReactNode> = {
  LayoutDashboard: size => <LayoutDashboard size={size || 18} />,
  Users: size => <Users size={size || 18} />,
  CalendarCheck: size => <CalendarCheck size={size || 18} />,
  GraduationCap: size => <GraduationCap size={size || 18} />,
  Flame: size => <Flame size={size || 18} />,
  Network: size => <Network size={size || 18} />,
  Compass: size => <Compass size={size || 18} />,
  Building2: size => <Building2 size={size || 18} />,
  Landmark: size => <Landmark size={size || 18} />,
  BookOpen: size => <BookOpen size={size || 18} />,
  Sparkles: size => <Sparkles size={size || 18} />,
  Settings: size => <Settings size={size || 18} />,
  FileSpreadsheet: size => <FileSpreadsheet size={size || 15} />,
  PlusCircle: size => <PlusCircle size={size || 15} />,
  HeartHandshake: size => <HeartHandshake size={size || 15} />,
  Shield: size => <Shield size={size || 15} />,
  Bell: size => <Bell size={size || 15} />,
};

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose }) => {
  const cfg = defaultSidebarConfig;
  const { userDisplayName, userRole, signOut } = useAuth();
  const { organisation } = useTenant();

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.68)',
            backdropFilter: 'blur(4px)',
            zIndex: 1040,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '320px',
          maxWidth: '88vw',
          height: '100vh',
          background: 'rgba(10, 16, 27, 0.98)',
          backdropFilter: 'blur(25px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.75)',
          overflowY: 'auto',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {cfg.brand.symbol}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>{organisation.name || cfg.brand.appName}</div>
              <div style={{ color: '#38bdf8', fontSize: '10.5px', letterSpacing: '0.04em', fontWeight: 600 }}>
                {organisation.slug ? `${organisation.slug}.churchflow.site` : cfg.brand.portalName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.8)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Primary Navigation Branches (1 to 9) */}
        <div style={{ flex: 1, padding: '16px 0' }}>
          <div
            style={{
              padding: '6px 20px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'rgba(255, 255, 255, 0.35)',
              textTransform: 'uppercase',
            }}
          >
            {cfg.primaryNav.sectionLabel}
          </div>

          <div style={{ marginBottom: '20px' }}>
            {/* Primary Modules 1-8 plus About Us */}
            {cfg.primaryNav.items
              .filter(item => item.visible && item.id !== 'settings')
              .map(item => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 20px',
                    fontSize: '13.5px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    background: isActive ? 'rgba(37, 99, 235, 0.22)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--blue)' : '3px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--blue)' }}>
                      {iconMap[item.iconName] ? iconMap[item.iconName](18) : <Compass size={18} />}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}

            {/* Section 11: Settings placed at the very bottom of primary navigation, visually separated */}
            {cfg.primaryNav.items
              .filter(item => item.visible && item.id === 'settings')
              .map(item => (
                <div key={item.id} style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 20px',
                      fontSize: '13.5px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                      background: isActive ? 'rgba(37, 99, 235, 0.22)' : 'rgba(255, 255, 255, 0.02)',
                      borderLeft: isActive ? '3px solid var(--blue)' : '3px solid transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {iconMap[item.iconName] ? iconMap[item.iconName](18) : <Settings size={18} />}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </div>
              ))}
          </div>

          {/* Report Actions Sub-section */}
          <div
            style={{
              padding: '6px 20px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'rgba(255, 255, 255, 0.35)',
              textTransform: 'uppercase',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '16px',
            }}
          >
            {cfg.actionForms.sectionLabel}
          </div>

          <div>
            {cfg.actionForms.items
              .filter(item => item.visible)
              .map(item => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 20px',
                    fontSize: '12.5px',
                    color: item.color || '#34d399',
                    textDecoration: 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span>{iconMap[item.iconName] ? iconMap[item.iconName](15) : <PlusCircle size={15} />}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
          </div>
        </div>

        {/* User / Session Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--blue)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              {userDisplayName.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '160px',
                }}
              >
                {userDisplayName}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '11px' }}>
                {userRole}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              signOut();
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '7px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            title="Sign out of operating system"
          >
            <LogOut size={13} />
            <span>Exit</span>
          </button>
        </div>
      </aside>
    </>
  );
};
