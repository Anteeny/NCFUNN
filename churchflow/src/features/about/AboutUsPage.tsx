import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Shield,
  Heart,
  Award,
  GraduationCap,
  Flame,
  Search,
  Target,
  CheckCircle2,
  Compass,
  Building2,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                DATA MODELS                                 */
/* -------------------------------------------------------------------------- */

interface GraceItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  scripture: string;
}

interface FourSItem {
  number: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  scripture: string;
  pillars: string[];
  color: string;
  bgSoft: string;
}

interface CoreValueItem {
  title: string;
  scriptureRef?: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgSoft: string;
}

interface ResponsibilityItem {
  id: number;
  title: string;
  subtitle: string;
  scripture: string;
  actions: { title: string; desc: string; scriptureRef?: string }[];
  color: string;
}

interface ConductRule {
  num: number;
  title: string;
  category: 'Spiritual' | 'Protocol & Order' | 'Appearance' | 'Relational';
  shortSummary: string;
  details: string;
  scriptureRef?: string;
  color: string;
}

/* -------------------------------------------------------------------------- */
/*                                CONSTANTS                                   */
/* -------------------------------------------------------------------------- */

// THE 4 S'S: REPLACES THE 4-PILLAR TRANSFORMATION PATHWAY
const THE_FOUR_S: FourSItem[] = [
  {
    number: '01',
    title: 'Service',
    subtitle: 'Kingdom Stewardship & Ministry Impact',
    tagline: 'Leading through the towel of humility and faithful labour.',
    description:
      'Every member of NCF is first and foremost a servant of Christ. We express the character of our Lord through active participation in ministries, departments, and cells. In our fellowship, leadership is defined by servitude rather than titles.',
    scripture: 'Mark 10:45 / Galatians 5:13',
    pillars: [
      'Active departmental ministry participation',
      'Humble, selfless attitude toward brethren',
      'Excellence and reliability in every assigned task',
      'Putting Kingdom interest above personal convenience',
    ],
    color: 'var(--blue)',
    bgSoft: 'var(--blue-soft)',
  },
  {
    number: '02',
    title: 'Sacrifice',
    subtitle: 'Generosity, Devotion & Costly Commitment',
    tagline: 'We will not offer to the Lord that which costs us nothing.',
    description:
      'True discipleship requires laying down our personal comforts, time, and resources for the Gospel. NCF members embrace early morning prayers, late-night soul vigils, academic discipline, and generous financial investment to advance the Kingdom of God.',
    scripture: 'Romans 12:1 / 2 Samuel 24:24',
    pillars: [
      'Consecrated time for prayer and spiritual growth',
      'Sacrificial deployment of physical energy and talents',
      'Financial support for gospel crusades and fellowship',
      'Willingness to endure hardship as a good soldier of Christ',
    ],
    color: '#e11d48',
    bgSoft: 'rgba(225, 29, 72, 0.1)',
  },
  {
    number: '03',
    title: 'Submission',
    subtitle: 'Divine Order & Spiritual Accountability',
    tagline: 'Spiritual authority is God’s hedge of protection and elevation.',
    description:
      'Walking under authority is the secret to spiritual longevity and power. Every leader and member is submitted to a designated spiritual mentor, G12 leader, and pastoral covering. We obey instructions without murmuring, walking in humility and transparency.',
    scripture: 'Hebrews 13:17 / 1 Peter 5:5',
    pillars: [
      'Accountability to pastorship and G12 disciplers',
      'Prompt obedience to spiritual directives without argument',
      'Submitting personal plans and travels for pastoral approval',
      'Cultivating a teachable, correction-friendly disposition',
    ],
    color: '#8b5cf6',
    bgSoft: 'rgba(139, 92, 246, 0.1)',
  },
  {
    number: '04',
    title: 'Seed (Honour)',
    subtitle: 'Covenant Giving & Tangible Appreciation',
    tagline: 'Honour is celebrated through thanksgiving and covenant seeds.',
    description:
      'Honour is a spiritual law that unlocks generational blessing and kingdom wealth. We practice intentional appreciation towards God, our spiritual parents, pastors, leaders, and natural parents. Seed giving is our covenant anchor for abundance.',
    scripture: 'Galatians 6:6-7 / 1 Timothy 5:17',
    pillars: [
      'Generous giving of tithes, firstfruits, and mission seeds',
      'Tangible gifts of honour to pastors and visiting leaders',
      'Honouring biological parents when visiting home',
      'Sowing continuously into fertile spiritual grounds',
    ],
    color: '#16a34a',
    bgSoft: 'rgba(22, 163, 74, 0.1)',
  },
];

// 7 CORE PASSIONS
const CORE_PASSIONS: CoreValueItem[] = [
  {
    title: "Passion for God's Presence",
    description:
      'Continual hunger for prayer, worship, intimacy with the Holy Spirit, and walking in consecrated holiness.',
    icon: Flame,
    color: '#f59e0b',
    bgSoft: 'rgba(245, 158, 11, 0.12)',
  },
  {
    title: 'Passion for Knowledge',
    description:
      "Relentless pursuit of God's Word, academic mastery, continuous intellectual enhancement, and intellectual excellence on campus.",
    icon: GraduationCap,
    color: '#06b6d4',
    bgSoft: 'rgba(6, 182, 212, 0.12)',
  },
  {
    title: 'Passion for Souls',
    description:
      'An unquenchable evangelistic fire to rescue the lost across university faculties, hostels, towns, and nations.',
    icon: Target,
    color: '#ef4444',
    bgSoft: 'rgba(239, 68, 68, 0.12)',
  },
  {
    title: 'Passion for Integrity',
    description:
      'Absolute moral purity, truthfulness, financial transparency, and unyielding uprightness in private and public affairs.',
    icon: Shield,
    color: 'var(--blue)',
    bgSoft: 'rgba(37, 99, 235, 0.12)',
  },
  {
    title: 'Passion for Excellence',
    description:
      'Setting world-class benchmarks in leadership, execution, academics, personal conduct, and ministry operations.',
    icon: Award,
    color: '#8b5cf6',
    bgSoft: 'rgba(139, 92, 246, 0.12)',
  },
  {
    title: 'Passion for Covenant Relationships',
    description:
      'Unconditional brotherly love, loyalty, mutual protection, spiritual brotherhood, and covenant commitment to each other.',
    icon: Heart,
    color: '#ec4899',
    bgSoft: 'rgba(236, 72, 153, 0.12)',
  },
  {
    title: 'Passion for Societal Transformation',
    description:
      'Taking the Kingdom to the marketplace, governance, science, healthcare, education, technology, and media.',
    icon: Compass,
    color: '#10b981',
    bgSoft: 'rgba(16, 185, 129, 0.12)',
  },
];

// THE SPIRIT/DNA OF DOMINION CITY
const THE_TWELVE_SPIRITS = [
  'The Spirit of Covenant & Love',
  'The Spirit of Faith & Possibility',
  'The Spirit of Meekness & Humility',
  'The Spirit of Service & Selflessness',
  'The Spirit of Sacrifice & Generosity',
  'The Spirit of Integrity & Truth',
  'The Spirit of Loyalty & Dependability',
  'The Spirit of Unity & Teamwork',
  'The Spirit of Development & Empowerment',
  'The Spirit of Excellence & Quality',
  'The Spirit of Stewardship & Accountability',
  'The Spirit of Transformation',
];

// THE 12 GRACES / ANOINTINGS
const THE_TWELVE_GRACES: GraceItem[] = [
  {
    id: 1,
    title: "Anointing for Worship (God's Presence)",
    subtitle: 'Manifest Glory & Communion',
    description:
      "Empowerment to host the supernatural presence of God, leading congregations into deep spiritual intimacy and breakthrough.",
    scripture: 'Psalm 22:3',
  },
  {
    id: 2,
    title: 'Anointing for Intercession',
    subtitle: 'Travail & Spiritual Dominion',
    description:
      'Divine stamina to stand in the gap through fervent prayer, shifting spiritual atmospheres, preserving lives, and birth revival.',
    scripture: 'Ezekiel 22:30',
  },
  {
    id: 3,
    title: 'Anointing for Wisdom',
    subtitle: 'Prudence & Problem Solving',
    description:
      'Intellectual superiority, administrative mastery, creative solutions, and superior strategy for campus leadership and life.',
    scripture: 'Daniel 1:17',
  },
  {
    id: 4,
    title: 'Anointing for Revelation',
    subtitle: 'Prophetic Vision & Word Insights',
    description:
      "Deep revelatory comprehension of God's Word, accurate spiritual discernment, and seeing what God is doing before it happens.",
    scripture: 'Ephesians 1:17-18',
  },
  {
    id: 5,
    title: 'The Anointing for Personal Transformation',
    subtitle: 'Metamorphosis & Deliverance',
    description:
      'Supernatural power breaking habits, healing emotional wounds, renewing the mind, and conforming believers to Christ.',
    scripture: '2 Corinthians 3:18',
  },
  {
    id: 6,
    title: 'Anointing for the Miraculous',
    subtitle: 'Healing, Miracles & Breakthroughs',
    description:
      'The tangible demonstrations of the Holy Spirit delivering physical healings, emotional restoration, and divine interventions.',
    scripture: 'Acts 10:38',
  },
  {
    id: 7,
    title: 'The Financial Anointing',
    subtitle: 'Kingdom Wealth & Generosity',
    description:
      'Divine empowerment to generate wealth, enterprise intelligence, debt cancellation, and kingdom financing power.',
    scripture: 'Deuteronomy 8:18',
  },
  {
    id: 8,
    title: 'Anointing for Soul Winning',
    subtitle: 'Magnetic Evangelistic Harvest',
    description:
      'Bold persuasive unction to draw souls into salvation, turning hearts from darkness to the marvelous light of Christ.',
    scripture: 'Proverbs 11:30',
  },
  {
    id: 9,
    title: 'Anointing for Discipleship',
    subtitle: 'Mentorship & Spiritual Parenting',
    description:
      'Patience, pedagogical grace, and wisdom to nurture baby believers into mature, responsible kingdom disciples through G12.',
    scripture: 'Matthew 28:19',
  },
  {
    id: 10,
    title: 'The Grace for Ministry',
    subtitle: 'Functional Office Endowments',
    description:
      'Spiritual empowerment for apostolic, pastoral, teaching, administrative, and prophetic service in the body of Christ.',
    scripture: 'Ephesians 4:11-12',
  },
  {
    id: 11,
    title: 'The Grace for Godly Marriage',
    subtitle: 'Covenant Purity & Harmony',
    description:
      'Emotional sanctity, marital fidelity, supernatural matchmaking, peace in homes, and raising godly seeds.',
    scripture: 'Psalm 128:1-4',
  },
  {
    id: 12,
    title: 'The Anointing for National Transformation',
    subtitle: 'Dominion, Greatness & Governance',
    description:
      'Statesmanship, marketplace leadership, and social reform to establish kingdom righteousness across the spheres of society.',
    scripture: 'Isaiah 2:2-3',
  },
];

// THREE RESPONSIBILITIES OF EVERY FAMILY MEMBER
const FAMILY_RESPONSIBILITIES: ResponsibilityItem[] = [
  {
    id: 1,
    title: 'Protect the Scroll Bearer (The Set Man)',
    subtitle: 'Honouring God’s Appointed Apostolic Head',
    scripture: 'Ezekiel 2:8–11 / Ezekiel 3:1–4 / Revelation 10:8–11',
    color: '#2563eb',
    actions: [
      {
        title: 'Pray For Him',
        desc: 'Offer continuous intercessory prayer for his health, spiritual longevity, family protection, and fresh divine insight.',
      },
      {
        title: 'Honour Him',
        desc: 'Treat his office, instructions, and fatherhood with high biblical reverence, appreciation, and tangible honor.',
      },
    ],
  },
  {
    id: 2,
    title: 'Protect the Scroll (The Message)',
    subtitle: 'Preserving and Propagating Kingdom Truth',
    scripture: 'Revelation 10:8–11 / Psalm 68:11',
    color: '#8b5cf6',
    actions: [
      {
        title: 'Feed On It',
        desc: 'Assimilate the messages, books, audio series, and apostolic teachings thoroughly until they become second nature.',
        scriptureRef: 'Rev. 10:8-10',
      },
      {
        title: 'Share It',
        desc: 'Actively publish, preach, distribute materials, and disciple others with the unadulterated message of the Kingdom.',
        scriptureRef: 'Rev. 10:11 / Ps. 68:11',
      },
    ],
  },
  {
    id: 3,
    title: 'Play Your Part in the Vision',
    subtitle: 'Active Engagement in the Mandate',
    scripture: '2 Timothy 2:1–2 / Luke 6:12–13 / Mark 3:13–15',
    color: '#16a34a',
    actions: [
      {
        title: 'Identify Your Role',
        desc: 'Discover your unique calling, gifting, and specific place of assignment within the vision.',
      },
      {
        title: 'Pursue It Diligently',
        desc: 'Burn the rest of your life pursuing and executing this vision with undivided passion and endurance.',
      },
      {
        title: 'Train The Next Generation',
        desc: 'Faithfully disciple and teach others to do the same, multiplying leaders across successive generations.',
        scriptureRef: '2 Tim 2:2',
      },
    ],
  },
];

// NCF UNN DIVINE ORDER HIERARCHY
const NCF_DIVINE_ORDER = [
  { rank: 1, title: 'God (The Father)', desc: 'The Sovereign Creator, Lord, and Ultimate Source of all things.' },
  { rank: 2, title: 'Jesus Christ', desc: 'The Head of the Body, Chief Shepherd, and Lord of the Church.' },
  { rank: 3, title: 'The Set Man: Dr. David Ogbueli', desc: 'The Founder & President of Dominion City Worldwide; bearer of the scroll.' },
  { rank: 4, title: 'The C.E.C. Pastors (Central Executive Council)', desc: 'Apostolic governing council and senior leadership.' },
  { rank: 5, title: 'The Head Pastor: Pastor Ifeanyi Okeke', desc: 'Pastoral executive overseeing the institutional mission.' },
  { rank: 6, title: 'The Chapter Pastor: Pastor Ubagu Tony', desc: 'Resident Shepherd and Presiding Pastor of NCF UNN Chapter.' },
  { rank: 7, title: 'The Zonal Pastors', desc: 'Pastoral leaders overseeing regional zones and sectors.' },
  { rank: 8, title: 'The Directorate Heads', desc: 'Executive ministers directing specialized directorates and operational arms.' },
  { rank: 9, title: 'The Small Group Leaders', desc: 'Heads of Departments (HODs), Assistant HODs, and Cell Leaders on the frontline.' },
];

// 13 LEADERSHIP CONDUCT GUIDELINES
const LEADERSHIP_CONDUCT: ConductRule[] = [
  {
    num: 1,
    title: 'A Consistent Walk with God',
    category: 'Spiritual',
    shortSummary: 'Continuous devotion and unbroken fellowship with God.',
    details: 'An NCF leader must maintain a daily, continuous walk with God through prayer, Bible study, and walking in the Holy Spirit.',
    color: 'var(--blue)',
  },
  {
    num: 2,
    title: 'Dress Code & Neat Appearance',
    category: 'Appearance',
    shortSummary: 'Neat, dignified, and modest attire for all services.',
    details:
      'Males and Females should be neatly and decently dressed at all times. FOR MALES: Sundays: Suits or senators with flat shoes. Midweek services: Flat shoes are compulsory. FOR LADIES: Midweek Services and EQUIP: Flat shoes only (no sandals or slippers). Sundays: Heels are compulsory.',
    color: '#8b5cf6',
  },
  {
    num: 3,
    title: 'Personal Hygiene',
    category: 'Appearance',
    shortSummary: 'Impeccable personal cleanliness and grooming.',
    details: 'Personal hygiene is essential. Leaders should ensure they always smell pleasant, fresh, and well-groomed at all times.',
    color: '#06b6d4',
  },
  {
    num: 4,
    title: 'Active Prayer Participation',
    category: 'Spiritual',
    shortSummary: 'Fully engaged in all prayer sessions.',
    details: 'Leaders must be present and actively engaged in all prayer times: pre-service intercession, prayer chains, and during service.',
    color: '#f59e0b',
  },
  {
    num: 5,
    title: 'No Unnecessary Movement During Service',
    category: 'Protocol & Order',
    shortSummary: 'Eliminate distractions once service has commenced.',
    details:
      'Avoid walking around or loitering once the service has started. All necessary materials, equipment, and items should be organized beforehand.',
    color: '#ef4444',
  },
  {
    num: 6,
    title: 'Orderliness & Front-Row Seating',
    category: 'Protocol & Order',
    shortSummary: 'Fill the front rows and lead by example.',
    details: 'Leaders should sit in the front rows and ensure no seats in front of them are left vacant in order to maintain divine order.',
    color: '#10b981',
  },
  {
    num: 7,
    title: 'Hospitality to Leaders',
    category: 'Relational',
    shortSummary: 'Caring for pastors, G12 mentors, and HODs.',
    details: 'Ensure Pastors, G12 leaders, and departmental heads have bottled water and necessary hospitality during and after services.',
    color: '#ec4899',
  },
  {
    num: 8,
    title: 'Respect for Authority',
    category: 'Relational',
    shortSummary: 'Prompt obedience and respectful communication.',
    details:
      'Instructions from Pastors and Directorate Heads must be obeyed without argument. If a leader feels wronged, report to the appropriate authority instead of reacting disrespectfully.',
    color: '#6366f1',
  },
  {
    num: 9,
    title: 'Permission Before Travel or Absence',
    category: 'Protocol & Order',
    shortSummary: 'Prior authorization before travelling or missing meetings.',
    details: 'Always seek permission from the relevant authority before travelling or being absent from services, rehearsals, and leadership meetings.',
    color: '#f97316',
  },
  {
    num: 10,
    title: 'The Core Values of NCF (The 4 S’s)',
    category: 'Spiritual',
    shortSummary: 'Embodying Service, Sacrifice, Submission, and Seed.',
    details: 'Every leader must actively live out and reproduce the 4 S’s of NCF: Service, Sacrifice, Submission, and Seed (honour).',
    color: '#16a34a',
  },
  {
    num: 11,
    title: 'Submission & Accountability',
    category: 'Relational',
    shortSummary: 'Clear reporting line and spiritual covering.',
    details: 'Every leader must have a recognized spiritual authority and mentor they are submitted, transparent, and accountable to.',
    color: '#3b82f6',
  },
  {
    num: 12,
    title: 'Punctuality for Services and Meetings',
    category: 'Protocol & Order',
    shortSummary: 'Arrive early during venue setup time.',
    details: 'Leaders must arrive early for all meetings and services, specifically during setup time, to prepare spiritually and logistically.',
    color: '#14b8a6',
  },
  {
    num: 13,
    title: 'Appreciation (Honor)',
    category: 'Relational',
    shortSummary: 'Tangible signs of honour to leaders and parents.',
    details:
      "Always get something for your leaders when you return from your travels, and for your parents too when you go home after a long time. It's a sign of honour and appreciation.",
    color: '#a855f7',
  },
];

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export const AboutUsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'dna' | 'values' | 'graces' | 'order' | 'conduct'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conduct rules based on search
  const filteredConduct = useMemo(() => {
    if (!searchQuery.trim()) return LEADERSHIP_CONDUCT;
    const q = searchQuery.toLowerCase();
    return LEADERSHIP_CONDUCT.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        r.details.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filter 4S items based on search
  const filtered4S = useMemo(() => {
    if (!searchQuery.trim()) return THE_FOUR_S;
    const q = searchQuery.toLowerCase();
    return THE_FOUR_S.filter(
      s =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filter Core Passions
  const filteredPassions = useMemo(() => {
    if (!searchQuery.trim()) return CORE_PASSIONS;
    const q = searchQuery.toLowerCase();
    return CORE_PASSIONS.filter(
      p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filter 12 Graces
  const filteredGraces = useMemo(() => {
    if (!searchQuery.trim()) return THE_TWELVE_GRACES;
    const q = searchQuery.toLowerCase();
    return THE_TWELVE_GRACES.filter(
      g =>
        g.title.toLowerCase().includes(q) ||
        g.subtitle.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.scripture.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ==================================================================== */}
      {/* TOP HERO BANNER: VISION & MISSION                                    */}
      {/* ==================================================================== */}
      <div
        className="portal-card"
        style={{
          padding: '36px 36px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(139,92,246,0.06) 100%), var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--blue)', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
            <Sparkles size={16} /> MINISTERIAL HERITAGE & SPIRITUAL CONSTITUTION
          </div>

          <h1 className="font-serif" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Dominion City — NCF UNN Chapter
          </h1>

          <div
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(37,99,235,0.1)',
              color: 'var(--blue)',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '18px',
            }}
          >
            University of Nigeria, Nsukka
          </div>

          {/* VISION BLOCK */}
          <div
            style={{
              background: 'var(--navy-soft)',
              borderRadius: '12px',
              padding: '20px 24px',
              borderLeft: '4px solid var(--blue)',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--blue)', marginBottom: '4px' }}>
              Our Vision
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '8px' }}>
              &ldquo;Our vision was born out of an encounter with God, not man made.&rdquo;
            </p>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.5px' }}>
              RAISING LEADERS THAT TRANSFORM SOCIETY
            </h2>
          </div>

          {/* MISSION BLOCK & PILLARS */}
          <div
            style={{
              background: 'var(--navy-soft)',
              borderRadius: '12px',
              padding: '20px 24px',
              borderLeft: '4px solid #16a34a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#16a34a' }}>
                Our Mission & Threefold Mandate
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'rgba(22,163,74,0.12)',
                  color: '#166534',
                  padding: '2px 10px',
                  borderRadius: '12px',
                }}
              >
                EVERY MEMBER A LEADER
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text)', marginBottom: '14px', lineHeight: '1.5' }}>
              Our mission is to help people:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--card)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(37,99,235,0.12)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>1</span>
                  <strong style={{ fontSize: '14px', color: 'var(--blue)' }}>DISCOVER</strong>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>their God-given Purpose and destiny in Christ.</div>
              </div>

              <div style={{ background: 'var(--card)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>2</span>
                  <strong style={{ fontSize: '14px', color: '#8b5cf6' }}>DEVELOP</strong>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>their Potentials, leadership capacity, and skills.</div>
              </div>

              <div style={{ background: 'var(--card)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(22,163,74,0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>3</span>
                  <strong style={{ fontSize: '14px', color: '#16a34a' }}>DEPLOY</strong>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>them to fulfill their ministry in different spheres of society.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FILTER TABS & SEARCH BAR                                             */}
      {/* ==================================================================== */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[
            { id: 'all', label: 'All Heritage' },
            { id: 'dna', label: "The 4 S's (DNA)" },
            { id: 'values', label: 'Values & 12 Spirits' },
            { id: 'graces', label: '12 Anointings' },
            { id: 'order', label: 'Divine Order' },
            { id: 'conduct', label: 'Conduct Guidelines (13)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                border: activeTab === tab.id ? '1px solid var(--blue)' : '1px solid var(--border)',
                background: activeTab === tab.id ? 'var(--blue)' : 'var(--card)',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH INPUT */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search doctrines, rules, values..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: THE DNA OF AN NCF MEMBER: THE 4 S'S                       */}
      {/* (REPLACES THE 4-PILLAR TRANSFORMATION PATHWAY)                       */}
      {/* ==================================================================== */}
      {(activeTab === 'all' || activeTab === 'dna') && (
        <div className="portal-card" style={{ padding: '30px 32px', marginBottom: '24px' }}>
          <div style={{ marginBottom: '22px' }}>
            <span
              className="badge"
              style={{
                background: 'rgba(37,99,235,0.12)',
                color: 'var(--blue)',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '12px',
                marginBottom: '8px',
                display: 'inline-block',
              }}
            >
              The DNA of an NCF Member
            </span>
            <h2 className="font-serif" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>
              The 4 S&rsquo;s: Service, Sacrifice, Submission, Seed (Honour)
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '850px' }}>
              The four foundational spiritual pillars and identity markers of every student, leader, and family member in New Covenant Fellowship (NCF UNN).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {filtered4S.map((item) => (
              <div
                key={item.number}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative',
                  overflow: 'hidden',
                  borderTop: `4px solid ${item.color}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: item.bgSoft,
                        color: item.color,
                        letterSpacing: '0.5px',
                      }}
                    >
                      PILLAR {item.number}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {item.scripture}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                    {item.title}
                  </h3>

                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: item.color, marginBottom: '10px' }}>
                    {item.subtitle}
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      fontStyle: 'italic',
                      color: 'var(--text-muted)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--navy-soft)',
                      marginBottom: '14px',
                      lineHeight: '1.4',
                    }}
                  >
                    &ldquo;{item.tagline}&rdquo;
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5', marginBottom: '16px' }}>
                    {item.description}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Hallmarks & Practice:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.pillars.map((p, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text)' }}>
                        <CheckCircle2 size={14} style={{ color: item.color, flexShrink: 0, marginTop: '2px' }} />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: CORE VALUES (7 PASSIONS) & 12 SPIRITS                     */}
      {/* ==================================================================== */}
      {(activeTab === 'all' || activeTab === 'values') && (
        <>
          {/* 7 PASSIONS */}
          <div className="portal-card" style={{ padding: '30px 32px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: 'var(--amber)',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  display: 'inline-block',
                }}
              >
                Kingdom Virtues
              </span>
              <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
                Summary of Our Core Values: The 7 Passions
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                The unyielding passions that define our pursuit of God, character, and mission.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredPassions.map((p, idx) => {
                const IconComponent = p.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      transition: 'all 0.15s ease',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: p.bgSoft,
                        color: p.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={20} />
                    </div>

                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                        {p.title}
                      </h3>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                        {p.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 12 SPIRITS / DNA OF DOMINION CITY */}
          <div className="portal-card" style={{ padding: '30px 32px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <span
                style={{
                  background: 'rgba(139, 92, 246, 0.12)',
                  color: '#8b5cf6',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  display: 'inline-block',
                }}
              >
                Apostolic Identity
              </span>
              <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
                THE SPIRIT/DNA OF DOMINION CITY
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {THE_TWELVE_SPIRITS.map((spirit, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--navy-soft)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#8b5cf6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>
                    {spirit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: THE 12 GRACES / ANOINTINGS                                */}
      {/* ==================================================================== */}
      {(activeTab === 'all' || activeTab === 'graces') && (
        <div className="portal-card" style={{ padding: '30px 32px', marginBottom: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--amber)',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '12px',
                marginBottom: '8px',
                display: 'inline-block',
              }}
            >
              Supernatural Endowments
            </span>
            <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
              Our Grace / Anointing (The 12 Anointings)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              The twelve operational covenant anointings powering our mission and members.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredGraces.map(g => (
              <div
                key={g.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
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
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                      {g.title}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 700 }}>
                      {g.scripture}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 600, marginTop: '2px', marginBottom: '6px' }}>
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
      )}

      {/* ==================================================================== */}
      {/* SECTION 4: THREE RESPONSIBILITIES & THE DIVINE ORDER                 */}
      {/* ==================================================================== */}
      {(activeTab === 'all' || activeTab === 'order') && (
        <>
          {/* THREE RESPONSIBILITIES */}
          <div className="portal-card" style={{ padding: '30px 32px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <span
                style={{
                  background: 'rgba(37,99,235,0.12)',
                  color: 'var(--blue)',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  display: 'inline-block',
                }}
              >
                Covenant Obligations
              </span>
              <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
                Three Responsibilities of Every Family Member
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                The sacred covenant duties incumbent upon every disciple and member of our spiritual family.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
              {FAMILY_RESPONSIBILITIES.map(resp => (
                <div
                  key={resp.id}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '24px',
                    borderTop: `4px solid ${resp.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: resp.color }}>
                        DUTY #{resp.id}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                      {resp.title}
                    </h3>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
                      {resp.subtitle}
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--blue)', fontWeight: 700, marginBottom: '14px' }}>
                      {resp.scripture}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {resp.actions.map((act, aIdx) => (
                        <div
                          key={aIdx}
                          style={{
                            background: 'var(--navy-soft)',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text)' }}>{act.title}</strong>
                            {act.scriptureRef && (
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                {act.scriptureRef}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                            {act.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* THE DIVINE ORDER HIERARCHY */}
          <div className="portal-card" style={{ padding: '30px 32px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <span
                style={{
                  background: 'rgba(22, 163, 74, 0.12)',
                  color: '#16a34a',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  display: 'inline-block',
                }}
              >
                Apostolic Government
              </span>
              <h2 className="font-serif" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
                The Divine Order in NCF UNN & The Kingdom
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Spiritual alignment, reporting lines, and the divine chain of authority that ensures spiritual covering.
              </p>
            </div>

            {/* SIDE-BY-SIDE DIVINE ORDER COMPARISON */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '24px' }}>
              {/* AT HOME */}
              <div
                style={{
                  background: 'var(--navy-soft)',
                  borderRadius: '12px',
                  padding: '20px 22px',
                  border: '1px solid var(--border)',
                  borderTop: '3px solid var(--blue)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  THE DIVINE ORDER AT HOME
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { step: '1', role: 'God' },
                    { step: '2', role: 'Jesus Christ' },
                    { step: '3', role: 'Husband' },
                    { step: '4', role: 'Wife' },
                    { step: '5', role: 'Children' },
                  ].map(item => (
                    <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)', color: 'var(--blue)', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.step}
                      </span>
                      <strong>{item.role}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* IN CHURCH */}
              <div
                style={{
                  background: 'var(--navy-soft)',
                  borderRadius: '12px',
                  padding: '20px 22px',
                  border: '1px solid var(--border)',
                  borderTop: '3px solid #16a34a',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  THE DIVINE ORDER IN CHURCH
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { step: '1', role: 'God' },
                    { step: '2', role: 'Jesus Christ' },
                    { step: '3', role: 'The Set Man' },
                    { step: '4', role: 'The Eldership' },
                    { step: '5', role: 'The Congregation' },
                  ].map(item => (
                    <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(22,163,74,0.15)', color: '#16a34a', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.step}
                      </span>
                      <strong>{item.role}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NCF UNN CHAPTER SPECIFIC ORDER */}
            <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '22px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} color="var(--blue)" />
                THE DIVINE ORDER IN NCF UNN (Leadership Hierarchy)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {NCF_DIVINE_ORDER.map(item => (
                  <div
                    key={item.rank}
                    style={{
                      background: 'var(--navy-soft)',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: 'var(--blue)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.rank}
                    </span>
                    <div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* SECTION 5: NCF UNN LEADERSHIP CONDUCT GUIDELINES (13 RULES)          */}
      {/* ==================================================================== */}
      {(activeTab === 'all' || activeTab === 'conduct') && (
        <div className="portal-card" style={{ padding: '30px 32px' }}>
          <div style={{ marginBottom: '22px' }}>
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '12px',
                marginBottom: '8px',
                display: 'inline-block',
              }}
            >
              Ministerial Code of Conduct
            </span>
            <h2 className="font-serif" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>
              NCF UNN Leadership Conduct Guidelines
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              The thirteen operational, spiritual, ethical, and relational directives for every appointed leader and minister.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredConduct.map(rule => (
              <div
                key={rule.num}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--navy-soft)',
                    border: '1px solid var(--border)',
                    color: rule.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '13px',
                    flexShrink: 0,
                  }}
                >
                  {rule.num}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text)' }}>
                      {rule.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: 'var(--navy-soft)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {rule.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, color: rule.color, marginBottom: '6px' }}>
                    {rule.shortSummary}
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {rule.details}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredConduct.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              No conduct guidelines match &ldquo;{searchQuery}&rdquo;. Try another search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
