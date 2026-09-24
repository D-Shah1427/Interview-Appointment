import React, { useState, useEffect } from 'react';
import { InterviewProvider } from './context/InterviewContext';
import { StaffAuthProvider, useStaffAuth } from './context/StaffAuthContext';
import { Header } from './components/Header';
import { CandidatePortalView } from './components/CandidatePortal/CandidatePortalView';
import { PanelManagementView } from './components/PanelManagement/PanelManagementView';
import { AdminDashboardView } from './components/AdminDashboard/AdminDashboardView';
import { StaffAccessGate } from './components/Common/StaffAccessGate';
import { LiveAlertToast } from './components/LiveAlertToast';
import { getRouteFromUrl, navigateToRoute, type AppRoute } from './utils/router';
import { Lock } from 'lucide-react';

export function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => getRouteFromUrl());
  const { isAuthenticated } = useStaffAuth();

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

  // Protected route check: if user is trying to access panelists or admin and not authenticated
  const isStaffRoute = currentRoute === 'panelists' || currentRoute === 'admin';
  const showStaffGate = isStaffRoute && !isAuthenticated;

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header currentView={currentRoute} onNavigate={handleNavigate} />

      <main style={{ flex: 1 }}>
        {showStaffGate ? (
          <StaffAccessGate
            targetRole={currentRoute === 'panelists' ? 'panelists' : 'admin'}
            onSuccess={() => {
              // Re-render will automatically display the view since isAuthenticated is now true
            }}
            onCancel={() => handleNavigate('candidate')}
          />
        ) : (
          <>
            {currentRoute === 'candidate' && <CandidatePortalView />}
            {currentRoute === 'panelists' && <PanelManagementView />}
            {currentRoute === 'admin' && <AdminDashboardView />}
          </>
        )}
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
        <span>Interview Appointment &bull; Confidential & Secure</span>

        {/* Staff access controls */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
            {currentRoute !== 'candidate' ? (
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
                &larr; Candidate Booking Portal
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigate('admin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Return to Staff Portal
              </button>
            )}
          </div>
        ) : (
          /* Subtle, discreet staff access icon for recruiters - hidden from normal candidate flow */
          <button
            type="button"
            onClick={() => handleNavigate('admin')}
            title="Authorized Staff Access"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--border-medium)',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'inline-flex',
              alignItems: 'center',
              opacity: 0.35,
              transition: 'opacity 0.2s ease, color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.35';
              e.currentTarget.style.color = 'var(--border-medium)';
            }}
          >
            <Lock size={12} />
          </button>
        )}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <StaffAuthProvider>
      <InterviewProvider>
        <AppContent />
      </InterviewProvider>
    </StaffAuthProvider>
  );
}
