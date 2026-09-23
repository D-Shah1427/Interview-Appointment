export type Department = 'Engineering' | 'Product' | 'Architecture' | 'Leadership' | 'People & Culture';

export type Seniority = 'Staff' | 'Principal' | 'Lead' | 'Senior' | 'Peer';

export interface TimeWindow {
  start: string; // "09:00"
  end: string;   // "12:00"
}

export interface PanelMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: Department;
  skills: string[];
  seniority: Seniority;
  avatar: string;
  // Day of week (0 = Sunday, 1 = Monday, ... 6 = Saturday) to working windows
  weeklySchedule: Record<number, TimeWindow[]>;
  // Specific date overrides (YYYY-MM-DD) -> false for out of office, or custom windows
  dateOverrides?: Record<string, TimeWindow[] | false>;
  maxInterviewsPerDay: number;
  totalInterviewsConducted: number;
}

export interface InterviewStage {
  id: string;
  title: string;
  roleTrack: string;
  durationMinutes: number;
  description: string;
  minPanelSize: number;      // 3
  optimumPanelSize: number;  // 4
  maxPanelSize: number;      // 5
  requiredSkills: string[];
  badgeColor: string;
}

export interface AssignedPanelist {
  memberId: string;
  name: string;
  role: string;
  avatar: string;
  panelRole: 'Lead Interviewer' | 'Technical Evaluator' | 'Domain Specialist' | 'Culture & Values Assessor' | 'Peer Panelist';
}

export interface InterviewBooking {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  resumeUrl?: string;
  notes?: string;
  stageId: string;
  stageTitle: string;
  date: string;       // "YYYY-MM-DD"
  time: string;       // "10:00"
  durationMinutes: number;
  meetingLink: string;
  assignedPanel: AssignedPanelist[];
  bookedAt: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
}

export interface SlotCapacityInfo {
  date: string;
  time: string;
  eligiblePanelists: PanelMember[];
  freePanelists: PanelMember[];
  bookedCount: number;
  maxInterviewsCapacity: number; // e.g., 2 if free >= 7, 1 if free >= 3, 0 if free < 3
  remainingInterviewsCapacity: number;
  isLocked: boolean;
  assignedInterviews: InterviewBooking[];
  statusText: string;
  statusType: 'available-high' | 'available-single' | 'limited' | 'locked';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: 'SLOT_LOCKED' | 'INTERVIEW_BOOKED' | 'PANEL_ASSIGNED' | 'CAPACITY_REDUCED' | 'PANEL_UPDATED';
  title: string;
  description: string;
  metadata?: Record<string, any>;
}
