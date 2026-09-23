import React, { useState } from 'react';
import { CalendarBar } from './CalendarBar';
import { TimeSlotGrid } from './TimeSlotGrid';
import { BookingModal } from './BookingModal';
import { ConfirmationModal } from './ConfirmationModal';
import type { SlotCapacityInfo, InterviewBooking } from '../../types';

export const CandidatePortalView: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; capacity: SlotCapacityInfo } | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<InterviewBooking | null>(null);

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          Schedule Interview
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Select a date and available time slot to book your appointment.
        </p>
      </div>

      <CalendarBar />

      <div style={{ marginBottom: '0.75rem', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Available Slots
        </h3>
      </div>

      <TimeSlotGrid
        onSelectSlot={(time, capacity) => {
          setSelectedSlot({ time, capacity });
        }}
      />

      {selectedSlot && (
        <BookingModal
          slotTime={selectedSlot.time}
          slotCapacity={selectedSlot.capacity}
          onClose={() => setSelectedSlot(null)}
          onBookingSuccess={(booking) => {
            setSelectedSlot(null);
            setConfirmedBooking(booking);
          }}
        />
      )}

      {confirmedBooking && (
        <ConfirmationModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}
    </div>
  );
};
