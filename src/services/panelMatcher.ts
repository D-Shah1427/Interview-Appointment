import type { PanelMember, InterviewBooking, SlotCapacityInfo, AssignedPanelist } from '../types';

/**
 * Checks if a given time slot "HH:MM" with duration (default 30 mins) fits within a window "HH:MM" - "HH:MM"
 */
export function isTimeInWindow(
  time: string,
  window: { start: string; end: string },
  durationMinutes = 30
): boolean {
  const [slotH, slotM] = time.split(':').map(Number);
  const [startH, startM] = window.start.split(':').map(Number);
  const [endH, endM] = window.end.split(':').map(Number);

  const slotStart = slotH * 60 + slotM;
  const slotEnd = slotStart + durationMinutes;
  const windowStart = startH * 60 + startM;
  const windowEnd = endH * 60 + endM;

  return slotStart >= windowStart && slotEnd <= windowEnd;
}

/**
 * Determines if a panel member is available on a given date and time slot
 */
export function isPanelistAvailableForSlot(
  panelist: PanelMember,
  dateStr: string,
  timeStr: string,
  bookings: InterviewBooking[],
  slotDuration = 30
): boolean {
  const [sH, sM] = timeStr.split(':').map(Number);
  const slotStart = sH * 60 + sM;
  const slotEnd = slotStart + slotDuration;

  // 1. Check if panelist is already booked for any interview overlapping with this slot
  const overlapsExistingBooking = bookings.some(b => {
    if (b.date !== dateStr || b.status !== 'confirmed') return false;
    const isAssigned = b.assignedPanel.some(p => p.memberId === panelist.id);
    if (!isAssigned) return false;

    const [bH, bM] = b.time.split(':').map(Number);
    const bStart = bH * 60 + bM;
    const bEnd = bStart + (b.durationMinutes || 30);

    return Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd);
  });
  if (overlapsExistingBooking) return false;

  // 2. Check daily interview limit
  const interviewsToday = bookings.filter(
    b => b.date === dateStr && b.status === 'confirmed' &&
      b.assignedPanel.some(p => p.memberId === panelist.id)
  ).length;

  if (interviewsToday >= (panelist.maxInterviewsPerDay || 3)) {
    return false;
  }

  // 3. Check date override (e.g., Vacation / Out of office or custom times for this date)
  if (panelist.dateOverrides && panelist.dateOverrides[dateStr] !== undefined) {
    const override = panelist.dateOverrides[dateStr];
    if (override === false) return false; // Full day off
    return override.some(w => isTimeInWindow(timeStr, w, slotDuration));
  }

  // 4. Check standard weekly schedule
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  const dayWindows = panelist.weeklySchedule[dayOfWeek] || [];
  return dayWindows.some(w => isTimeInWindow(timeStr, w, slotDuration));
}

/**
 * Calculates slot capacity:
 * - Minimum: 3 members
 * - Optimum: 4 members
 * - Maximum: 5 members
 * - 6-Panel Rule: If 6 panelists available, 1 interview with optimal 4 members.
 * - Multi-Interview: If >= 7 panelists available, slot can host 2 interviews.
 */
export function calculateSlotCapacity(
  dateStr: string,
  timeStr: string,
  allPanelists: PanelMember[],
  allBookings: InterviewBooking[],
  slotDuration = 30
): SlotCapacityInfo {
  const [sH, sM] = timeStr.split(':').map(Number);
  const slotStart = sH * 60 + sM;
  const slotEnd = slotStart + slotDuration;

  const slotBookings = allBookings.filter(b => {
    if (b.date !== dateStr || b.status !== 'confirmed') return false;
    const [bH, bM] = b.time.split(':').map(Number);
    const bStart = bH * 60 + bM;
    const bEnd = bStart + (b.durationMinutes || 30);
    return Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd);
  });
  const bookedCount = slotBookings.length;

  // Find free panelists for this slot
  const freePanelists = allPanelists.filter(p => isPanelistAvailableForSlot(p, dateStr, timeStr, allBookings, slotDuration));
  const freeCount = freePanelists.length;

  // Compute maximum interview capacity
  let maxInterviewsCapacity = 0;
  if (freeCount < 3) {
    maxInterviewsCapacity = 0;
  } else if (freeCount >= 3 && freeCount <= 6) {
    // 6 panelists strictly gives 1 interview with 4 members
    maxInterviewsCapacity = 1;
  } else if (freeCount >= 7 && freeCount <= 10) {
    maxInterviewsCapacity = 2;
  } else if (freeCount >= 11) {
    maxInterviewsCapacity = 3;
  }

  // Remaining capacity
  let remainingInterviewsCapacity = 0;
  if (freeCount < 3) {
    remainingInterviewsCapacity = 0;
  } else if (freeCount >= 3 && freeCount <= 6) {
    remainingInterviewsCapacity = 1;
  } else if (freeCount >= 7 && freeCount <= 10) {
    remainingInterviewsCapacity = 2;
  } else {
    remainingInterviewsCapacity = 3;
  }

  const isLocked = remainingInterviewsCapacity <= 0;

  // Anonymous status texts (Candidate does NOT see panel member identities)
  let statusText = '';
  let statusType: SlotCapacityInfo['statusType'] = 'available-single';

  if (isLocked) {
    statusType = 'locked';
    statusText = 'Fully Booked';
  } else if (remainingInterviewsCapacity >= 2) {
    statusType = 'available-high';
    statusText = '2 Interview Spots Available';
  } else if (freeCount >= 4) {
    statusType = 'available-single';
    statusText = '1 Interview Spot Available';
  } else {
    statusType = 'limited';
    statusText = '1 Interview Spot Available';
  }

  return {
    date: dateStr,
    time: timeStr,
    eligiblePanelists: allPanelists,
    freePanelists,
    bookedCount,
    maxInterviewsCapacity,
    remainingInterviewsCapacity,
    isLocked,
    assignedInterviews: slotBookings,
    statusText,
    statusType
  };
}

/**
 * Dynamically selects the best 3 to 5 panel members in the background
 */
export function dynamicallySelectPanel(freePanelists: PanelMember[]): AssignedPanelist[] {
  const freeCount = freePanelists.length;
  if (freeCount < 3) {
    throw new Error(`Insufficient panel members available (${freeCount}). Minimum 3 required.`);
  }

  // Target optimum: 4 members
  let targetPanelSize = 4;
  if (freeCount === 3) {
    targetPanelSize = 3;
  }

  // Sort by least total interviews conducted (fair load balancing)
  const sorted = [...freePanelists].sort((a, b) => {
    if (a.totalInterviewsConducted !== b.totalInterviewsConducted) {
      return a.totalInterviewsConducted - b.totalInterviewsConducted;
    }
    const seniorityRank: Record<string, number> = { Principal: 4, Staff: 3, Lead: 3, Senior: 2, Peer: 1 };
    return (seniorityRank[b.seniority] || 0) - (seniorityRank[a.seniority] || 0);
  });

  const selected: PanelMember[] = [];

  // Pick Lead if available
  const leadIndex = sorted.findIndex(p => p.seniority === 'Principal' || p.seniority === 'Staff' || p.seniority === 'Lead');
  if (leadIndex !== -1) {
    selected.push(sorted[leadIndex]);
    sorted.splice(leadIndex, 1);
  }

  // Fill up to target panel size
  while (selected.length < targetPanelSize && sorted.length > 0) {
    selected.push(sorted.shift()!);
  }

  return selected.map((member, index) => {
    let panelRole: AssignedPanelist['panelRole'] = 'Technical Evaluator';
    if (index === 0 && (member.seniority === 'Principal' || member.seniority === 'Staff' || member.seniority === 'Lead')) {
      panelRole = 'Lead Interviewer';
    } else if (member.department === 'People & Culture' || member.skills.includes('Culture')) {
      panelRole = 'Culture & Values Assessor';
    } else if (member.department === 'Architecture' || member.skills.includes('System Design')) {
      panelRole = 'Domain Specialist';
    } else {
      panelRole = 'Peer Panelist';
    }

    return {
      memberId: member.id,
      name: member.name,
      role: member.role,
      avatar: member.avatar,
      panelRole
    };
  });
}
