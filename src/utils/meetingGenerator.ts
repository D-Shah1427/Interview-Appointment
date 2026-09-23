/**
 * Meeting Link & External Video Dispatch Utility
 *
 * In accordance with the system workflow:
 * Video conference links are managed and dispatched outside the platform via email
 * to the candidate and the assigned panel members.
 */

export const VIDEO_LINK_DISPATCH_MESSAGE = 'Video meeting link will be sent via email prior to the interview.';

/**
 * Returns the placeholder meeting descriptor indicating external email delivery
 */
export function getExternalMeetingDescriptor(): string {
  return VIDEO_LINK_DISPATCH_MESSAGE;
}

/**
 * Generates a direct Google Calendar template URL
 */
export function generateGoogleCalendarUrl(booking: {
  date: string;
  time: string;
  durationMinutes: number;
  candidateName: string;
}): string {
  const [year, month, day] = booking.date.split('-').map(Number);
  const [hour, minute] = booking.time.split(':').map(Number);

  const startUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const endUtc = new Date(startUtc.getTime() + booking.durationMinutes * 60000);

  const formatGCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const title = encodeURIComponent(`Interview Appointment: ${booking.candidateName}`);
  const details = encodeURIComponent(
    `Confirmed Interview Appointment\\n\\nNote: Secure video meeting link will be sent via email prior to the interview.\\n\\nDedicated panel dynamically assigned in background.`
  );
  const location = encodeURIComponent('Video call link sent via email');
  const dates = `${formatGCalDate(startUtc)}/${formatGCalDate(endUtc)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}
