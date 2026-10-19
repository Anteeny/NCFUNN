import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Users,
} from 'lucide-react';
import './discipleship.css';

type SchoolTab = 'overview' | 'cohorts' | 'waitlist' | 'attendance' | 'curriculum' | 'reports' | 'sops';
type School = 'Foundation School' | 'Encounter' | 'DLI';

const tabs: { id: SchoolTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'cohorts', label: 'Cohorts' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'reports', label: 'Reports' },
  { id: 'sops', label: 'SOPs & Regulations' },
];

const unavailable = 'Unavailable';

function DataNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="school-notice" role="status">
      <AlertCircle size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="school-empty">
      <div className="school-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export const DiscipleshipPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SchoolTab>('overview');
  const [selectedSchool, setSelectedSchool] = useState<School>('Foundation School');

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentTab: SchoolTab) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === currentTab);
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex].id;
    setActiveTab(nextTab);
    document.getElementById(`school-tab-${nextTab}`)?.focus();
  };

  return (
    <section className="school-page animate-fade-in" aria-labelledby="school-title">
      <header className="school-header portal-card">
        <div className="school-heading">
          <span className="school-eyebrow"><GraduationCap size={16} /> LEARNING & DEVELOPMENT</span>
          <h1 id="school-title" className="font-serif">Foundation School</h1>
          <p>Manage cohorts, student enrollment, classes, attendance, and learning resources.</p>
        </div>
        <span className="school-status"><AlertCircle size={15} /> Data setup required</span>
      </header>

      <DataNotice>
        Foundation School records are not connected yet. Counts and student information are shown as unavailable,
        not as zero or sample data. No enrollment or attendance changes can be made from this page yet.
      </DataNotice>

      <div className="school-stats" aria-label="Foundation School summary">
        {[
          { label: 'Active cohorts', icon: <GraduationCap size={18} /> },
          { label: 'Enrolled students', icon: <Users size={18} /> },
          { label: 'Upcoming classes', icon: <CalendarDays size={18} /> },
          { label: 'Completions', icon: <CheckCircle2 size={18} /> },
        ].map((stat) => (
          <article className="school-stat portal-card" key={stat.label}>
            <span className="school-stat-icon">{stat.icon}</span>
            <span className="school-stat-label">{stat.label}</span>
            <strong>{unavailable}</strong>
          </article>
        ))}
      </div>

      <nav className="school-tabs" aria-label="Foundation School sections" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`school-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="school-tab-panel"
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`school-tab${activeTab === tab.id ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div
        id="school-tab-panel"
        className="school-panel portal-card"
        role="tabpanel"
        aria-labelledby={`school-tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'overview' && (
          <div className="school-overview">
            <div>
              <span className="school-section-kicker">SCHOOL WORKSPACE</span>
              <h2>Build a reliable student journey</h2>
              <p className="school-muted">
                Keep enrollment, class attendance, and completion tied to saved school records. Church service
                attendance and waitlist status do not count as school attendance or completion.
              </p>
            </div>
            <div className="school-setup-list">
              {[
                'Set up courses and cohorts',
                'Enroll students from the member waitlist',
                'Schedule classes and assign teachers',
                'Record attendance and verify completion',
              ].map((item, index) => (
                <div className="school-setup-item" key={item}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{item}</p>
                  <small>Not connected</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cohorts' && (
          <div className="school-section">
            <div className="school-section-heading">
              <div>
                <span className="school-section-kicker">SCHOOL MANAGEMENT</span>
                <h2>Cohorts</h2>
              </div>
              <span className="school-unavailable-pill">Records unavailable</span>
            </div>
            <EmptyState icon={<GraduationCap size={24} />} title="Cohort records are not connected">
              Cohorts, courses, teachers, schedules, and rosters will appear here when their saved records and
              access rules are confirmed.
            </EmptyState>
          </div>
        )}

        {activeTab === 'waitlist' && (
          <div className="school-section">
            <div className="school-section-heading">
              <div>
                <span className="school-section-kicker">ENROLLMENT</span>
                <h2>Student waitlist</h2>
                <p className="school-muted">Waitlisted members remain unenrolled until an authorized enrollment is saved.</p>
              </div>
              <label className="school-filter">
                <span>School</span>
                <select
                  className="form-control"
                  value={selectedSchool}
                  onChange={(event) => setSelectedSchool(event.target.value as School)}
                >
                  <option>Foundation School</option>
                  <option>Encounter</option>
                  <option>DLI</option>
                </select>
              </label>
            </div>
            <EmptyState icon={<Users size={24} />} title={`${selectedSchool} waitlist unavailable`}>
              The member roster and enrollment history are not connected, so no candidates can be listed or enrolled.
            </EmptyState>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="school-section">
            <div className="school-section-heading">
              <div>
                <span className="school-section-kicker">CLASS SESSIONS</span>
                <h2>Attendance tracker</h2>
              </div>
              <span className="school-unavailable-pill">No session selected</span>
            </div>
            <div className="school-attendance-summary">
              {['Present', 'Absent', 'Not recorded'].map((label) => (
                <div className="school-attendance-count" key={label}>
                  <span>{label}</span><strong>{unavailable}</strong>
                </div>
              ))}
            </div>
            <EmptyState icon={<ClipboardList size={24} />} title="Class attendance is not connected">
              Attendance requires a saved cohort, class session, date, and enrolled roster. An unmarked student
              must remain not recorded; it must not be counted as absent.
            </EmptyState>
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="school-section">
            <div className="school-section-heading">
              <div>
                <span className="school-section-kicker">COURSES & LESSONS</span>
                <h2>Curriculum</h2>
              </div>
              <span className="school-unavailable-pill">Records unavailable</span>
            </div>
            <EmptyState icon={<BookOpen size={24} />} title="Curriculum records are not connected">
              Courses, lessons, topics, and their links to cohorts and class sessions will appear here when verified
              curriculum records are available. A curriculum listing alone will not mark student progress.
            </EmptyState>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="school-section">
            <div className="school-section-heading">
              <div>
                <span className="school-section-kicker">SUBMITTED REPORTS</span>
                <h2>Foundation School reports</h2>
              </div>
              <span className="school-unavailable-pill">Unavailable</span>
            </div>
            <EmptyState icon={<ClipboardList size={24} />} title="No connected report source">
              The external reporting site has no confirmed Foundation School submission form or verified report
              table. This page will remain unavailable until both exist; local attendance will not be presented as
              an external submission.
            </EmptyState>
          </div>
        )}

        {activeTab === 'sops' && (
          <div className="school-section">
            <div className="school-section-heading">
              <div>
                <span className="school-section-kicker">OPERATING GUIDANCE</span>
                <h2>SOPs & Regulations</h2>
              </div>
              <span className="school-unavailable-pill">Restricted content unavailable</span>
            </div>
            <EmptyState icon={<ClipboardList size={24} />} title="Approved policies and access controls are required">
              This section is reserved for approved school policies and authorized admins or teachers. Policy
              content and role-based access have not been configured, so no draft or example rules are shown as active.
            </EmptyState>
          </div>
        )}
      </div>
    </section>
  );
};
