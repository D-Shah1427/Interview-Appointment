import React, { useState } from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { ShieldCheck, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';

interface StaffAccessGateProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  targetRole?: 'admin' | 'panelists';
}

export const StaffAccessGate: React.FC<StaffAccessGateProps> = ({
  onSuccess,
  onCancel,
  targetRole = 'admin'
}) => {
  const { login } = useStaffAuth();
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setErrorMsg('Please enter the staff passcode.');
      return;
    }

    const success = login(passcode);
    if (success) {
      setErrorMsg(null);
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg('Invalid passcode. Access denied.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const roleTitle = targetRole === 'panelists' ? 'Interviewer Panel Portal' : 'Admin & Recruiter Dashboard';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 160px)',
        padding: '2rem 1.5rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          animation: isShaking ? 'shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both' : undefined
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--color-info-bg)',
            border: '2px solid var(--border-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: 'var(--primary)',
            boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.2)'
          }}
        >
          <Lock size={28} />
        </div>

        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.4rem',
            letterSpacing: '-0.02em'
          }}
        >
          Staff Authentication
        </h2>

        <p
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.75rem',
            lineHeight: 1.45
          }}
        >
          Access to the <strong>{roleTitle}</strong> is restricted to authorized interviewers and recruiting administrators.
        </p>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              border: '1px solid var(--color-danger-border)'
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label
              htmlFor="staff-passcode-input"
              className="form-label"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>Staff Passcode</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Default: admin2026 or admin</span>
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="staff-passcode-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter staff passcode..."
                autoFocus
                style={{
                  paddingRight: '2.5rem',
                  fontSize: '0.95rem',
                  letterSpacing: showPassword ? 'normal' : '0.15em'
                }}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.35rem',
                  color: 'var(--text-muted)'
                }}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '0.75rem',
              fontSize: '0.92rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <KeyRound size={16} />
            Unlock Staff Portal
          </button>
        </form>

        {onCancel && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <ArrowLeft size={14} />
              Return to Candidate Booking
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};
