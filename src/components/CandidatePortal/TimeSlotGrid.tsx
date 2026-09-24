import React from 'react';
import { useInterview } from '../../context/InterviewContext';
import type { SlotCapacityInfo } from '../../types';
import { Clock, CheckCircle2, CalendarX2 } from 'lucide-react';
import { formatInterviewSlotRange } from '../../utils/timeHelpers';

interface TimeSlotGridProps {
  onSelectSlot: (time: string, capacity: SlotCapacityInfo) => void;
}

// Generate all 15-minute slot intervals from 08:30 to 18:00
const generateSlotsForPeriod = (startH: number, startM: number, endH: number, endM: number): string[] => {
  const times: string[] = [];
  let currentMinutes = startH * 60 + startM;
  const stopMinutes = endH * 60 + endM;

  while (currentMinutes <= stopMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += 15;
  }
  return times;
};

const ALL_SLOT_GROUPS = [
  { period: 'Morning', times: generateSlotsForPeriod(8, 30, 11, 45) },
  { period: 'Afternoon', times: generateSlotsForPeriod(12, 0, 15, 45) },
  { period: 'Late Afternoon', times: generateSlotsForPeriod(16, 0, 18, 0) }
];

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({ onSelectSlot }) => {
  const { selectedDate, getSlotCapacity } = useInterview();

  // Filter available slots with capacity
  const periodGroups = ALL_SLOT_GROUPS.map(group => {
    const availableSlots = group.times
      .map(time => ({ time, capacity: getSlotCapacity(selectedDate, time) }))
      .filter(({ capacity }) => !capacity.isLocked && capacity.remainingInterviewsCapacity > 0);

    return {
      period: group.period,
      availableSlots
    };
  }).filter(group => group.availableSlots.length > 0);

  const totalAvailableSlots = periodGroups.reduce((acc, g) => acc + g.availableSlots.length, 0);

  return (
    <div>
      {totalAvailableSlots === 0 ? (
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
            No interview slots are currently available for this date based on active panelist schedules. Please select another date.
          </p>
        </div>
      ) : (
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
                      <div className="slot-time" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                            {formatInterviewSlotRange(time, 30)}
                          </span>
                          <span className={`slot-badge-indicator ${hasMultipleSpots ? 'high' : 'single'}`}>
                            <CheckCircle2 size={12} />
                            {hasMultipleSpots ? '2 Openings' : '1 Opening'}
                          </span>
                        </div>
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
      )}
    </div>
  );
};

