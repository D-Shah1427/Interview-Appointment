import type { InterviewBooking } from '../types';

export function downloadICSFile(booking: InterviewBooking) {
  const [year, month, day] = booking.date.split('-').map(Number);
  const [hour, minute] = booking.time.split(':').map(Number);

  const startDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const endDate = new Date(startDate.getTime() + booking.durationMinutes * 60000);

  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Interview Appointment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${booking.id}@interview-appointment.internal`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:Interview Appointment - ${booking.candidateName}`,
    `DESCRIPTION:Interview Appointment for ${booking.candidateName}.\\n\\nNote: Video conference meeting link will be sent directly via email prior to the interview session.\\n\\nNotes: ${booking.notes || 'None'}`,
    'LOCATION:Virtual Conference (Link sent via email)',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `interview-${booking.candidateName.replace(/\s+/g, '_')}-${booking.date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
