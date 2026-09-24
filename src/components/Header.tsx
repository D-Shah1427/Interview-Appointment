import React from 'react';
import { Calendar, Users, BarChart3, Lock, ArrowLeft } from 'lucide-react';
import type { AppRoute } from '../utils/router';
import { useStaffAuth } from '../context/StaffAuthContext';

interface HeaderProps {
  currentView: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const isCandidateView = currentView === 'candidate';
  const { isAuthenticated, logout } = useStaffAuth();

  const handleLockPortal = () => {
    logout();
    onNavigate('candidate');
  };

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Calendar size={20} />
        </div>
        <h1 className="brand-title">Interview Appointment</h1>
      </div>

      {/* Navigation tabs - visible ONLY in Staff mode when authenticated */}
      {!isCandidateView && isAuthenticated ? (
        <nav className="nav-tabs">
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

        {/* Staff view action controls: Candidate View preview and Lock Portal */}
        {!isCandidateView && isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('candidate')}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', gap: '0.35rem' }}
              title="Preview candidate booking portal"
            >
              <ArrowLeft size={14} />
              Candidate View
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLockPortal}
              style={{
                fontSize: '0.78rem',
                padding: '0.4rem 0.75rem',
                gap: '0.35rem',
                color: 'var(--color-danger)',
                borderColor: 'var(--color-danger-border)'
              }}
              title="Lock staff portal and sign out"
            >
              <Lock size={14} />
              Lock
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

