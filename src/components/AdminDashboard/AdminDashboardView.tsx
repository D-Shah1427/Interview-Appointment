import React, { useState } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { emailService } from '../../services/emailService';
import { Users, Calendar, ShieldCheck, Trash2, CheckCircle2, Mail, Link, Copy, Check, ExternalLink } from 'lucide-react';
import { getCandidateShareableUrl } from '../../utils/router';

export const AdminDashboardView: React.FC = () => {
  const { bookings, panelMembers, auditLogs, cancelInterview } = useInterview();
  const [activeTab, setActiveTab] = useState<'bookings' | 'emails'>('bookings');
  const [copiedLink, setCopiedLink] = useState(false);

  const candidateUrl = getCandidateShareableUrl();
  const handleCopyLink = () => {
    navigator.clipboard.writeText(candidateUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const allSentEmails = emailService.getAllSentEmails();

  return (
    <div className="page-container animate-fade-in">
      {/* Top KPI Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active Interviews</span>
            <Calendar size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)' }}>
            {confirmedBookings.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
            <CheckCircle2 size={13} />
            <span>Real-time confirmed</span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active Panel Pool</span>
            <Users size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)' }}>
            {panelMembers.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
            Total interviewers
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Panel Size Target</span>
            <ShieldCheck size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)' }}>
            4 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>(Min 3, Max 5)</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
            Optimum 4 per interview
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Dispatch</span>
            <Mail size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: '#b45309' }}>
            {allSentEmails.length} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>dispatches</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Notifications sent
          </div>
        </div>
      </div>

      {/* Shareable Candidate URL Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(79, 70, 229, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              flexShrink: 0
            }}
          >
            <Link size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Candidate Direct Booking Link (Internal Tabs Hidden)
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {candidateUrl}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopyLink}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            {copiedLink ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
            {copiedLink ? 'Copied Link' : 'Copy Link'}
          </button>

          <a
            href={candidateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', textDecoration: 'none' }}
          >
            <ExternalLink size={14} />
            Open Portal
          </a>
        </div>
      </div>

      {/* Main Grid: Scheduled Bookings / Emails & Live Audit Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Switcher between Bookings and Sent Emails */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('bookings')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                Scheduled Interviews ({confirmedBookings.length})
              </button>
              <button
                type="button"
                className={`btn ${activeTab === 'emails' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('emails')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                <Mail size={14} />
                Email Dispatches ({allSentEmails.length})
              </button>
            </div>
          </div>

          {activeTab === 'bookings' ? (
            confirmedBookings.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                No interviews scheduled yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {confirmedBookings.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{b.candidateName}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.candidateEmail}</p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {b.date} at {b.time}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Video link sent via email
                        </div>
                      </div>
                    </div>

                    {/* Panel Avatars visible to Admin */}
                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Assigned Panel ({b.assignedPanel.length} members):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                          {b.assignedPanel.map((p) => (
                            <div
                              key={p.memberId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.75rem',
                                background: 'var(--bg-subtle)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              <img
                                src={p.avatar}
                                alt={p.name}
                                style={{ width: '18px', height: '18px', borderRadius: '50%' }}
                              />
                              <span style={{ fontWeight: 600 }}>{p.name}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--primary)' }}>({p.panelRole.split(' ')[0]})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => {
                          if (window.confirm(`Cancel interview for ${b.candidateName}? This will instantly unlock the slot for others.`)) {
                            cancelInterview(b.id);
                          }
                        }}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        title="Cancel interview and release slot back into pool"
                      >
                        <Trash2 size={13} />
                        Release Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Email Dispatches Log */
            allSentEmails.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                No email dispatches recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {allSentEmails.map((email) => (
                  <div
                    key={email.id}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: email.recipientType === 'candidate' ? 'var(--primary)' : email.recipientType === 'admin' ? '#d97706' : '#059669',
                          background: 'var(--bg-surface)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        {email.recipientType.toUpperCase()} EMAIL
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(email.sentAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {email.subject}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      To: <strong>{email.recipientName}</strong> &lt;{email.recipientEmail}&gt;
                    </div>

                    <pre
                      style={{
                        background: 'var(--bg-surface)',
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                        border: '1px solid var(--border-subtle)',
                        lineHeight: 1.4
                      }}
                    >
                      {email.bodyText}
                    </pre>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Live Audit Log Stream */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '620px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Live Audit Log</h3>
            <span className="live-indicator" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
              <span className="pulse-dot"></span>
              Real-time
            </span>
          </div>

          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: log.eventType === 'INTERVIEW_BOOKED' ? 'var(--color-success)' : 'var(--primary)'
                    }}
                  >
                    {log.eventType.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {log.title}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.35 }}>
                  {log.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
