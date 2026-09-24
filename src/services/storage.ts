import type { PanelMember, InterviewStage, InterviewBooking, AuditLogEntry } from '../types';
import { INITIAL_PANEL_MEMBERS, INITIAL_INTERVIEW_STAGES } from './seedData';

const STORAGE_KEYS = {
  PANEL_MEMBERS: 'interview_panel_members_v1',
  STAGES: 'interview_stages_v1',
  BOOKINGS: 'interview_bookings_v1',
  AUDIT_LOGS: 'interview_audit_logs_v1',
  ACTIVE_HOLDS: 'interview_active_holds_v1'
};

const CHANNEL_NAME = 'interview_platform_sync_channel';

// Web Audio API for subtle micro-feedback
export function playChime(type: 'success' | 'alert' | 'lock') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      // Pleasant high double chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'alert') {
      // Gentle notification pulse
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Soft lock tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    // Ignore audio autoplay restrictions gracefully
  }
}

class StorageService {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(event: any) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data);
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && Object.values(STORAGE_KEYS).includes(event.key)) {
          this.notifyListeners({ type: 'STORAGE_CHANGE', key: event.key });
        }
      });
    }
  }

  public subscribe(callback: (event: any) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error('Error in listener callback', err);
      }
    });
  }

  public broadcast(event: any) {
    if (this.channel) {
      this.channel.postMessage(event);
    }
    // Also notify internal window listeners
    this.notifyListeners(event);
  }

  // --- Panel Members ---
  public getPanelMembers(): PanelMember[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PANEL_MEMBERS);
      if (!data) {
        this.savePanelMembers(INITIAL_PANEL_MEMBERS);
        return INITIAL_PANEL_MEMBERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PANEL_MEMBERS;
    }
  }

  public savePanelMembers(members: PanelMember[]) {
    localStorage.setItem(STORAGE_KEYS.PANEL_MEMBERS, JSON.stringify(members));
    this.broadcast({ type: 'PANEL_MEMBERS_UPDATED', members });
  }

  public updatePanelMember(updated: PanelMember) {
    const list = this.getPanelMembers();
    const index = list.findIndex(p => p.id === updated.id);
    if (index !== -1) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    this.savePanelMembers(list);
  }

  public deletePanelMember(memberId: string) {
    const list = this.getPanelMembers().filter(p => p.id !== memberId);
    this.savePanelMembers(list);
    this.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'PANEL_UPDATED',
      title: 'Panelist Removed',
      description: 'A panelist was removed from the active interview pool.'
    });
  }

  // --- Stages ---
  public getStages(): InterviewStage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAGES);
      if (!data) {
        this.saveStages(INITIAL_INTERVIEW_STAGES);
        return INITIAL_INTERVIEW_STAGES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_INTERVIEW_STAGES;
    }
  }

  public saveStages(stages: InterviewStage[]) {
    localStorage.setItem(STORAGE_KEYS.STAGES, JSON.stringify(stages));
  }

  // --- Bookings ---
  public getBookings(): InterviewBooking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveBooking(booking: InterviewBooking): void {
    const bookings = this.getBookings();
    bookings.push(booking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Update panelists interview counts
    const members = this.getPanelMembers();
    booking.assignedPanel.forEach(assigned => {
      const target = members.find(m => m.id === assigned.memberId);
      if (target) {
        target.totalInterviewsConducted = (target.totalInterviewsConducted || 0) + 1;
      }
    });
    localStorage.setItem(STORAGE_KEYS.PANEL_MEMBERS, JSON.stringify(members));

    // Add Audit Log
    this.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'INTERVIEW_BOOKED',
      title: `Interview booked by ${booking.candidateName}`,
      description: `${booking.stageTitle} on ${booking.date} at ${booking.time} with ${booking.assignedPanel.length}-member panel (${booking.assignedPanel.map(p => p.name).join(', ')}).`,
      metadata: { bookingId: booking.id, slot: `${booking.date} ${booking.time}` }
    });

    this.broadcast({
      type: 'SLOT_BOOKED',
      booking,
      slotKey: `${booking.date}_${booking.time}`
    });
  }

  public cancelBooking(bookingId: string) {
    const bookings = this.getBookings();
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;

    target.status = 'cancelled';
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    this.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'CAPACITY_REDUCED',
      title: `Interview cancelled for ${target.candidateName}`,
      description: `Slot ${target.date} at ${target.time} has been released back into available capacity.`
    });

    this.broadcast({
      type: 'BOOKING_CANCELLED',
      bookingId,
      slotKey: `${target.date}_${target.time}`
    });
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addAuditLog(entry: AuditLogEntry) {
    const logs = this.getAuditLogs();
    logs.unshift(entry);
    // Keep last 100 entries
    if (logs.length > 100) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    this.broadcast({ type: 'AUDIT_LOG_ADDED', entry });
  }

  // --- Reset All Data ---
  public resetToDefaultSeed() {
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOLDS);
    this.savePanelMembers(INITIAL_PANEL_MEMBERS);
    this.saveStages(INITIAL_INTERVIEW_STAGES);

    const initialAudit: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'PANEL_UPDATED',
      title: 'Platform System Initialized',
      description: 'Reset platform to default state with 14 active panel members and dynamic matching rules configured.'
    };
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([initialAudit]));

    this.broadcast({ type: 'DATA_RESET' });
  }
}

export const storageService = new StorageService();
