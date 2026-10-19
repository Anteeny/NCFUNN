import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ExecutiveHeader } from '../components/ui/ExecutiveHeader';
import { AnnouncementBanner } from '../components/ui/AnnouncementBanner';
import { LiveTicker } from '../components/ui/LiveTicker';
import { SidebarDrawer } from '../components/ui/SidebarDrawer';

export const Layout: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('churchflow_theme') as 'light' | 'dark') || 'light';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('churchflow_theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SidebarDrawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main App Container */}
      <div style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        <ExecutiveHeader
          currentTheme={theme}
          onThemeToggle={handleThemeToggle}
          onMenuToggle={() => setIsSidebarOpen(true)}
        />

        <AnnouncementBanner />

        <LiveTicker />

        <main style={{ minHeight: '600px' }}>
          <Outlet />
        </main>
      </div>

      {/* Executive Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '24px 20px',
          textAlign: 'center',
          fontSize: '12.5px',
          color: 'var(--text-muted)',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontWeight: 700, color: 'var(--blue)' }}>ChurchFlow</span>
          <span>·</span>
          <span>NCF UNN Administrative Operating System</span>
        </div>
        <p style={{ opacity: 0.75 }}>
          Authorized administrator access only. All actions are securely encrypted and logged.
        </p>
      </footer>
    </div>
  );
};
