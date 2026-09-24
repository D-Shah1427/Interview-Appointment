import type { PanelMember, InterviewStage } from '../types';

export const INITIAL_INTERVIEW_STAGES: InterviewStage[] = [
  {
    id: 'stage-architecture',
    title: 'Senior Full-Stack & System Architecture',
    roleTrack: 'Software Engineering',
    durationMinutes: 30,
    description: 'Deep architectural evaluation covering distributed systems, scalability, frontend performance, and API design.',
    minPanelSize: 3,
    optimumPanelSize: 4,
    maxPanelSize: 5,
    requiredSkills: ['System Design', 'Architecture', 'Full-Stack'],
    badgeColor: '#6366f1' // Indigo
  },
  {
    id: 'stage-coding',
    title: 'Core Algorithms & Data Engineering',
    roleTrack: 'Backend & Data',
    durationMinutes: 30,
    description: 'Hands-on problem solving, algorithm design, concurrent data structures, and live pair coding.',
    minPanelSize: 3,
    optimumPanelSize: 4,
    maxPanelSize: 5,
    requiredSkills: ['Backend', 'Algorithms', 'Databases'],
    badgeColor: '#0ea5e9' // Sky
  },
  {
    id: 'stage-leadership',
    title: 'Engineering Leadership & Culture Alignment',
    roleTrack: 'Leadership & Talent',
    durationMinutes: 30,
    description: 'Assessing communication, mentorship, strategic thinking, cross-functional collaboration, and cultural values.',
    minPanelSize: 3,
    optimumPanelSize: 4,
    maxPanelSize: 5,
    requiredSkills: ['Leadership', 'Culture', 'Collaboration'],
    badgeColor: '#10b981' // Emerald
  }
];

// Helper to generate typical Mon-Fri working schedule (09:00 - 18:00 with variations)
const standardSchedule = (start1 = '09:00', end1 = '12:00', start2 = '13:00', end2 = '17:00') => ({
  1: [{ start: start1, end: end1 }, { start: start2, end: end2 }], // Monday
  2: [{ start: start1, end: end1 }, { start: start2, end: end2 }], // Tuesday
  3: [{ start: start1, end: end1 }, { start: start2, end: end2 }], // Wednesday
  4: [{ start: start1, end: end1 }, { start: start2, end: end2 }], // Thursday
  5: [{ start: start1, end: end1 }, { start: start2, end: '16:00' }], // Friday
  0: [], // Sunday off
  6: []  // Saturday off
});

export const INITIAL_PANEL_MEMBERS: PanelMember[] = [
  {
    id: 'panel-1',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@company.internal',
    role: 'Principal Distributed Systems Architect',
    department: 'Architecture',
    skills: ['System Design', 'Architecture', 'Full-Stack', 'Backend'],
    seniority: 'Principal',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('09:00', '12:00', '13:00', '17:00'),
    maxInterviewsPerDay: 3,
    totalInterviewsConducted: 4
  },
  {
    id: 'panel-2',
    name: 'Marcus Vance',
    email: 'marcus.v@company.internal',
    role: 'Staff Full-Stack Engineer',
    department: 'Engineering',
    skills: ['Full-Stack', 'Architecture', 'System Design', 'Algorithms'],
    seniority: 'Staff',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('09:00', '12:00', '13:00', '17:00'),
    maxInterviewsPerDay: 3,
    totalInterviewsConducted: 6
  },
  {
    id: 'panel-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@company.internal',
    role: 'Engineering Lead & Technical Fellow',
    department: 'Engineering',
    skills: ['Architecture', 'System Design', 'Leadership', 'Full-Stack'],
    seniority: 'Lead',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: {
      1: [{ start: '10:00', end: '13:00' }], // Mon: 10:00 - 13:00
      2: [{ start: '10:00', end: '13:00' }], // Tue: 10:00 - 13:00
      3: [{ start: '10:00', end: '13:00' }], // Wed: 10:00 - 13:00
      4: [],                                  // Thu: Not available / Off
      5: [                                    // Fri: 10-11, 12:30-13:15, 15:00-18:00
        { start: '10:00', end: '11:00' },
        { start: '12:30', end: '13:15' },
        { start: '15:00', end: '18:00' }
      ],
      6: [],
      0: []
    },
    maxInterviewsPerDay: 2,
    totalInterviewsConducted: 2
  },
  {
    id: 'panel-4',
    name: 'David Kim',
    email: 'david.kim@company.internal',
    role: 'Senior Infrastructure & Cloud Specialist',
    department: 'Architecture',
    skills: ['System Design', 'Backend', 'Full-Stack', 'Algorithms'],
    seniority: 'Senior',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('09:00', '12:00', '13:00', '17:00'),
    maxInterviewsPerDay: 3,
    totalInterviewsConducted: 5
  },
  {
    id: 'panel-5',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.m@company.internal',
    role: 'Staff Frontend Architect',
    department: 'Engineering',
    skills: ['Full-Stack', 'Architecture', 'Culture', 'Collaboration'],
    seniority: 'Staff',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('10:00', '13:00', '14:00', '18:00'),
    maxInterviewsPerDay: 3,
    totalInterviewsConducted: 3
  },
  {
    id: 'panel-6',
    name: 'Julian Thorne',
    email: 'julian.t@company.internal',
    role: 'Director of Platform Engineering',
    department: 'Leadership',
    skills: ['Leadership', 'System Design', 'Culture', 'Architecture'],
    seniority: 'Lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('09:00', '12:00', '14:00', '17:00'),
    maxInterviewsPerDay: 2,
    totalInterviewsConducted: 1
  },
  {
    id: 'panel-7',
    name: 'Priya Sharma',
    email: 'priya.sharma@company.internal',
    role: 'Senior Backend & Database Engineer',
    department: 'Engineering',
    skills: ['Backend', 'Databases', 'Algorithms', 'System Design'],
    seniority: 'Senior',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('09:00', '12:00', '13:00', '17:00'),
    maxInterviewsPerDay: 3,
    totalInterviewsConducted: 7
  },
  {
    id: 'panel-8',
    name: 'Lucas Meyer',
    email: 'lucas.meyer@company.internal',
    role: 'Principal Security & Reliability Engineer',
    department: 'Architecture',
    skills: ['Architecture', 'System Design', 'Backend', 'Full-Stack'],
    seniority: 'Principal',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('09:00', '12:00', '13:00', '17:00'),
    maxInterviewsPerDay: 3,
    totalInterviewsConducted: 4
  },
  {
    id: 'panel-9',
    name: 'Nadia Benali',
    email: 'nadia.b@company.internal',
    role: 'VP of People, Talent & Org Culture',
    department: 'People & Culture',
    skills: ['Culture', 'Leadership', 'Collaboration'],
    seniority: 'Lead',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('10:00', '13:00', '14:00', '17:00'),
    maxInterviewsPerDay: 3,
    totalInterviewsConducted: 2
  },
  {
    id: 'panel-10',
    name: 'Thomas Wu',
    email: 'thomas.wu@company.internal',
    role: 'Senior Machine Learning & Systems Engineer',
    department: 'Engineering',
    skills: ['Algorithms', 'Backend', 'Databases', 'System Design'],
    seniority: 'Senior',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('09:00', '12:00', '13:00', '16:00'),
    maxInterviewsPerDay: 2,
    totalInterviewsConducted: 3
  },
  {
    id: 'panel-11',
    name: 'Clara Oswald',
    email: 'clara.o@company.internal',
    role: 'Staff Product & Engineering Partner',
    department: 'Product',
    skills: ['Full-Stack', 'Leadership', 'Culture', 'Collaboration'],
    seniority: 'Staff',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('11:00', '13:00', '14:00', '18:00'),
    maxInterviewsPerDay: 2,
    totalInterviewsConducted: 5
  },
  {
    id: 'panel-12',
    name: 'Liam Gallagher',
    email: 'liam.g@company.internal',
    role: 'Senior Distributed Storage Engineer',
    department: 'Engineering',
    skills: ['Backend', 'System Design', 'Databases', 'Algorithms'],
    seniority: 'Senior',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('09:00', '12:00', '14:00', '17:00'),
    maxInterviewsPerDay: 2,
    totalInterviewsConducted: 3
  },
  {
    id: 'panel-13',
    name: 'Hannah Abbott',
    email: 'hannah.a@company.internal',
    role: 'Senior Talent Acquisition & Culture Lead',
    department: 'People & Culture',
    skills: ['Culture', 'Leadership', 'Collaboration'],
    seniority: 'Senior',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('09:00', '12:00', '13:00', '17:00'),
    maxInterviewsPerDay: 3,
    totalInterviewsConducted: 8
  },
  {
    id: 'panel-14',
    name: 'Kofi Mensah',
    email: 'kofi.mensah@company.internal',
    role: 'Staff Solutions & Site Reliability Architect',
    department: 'Architecture',
    skills: ['System Design', 'Architecture', 'Backend', 'Full-Stack'],
    seniority: 'Staff',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
    weeklySchedule: standardSchedule('10:00', '13:00', '14:00', '18:00'),
    maxInterviewsPerDay: 3,
    totalInterviewsConducted: 2
  }
];
