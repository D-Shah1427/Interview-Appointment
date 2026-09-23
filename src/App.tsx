import React, { useState, useEffect } from 'react';
import { InterviewProvider } from './context/InterviewContext';
import { Header } from './components/Header';
import { CandidatePortalView } from './components/CandidatePortal/CandidatePortalView';
import { PanelManagementView } from './components/PanelManagement/PanelManagementView';
import { AdminDashboardView } from './components/AdminDashboard/AdminDashboardView';
import { LiveAlertToast } from './components/LiveAlertToast';
import { getRouteFromUrl, navigateToRoute, type AppRoute } from './utils/router';

export function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => getRouteFromUrl());

  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentRoute(getRouteFromUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleNavigate = (route: AppRoute) => {
    navigateToRoute(route);
    setCurrentRoute(route);
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header currentView={currentRoute} onNavigate={handleNavigate} />

      <main style={{ flex: 1 }}>
        {currentRoute === 'candidate' && <CandidatePortalView />}
        {currentRoute === 'panelists' && <PanelManagementView />}
        {currentRoute === 'admin' && <AdminDashboardView />}
      </main>

      <LiveAlertToast />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.25rem 2rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        <span>Interview Appointment</span>

        {/* Discreet link for internal staff access */}
        <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.75rem' }}>
          {currentRoute === 'candidate' ? (
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Staff Portal (Admin / Panel)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNavigate('candidate')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Back to Candidate Portal
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <InterviewProvider>
      <AppContent />
    </InterviewProvider>
  );
}
