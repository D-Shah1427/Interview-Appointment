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

export const INITIAL_PANEL_MEMBERS: PanelMember[] = [];
