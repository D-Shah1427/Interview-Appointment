import React from 'react';
import { Calendar, Users, BarChart3, ExternalLink, ShieldCheck, ArrowLeft } from 'lucide-react';
import type { AppRoute } from '../utils/router';

interface HeaderProps {
  currentView: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const isCandidateView = currentView === 'candidate';

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Calendar size={20} />
        </div>
        <h1 className="brand-title">Interview Appointment</h1>
      </div>

      {/* Navigation tabs - visible in Staff mode */}
      {!isCandidateView ? (
        <nav className="nav-tabs">
          <button
            type="button"
            className="nav-tab-btn"
            onClick={() => onNavigate('candidate')}
            title="Preview candidate booking portal"
          >
            <ArrowLeft size={14} />
            Candidate View
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'panelists' ? 'active' : ''}`}
            onClick={() => onNavigate('panelists')}
          >
            <Users size={15} />
            Panelists
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => onNavigate('admin')}
          >
            <BarChart3 size={15} />
            Dashboard
          </button>
        </nav>
      ) : null}

      <div className="header-actions">
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          <span>Live Sync</span>
        </div>

        {/* Quick switcher in header */}
        {isCandidateView ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('admin')}
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', gap: '0.35rem' }}
            title="Switch to Recruiter Dashboard and Panel Management"
          >
            <ShieldCheck size={14} color="var(--primary)" />
            Staff Portal
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('candidate')}
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
            title="Switch back to candidate booking view"
          >
            Candidate View
          </button>
        )}
      </div>
    </header>
  );
};
