import React, { useState } from 'react';
import { Megaphone, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBentoConfig } from '../../hooks/useBentoConfig';

export const AnnouncementBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const { config } = useBentoConfig();
  const bannerCfg = config.announcementBanner;

  if (!bannerCfg.enabled || dismissed) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, rgba(11, 19, 32, 0.95) 0%, rgba(26, 42, 69, 0.92) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.28)',
        borderRadius: 'var(--radius-lg, 16px)',
        padding: '16px 22px',
        color: '#ffffff',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.16)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            flexShrink: 0,
          }}
        >
          <Megaphone size={20} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              {bannerCfg.badge}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
              {bannerCfg.title}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.4 }}>
            {bannerCfg.message}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {bannerCfg.actionLink && bannerCfg.actionLabel && (
          <Link
            to={bannerCfg.actionLink}
            className="btn btn-primary"
            style={{ fontSize: '12.5px', padding: '7px 14px', gap: '6px' }}
          >
            <span>{bannerCfg.actionLabel}</span>
            <ArrowRight size={13} />
          </Link>
        )}

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Dismiss Announcement"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
