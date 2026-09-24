import React, { useState } from 'react';
import { useInterview } from '../../context/InterviewContext';
import type { PanelMember, Department, TimeWindow } from '../../types';
import { Users, Search, Plus, Clock, X, Award, Trash2, Edit3, Calendar } from 'lucide-react';
import { getQuarterHourOptions } from '../../utils/timeHelpers';
import { Modal } from '../Common/Modal';

const quarterHourOptions = getQuarterHourOptions(7, 20);

export const PanelManagementView: React.FC = () => {
  const { panelMembers, updatePanelMember, addPanelMember, deletePanelMember, selectedDate } = useInterview();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New member form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState<Department>('Engineering');
  const [newSkills, setNewSkills] = useState('System Design, Architecture');
  const [newWindows, setNewWindows] = useState<TimeWindow[]>([
    { start: '09:00', end: '13:00' },
    { start: '14:00', end: '17:00' }
  ]);

  // Edit hours form state
  const [editingMember, setEditingMember] = useState<PanelMember | null>(null);
  const [targetDate, setTargetDate] = useState(selectedDate);
  const [editWindows, setEditWindows] = useState<TimeWindow[]>([
    { start: '09:00', end: '17:00' }
  ]);
  const [editScope, setEditScope] = useState<'date' | 'all'>('date');
  const [memberToDelete, setMemberToDelete] = useState<PanelMember | null>(null);
  const [editHoursError, setEditHoursError] = useState<string | null>(null);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  const filteredMembers = panelMembers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = filterDept === 'All' || m.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const getMemberHoursSummary = (member: PanelMember, dateStr: string) => {
    if (member.dateOverrides?.[dateStr] === false) {
      return 'Out of Office';
    }
    const dateOverride = member.dateOverrides?.[dateStr];
    if (Array.isArray(dateOverride) && dateOverride.length > 0) {
      return `${dateOverride.map(w => `${w.start} - ${w.end}`).join(', ')} (${dateStr})`;
    }
    const mondayWindows = member.weeklySchedule[1] || member.weeklySchedule[2] || [];
    if (mondayWindows.length > 0) {
      return mondayWindows.map(w => `${w.start} - ${w.end}`).join(', ');
    }
    return '09:00 - 17:00';
  };

  const handleToggleOOO = (member: PanelMember) => {
    const currentOverrides = member.dateOverrides || {};
    const isCurrentlyOOO = currentOverrides[selectedDate] === false;

    const updatedOverrides = {
      ...currentOverrides,
      [selectedDate]: isCurrentlyOOO ? undefined : false
    };

    updatePanelMember({
      ...member,
      dateOverrides: updatedOverrides as any
    });
  };

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

  const handleDateChange = (newDate: string) => {
    setTargetDate(newDate);
    if (!editingMember) return;
    const override = editingMember.dateOverrides?.[newDate];
    if (Array.isArray(override) && override.length > 0) {
      setEditWindows([...override]);
    } else {
      const mondayWindows = editingMember.weeklySchedule[1] || [];
      if (mondayWindows.length > 0) {
        setEditWindows([...mondayWindows]);
      }
    }
  };

  // Multiple Window Handlers for Edit
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

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    if (editWindows.length === 0) {
      setEditHoursError('Please configure at least one availability window.');
      return;
    }

    for (let i = 0; i < editWindows.length; i++) {
      const w = editWindows[i];
      if (w.start >= w.end) {
        setEditHoursError(`Window #${i + 1} (${w.start} to ${w.end}) is invalid. Start time must be before end time.`);
        return;
      }
    }

    setEditHoursError(null);

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

  const handleDeleteMember = (member: PanelMember) => {
    setMemberToDelete(member);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    if (newWindows.length === 0) {
      setAddMemberError('Please configure at least one availability window.');
      return;
    }

    for (let i = 0; i < newWindows.length; i++) {
      const w = newWindows[i];
      if (w.start >= w.end) {
        setAddMemberError(`Window #${i + 1} (${w.start} to ${w.end}) is invalid. Start time must be before end time.`);
        return;
      }
    }

    setAddMemberError(null);

    addPanelMember({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole.trim() || 'Senior Software Engineer',
      department: newDept,
      skills: newSkills.split(',').map(s => s.trim()).filter(Boolean),
      seniority: 'Senior',
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
    setNewRole('');
    setNewWindows([
      { start: '09:00', end: '13:00' },
      { start: '14:00', end: '17:00' }
    ]);
  };

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          Panel Availability & Hours
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Panelists can set multiple availability windows (e.g. 10–2 and 5–6), customize variable dates, or toggle Out of Office.
        </p>
      </div>

      {/* Control Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'var(--bg-surface)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.2rem' }}
              placeholder="Search by name, role, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Architecture">Architecture</option>
            <option value="Leadership">Leadership</option>
            <option value="People & Culture">People & Culture</option>
            <option value="Product">Product</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Join / Add Panelist
        </button>
      </div>

      {/* Panelist Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {filteredMembers.map((member) => {
          const isOOOOnSelectedDate = member.dateOverrides?.[selectedDate] === false;
          const hoursSummary = getMemberHoursSummary(member, selectedDate);
          const overrideCount = member.dateOverrides ? Object.keys(member.dateOverrides).length : 0;

          return (
            <div
              key={member.id}
              style={{
                background: isOOOOnSelectedDate ? '#fff1f2' : 'var(--bg-surface)',
                border: '1px solid',
                borderColor: isOOOOnSelectedDate ? 'var(--color-danger-border)' : 'var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <img
                    src={member.avatar}
                    alt={member.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #e2e8f0',
                      opacity: isOOOOnSelectedDate ? 0.6 : 1
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>{member.name}</h4>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--primary)',
                          background: 'rgba(79, 70, 229, 0.08)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-xs)'
                        }}
                      >
                        {member.seniority}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {member.role}
                    </p>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: 600 }}>
                      {member.department} • <span style={{ color: 'var(--text-muted)' }}>{member.email}</span>
                    </div>
                  </div>
                </div>

                {/* Skills tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Availability stats & Working Hours */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-subtle)',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.85rem',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', flex: 1 }}>
                    <Clock size={13} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, lineHeight: 1.35 }}>{hoursSummary}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <Award size={13} color="#d97706" />
                    <span>{member.totalInterviewsConducted} conducted</span>
                  </div>
                </div>

                {overrideCount > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <Calendar size={12} />
                    <span>{overrideCount} custom date schedule{overrideCount > 1 ? 's' : ''} configured</span>
                  </div>
                )}
              </div>

              {/* Status & Actions: Edit Hours, Toggle OOO, and Leave/Remove */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  {isOOOOnSelectedDate ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                      ● Out of Office
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      ● Available
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openEditHours(member)}
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', gap: '0.3rem' }}
                    title="Change working hours / time slots"
                  >
                    <Edit3 size={12} />
                    Change Time
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleToggleOOO(member)}
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                  >
                    {isOOOOnSelectedDate ? 'Mark Active' : 'Mark OOO'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => handleDeleteMember(member)}
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem' }}
                    title="Remove from panel pool"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Hours / Time Modal */}
      <Modal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        title="Change Working Hours & Windows"
        subtitle={editingMember ? <span>Configure multiple availability windows (e.g. 10–2 and 5–6) for <strong>{editingMember.name}</strong>.</span> : undefined}
        maxWidth="540px"
      >
        <form onSubmit={handleSaveHours}>
          {editHoursError && (
            <div
              style={{
                color: 'var(--color-danger)',
                background: 'var(--color-danger-bg)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid var(--color-danger-border)',
                marginBottom: '1rem'
              }}
            >
              {editHoursError}
            </div>
          )}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Apply Hours To</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.35rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope"
                  checked={editScope === 'date'}
                  onChange={() => setEditScope('date')}
                />
                <span>Specific Date (Variable Hours for Selected Date)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope"
                  checked={editScope === 'all'}
                  onChange={() => setEditScope('all')}
                />
                <span>All Standard Workdays (Monday – Friday)</span>
              </label>
            </div>
          </div>

          {editScope === 'date' && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Select Date *</label>
              <input
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />
            </div>
          )}

          {/* Multiple Availability Windows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
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
                      className="form-select"
                      value={win.start}
                      onChange={(e) => updateEditWindow(idx, 'start', e.target.value)}
                    >
                      {quarterHourOptions.map((opt) => (
                        <option key={`edit-start-${idx}-${opt.time}`} value={opt.time}>
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
                      className="form-select"
                      value={win.end}
                      onChange={(e) => updateEditWindow(idx, 'end', e.target.value)}
                    >
                      {quarterHourOptions.map((opt) => (
                        <option key={`edit-end-${idx}-${opt.time}`} value={opt.time}>
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
          {editingMember && editingMember.dateOverrides && Object.keys(editingMember.dateOverrides).length > 0 && (
            <div style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Configured Date Overrides ({Object.keys(editingMember.dateOverrides).length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto' }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
      </Modal>

      {/* Add / Join Panelist Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Join / Add Panel Member"
        subtitle="Add an interviewer with one or multiple availability windows."
        maxWidth="540px"
      >
        <form onSubmit={handleAddMember}>
          {addMemberError && (
            <div
              style={{
                color: 'var(--color-danger)',
                background: 'var(--color-danger-bg)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid var(--color-danger-border)',
                marginBottom: '1rem'
              }}
            >
              {addMemberError}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Jordan Blake"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. jordan.b@company.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role / Job Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Senior Software Engineer"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value as Department)}
            >
              <option value="Engineering">Engineering</option>
              <option value="Architecture">Architecture</option>
              <option value="Leadership">Leadership</option>
              <option value="People & Culture">People & Culture</option>
              <option value="Product">Product</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Skills (comma separated)</label>
            <input
              type="text"
              className="form-input"
              value={newSkills}
              onChange={(e) => setNewSkills(e.target.value)}
              placeholder="e.g. System Design, Full-Stack, Architecture"
            />
          </div>

          {/* Multiple Windows in Add Modal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
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
                      className="form-select"
                      value={win.start}
                      onChange={(e) => updateNewWindow(idx, 'start', e.target.value)}
                    >
                      {quarterHourOptions.map((opt) => (
                        <option key={`new-start-${idx}-${opt.time}`} value={opt.time}>
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
                      className="form-select"
                      value={win.end}
                      onChange={(e) => updateNewWindow(idx, 'end', e.target.value)}
                    >
                      {quarterHourOptions.map((opt) => (
                        <option key={`new-end-${idx}-${opt.time}`} value={opt.time}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add to Pool
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Panel Member Confirmation Modal */}
      <Modal
        isOpen={Boolean(memberToDelete)}
        onClose={() => setMemberToDelete(null)}
        title="Remove Panel Member"
        maxWidth="440px"
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
    </div>
  );
};
