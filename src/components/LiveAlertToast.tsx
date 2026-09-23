import React, { useEffect } from 'react';
import { useInterview } from '../context/InterviewContext';
import { Bell, X, CheckCircle2 } from 'lucide-react';

export const LiveAlertToast: React.FC = () => {
  const { liveAlert, dismissLiveAlert } = useInterview();

  useEffect(() => {
    if (liveAlert) {
      const timer = setTimeout(() => {
        dismissLiveAlert();
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [liveAlert, dismissLiveAlert]);

  if (!liveAlert) return null;

  return (
    <div className="live-toast animate-slide-down">
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: liveAlert.type === 'booking' ? 'var(--color-success-bg)' : 'rgba(99, 102, 241, 0.2)',
          border: `1px solid ${liveAlert.type === 'booking' ? 'var(--color-success-border)' : 'rgba(99, 102, 241, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {liveAlert.type === 'booking' ? (
          <CheckCircle2 size={18} color="var(--color-success)" />
        ) : (
          <Bell size={18} color="var(--primary)" />
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', marginBottom: '0.15rem' }}>
          {liveAlert.type === 'booking' ? '⚡ Real-Time Concurrency Event' : 'System Notification'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
          {liveAlert.message}
        </div>
      </div>

      <button
        onClick={dismissLiveAlert}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '0.2rem'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
