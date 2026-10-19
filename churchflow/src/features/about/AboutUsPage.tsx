import React from 'react';
import {
  Sparkles,
  Shield,
  Heart,
  Award,
  GraduationCap,
  Flame,
  Users,
} from 'lucide-react';

interface GraceItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  scripture: string;
}

const TWELVE_GRACES: GraceItem[] = [
  {
    id: 1,
    title: 'Grace for Leadership & Governance',
    subtitle: 'Kingdom Statesmanship & Influence',
    description: 'Empowerment to lead with integrity, moral clarity, vision, and executive wisdom in institutional spheres.',
    scripture: 'Proverbs 8:15-16',
  },
  {
    id: 2,
    title: 'Grace for Wealth & Financial Dominion',
    subtitle: 'Kingdom Resource Allocation',
    description: 'Divine insight for entrepreneurship, economic stewardship, poverty eradication, and kingdom financing.',
    scripture: 'Deuteronomy 8:18',
  },
  {
    id: 3,
    title: 'Grace for Wisdom & Intellectual Mastery',
    subtitle: 'Prudence, Insight & Creativity',
    description: 'The spirit of excellence that produces groundbreaking research, creative problem-solving, and superior intellect.',
    scripture: 'Daniel 1:17',
  },
  {
    id: 4,
    title: 'Grace for Supernatural Healing',
    subtitle: 'Divine Health & Wholeness',
    description: 'The working of the Holy Spirit delivering physical, emotional, and psychological restoration and vitality.',
    scripture: 'Acts 10:38',
  },
  {
    id: 5,
    title: 'Grace for Prophetic Direction & Signs',
    subtitle: 'Spiritual Vision & Discernment',
    description: 'Accurate spiritual discernment, divine timing, revelatory insight, and supernatural confirmation of God’s voice.',
    scripture: 'Hosea 12:13',
  },
  {
    id: 6,
    title: 'Grace for Soul Winning & Evangelism',
    subtitle: 'Fruitful Harvest of Souls',
    description: 'A burning passion for the lost, compelling gospel persuasion, and supernatural follow-up and retention.',
    scripture: 'Proverbs 11:30',
  },
  {
    id: 7,
    title: 'Grace for Marital Harmony & Family',
    subtitle: 'Generational Purity & Wholeness',
    description: 'The covenant blessing establishing godly homes, godly parenting, emotional peace, and marital fidelity.',
    scripture: 'Psalm 128:1-4',
  },
  {
    id: 8,
    title: 'Grace for Academic Excellence',
    subtitle: 'Distinction Across Campuses',
    description: 'First-class academic distinction, retentive memory, calm confidence in examinations, and global scholarships.',
    scripture: 'Daniel 6:3',
  },
  {
    id: 9,
    title: 'Grace for Divine Speed & Acceleration',
    subtitle: 'Redemption of Lost Time',
    description: 'The hand of God outrunning chariots, eliminating stagnation, and achieving decades of impact in record time.',
    scripture: '1 Kings 18:46',
  },
  {
    id: 10,
    title: 'Grace for Preservation & Divine Security',
    subtitle: 'Unbroken Divine Protection',
    description: 'Covenant immunity from harm, spiritual evil, physical accidents, terror, and plagues on campus and in transit.',
    scripture: 'Psalm 91:1-7',
  },
  {
    id: 11,
    title: 'Grace for Spiritual Depth & Intimacy',
    subtitle: 'Deep Calling Unto Deep',
    description: 'Consistent consecrated personal prayer, hunger for the Word, purity of heart, and experiential knowledge of God.',
    scripture: 'Psalm 42:7',
  },
  {
    id: 12,
    title: 'Grace for Societal Transformation',
    subtitle: 'Seven Mountains Mandate',
    description: 'Anointing to reshape culture, institutions, media, education, business, and policy for the Kingdom of our God.',
    scripture: 'Isaiah 2:2-3',
  },
];

const CORE_VALUES = [
  {
    title: 'Integrity & Godliness',
    description: 'Living in total transparency, moral purity, and reverence before God in private and public life.',
    icon: Shield,
    color: 'var(--blue)',
  },
  {
    title: 'Academic & Professional Mastery',
    description: 'Pursuing the highest standards of scholarship, research, innovation, and professional craftsmanship.',
    icon: GraduationCap,
    color: '#06b6d4',
  },
  {
    title: 'Passion for Lost Souls',
    description: 'Unrelenting commitment to preach the gospel of Jesus Christ across faculties, hostels, and nations.',
    icon: Flame,
    color: '#f59e0b',
  },
  {
    title: 'Servant Leadership',
    description: 'Leading by example through humility, sacrificial service, and elevating others into their God-given destiny.',
    icon: Heart,
    color: '#ec4899',
  },
  {
    title: 'Diligence & Innovation',
    description: 'Resourceful execution, continuous improvement, and applying kingdom creativity to solve real-world problems.',
    icon: Award,
    color: '#8b5cf6',
  },
  {
    title: 'Unconditional Community',
    description: 'Fostering a loving family atmosphere where every student is valued, nurtured, prayed for, and protected.',
    icon: Users,
    color: '#10b981',
  },
];

const FOUR_PILLARS = [
  {
    step: '1. Encounter',
    title: 'Personal Encounter with Christ',
    subtitle: 'Spiritual Regeneration & New Birth',
    desc: 'Experiencing the transformative reality of God’s love, salvation through faith in Jesus Christ, and baptism in the Holy Spirit.',
    badge: 'Stage 1',
  },
  {
    step: '2. Discipleship',
    title: 'Rooted in Christian Character',
    subtitle: 'Spiritual Formation & Discipline',
    desc: 'Systematic discipleship through Foundation School, G12 mentor relationships, and consistent biblical doctrine.',
    badge: 'Stage 2',
  },
  {
    step: '3. Leadership',
    title: 'Equipped for Kingdom Leadership',
    subtitle: 'Discovery of Purpose & Calling',
    desc: 'Cultivating ministerial competence, organizational excellence, public speaking, and visionary executive stewardship.',
    badge: 'Stage 3',
  },
  {
    step: '4. Transformation',
    title: 'Societal & Cultural Impact',
    subtitle: 'Reforming Campus & Marketplace',
    desc: 'Deploying graduates and campus leaders who transform governance, business, healthcare, science, and the creative arts.',
    badge: 'Stage 4',
  },
];

export const AboutUsPage: React.FC = () => {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '1150px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div
        className="portal-card"
        style={{
          padding: '28px 32px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
            <Sparkles size={15} /> 11. Ministerial Heritage & Core Pillars
          </div>
          <h2 className="font-serif" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
            Dominion City — NCF UNN Chapter
          </h2>
          <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', maxWidth: '780px', lineHeight: '1.6' }}>
            <strong>Dominion City</strong> is a global Christian ministry with a divine mandate to <em>raise leaders that transform society</em>.
            As the university fellowship community at the University of Nigeria, Nsukka, New Covenant Fellowship (NCF UNN) equips students with spiritual depth, moral fortitude, intellectual distinction, and marketplace mastery.
          </p>
        </div>
      </div>

      {/* SECTION 1: DOMINION CITY EXPERIENCE CHART (4 PILLARS) */}
      <div className="portal-card" style={{ padding: '28px 32px', marginBottom: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-blue" style={{ fontSize: '11px', marginBottom: '6px' }}>
            The Dominion City Experience
          </span>
          <h3 className="font-serif" style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text)' }}>
            The 4-Pillar Transformation Pathway
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            How our ministry systematically matures a first-time seeker into a societal reformer.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {FOUR_PILLARS.map((p, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--navy-soft)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.18s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {p.step}
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '10px', padding: '1px 6px' }}>
                    {p.badge}
                  </span>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                  {p.title}
                </h4>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#06b6d4', marginBottom: '8px' }}>
                  {p.subtitle}
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: THE TWELVE GRACES / ANOINTINGS */}
      <div className="portal-card" style={{ padding: '28px 32px', marginBottom: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-amber" style={{ fontSize: '11px', marginBottom: '6px' }}>
            Ministry Endowment
          </span>
          <h3 className="font-serif" style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text)' }}>
            The Ministry's Twelve Graces & Anointings
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            The 12 spiritual endowments and covenant dimensions operating across Dominion City worldwide.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '16px' }}>
          {TWELVE_GRACES.map(g => (
            <div
              key={g.id}
              style={{
                background: 'var(--navy-soft)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '18px 20px',
                display: 'flex',
                gap: '14px',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--amber)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                {g.id}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                    {g.title}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 600 }}>
                    {g.scripture}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 500, marginTop: '2px', marginBottom: '6px' }}>
                  {g.subtitle}
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  {g.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: CORE VALUES */}
      <div className="portal-card" style={{ padding: '28px 32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-green" style={{ fontSize: '11px', marginBottom: '6px' }}>
            Guiding Philosophy
          </span>
          <h3 className="font-serif" style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text)' }}>
            Our Six Foundational Core Values
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            The uncompromised virtues and kingdom culture that guide our leadership, discipleship, and fellowship.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {CORE_VALUES.map((v, idx) => {
            const Icon = v.icon;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--navy-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: v.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                    {v.title}
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {v.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
