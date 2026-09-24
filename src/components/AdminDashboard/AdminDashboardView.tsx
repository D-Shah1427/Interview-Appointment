import React, { useState } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { emailService } from '../../services/emailService';
import { Users, Calendar, ShieldCheck, Trash2, CheckCircle2, Mail, Link, Copy, Check, ExternalLink, UserPlus, Clock, X, Edit3, Plus, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { getCandidateShareableUrl } from '../../utils/router';
import { Department, Seniority, TimeWindow, PanelMember } from '../../types';
import { getQuarterHourOptions } from '../../utils/timeHelpers';
import { Modal } from '../Common/Modal';
import { useStaffAuth } from '../../context/StaffAuthContext';

const quarterHourOptions = getQuarterHourOptions(7, 20);

export const AdminDashboardView: React.FC = () => {
  const { bookings, panelMembers, auditLogs, cancelInterview, addPanelMember, deletePanelMember, updatePanelMember, selectedDate } = useInterview();
  const { currentPasscode, updatePasscode } = useStaffAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'panelists' | 'emails'>('bookings');
  const [copiedLink, setCopiedLink] = useState(false);

  // Security Passcode Modal State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [currPinInput, setCurrPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Panelist Modal State for Admin
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Senior Software Engineer');
  const [newDept, setNewDept] = useState<Department>('Engineering');
  const [newSeniority, setNewSeniority] = useState<Seniority>('Senior');
  const [newSkills, setNewSkills] = useState('TypeScript, React, Architecture');
  const [newWindows, setNewWindows] = useState<TimeWindow[]>([
    { start: '09:00', end: '13:00' },
    { start: '14:00', end: '17:00' }
  ]);

  // Edit Panelist Hours Modal State for Admin
  const [editingMember, setEditingMember] = useState<PanelMember | null>(null);
  const [targetDate, setTargetDate] = useState(selectedDate);
  const [editWindows, setEditWindows] = useState<TimeWindow[]>([]);
  const [editScope, setEditScope] = useState<'date' | 'all'>('date');

  const candidateUrl = getCandidateShareableUrl();
  const handleCopyLink = () => {
    navigator.clipboard.writeText(candidateUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Multiple Window Handlers for Add
  const addNewWindow = () => {
    const lastWin = newWindows[newWindows.length - 1];
    let defaultStart = '14:00';
    let defaultEnd = '18:00';
    if (lastWin) {
      defaultStart = lastWin.end;
      const [h] = defaultStart.split(':').map(Number);
      const nextH = Math.min(20, h + 2);
      defaultEnd = `${String(nextH).padStart(2, '0')}:00`;
    }
    setNewWindows(prev => [...prev, { start: defaultStart, end: defaultEnd }]);
  };

  const removeNewWindow = (index: number) => {
    if (newWindows.length <= 1) return;
    setNewWindows(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateNewWindow = (index: number, field: 'start' | 'end', value: string) => {
    setNewWindows(prev => prev.map((w, idx) => idx === index ? { ...w, [field]: value } : w));
  };

  // Multiple Window Handlers for Edit
  const openEditHours = (member: PanelMember) => {
    setEditingMember(member);
    setTargetDate(selectedDate);

    const dateOverride = member.dateOverrides?.[selectedDate];
    if (Array.isArray(dateOverride) && dateOverride.length > 0) {
      setEditWindows([...dateOverride]);
      setEditScope('date');
    } else {
      const mondayWindows = member.weeklySchedule[1] || member.weeklySchedule[2] || [];
      if (mondayWindows.length > 0) {
        setEditWindows([...mondayWindows]);
      } else {
        setEditWindows([{ start: '09:00', end: '17:00' }]);
      }
      setEditScope('date');
    }
  };

  const addEditWindow = () => {
    const lastWin = editWindows[editWindows.length - 1];
    let defaultStart = '14:00';
    let defaultEnd = '18:00';
    if (lastWin) {
      defaultStart = lastWin.end;
      const [h] = defaultStart.split(':').map(Number);
      const nextH = Math.min(20, h + 2);
      defaultEnd = `${String(nextH).padStart(2, '0')}:00`;
    }
    setEditWindows(prev => [...prev, { start: defaultStart, end: defaultEnd }]);
  };

  const removeEditWindow = (index: number) => {
    if (editWindows.length <= 1) return;
    setEditWindows(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateEditWindow = (index: number, field: 'start' | 'end', value: string) => {
    setEditWindows(prev => prev.map((w, idx) => idx === index ? { ...w, [field]: value } : w));
  };

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    if (editWindows.length === 0) {
      alert('Please configure at least one availability window.');
      return;
    }

    for (let i = 0; i < editWindows.length; i++) {
      const w = editWindows[i];
      if (w.start >= w.end) {
        alert(`Window #${i + 1} (${w.start} to ${w.end}) is invalid. Start time must be before end time.`);
        return;
      }
    }

    if (editScope === 'date') {
      const updatedOverrides = {
        ...(editingMember.dateOverrides || {}),
        [targetDate]: [...editWindows]
      };
      updatePanelMember({
        ...editingMember,
        dateOverrides: updatedOverrides as any
      });
    } else {
      const newWeekly: Record<number, TimeWindow[]> = {
        ...editingMember.weeklySchedule,
        1: [...editWindows],
        2: [...editWindows],
        3: [...editWindows],
        4: [...editWindows],
        5: [...editWindows]
      };
      updatePanelMember({
        ...editingMember,
        weeklySchedule: newWeekly
      });
    }

    setEditingMember(null);
  };

  const handleAddPanelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    if (newWindows.length === 0) {
      alert('Please configure at least one availability window.');
      return;
    }

    for (let i = 0; i < newWindows.length; i++) {
      const w = newWindows[i];
      if (w.start >= w.end) {
        alert(`Window #${i + 1} (${w.start} to ${w.end}) is invalid. Start time must be before end time.`);
        return;
      }
    }

    addPanelMember({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole.trim() || 'Senior Software Engineer',
      department: newDept,
      skills: newSkills.split(',').map(s => s.trim()).filter(Boolean),
      seniority: newSeniority,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?auto=format&fit=crop&w=256&h=256&q=80`,
      weeklySchedule: {
        1: [...newWindows],
        2: [...newWindows],
        3: [...newWindows],
        4: [...newWindows],
        5: [...newWindows],
        0: [],
        6: []
      },
      maxInterviewsPerDay: 3
    });

    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewRole('Senior Software Engineer');
    setNewWindows([
      { start: '09:00', end: '13:00' },
      { start: '14:00', end: '17:00' }
    ]);
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

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSecurityStatus(null);
              setCurrPinInput('');
              setNewPinInput('');
              setShowSecurityModal(true);
            }}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
            title="Manage staff access passcode and security"
          >
            <KeyRound size={14} color="var(--primary)" />
            Staff Passcode
          </button>
        </div>
      </div>

      {/* Main Grid: Scheduled Bookings / Emails & Live Audit Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Switcher between Bookings, Panelists, and Sent Emails */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                className={`btn ${activeTab === 'panelists' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('panelists')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Users size={14} />
                Manage Panelists ({panelMembers.length})
              </button>
              <button
                type="button"
                className={`btn ${activeTab === 'emails' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('emails')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Mail size={14} />
                Email Dispatches ({allSentEmails.length})
              </button>
            </div>

            {activeTab === 'panelists' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <UserPlus size={14} />
                Add Panelist
              </button>
            )}
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
          ) : activeTab === 'panelists' ? (
            panelMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No panelists currently in the pool.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {panelMembers.map((member) => {
                  const monWindows = member.weeklySchedule[1] || [];
                  const hoursLabel = monWindows.length > 0
                    ? monWindows.map(w => `${w.start} - ${w.end}`).join(', ')
                    : 'Flexible';
                  const overrideCount = member.dateOverrides ? Object.keys(member.dateOverrides).length : 0;

                  return (
                    <div
                      key={member.id}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <img
                          src={member.avatar}
                          alt={member.name}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--border-subtle)'
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                              {member.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: 'var(--bg-surface)',
                                color: 'var(--primary)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              {member.department}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: 'var(--text-muted)',
                                background: 'var(--bg-surface)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              {member.seniority}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {member.email} • {member.role}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                            <Clock size={12} color="var(--primary)" />
                            <span>Hours: <strong>{hoursLabel}</strong> (Mon-Fri)</span>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span>Max <strong>{member.maxInterviewsPerDay || 3}</strong>/day</span>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span><strong>{member.totalInterviewsConducted || 0}</strong> conducted</span>
                          </div>
                          {overrideCount > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                              <Calendar size={11} />
                              <span>{overrideCount} custom date schedule{overrideCount > 1 ? 's' : ''} configured</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openEditHours(member)}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Change hours or set date overrides"
                        >
                          <Edit3 size={13} />
                          Change Time
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${member.name} from the interviewer panel pool? This will immediately recalculate open slots.`)) {
                              deletePanelMember(member.id);
                            }
                          }}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Remove panelist from pool"
                        >
                          <Trash2 size={13} />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
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

      {/* Admin Add Panelist Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} color="var(--primary)" />
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Add Panelist to Pool
            </span>
          </div>
        }
        maxWidth="540px"
      >
        <form onSubmit={handleAddPanelist} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="input-label" htmlFor="admin-panelist-name">Full Name</label>
            <input
              id="admin-panelist-name"
              type="text"
              required
              className="input-field"
              placeholder="e.g. Jordan Rivera"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="input-label" htmlFor="admin-panelist-email">Work Email</label>
            <input
              id="admin-panelist-email"
              type="email"
              required
              className="input-field"
              placeholder="e.g. jrivera@company.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label" htmlFor="admin-panelist-dept">Department</label>
              <select
                id="admin-panelist-dept"
                className="input-field"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value as Department)}
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Architecture">Architecture</option>
                <option value="Leadership">Leadership</option>
                <option value="People & Culture">People & Culture</option>
              </select>
            </div>
            <div>
              <label className="input-label" htmlFor="admin-panelist-seniority">Seniority</label>
              <select
                id="admin-panelist-seniority"
                className="input-field"
                value={newSeniority}
                onChange={(e) => setNewSeniority(e.target.value as Seniority)}
              >
                <option value="Lead">Lead</option>
                <option value="Principal">Principal</option>
                <option value="Staff">Staff</option>
                <option value="Senior">Senior</option>
                <option value="Peer">Peer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="admin-panelist-role">Job Title / Role</label>
            <input
              id="admin-panelist-role"
              type="text"
              className="input-field"
              placeholder="e.g. Principal Systems Architect"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />
          </div>

          {/* Multiple Windows in Admin Add Modal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="input-label" style={{ margin: 0, fontWeight: 700 }}>
                Availability Windows ({newWindows.length})
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addNewWindow}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Plus size={13} />
                Add Another Window
              </button>
            </div>

            {newWindows.map((win, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                    Window #{idx + 1}
                  </span>
                  {newWindows.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeNewWindow(idx)}
                      title="Remove window"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Available From
                    </label>
                    <select
                      className="input-field"
                      value={win.start}
                      onChange={(e) => updateNewWindow(idx, 'start', e.target.value)}
                    >
                      {quarterHourOptions.map((opt) => (
                        <option key={`admin-new-start-${idx}-${opt.time}`} value={opt.time}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Available Until
                    </label>
                    <select
                      className="input-field"
                      value={win.end}
                      onChange={(e) => updateNewWindow(idx, 'end', e.target.value)}
                    >
                      {quarterHourOptions.map((opt) => (
                        <option key={`admin-new-end-${idx}-${opt.time}`} value={opt.time}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save & Add to Pool
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Edit Working Hours Modal */}
      <Modal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title={
          editingMember && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--primary)" />
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Change Hours for {editingMember.name}
              </span>
            </div>
          )
        }
        maxWidth="540px"
      >
        {editingMember && (
          <form onSubmit={handleSaveHours} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="input-label">Apply Hours To</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="admin-edit-scope"
                    checked={editScope === 'date'}
                    onChange={() => setEditScope('date')}
                  />
                  <span>Specific Date (Variable Hours for Selected Date)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="admin-edit-scope"
                    checked={editScope === 'all'}
                    onChange={() => setEditScope('all')}
                  />
                  <span>All Standard Workdays (Monday – Friday)</span>
                </label>
              </div>
            </div>

            {editScope === 'date' && (
              <div>
                <label className="input-label">Select Date *</label>
                <input
                  type="date"
                  className="input-field"
                  value={targetDate}
                  onChange={(e) => {
                    const newD = e.target.value;
                    setTargetDate(newD);
                    const override = editingMember.dateOverrides?.[newD];
                    if (Array.isArray(override) && override.length > 0) {
                      setEditWindows([...override]);
                    } else {
                      const mondayWindows = editingMember.weeklySchedule[1] || [];
                      if (mondayWindows.length > 0) setEditWindows([...mondayWindows]);
                    }
                  }}
                  required
                />
              </div>
            )}

            {/* Multiple Windows in Edit Modal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="input-label" style={{ margin: 0, fontWeight: 700 }}>
                  Availability Windows ({editWindows.length})
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addEditWindow}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={13} />
                  Add Another Window
                </button>
              </div>

              {editWindows.map((win, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Window #{idx + 1}
                    </span>
                    {editWindows.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => removeEditWindow(idx)}
                        title="Remove window"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                        Available From
                      </label>
                      <select
                        className="input-field"
                        value={win.start}
                        onChange={(e) => updateEditWindow(idx, 'start', e.target.value)}
                      >
                        {quarterHourOptions.map((opt) => (
                          <option key={`admin-edit-start-${idx}-${opt.time}`} value={opt.time}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                        Available Until
                      </label>
                      <select
                        className="input-field"
                        value={win.end}
                        onChange={(e) => updateEditWindow(idx, 'end', e.target.value)}
                      >
                        {quarterHourOptions.map((opt) => (
                          <option key={`admin-edit-end-${idx}-${opt.time}`} value={opt.time}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show list of configured date overrides for this member */}
            {editingMember.dateOverrides && Object.keys(editingMember.dateOverrides).length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Configured Date Overrides ({Object.keys(editingMember.dateOverrides).length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '110px', overflowY: 'auto' }}>
                  {Object.entries(editingMember.dateOverrides).map(([dStr, val]) => (
                    <div
                      key={dStr}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        background: 'var(--bg-subtle)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span>
                        <strong>{dStr}</strong>: {val === false ? <span style={{ color: 'var(--color-danger)' }}>Out of Office</span> : val.map(w => `${w.start} – ${w.end}`).join(', ')}
                      </span>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ padding: '0.2rem' }}
                        title="Reset this date back to standard hours"
                        onClick={() => {
                          const newOverrides = { ...editingMember.dateOverrides };
                          delete newOverrides[dStr];
                          const updated = { ...editingMember, dateOverrides: newOverrides };
                          updatePanelMember(updated);
                          setEditingMember(updated);
                        }}
                      >
                        <X size={13} color="var(--color-danger)" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingMember(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Working Hours
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Staff Passcode & Security Settings Modal */}
      <Modal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={18} color="var(--primary)" />
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Staff Access & Passcode Settings
            </span>
          </div>
        }
        subtitle="Configure the security passcode required to access Admin and Panelist management."
        maxWidth="500px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Current Passcode Preview */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Active Staff Passcode
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {showCurrentPin ? currentPasscode : '••••••••'}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCurrentPin(!showCurrentPin)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', gap: '0.25rem' }}
            >
              {showCurrentPin ? <EyeOff size={14} /> : <Eye size={14} />}
              {showCurrentPin ? 'Hide' : 'Reveal'}
            </button>
          </div>

          {securityStatus && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: securityStatus.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                color: securityStatus.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                border: `1px solid ${securityStatus.type === 'success' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`
              }}
            >
              {securityStatus.message}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = updatePasscode(currPinInput, newPinInput);
              if (res.success) {
                setSecurityStatus({ type: 'success', message: res.message });
                setCurrPinInput('');
                setNewPinInput('');
              } else {
                setSecurityStatus({ type: 'error', message: res.message });
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <label className="form-label">Current Passcode *</label>
              <input
                type="password"
                className="form-input"
                required
                placeholder="Enter current passcode..."
                value={currPinInput}
                onChange={(e) => setCurrPinInput(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">New Passcode (min 4 characters) *</label>
              <input
                type="password"
                className="form-input"
                required
                placeholder="Enter new passcode..."
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSecurityModal(false)}
              >
                Done
              </button>
              <button type="submit" className="btn btn-primary">
                Update Passcode
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
