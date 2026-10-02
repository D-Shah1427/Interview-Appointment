export function getUpcomingWeekdays(count = 14) {
  const dates = [];
  const curr = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  while (dates.length < count) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      dates.push({
        dateStr,
        dayName: days[dayOfWeek],
        dayNumber: curr.getDate(),
        monthName: months[curr.getMonth()],
        isToday: dates.length === 0
      });
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * Calculates a numerical Unix timestamp (in milliseconds) for a meeting booking based on date (YYYY-MM-DD) and time (HH:mm).
 * Used for accurate chronological comparison and sorting.
 */
export function getBookingMeetTimeValue(booking: { date: string; time: string }): number {
  if (!booking || !booking.date) return 0;
  const [yearStr = '', monthStr = '', dayStr = ''] = (booking.date || '').split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return 0;
  }

  const [hStr = '0', mStr = '0'] = (booking.time || '00:00').split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  return new Date(year, month, day, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0).getTime();
}

/**
 * Sorts interview bookings by meet time.
 * If direction is 'asc' (default), bookings with the earliest meet time appear first.
 * If direction is 'desc', bookings with the latest meet time appear first.
 * Ties are broken by candidate name, then bookedAt.
 */
export function sortBookingsByEarliestMeetTime<T extends { date: string; time: string; candidateName?: string; bookedAt?: string }>(
  bookings: T[],
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...bookings].sort((a, b) => {
    const timeA = getBookingMeetTimeValue(a);
    const timeB = getBookingMeetTimeValue(b);

    if (timeA !== timeB) {
      return direction === 'asc' ? timeA - timeB : timeB - timeA;
    }

    // Tie-breaker 1: candidate name
    const nameA = (a.candidateName || '').toLowerCase();
    const nameB = (b.candidateName || '').toLowerCase();
    if (nameA !== nameB) {
      return nameA.localeCompare(nameB);
    }

    // Tie-breaker 2: bookedAt (if available)
    if (a.bookedAt && b.bookedAt) {
      const bookedA = new Date(a.bookedAt).getTime();
      const bookedB = new Date(b.bookedAt).getTime();
      if (!isNaN(bookedA) && !isNaN(bookedB) && bookedA !== bookedB) {
        return direction === 'asc' ? bookedA - bookedB : bookedB - bookedA;
      }
    }

    return 0;
  });
}

/**
 * Formats a meeting date string (YYYY-MM-DD) into a human-friendly format (e.g., "Today", "Tomorrow", "Tue, Sep 29").
 */
export function formatFriendlyMeetDate(dateStr: string): { formatted: string; relativeBadge?: string } {
  if (!dateStr) return { formatted: '' };
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return { formatted: dateStr };

  const meetDate = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((meetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const formatted = meetDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  if (diffDays === 0) {
    return { formatted, relativeBadge: 'Today' };
  } else if (diffDays === 1) {
    return { formatted, relativeBadge: 'Tomorrow' };
  } else if (diffDays > 1 && diffDays <= 7) {
    return { formatted, relativeBadge: `In ${diffDays} days` };
  }

  return { formatted };
}

/**
 * Checks whether an interview booking has already passed its scheduled end time.
 */
export function isBookingPast(booking: { date: string; time: string; durationMinutes?: number }): boolean {
  if (!booking || !booking.date || !booking.time) return false;
  const meetTime = getBookingMeetTimeValue(booking);
  if (!meetTime) return false;
  const durationMs = (booking.durationMinutes || 30) * 60 * 1000;
  return meetTime + durationMs < Date.now();
}

