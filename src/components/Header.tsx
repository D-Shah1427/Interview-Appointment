import React from 'react';
import { Calendar, Users, BarChart3, ExternalLink } from 'lucide-react';
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

      {/* Internal navigation tabs - only visible in Staff / Admin / Panelist mode */}
      {!isCandidateView ? (
        <nav className="nav-tabs">
          <button
            type="button"
            className="nav-tab-btn"
            onClick={() => onNavigate('candidate')}
            title="Preview candidate booking portal"
          >
            <ExternalLink size={14} />
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
      </div>
    </header>
  );
};
