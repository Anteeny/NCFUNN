import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { isBirthdayToday } from '../../lib/date';
import { Cake, Bell, Megaphone } from 'lucide-react';
import { useBentoConfig } from '../../hooks/useBentoConfig';
import { Link } from 'react-router-dom';

interface TickerItem {
  id: string | number;
  text: string;
  type: 'birthday' | 'announcement' | 'ticker';
  highlight?: boolean;
  link?: string;
}

export const LiveTicker: React.FC = () => {
  const { config } = useBentoConfig();
  const tickerCfg = config.liveTicker;
  const announcementCfg = config.announcementBanner;

  const [birthdayItems, setBirthdayItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    async function loadLiveBirthdays() {
      try {
        const { data } = await supabase
          .from('members')
          .select('id, member_name, birthday, zone, department')
          .not('birthday', 'is', null)
          .limit(200);

        if (data && data.length > 0) {
          const bdays: TickerItem[] = [];
          data.forEach(m => {
            if (isBirthdayToday(m.birthday)) {
              bdays.push({
                id: `bday-${m.id}`,
                text: `🎂 Happy Birthday to ${m.member_name} (${m.department || m.zone || 'NCF UNN'})! 🎉`,
                type: 'birthday',
                highlight: true,
                link: '/members',
              });
            }
          });
          setBirthdayItems(bdays);
        }
      } catch (err) {
        console.warn('Live ticker birthday sync warning:', err);
      }
    }

    loadLiveBirthdays();
  }, []);

  if (!tickerCfg.enabled) return null;

  // Build items dynamically from current config + live birthdays
  const items: TickerItem[] = [];

  // 1. Birthdays first (if any)
  items.push(...birthdayItems);

  // 2. Prominent Announcement Banner Link Item (if enabled)
  if (announcementCfg.enabled) {
    items.push({
      id: 'announcement-main',
      text: `📢 ${announcementCfg.badge}: ${announcementCfg.title} — ${announcementCfg.message}`,
      type: 'announcement',
      highlight: true,
      link: announcementCfg.actionLink,
    });
  }

  // 3. Custom live ticker items from config
  tickerCfg.items.forEach((txt, idx) => {
    items.push({
      id: `config-${idx}`,
      text: txt,
      type: 'ticker',
    });
  });
  // Duplicate items twice to ensure continuous, infinite loop on wide displays
  const displayItems = [...items, ...items, ...items];

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md, 12px)',
        height: '46px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '20px',
      }}
    >
      {/* Live Label Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--blue)',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          paddingRight: '16px',
          borderRight: '1px solid var(--border)',
          marginRight: '16px',
          flexShrink: 0,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          {tickerCfg.label || '🔴 Live Updates'}
        </span>
      </div>

      {/* Scrolling Ticker Track */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div className="animate-ticker" style={{ gap: '40px' }}>
          {displayItems.map((item, idx) => {
            const content = (
              <span
                key={`${item.id}-${idx}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: item.highlight ? 600 : 400,
                  color:
                    item.type === 'birthday'
                      ? 'var(--amber-text, #d97706)'
                      : item.type === 'announcement'
                      ? 'var(--blue)'
                      : 'var(--text)',
                  background:
                    item.type === 'birthday'
                      ? 'var(--amber-bg, rgba(217,119,6,0.12))'
                      : item.type === 'announcement'
                      ? 'var(--blue-soft, rgba(37,99,235,0.08))'
                      : 'transparent',
                  padding: item.highlight ? '3px 12px' : '0',
                  borderRadius: item.highlight ? '12px' : '0',
                  border: item.highlight
                    ? `1px solid ${item.type === 'birthday' ? 'var(--amber, #d97706)' : 'rgba(56,189,248,0.3)'}`
                    : 'none',
                  cursor: item.link ? 'pointer' : 'default',
                  textDecoration: 'none',
                }}
              >
                {item.type === 'birthday' && <Cake size={14} style={{ flexShrink: 0 }} />}
                {item.type === 'announcement' && <Megaphone size={13} style={{ flexShrink: 0 }} />}
                {item.type === 'ticker' && <Bell size={12} style={{ opacity: 0.5, flexShrink: 0 }} />}
                <span>{item.text}</span>
              </span>
            );

            if (item.link) {
              return (
                <Link key={`${item.id}-${idx}`} to={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {content}
                </Link>
              );
            }

            return content;
          })}
        </div>
      </div>
    </div>
  );
};
