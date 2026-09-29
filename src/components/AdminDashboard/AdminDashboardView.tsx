import React, { useState, useMemo } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { emailService } from '../../services/emailService';
import { Users, Calendar, ShieldCheck, Trash2, CheckCircle2, Mail, Link, Copy, Check, ExternalLink, UserPlus, Clock, X, Edit3, Plus, KeyRound, Lock, Eye, EyeOff, Cloud, RefreshCw, Download, Upload, ArrowUpDown, Send, Filter, RotateCcw, CalendarPlus } from 'lucide-react';
import { getCandidateShareableUrl } from '../../utils/router';
import { Department, Seniority, TimeWindow, PanelMember, InterviewBooking } from '../../types';
import { getQuarterHourOptions, getMemberHoursForDate, DAY_CONFIG } from '../../utils/timeHelpers';
import { sortBookingsByEarliestMeetTime, formatFriendlyMeetDate } from '../../utils/dateHelpers';
import { Modal } from '../Common/Modal';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { PanelScheduleModal } from '../PanelManagement/PanelScheduleModal';
import { cloudSyncService } from '../../services/cloudSyncService';
import { storageService, safeSetItem } from '../../services/storage';

const quarterHourOptions = getQuarterHourOptions(7, 20);

export const AdminDashboardView: React.FC = () => {
  const {
    bookings,
    panelMembers,
    auditLogs,
    bookInterview,
    cancelInterview,
    restoreInterview,
    toggleEmailSent,
    addPanelMember,
    deletePanelMember,
    updatePanelMember,
    selectedDate,
    availableDates,
    triggerCloudSync,
    isCloudConfigured
  } = useInterview();
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
    { start: '10:00', end: '13:00' }
  ]);

  // Edit Panelist Hours Modal State for Admin
  const [editingMember, setEditingMember] = useState<PanelMember | null>(null);

  // Deletion & Confirmation Modal States (non-blocking for Google Sites iframe compatibility)
  const [memberToDelete, setMemberToDelete] = useState<PanelMember | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<InterviewBooking | null>(null);
  const [addPanelistError, setAddPanelistError] = useState<string | null>(null);

  const candidateUrl = getCandidateShareableUrl();
  const handleCopyLink = () => {
    navigator.clipboard.writeText(candidateUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Cloud Sync Modal State
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudUrlInput, setCloudUrlInput] = useState(() => cloudSyncService.getSyncUrl() || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showGasInstructions, setShowGasInstructions] = useState(false);
  const [copiedGasScript, setCopiedGasScript] = useState(false);

  const handleSaveSyncUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    cloudSyncService.setSyncUrl(cloudUrlInput);
    if (!cloudUrlInput.trim()) {
      setSyncStatusMsg({ type: 'success', message: 'Cloud sync disconnected. Operating in local storage mode.' });
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const ok = await triggerCloudSync();
      if (ok) {
        setSyncStatusMsg({ type: 'success', message: 'Connected and synchronized with Google Sheet / Cloud successfully!' });
      } else {
        setSyncStatusMsg({ type: 'error', message: 'Connected, but initial data sync failed. Check URL permissions (Access must be "Anyone").' });
      }
    } catch (err: any) {
      setSyncStatusMsg({ type: 'error', message: `Sync error: ${err.message || 'Unable to connect'}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      await triggerCloudSync();
      setSyncStatusMsg({ type: 'success', message: 'Data synced successfully!' });
    } catch {
      setSyncStatusMsg({ type: 'error', message: 'Sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      panelMembers,
      bookings,
      passcode: currentPasscode
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.panelMembers)) {
          storageService.savePanelMembers(parsed.panelMembers);
        }
        if (Array.isArray(parsed.bookings)) {
          safeSetItem('interview_bookings_v1', JSON.stringify(parsed.bookings));
        }
        if (parsed.passcode) {
          safeSetItem('staff_portal_passcode', parsed.passcode);
        }
        window.location.reload();
      } catch {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
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


  const handleAddPanelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    if (newWindows.length === 0) {
      setAddPanelistError('Please configure at least one availability window.');
      return;
    }

    for (let i = 0; i < newWindows.length; i++) {
      const w = newWindows[i];
      if (w.start >= w.end) {
        setAddPanelistError(`Window #${i + 1} (${w.start} to ${w.end}) is invalid. Start time must be before end time.`);
        return;
      }
    }

    setAddPanelistError(null);

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

  // Scheduled Interviews Sorting & Email Dispatch Filter
  const [bookingSortBy, setBookingSortBy] = useState<'earliest' | 'latest' | 'recently-booked' | 'name'>('earliest');
  const [bookingEmailFilter, setBookingEmailFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'confirmed' | 'cancelled' | 'all'>('confirmed');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [undoToast, setUndoToast] = useState<{ booking: InterviewBooking } | null>(null);

  // Manual Schedule Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualDate, setManualDate] = useState(() => availableDates[0]?.dateStr || '2026-10-01');
  const [manualTime, setManualTime] = useState('10:00');
  const [manualNotes, setManualNotes] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  const confirmedBookings = useMemo(() => bookings.filter(b => b.status === 'confirmed'), [bookings]);
  const cancelledBookings = useMemo(() => bookings.filter(b => b.status === 'cancelled'), [bookings]);
  const pendingEmailCount = useMemo(() => confirmedBookings.filter(b => !b.emailSent).length, [confirmedBookings]);

  // Bookings sorted and filtered according to user preferences (defaults to earliest meet time)
  const displayedBookings = useMemo(() => {
    let list = [...bookings];

    if (bookingStatusFilter === 'confirmed') {
      list = list.filter(b => b.status === 'confirmed');
    } else if (bookingStatusFilter === 'cancelled') {
      list = list.filter(b => b.status === 'cancelled');
    }

    if (bookingEmailFilter === 'pending') {
      list = list.filter(b => !b.emailSent);
    } else if (bookingEmailFilter === 'sent') {
      list = list.filter(b => !!b.emailSent);
    }

    if (bookingSearchQuery.trim()) {
      const q = bookingSearchQuery.toLowerCase().trim();
      list = list.filter(b =>
        (b.candidateName && b.candidateName.toLowerCase().includes(q)) ||
        (b.candidateEmail && b.candidateEmail.toLowerCase().includes(q)) ||
        (b.date && b.date.includes(q)) ||
        (b.time && b.time.includes(q))
      );
    }

    if (bookingSortBy === 'earliest') {
      return sortBookingsByEarliestMeetTime(list, 'asc');
    } else if (bookingSortBy === 'latest') {
      return sortBookingsByEarliestMeetTime(list, 'desc');
    } else if (bookingSortBy === 'recently-booked') {
      return [...list].sort((a, b) => new Date(b.bookedAt || 0).getTime() - new Date(a.bookedAt || 0).getTime());
    } else if (bookingSortBy === 'name') {
      return [...list].sort((a, b) => (a.candidateName || '').localeCompare(b.candidateName || ''));
    }

    return sortBookingsByEarliestMeetTime(list, 'asc');
  }, [bookings, bookingStatusFilter, bookingEmailFilter, bookingSearchQuery, bookingSortBy]);

  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) {
      setManualError('Please provide candidate name and email address.');
      return;
    }
    setManualLoading(true);
    setManualError(null);
    try {
      await bookInterview({
        candidateName: manualName.trim(),
        candidateEmail: manualEmail.trim(),
        candidatePhone: manualPhone.trim() || undefined,
        date: manualDate,
        time: manualTime,
        notes: manualNotes.trim() || undefined
      });
      setShowManualModal(false);
      setManualName('');
      setManualEmail('');
      setManualPhone('');
      setManualNotes('');
    } catch (err: any) {
      setManualError(err.message || 'Failed to book slot.');
    } finally {
      setManualLoading(false);
    }
  };

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
          {pendingEmailCount > 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              <span>⚠️ {pendingEmailCount} invite{pendingEmailCount > 1 ? 's' : ''} pending dispatch</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              <CheckCircle2 size={13} />
              <span>All email invites dispatched</span>
            </div>
          )}
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

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSyncStatusMsg(null);
              setShowCloudModal(true);
            }}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
            title="Configure real-time Google Sheet / Cloud multi-device synchronization"
          >
            <Cloud size={14} color={isCloudConfigured ? '#10b981' : 'var(--text-muted)'} />
            {isCloudConfigured ? 'Cloud Synced' : 'Cloud Sync'}
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

            {activeTab === 'bookings' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setManualError(null);
                  setShowManualModal(true);
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <CalendarPlus size={14} />
                Schedule Interview
              </button>
            )}
          </div>

          {activeTab === 'bookings' ? (
            <div>
              {/* Search, Sort & Email Filter Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  marginBottom: '1.25rem',
                  background: 'var(--bg-subtle)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {/* Search */}
                <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search candidate name, email, date..."
                    value={bookingSearchQuery}
                    onChange={(e) => setBookingSearchQuery(e.target.value)}
                    style={{ padding: '0.42rem 0.75rem', fontSize: '0.82rem', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {/* Sort Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ArrowUpDown size={14} color="var(--primary)" />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
                    <select
                      className="input-field"
                      value={bookingSortBy}
                      onChange={(e) => setBookingSortBy(e.target.value as any)}
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}
                    >
                      <option value="earliest">Earliest Meet Time (Upcoming first)</option>
                      <option value="latest">Latest Meet Time</option>
                      <option value="recently-booked">Recently Booked</option>
                      <option value="name">Candidate Name (A-Z)</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
                    <select
                      className="input-field"
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value as any)}
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}
                    >
                      <option value="confirmed">Confirmed ({confirmedBookings.length})</option>
                      <option value="cancelled">Cancelled / Released ({cancelledBookings.length})</option>
                      <option value="all">All ({bookings.length})</option>
                    </select>
                  </div>

                  {/* Email Status Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Filter size={14} color="var(--primary)" />
                    <select
                      className="input-field"
                      value={bookingEmailFilter}
                      onChange={(e) => setBookingEmailFilter(e.target.value as any)}
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}
                    >
                      <option value="all">All Email Statuses ({confirmedBookings.length})</option>
                      <option value="pending">⚠️ Email Pending ({pendingEmailCount})</option>
                      <option value="sent">✅ Email Sent ({confirmedBookings.length - pendingEmailCount})</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Instant Undo Banner if an interview was just cancelled */}
              {undoToast && (
                <div
                  style={{
                    marginBottom: '1.25rem',
                    padding: '0.85rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    animation: 'fadeIn 0.3s ease-in-out'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    <span>
                      Interview cancelled for <strong>{undoToast.booking.candidateName}</strong>. Slot <strong>{undoToast.booking.date} at {undoToast.booking.time}</strong> released back into pool.
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        const res = restoreInterview(undoToast.booking.id);
                        if (res.success) {
                          setUndoToast(null);
                        } else {
                          alert(res.message);
                        }
                      }}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#059669', borderColor: '#059669' }}
                    >
                      <RotateCcw size={13} />
                      Undo Cancellation
                    </button>
                    <button
                      type="button"
                      onClick={() => setUndoToast(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      title="Dismiss"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )}

              {bookings.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem'
                  }}
                >
                  No interviews in system yet.
                </div>
              ) : displayedBookings.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-subtle)'
                  }}
                >
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 0.75rem' }}>
                    {bookingStatusFilter === 'cancelled'
                      ? 'No cancelled interviews found.'
                      : 'No interviews match your search or filter criteria.'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setBookingSearchQuery('');
                      setBookingEmailFilter('all');
                      setBookingStatusFilter('confirmed');
                      setBookingSortBy('earliest');
                    }}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {displayedBookings.map((b) => {
                    const friendlyDate = formatFriendlyMeetDate(b.date);
                    return (
                      <div
                        key={b.id}
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1.15rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {b.candidateName}
                              </h4>
                              {b.status === 'cancelled' ? (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    color: 'var(--color-danger, #ef4444)',
                                    fontWeight: 700
                                  }}
                                >
                                  ❌ Cancelled (Slot Released)
                                </span>
                              ) : (
                                friendlyDate.relativeBadge && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: 'var(--radius-full)',
                                      background: 'rgba(79, 70, 229, 0.1)',
                                      color: 'var(--primary)',
                                      fontWeight: 700
                                    }}
                                  >
                                    {friendlyDate.relativeBadge}
                                  </span>
                                )
                              )}
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                              {b.candidateEmail}
                              {b.candidatePhone && ` • ${b.candidatePhone}`}
                            </p>
                            {b.notes && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0.25rem 0 0' }}>
                                Note: {b.notes}
                              </p>
                            )}
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              📅 {b.date} at {b.time}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              30-min session • {b.stageTitle}
                            </div>
                          </div>
                                         {/* Manual Email Dispatch Status & Tick Action (Only for confirmed bookings) */}
                        {b.status === 'confirmed' ? (
                          <div
                            style={{
                              background: b.emailSent ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                              border: `1px solid ${b.emailSent ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.65rem 0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.6rem'
                            }}
                          >
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.55rem',
                                cursor: 'pointer',
                                userSelect: 'none',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: b.emailSent ? 'var(--color-success)' : 'var(--color-warning)'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={!!b.emailSent}
                                onChange={() => toggleEmailSent(b.id)}
                                style={{
                                  width: '17px',
                                  height: '17px',
                                  cursor: 'pointer',
                                  accentColor: 'var(--color-success)'
                                }}
                              />
                              <span>
                                {b.emailSent ? '✅ Email Invite Dispatched' : '⚠️ Email Invite Pending'}
                              </span>
                              {b.emailSent && b.emailSentAt && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                  (Ticked on {new Date(b.emailSentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(b.emailSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              )}
                              {!b.emailSent && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                  — Admin sends calendar / Meet link outside platform
                                </span>
                              )}
                            </label>

                            <button
                              type="button"
                              className={b.emailSent ? "btn btn-secondary" : "btn btn-primary"}
                              onClick={() => toggleEmailSent(b.id)}
                              style={{
                                fontSize: '0.74rem',
                                padding: '0.3rem 0.7rem',
                                gap: '0.35rem',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              {b.emailSent ? (
                                <>
                                  <Check size={13} color="var(--color-success)" />
                                  <span>Ticked (Sent)</span>
                                </>
                              ) : (
                                <>
                                  <Send size={13} />
                                  <span>Mark Email Sent</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              background: 'rgba(239, 68, 68, 0.05)',
                              border: '1px dashed rgba(239, 68, 68, 0.3)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.65rem 0.85rem',
                              fontSize: '0.8rem',
                              color: 'var(--color-danger, #ef4444)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}
                          >
                            <span>⚠️ This interview is currently cancelled and released back into pool.</span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Click <strong>Restore Interview (Undo)</strong> below to reactivate.</span>
                          </div>
                        )}

                        {/* Panel Avatars and Actions */}
                        <div
                          style={{
                            background: 'var(--bg-surface)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid var(--border-subtle)',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
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

                          {b.status === 'cancelled' ? (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                const res = restoreInterview(b.id);
                                if (res.success) {
                                  if (undoToast && undoToast.booking.id === b.id) {
                                    setUndoToast(null);
                                  }
                                } else {
                                  alert(res.message);
                                }
                              }}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#059669', borderColor: '#059669' }}
                              title="Undo cancellation and restore slot to confirmed"
                            >
                              <RotateCcw size={13} />
                              Restore Interview (Undo)
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => setBookingToCancel(b)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              title="Cancel interview and release slot back into pool"
                            >
                              <Trash2 size={13} />
                              Release Slot
                            </button>
                          )}
                        </div>                   </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'panelists' ? (
            panelMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No panelists currently in the pool.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {panelMembers.map((member) => {
                  const hoursInfo = getMemberHoursForDate(member, selectedDate);
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
                            <span>Hours: <strong style={{ color: hoursInfo.isAvailable ? 'var(--text-primary)' : 'var(--text-muted)' }}>{hoursInfo.summary}</strong></span>
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
                          onClick={() => setEditingMember(member)}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Change hours or set date overrides"
                        >
                          <Edit3 size={13} />
                          Edit Hours
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => setMemberToDelete(member)}
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
          {addPanelistError && (
            <div
              style={{
                color: 'var(--color-danger)',
                background: 'var(--color-danger-bg)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid var(--color-danger-border)'
              }}
            >
              {addPanelistError}
            </div>
          )}
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

      {/* Comprehensive Panelist Availability & Schedule Modal */}
      <PanelScheduleModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        selectedDate={selectedDate}
        onClose={() => setEditingMember(null)}
        onSave={(updatedMember) => {
          updatePanelMember(updatedMember);
          setEditingMember(null);
        }}
      />

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

      {/* Cancel Interview Confirmation Modal */}
      <Modal
        isOpen={Boolean(bookingToCancel)}
        onClose={() => setBookingToCancel(null)}
        title="Cancel Interview Appointment"
        maxWidth="460px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to cancel the interview for <strong>{bookingToCancel?.candidateName}</strong> scheduled on <strong>{bookingToCancel?.date}</strong> at <strong>{bookingToCancel?.time}</strong>? This will instantly release the slot back into the available pool.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setBookingToCancel(null)}
            >
              Keep Booking
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              onClick={() => {
                if (bookingToCancel) {
                  const toCancel = bookingToCancel;
                  cancelInterview(toCancel.id);
                  setUndoToast({ booking: toCancel });
                  setBookingToCancel(null);
                }
              }}
            >
              Confirm Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Panel Member Confirmation Modal */}
      <Modal
        isOpen={Boolean(memberToDelete)}
        onClose={() => setMemberToDelete(null)}
        title="Remove Panel Member"
        maxWidth="460px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to remove <strong>{memberToDelete?.name}</strong> from the interviewer panel pool? This will immediately recalculate open slots.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMemberToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              onClick={() => {
                if (memberToDelete) {
                  deletePanelMember(memberToDelete.id);
                  setMemberToDelete(null);
                }
              }}
            >
              Confirm Remove
            </button>
          </div>
        </div>
      </Modal>
      {/* Real-Time Cloud & Google Sheet Sync Modal */}
      <Modal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cloud size={18} color="var(--primary)" />
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Multi-Device &amp; Google Sheet Sync
            </span>
          </div>
        }
        subtitle="Synchronize interview bookings, panels, and passcode in real-time across phone, laptop, and candidates."
        maxWidth="580px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Status Banner */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: isCloudConfigured ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isCloudConfigured ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isCloudConfigured ? '#059669' : '#b45309' }}>
                {isCloudConfigured ? '● Cloud Synchronization Active' : '○ Local Storage Mode (Single Device)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {isCloudConfigured
                  ? 'All devices and candidates share the same live bookings, panels, and passcode.'
                  : 'Currently data is stored only in this specific browser. Connect a Google Sheet to sync across all devices.'}
              </div>
            </div>

            {isCloudConfigured && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSyncing}
                onClick={handleManualSync}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', gap: '0.35rem', flexShrink: 0 }}
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>

          {syncStatusMsg && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: syncStatusMsg.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                color: syncStatusMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                border: `1px solid ${syncStatusMsg.type === 'success' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`
              }}
            >
              {syncStatusMsg.message}
            </div>
          )}

          {/* Form to Connect Google Sheet Web App */}
          <form onSubmit={handleSaveSyncUrl} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label className="form-label">Google Apps Script Web App URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={cloudUrlInput}
                onChange={(e) => setCloudUrlInput(e.target.value)}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Leave empty to disconnect and run locally in browser.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowGasInstructions(!showGasInstructions)}
                style={{ fontSize: '0.78rem' }}
              >
                {showGasInstructions ? 'Hide Instructions' : 'How to set up Google Sheet (2 mins)'}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSyncing}
                style={{ fontSize: '0.78rem' }}
              >
                {isSyncing ? 'Testing...' : 'Save & Connect'}
              </button>
            </div>
          </form>

          {/* Collapsible Step-by-Step Instructions */}
          {showGasInstructions && (
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.9rem',
                fontSize: '0.78rem',
                lineHeight: 1.5,
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Quick 4-Step Setup with Google Sheets:
              </div>
              <ol style={{ paddingLeft: '1.2rem', margin: '0 0 0.75rem' }}>
                <li>Open a new <strong>Google Sheet</strong> in your Google Drive.</li>
                <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                <li>Delete any code in the editor and paste the snippet below:</li>
              </ol>

              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <pre
                  style={{
                    background: '#1e293b',
                    color: '#e2e8f0',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    overflowX: 'auto',
                    margin: 0
                  }}
                >
{`function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("_AppData") || ss.insertSheet("_AppData");
  var val = sheet.getRange("A1").getValue();
  return ContentService.createTextOutput(val || "{}")
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dataSheet = ss.getSheetByName("_AppData") || ss.insertSheet("_AppData");
    var raw = e.postData.contents;
    dataSheet.getRange("A1").setValue(raw);

    // Populate a readable "Bookings" spreadsheet tab for HR / Team
    var parsed = JSON.parse(raw);
    if (parsed.bookings && Array.isArray(parsed.bookings)) {
      var bSheet = ss.getSheetByName("Bookings") || ss.insertSheet("Bookings");
      bSheet.clear();
      bSheet.appendRow(["Booking ID", "Date", "Time", "Candidate Name", "Email", "Phone", "Assigned Panel", "Status", "Booked At"]);
      var header = bSheet.getRange(1, 1, 1, 9);
      header.setBackground("#4f46e5").setFontColor("#ffffff").setFontWeight("bold");
      parsed.bookings.forEach(function(b) {
        var panel = (b.assignedPanel || []).map(function(p) { return p.name; }).join(", ");
        bSheet.appendRow([b.id, b.date, b.time, b.candidateName, b.candidateEmail, b.candidatePhone || "", panel, b.status, b.bookedAt]);
      });
      bSheet.autoResizeColumns(1, 9);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                </pre>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(`function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("_AppData") || ss.insertSheet("_AppData");
  var val = sheet.getRange("A1").getValue();
  return ContentService.createTextOutput(val || "{}")
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dataSheet = ss.getSheetByName("_AppData") || ss.insertSheet("_AppData");
    var raw = e.postData.contents;
    dataSheet.getRange("A1").setValue(raw);

    var parsed = JSON.parse(raw);
    if (parsed.bookings && Array.isArray(parsed.bookings)) {
      var bSheet = ss.getSheetByName("Bookings") || ss.insertSheet("Bookings");
      bSheet.clear();
      bSheet.appendRow(["Booking ID", "Date", "Time", "Candidate Name", "Email", "Phone", "Assigned Panel", "Status", "Booked At"]);
      var header = bSheet.getRange(1, 1, 1, 9);
      header.setBackground("#4f46e5").setFontColor("#ffffff").setFontWeight("bold");
      parsed.bookings.forEach(function(b) {
        var panel = (b.assignedPanel || []).map(function(p) { return p.name; }).join(", ");
        bSheet.appendRow([b.id, b.date, b.time, b.candidateName, b.candidateEmail, b.candidatePhone || "", panel, b.status, b.bookedAt]);
      });
      bSheet.autoResizeColumns(1, 9);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`);
                    setCopiedGasScript(true);
                    setTimeout(() => setCopiedGasScript(false), 2000);
                  }}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem'
                  }}
                >
                  {copiedGasScript ? 'Copied!' : 'Copy Script'}
                </button>
              </div>

              <ol start={4} style={{ paddingLeft: '1.2rem', margin: 0 }}>
                <li>Click <strong>Deploy &gt; New deployment</strong>, select <strong>Web App</strong>, set <em>Who has access</em> to <strong>Anyone</strong>, click <strong>Deploy</strong>, and paste the generated URL above!</li>
              </ol>
            </div>
          )}

          {/* Backup / Export / Import */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Data Backup &amp; Instant Device Migration
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              You can also export your configured panelists, bookings, and passcode as a JSON file and import it directly into your phone or any other browser:
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportData}
                style={{ fontSize: '0.78rem', gap: '0.35rem' }}
              >
                <Download size={13} />
                Export Backup (JSON)
              </button>
              <label
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', gap: '0.35rem', cursor: 'pointer', margin: 0 }}
              >
                <Upload size={13} />
                Import Backup (JSON)
                <input
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={handleImportFile}
                />
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Schedule Interview (Manual Admin Entry) Modal */}
      <Modal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="Schedule / Restore Candidate Interview"
        maxWidth="500px"
      >
        <form onSubmit={handleManualBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Manually schedule or restore an interview appointment for a candidate. The dynamic panel matching engine will automatically pair available panelists.
          </p>

          {manualError && (
            <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', fontSize: '0.82rem' }}>
              {manualError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Candidate Full Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Suparnojit Sarkar"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Candidate Email *
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="e.g. suparnojit@example.com"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="+91..."
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Interview Date *
              </label>
              <input
                type="date"
                required
                className="input-field"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Start Time *
              </label>
              <select
                className="input-field"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                style={{ width: '100%' }}
              >
                {quarterHourOptions.map(t => (
                  <option key={t.time} value={t.time}>{t.time} ({t.label})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Internal Notes / Details
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="e.g. Restored booking, standard 30m interview"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowManualModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={manualLoading}
              className="btn btn-primary"
            >
              {manualLoading ? 'Confirming...' : 'Schedule & Confirm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
