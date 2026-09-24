import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { InterviewBooking } from '../../types';
import { downloadICSFile } from '../../utils/icsGenerator';
import { generateGoogleCalendarUrl } from '../../utils/meetingGenerator';
import { emailService, SentEmailNotification } from '../../services/emailService';
import { CheckCircle2, Calendar, Clock, Mail, Download, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '../Common/Modal';

interface ConfirmationModalProps {
  booking: InterviewBooking;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ booking, onClose }) => {
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [sentEmails, setSentEmails] = useState<SentEmailNotification[]>([]);
  const [activeEmailTab, setActiveEmailTab] = useState<'candidate' | 'admin'>('candidate');

  useEffect(() => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    const emails = emailService.getEmailsForBooking(booking.id);
    setSentEmails(emails);
  }, [booking.id]);

  const googleCalUrl = generateGoogleCalendarUrl({
    date: booking.date,
    time: booking.time,
    durationMinutes: booking.durationMinutes,
    candidateName: booking.candidateName
  });

  const candidateEmailObj = sentEmails.find(e => e.recipientType === 'candidate');
  const adminEmailObj = sentEmails.find(e => e.recipientType === 'admin');

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="580px" showCloseButton={true}>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--color-success-bg)',
              border: '2px solid var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              color: 'var(--color-success)'
            }}
          >
            <CheckCircle2 size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
            Interview Confirmed
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Your appointment is scheduled and details have been sent.
          </p>
        </div>

        {/* Date & Time Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.85rem',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Date
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{booking.date}</div>
            </div>
          </div>

          <div style={{ width: '1px', height: '26px', background: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Time & Duration
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {booking.time} ({booking.durationMinutes} mins)
              </div>
            </div>
          </div>
        </div>

        {/* Video Link via Email Notice Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Mail size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Meeting Link Sent via Email
              </span>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: 'var(--color-success)',
                background: 'var(--color-success-bg)',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Email Sent
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.6rem' }}>
            The video interview link will be sent to <strong>{booking.candidateEmail}</strong> before the session.
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowEmailPreview(!showEmailPreview)}
            style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem 0.65rem', justifyContent: 'center' }}
          >
            {showEmailPreview ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showEmailPreview ? 'Hide Email Details' : 'View Email Details'}
          </button>
        </div>

        {/* Sent Email Preview Drawer */}
        {showEmailPreview && (
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              marginBottom: '1rem',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <button
                type="button"
                className={`btn ${activeEmailTab === 'candidate' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveEmailTab('candidate')}
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
              >
                Candidate Confirmation
              </button>
              <button
                type="button"
                className={`btn ${activeEmailTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveEmailTab('admin')}
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
              >
                Recruiter Notification
              </button>
            </div>

            {activeEmailTab === 'candidate' && candidateEmailObj && (
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  <strong>To:</strong> {candidateEmailObj.recipientEmail} | <strong>Subject:</strong> {candidateEmailObj.subject}
                </div>
                <pre
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--border-subtle)',
                    lineHeight: 1.4
                  }}
                >
                  {candidateEmailObj.bodyText}
                </pre>
              </div>
            )}

            {activeEmailTab === 'admin' && adminEmailObj && (
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  <strong>To:</strong> {adminEmailObj.recipientEmail} | <strong>Subject:</strong> {adminEmailObj.subject}
                </div>
                <pre
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--border-subtle)',
                    lineHeight: 1.4
                  }}
                >
                  {adminEmailObj.bodyText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Panel Assignment Confirmation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-success)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            fontWeight: 600
          }}
        >
          <ShieldCheck size={16} />
          <span>Confirmed with a {booking.assignedPanel.length}-member interview panel.</span>
        </div>

        {/* Calendar Add Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ flex: '1 1 180px', fontSize: '0.78rem', padding: '0.45rem 0.65rem', textDecoration: 'none' }}
          >
            <Calendar size={14} />
            Add to Google Calendar
          </a>

          <button
            className="btn btn-secondary"
            onClick={() => downloadICSFile(booking)}
            style={{ flex: '1 1 180px', fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
          >
            <Download size={14} />
            Download .ICS File
          </button>
        </div>

        {/* Done Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '100px' }}>
            Done
          </button>
        </div>
    </Modal>
  );
};
