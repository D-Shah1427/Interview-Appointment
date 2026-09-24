export interface TimeOption {
  time: string; // "09:15"
  label: string; // "9:15 AM"
  period: 'Morning' | 'Afternoon' | 'Late Afternoon';
  minuteType: 'hour' | 'quarter-past' | 'half-past' | 'quarter-to';
}

/**
 * Generates quarter-hour time options from startHour to endHour
 */
export function getQuarterHourOptions(startHour = 8, endHour = 19): TimeOption[] {
  const options: TimeOption[] = [];

  for (let h = startHour; h <= endHour; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === endHour && m > 0) break; // Stop at endHour:00

      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const hour12 = h % 12 || 12;
      const amPm = h >= 12 ? 'PM' : 'AM';

      let minuteType: TimeOption['minuteType'] = 'hour';
      if (m === 15) {
        minuteType = 'quarter-past';
      } else if (m === 30) {
        minuteType = 'half-past';
      } else if (m === 45) {
        minuteType = 'quarter-to';
      }

      let period: TimeOption['period'] = 'Morning';
      if (h >= 12 && h < 16) {
        period = 'Afternoon';
      } else if (h >= 16) {
        period = 'Late Afternoon';
      }

      const mStr = `:${String(m).padStart(2, '0')}`;
      const label = `${hour12}${mStr} ${amPm}`;

      options.push({
        time,
        label,
        period,
        minuteType
      });
    }
  }

  return options;
}

/**
 * Format a 30-minute interview window string:
 * e.g. "09:15" -> "9:15 AM – 9:45 AM"
 */
export function formatInterviewSlotRange(startTime: string, durationMinutes = 30): string {
  const [h, m] = startTime.split(':').map(Number);
  const startHour12 = h % 12 || 12;
  const startAmPm = h >= 12 ? 'PM' : 'AM';
  const startMStr = `:${String(m).padStart(2, '0')}`;

  const endTotalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(endTotalMinutes / 60);
  const endM = endTotalMinutes % 60;
  const endHour12 = endH % 12 || 12;
  const endAmPm = endH >= 12 ? 'PM' : 'AM';
  const endMStr = `:${String(endM).padStart(2, '0')}`;

  return `${startHour12}${startMStr} ${startAmPm} – ${endHour12}${endMStr} ${endAmPm}`;
}

