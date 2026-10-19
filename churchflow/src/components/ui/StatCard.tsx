import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor = 'var(--blue-soft)',
  iconColor = 'var(--blue)',
  trend,
  subtitle,
}) => {
  return (
    <div className="portal-card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: iconBgColor,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: trend.isUp ? 'var(--green)' : 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {trend.isUp ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.1, color: 'var(--text)', marginBottom: '6px' }}>
        {value}
      </div>

      <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
        {title}
      </div>

      {subtitle && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.8 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
