import React, { useState, useEffect } from 'react';
import type { PanelMember, TimeWindow } from '../../types';
import { Modal } from '../Common/Modal';
import { DAY_CONFIG, getQuarterHourOptions } from '../../utils/timeHelpers';
import { Plus, Trash2, Calendar, Clock, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';

const quarterHourOptions = getQuarterHourOptions(7, 20);

interface PanelScheduleModalProps {
  isOpen: boolean;
  member: PanelMember | null;
  selectedDate: string;
  onClose: () => void;
  onSave: (updatedMember: PanelMember) => void;
}

export const PanelScheduleModal: React.FC<PanelScheduleModalProps> = ({
  isOpen,
  member,
  selectedDate,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'dates'>('weekly');
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, TimeWindow[]>>({});
  const [dateOverrides, setDateOverrides] = useState<Record<string, TimeWindow[] | false>>({});
  
  // Date override subform state
  const [overrideDate, setOverrideDate] = useState<string>(selectedDate);
  const [overrideIsOOO, setOverrideIsOOO] = useState<boolean>(false);
  const [overrideWindows, setOverrideWindows] = useState<TimeWindow[]>([
    { start: '10:00', end: '13:00' }
  ]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Initialize state when member changes
  useEffect(() => {
    if (member) {
      const scheduleCopy: Record<number, TimeWindow[]> = {};
      DAY_CONFIG.forEach(({ key }) => {
        const existing = member.weeklySchedule?.[key];
        scheduleCopy[key] = existing && existing.length > 0
          ? existing.map(w => ({ ...w }))
          : [];
      });
      setWeeklySchedule(scheduleCopy);

      const overridesCopy: Record<string, TimeWindow[] | false> = {};
      if (member.dateOverrides) {
        Object.entries(member.dateOverrides).forEach(([d, val]) => {
          overridesCopy[d] = val === false ? false : val.map(w => ({ ...w }));
        });
      }
      setDateOverrides(overridesCopy);
      setOverrideDate(selectedDate);
      setErrorMessage(null);
      setSuccessNotice(null);
    }
  }, [member, selectedDate, isOpen]);

  if (!isOpen || !member) return null;

  // Toggle day availability
  const toggleDayAvailable = (dayKey: number) => {
    setWeeklySchedule(prev => {
      const current = prev[dayKey] || [];
      if (current.length > 0) {
        // Turn off
        return { ...prev, [dayKey]: [] };
      } else {
        // Turn on with sensible default (10:00 - 13:00 or copy Monday)
        const defaultWin = prev[1] && prev[1].length > 0
          ? prev[1].map(w => ({ ...w }))
          : [{ start: '09:00', end: '17:00' }];
        return { ...prev, [dayKey]: defaultWin };
      }
    });
  };

  // Add window to a specific day
  const addWindowToDay = (dayKey: number) => {
    setWeeklySchedule(prev => {
      const current = prev[dayKey] || [];
      let defaultStart = '14:00';
      let defaultEnd = '18:00';
      if (current.length > 0) {
        const last = current[current.length - 1];
        defaultStart = last.end;
        const [h] = defaultStart.split(':').map(Number);
        const nextH = Math.min(20, h + 2);
        defaultEnd = `${String(nextH).padStart(2, '0')}:00`;
      }
      return {
        ...prev,
        [dayKey]: [...current, { start: defaultStart, end: defaultEnd }]
      };
    });
  };

  // Remove window from a day
  const removeWindowFromDay = (dayKey: number, winIndex: number) => {
    setWeeklySchedule(prev => {
      const current = prev[dayKey] || [];
      return {
        ...prev,
        [dayKey]: current.filter((_, idx) => idx !== winIndex)
      };
    });
  };

  // Update window on a day
  const updateWindowOnDay = (dayKey: number, winIndex: number, field: 'start' | 'end', val: string) => {
    setWeeklySchedule(prev => {
      const current = prev[dayKey] || [];
      return {
        ...prev,
        [dayKey]: current.map((w, idx) => idx === winIndex ? { ...w, [field]: val } : w)
      };
    });
  };

  // Copy helper
  const copyDayScheduleTo = (sourceDayKey: number, targetDayKeys: number[]) => {
    const sourceWins = weeklySchedule[sourceDayKey] || [];
    setWeeklySchedule(prev => {
      const updated = { ...prev };
      targetDayKeys.forEach(tKey => {
        updated[tKey] = sourceWins.map(w => ({ ...w }));
      });
      return updated;
    });
    setSuccessNotice(`Copied hours from ${DAY_CONFIG.find(d => d.key === sourceDayKey)?.name} to target days!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Preset 1: Mon-Wed 10 to 1, Thu Off, Fri 10-11, 12:30-1:15, 3-6
  const applyUserExamplePreset = () => {
    setWeeklySchedule({
      1: [{ start: '10:00', end: '13:00' }], // Mon: 10 - 1
      2: [{ start: '10:00', end: '13:00' }], // Tue: 10 - 1
      3: [{ start: '10:00', end: '13:00' }], // Wed: 10 - 1
      4: [],                                  // Thu: not at all (Day Off)
      5: [                                    // Fri: 10-11, 12:30-1:15, 3-6
        { start: '10:00', end: '11:00' },
        { start: '12:30', end: '13:15' },
        { start: '15:00', end: '18:00' }
      ],
      6: [],                                  // Sat: Off
      0: []                                   // Sun: Off
    });
    setSuccessNotice('Loaded preset: Mon–Wed (10–1), Thu (Off), Fri (10–11, 12:30–1:15, 3–6)!');
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Preset 2: Standard Mon-Fri 9-5
  const applyStandardPreset = () => {
    const standard = [{ start: '09:00', end: '17:00' }];
    setWeeklySchedule({
      1: [...standard],
      2: [...standard],
      3: [...standard],
      4: [...standard],
      5: [...standard],
      6: [],
      0: []
    });
    setSuccessNotice('Loaded Standard Mon–Fri (9:00 AM – 5:00 PM) schedule.');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Override window handlers
  const addOverrideWindow = () => {
    const last = overrideWindows[overrideWindows.length - 1];
    let start = '14:00';
    let end = '18:00';
    if (last) {
      start = last.end;
      const [h] = start.split(':').map(Number);
      end = `${String(Math.min(20, h + 2)).padStart(2, '0')}:00`;
    }
    setOverrideWindows(prev => [...prev, { start, end }]);
  };

  const removeOverrideWindow = (idx: number) => {
    if (overrideWindows.length <= 1) return;
    setOverrideWindows(prev => prev.filter((_, i) => i !== idx));
  };

  const updateOverrideWindow = (idx: number, field: 'start' | 'end', val: string) => {
    setOverrideWindows(prev => prev.map((w, i) => i === idx ? { ...w, [field]: val } : w));
  };

  const handleAddOrUpdateDateOverride = () => {
    if (!overrideDate) {
      setErrorMessage('Please select a valid calendar date.');
      return;
    }

    if (overrideIsOOO) {
      setDateOverrides(prev => ({
        ...prev,
        [overrideDate]: false
      }));
      setSuccessNotice(`Marked ${overrideDate} as Out of Office (Unavailable).`);
    } else {
      for (let i = 0; i < overrideWindows.length; i++) {
        const w = overrideWindows[i];
        if (w.start >= w.end) {
          setErrorMessage(`Invalid window #${i + 1} (${w.start} to ${w.end}): start must be before end.`);
          return;
        }
      }
      setDateOverrides(prev => ({
        ...prev,
        [overrideDate]: overrideWindows.map(w => ({ ...w }))
      }));
      setSuccessNotice(`Custom schedule saved for date ${overrideDate}.`);
    }
    setErrorMessage(null);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleRemoveDateOverride = (dateKey: string) => {
    setDateOverrides(prev => {
      const copy = { ...prev };
      delete copy[dateKey];
      return copy;
    });
  };

  const handleSave = () => {
    // Validate all weekly schedule windows
    for (const { key, name } of DAY_CONFIG) {
      const wins = weeklySchedule[key] || [];
      for (let i = 0; i < wins.length; i++) {
        if (wins[i].start >= wins[i].end) {
          setErrorMessage(`Invalid time on ${name} (Window #${i + 1}): start (${wins[i].start}) must be before end (${wins[i].end}).`);
          setActiveTab('weekly');
          return;
        }
      }
    }

    onSave({
      ...member,
      weeklySchedule,
      dateOverrides
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Availability & Schedule"
      subtitle={`Configure recurring weekly availability or specific date overrides for ${member.name}.`}
      maxWidth="680px"
    >
      <div>
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
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
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div
            style={{
              color: 'var(--color-success)',
              background: 'var(--color-success-bg)',
              padding: '0.55rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600,
              border: '1px solid rgba(16, 185, 129, 0.2)',
              marginBottom: '1rem'
            }}
          >
            {successNotice}
          </div>
        )}

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem',
            gap: '0.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'weekly' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'weekly' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Clock size={15} />
            <span>Weekly Recurring Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dates')}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'dates' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'dates' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Calendar size={15} />
            <span>Specific Date Overrides ({Object.keys(dateOverrides).length})</span>
          </button>
        </div>

        {/* TAB 1: WEEKLY RECURRING SCHEDULE */}
        {activeTab === 'weekly' && (
          <div>
            {/* Quick Presets Bar */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Sparkles size={14} color="var(--primary)" />
                <span>Quick Schedule Presets:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={applyUserExamplePreset}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                  title="Mon–Wed 10:00–13:00, Thu Off, Fri (10–11, 12:30–1:15, 3–6)"
                >
                  ⚡ Mon–Wed (10–1), Thu (Off), Fri (Split)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={applyStandardPreset}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                >
                  Mon–Fri (9–5)
                </button>
              </div>
            </div>

            {/* Day-by-Day Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {DAY_CONFIG.map(({ key, name }) => {
                const windows = weeklySchedule[key] || [];
                const isAvailable = windows.length > 0;

                return (
                  <div
                    key={key}
                    style={{
                      background: isAvailable ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                      border: '1px solid',
                      borderColor: isAvailable ? 'var(--border-subtle)' : 'rgba(0,0,0,0.06)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      opacity: isAvailable ? 1 : 0.8
                    }}
                  >
                    {/* Day Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isAvailable ? '0.75rem' : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <input
                          type="checkbox"
                          id={`day-toggle-${key}`}
                          checked={isAvailable}
                          onChange={() => toggleDayAvailable(key)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                        <label
                          htmlFor={`day-toggle-${key}`}
                          style={{
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: isAvailable ? 'var(--text-primary)' : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {name}
                        </label>
                        {!isAvailable && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                            Not Available / Day Off
                          </span>
                        )}
                      </div>

                      {isAvailable && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {/* Copy to helpers */}
                          {key === 1 && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => copyDayScheduleTo(1, [2, 3])}
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              title="Copy Monday's hours to Tuesday & Wednesday"
                            >
                              <Copy size={11} />
                              Copy to Tue & Wed
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => copyDayScheduleTo(key, [1, 2, 3, 4, 5].filter(k => k !== key))}
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            title="Copy these hours to all other weekdays"
                          >
                            <Copy size={11} />
                            Apply to Weekdays
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => addWindowToDay(key)}
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--primary)' }}
                          >
                            <Plus size={11} />
                            Add Window
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Window Rows if Available */}
                    {isAvailable && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {windows.map((win, winIdx) => (
                          <div
                            key={winIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              background: 'var(--bg-subtle)',
                              padding: '0.45rem 0.65rem',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', width: '65px' }}>
                              Window #{winIdx + 1}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                              <select
                                className="form-select"
                                value={win.start}
                                onChange={(e) => updateWindowOnDay(key, winIdx, 'start', e.target.value)}
                                style={{ padding: '0.25rem 0.45rem', fontSize: '0.78rem' }}
                              >
                                {quarterHourOptions.map(opt => (
                                  <option key={`day-${key}-w${winIdx}-s-${opt.time}`} value={opt.time}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>

                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>to</span>

                              <select
                                className="form-select"
                                value={win.end}
                                onChange={(e) => updateWindowOnDay(key, winIdx, 'end', e.target.value)}
                                style={{ padding: '0.25rem 0.45rem', fontSize: '0.78rem' }}
                              >
                                {quarterHourOptions.map(opt => (
                                  <option key={`day-${key}-w${winIdx}-e-${opt.time}`} value={opt.time}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {windows.length > 1 && (
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => removeWindowFromDay(key, winIdx)}
                                title="Remove time window"
                                style={{ color: 'var(--color-danger)' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SPECIFIC DATE OVERRIDES */}
        {activeTab === 'dates' && (
          <div>
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Add Custom Hours or Out of Office for a Specific Date
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                Overrides the regular weekly schedule on the selected calendar date.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Calendar Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={overrideDate}
                    onChange={(e) => setOverrideDate(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Status on This Date</label>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="overrideType"
                        checked={!overrideIsOOO}
                        onChange={() => setOverrideIsOOO(false)}
                      />
                      <span>Available</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="overrideType"
                        checked={overrideIsOOO}
                        onChange={() => setOverrideIsOOO(true)}
                      />
                      <span>Out of Office (OOO)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Windows if Available on Date */}
              {!overrideIsOOO && (
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Time Windows for {overrideDate}:
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={addOverrideWindow}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Plus size={11} />
                      Add Window
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {overrideWindows.map((win, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'var(--bg-surface)',
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '60px' }}>
                          Slot #{idx + 1}
                        </span>

                        <select
                          className="form-select"
                          value={win.start}
                          onChange={(e) => updateOverrideWindow(idx, 'start', e.target.value)}
                          style={{ padding: '0.25rem 0.45rem', fontSize: '0.78rem' }}
                        >
                          {quarterHourOptions.map(opt => (
                            <option key={`ov-s-${idx}-${opt.time}`} value={opt.time}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>to</span>

                        <select
                          className="form-select"
                          value={win.end}
                          onChange={(e) => updateOverrideWindow(idx, 'end', e.target.value)}
                          style={{ padding: '0.25rem 0.45rem', fontSize: '0.78rem' }}
                        >
                          {quarterHourOptions.map(opt => (
                            <option key={`ov-e-${idx}-${opt.time}`} value={opt.time}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {overrideWindows.length > 1 && (
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => removeOverrideWindow(idx)}
                            style={{ color: 'var(--color-danger)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddOrUpdateDateOverride}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'var(--bg-surface)' }}
              >
                Set Override for {overrideDate}
              </button>
            </div>

            {/* List of configured overrides */}
            <div>
              <h5 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Configured Date Overrides ({Object.keys(dateOverrides).length})
              </h5>

              {Object.keys(dateOverrides).length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                  No date overrides set. Regular weekly schedule applies to all dates.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {Object.entries(dateOverrides).map(([dStr, val]) => (
                    <div
                      key={dStr}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        background: 'var(--bg-subtle)',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{dStr}</span>
                        {val === false ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Out of Office (Full Day Off)</span>
                        ) : (
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            {val.map(w => `${w.start} - ${w.end}`).join(', ')}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleRemoveDateOverride(dStr)}
                        title="Delete override"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
            marginTop: '1.25rem'
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Availability
          </button>
        </div>
      </div>
    </Modal>
  );
};
