import React from 'react';
import { useInterview } from '../../context/InterviewContext';
import type { SlotCapacityInfo } from '../../types';
import { Clock, CheckCircle2, CalendarX2 } from 'lucide-react';

interface TimeSlotGridProps {
  onSelectSlot: (time: string, capacity: SlotCapacityInfo) => void;
}

const ALL_SLOT_TIMES = [
  { period: 'Morning', times: ['09:00', '10:00', '11:00'] },
  { period: 'Afternoon', times: ['12:00', '13:00', '14:00', '15:00'] },
  { period: 'Late Afternoon', times: ['16:00', '17:00'] }
];

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({ onSelectSlot }) => {
  const { selectedDate, getSlotCapacity } = useInterview();

  const formatTimeRange = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const startHour12 = h % 12 || 12;
    const startAmPm = h >= 12 ? 'PM' : 'AM';

    const endTotalMinutes = h * 60 + m + 60; // 60 mins duration
    const endH = Math.floor(endTotalMinutes / 60);
    const endM = endTotalMinutes % 60;
    const endHour12 = endH % 12 || 12;
    const endAmPm = endH >= 12 ? 'PM' : 'AM';

    const mStr = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
    const endMStr = endM === 0 ? '' : `:${String(endM).padStart(2, '0')}`;

    return `${startHour12}${mStr} ${startAmPm} – ${endHour12}${endMStr} ${endAmPm}`;
  };

  // Filter ONLY available slots with sufficient panelists
  const periodGroups = ALL_SLOT_TIMES.map(group => {
    const availableSlots = group.times
      .map(time => ({ time, capacity: getSlotCapacity(selectedDate, time) }))
      .filter(({ capacity }) => !capacity.isLocked && capacity.remainingInterviewsCapacity > 0);

    return {
      period: group.period,
      availableSlots
    };
  }).filter(group => group.availableSlots.length > 0);

  const totalAvailableSlots = periodGroups.reduce((acc, g) => acc + g.availableSlots.length, 0);

  if (totalAvailableSlots === 0) {
    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'var(--text-muted)'
          }}
        >
          <CalendarX2 size={24} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          No Available Slots for {selectedDate}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
          No interview slots are currently available for this date. Please select another date.
        </p>
      </div>
    );
  }

  return (
    <div className="slots-container">
      {periodGroups.map((group) => (
        <div key={group.period} className="slot-period-group">
          <h3>
            <Clock size={16} />
            {group.period}
          </h3>

          <div className="slot-cards-grid">
            {group.availableSlots.map(({ time, capacity }) => {
              const hasMultipleSpots = capacity.remainingInterviewsCapacity >= 2;

              return (
                <div
                  key={time}
                  className={`slot-card ${hasMultipleSpots ? 'status-available-high' : 'status-available-single'}`}
                  onClick={() => onSelectSlot(time, capacity)}
                >
                  <div className="slot-time">
                    <span>{formatTimeRange(time)}</span>
                    <span className={`slot-badge-indicator ${hasMultipleSpots ? 'high' : 'single'}`}>
                      <CheckCircle2 size={12} />
                      {hasMultipleSpots ? '2 Openings' : '1 Opening'}
                    </span>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem 0.85rem' }}
                  >
                    Select Slot
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
