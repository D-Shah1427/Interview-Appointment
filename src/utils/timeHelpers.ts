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

export const DAY_CONFIG = [
  { key: 1, name: 'Monday', short: 'Mon' },
  { key: 2, name: 'Tuesday', short: 'Tue' },
  { key: 3, name: 'Wednesday', short: 'Wed' },
  { key: 4, name: 'Thursday', short: 'Thu' },
  { key: 5, name: 'Friday', short: 'Fri' },
  { key: 6, name: 'Saturday', short: 'Sat' },
  { key: 0, name: 'Sunday', short: 'Sun' }
] as const;

export interface DateHoursSummary {
  isAvailable: boolean;
  isOOO: boolean;
  isOverride: boolean;
  summary: string;
  windows: Array<{ start: string; end: string }>;
}

/**
 * Accurately determines a panelist's hours for a specific calendar date (YYYY-MM-DD),
 * respecting date overrides and day-of-week schedules.
 */
export function getMemberHoursForDate(
  member: {
    weeklySchedule: Record<number, Array<{ start: string; end: string }>>;
    dateOverrides?: Record<string, Array<{ start: string; end: string }> | false>;
  },
  dateStr: string
): DateHoursSummary {
  // 1. Check specific date overrides (holiday, OOO, custom hours for date)
  if (member.dateOverrides && member.dateOverrides[dateStr] !== undefined) {
    const override = member.dateOverrides[dateStr];
    if (override === false) {
      return {
        isAvailable: false,
        isOOO: true,
        isOverride: true,
        summary: 'Out of Office (Date Override)',
        windows: []
      };
    }
    if (Array.isArray(override) && override.length > 0) {
      return {
        isAvailable: true,
        isOOO: false,
        isOverride: true,
        summary: `${override.map(w => `${w.start} - ${w.end}`).join(', ')} (${dateStr})`,
        windows: override
      };
    }
    return {
      isAvailable: false,
      isOOO: true,
      isOverride: true,
      summary: 'Unavailable on this date',
      windows: []
    };
  }

  // 2. Check weekly schedule based on day of the week
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();
  const dayConfig = DAY_CONFIG.find(d => d.key === dayOfWeek);
  const dayName = dayConfig ? dayConfig.name : 'this day';

  const windows = member.weeklySchedule?.[dayOfWeek] || [];
  if (windows.length > 0) {
    return {
      isAvailable: true,
      isOOO: false,
      isOverride: false,
      summary: windows.map(w => `${w.start} - ${w.end}`).join(', '),
      windows
    };
  }

  return {
    isAvailable: false,
    isOOO: false,
    isOverride: false,
    summary: `Not Available on ${dayName}s`,
    windows: []
  };
}


