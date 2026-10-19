import React from 'react';

interface AttendanceHeatmapProps {
  title?: string;
  subtitle?: string;
  monthName?: string;
  data?: { day: number; density: 'none' | 'low' | 'mid' | 'high'; count?: number }[];
}

export const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({
  title = 'Attendance Heatmap',
  subtitle,
  monthName = 'October 2026',
  data = [],
}) => {
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Clean calendar grid of 31 days if none provided (density: none, count: 0)
  const cells = data.length > 0 ? data : Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    density: 'none' as const,
    count: 0,
  }));

  const getCellBg = (density: 'none' | 'low' | 'mid' | 'high') => {
    switch (density) {
      case 'high': return '#3B6D11';
      case 'mid': return '#97C459';
      case 'low': return '#eaf3de';
      default: return 'var(--navy-soft)';
    }
  };

  const getCellColor = (density: 'none' | 'low' | 'mid' | 'high') => {
    switch (density) {
      case 'high': return '#ffffff';
      case 'mid': return '#27500A';
      case 'low': return '#3B6D11';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="portal-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 className="font-serif" style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {monthName}
        </span>
      </div>

      {/* Weekday Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '6px' }}>
        {daysOfWeek.map((d, i) => (
          <div key={i} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 7-column Calendar Cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {cells.map((cell, idx) => (
          <div
            key={idx}
            title={`Day ${cell.day}: ${cell.count ? cell.count + ' attendees' : 'No service'}`}
            style={{
              aspectRatio: '1',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              background: getCellBg(cell.density),
              color: getCellColor(cell.density),
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              border: cell.density === 'none' ? '1px solid var(--border)' : 'none',
            }}
          >
            {cell.day}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>Less</span>
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--navy-soft)', border: '1px solid var(--border)' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#eaf3de' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#97C459' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#3B6D11' }} />
        <span>More</span>
      </div>
    </div>
  );
};
