import React, { useState } from 'react';
import { useInterview } from '../../context/InterviewContext';
import type { PanelMember, Department } from '../../types';
import { Users, Search, Plus, Clock, X, Award, ShieldCheck } from 'lucide-react';

export const PanelManagementView: React.FC = () => {
  const { panelMembers, updatePanelMember, addPanelMember, selectedDate } = useInterview();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New member form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState<Department>('Engineering');
  const [newSkills, setNewSkills] = useState('System Design, Architecture');

  const filteredMembers = panelMembers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = filterDept === 'All' || m.department === filterDept;
    return matchesSearch && matchesDept;
  });

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

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    addPanelMember({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole.trim() || 'Senior Software Engineer',
      department: newDept,
      skills: newSkills.split(',').map(s => s.trim()).filter(Boolean),
      seniority: 'Senior',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?auto=format&fit=crop&w=256&h=256&q=80`,
      weeklySchedule: {
        1: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
        2: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
        3: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
        4: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
        5: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '16:00' }],
        0: [],
        6: []
      },
      maxInterviewsPerDay: 3
    });

    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewRole('');
  };

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          Panel Availability
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Manage panelist availability schedules and out-of-office overrides for <strong>{selectedDate}</strong>.
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
          Add Interviewer
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
                      width: '50px',
                      height: '50px',
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
                      {member.department}
                    </div>
                  </div>
                </div>

                {/* Skills tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
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

                {/* Availability stats */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-subtle)',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} color="var(--primary)" />
                    <span>Mon–Fri (09:00 - 17:00)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Award size={13} color="#d97706" />
                    <span>{member.totalInterviewsConducted} completed</span>
                  </div>
                </div>
              </div>

              {/* Status & OOO Action */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.85rem'
                }}
              >
                <div>
                  {isOOOOnSelectedDate ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                      ● Out of Office ({selectedDate})
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      ● On duty ({selectedDate})
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={isOOOOnSelectedDate ? 'btn btn-secondary' : 'btn btn-outline-danger'}
                  onClick={() => handleToggleOOO(member)}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  {isOOOOnSelectedDate ? 'Mark Available' : 'Mark OOO'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Interviewer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Add New Panel Member
            </h3>

            <form onSubmit={handleAddMember}>
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
                <label className="form-label">Internal Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. jordan.b@company.internal"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Professional Role / Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Principal Cloud Architect"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Interviewer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
