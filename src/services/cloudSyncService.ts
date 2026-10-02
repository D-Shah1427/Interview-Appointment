import { safeGetItem, safeSetItem } from './storage';
import type { PanelMember, InterviewBooking } from '../types';

const CLOUD_SYNC_URL_KEY = 'interview_cloud_sync_url_v1';
const CLOUD_LAST_SYNC_KEY = 'interview_cloud_last_sync_v1';
export const DEFAULT_CLOUD_SYNC_URL = 'https://script.google.com/macros/s/AKfycbwALGqQEcM01j2WT4hZESWGNWUlH_gnuA9KaDXPSUel-mzNMKkSjxD7xLde2Ec542tKJQ/exec';

export interface CloudPayload {
  passcode?: string;
  panelMembers?: PanelMember[];
  bookings?: InterviewBooking[];
  updatedAt?: string;
}

class CloudSyncService {
  private syncUrl: string | null = null;
  private isSyncing = false;

  constructor() {
    this.syncUrl = safeGetItem(CLOUD_SYNC_URL_KEY) || DEFAULT_CLOUD_SYNC_URL;
  }

  public getSyncUrl(): string | null {
    return this.syncUrl || safeGetItem(CLOUD_SYNC_URL_KEY) || DEFAULT_CLOUD_SYNC_URL;
  }

  public setSyncUrl(url: string | null): void {
    if (url && url.trim()) {
      const clean = url.trim();
      this.syncUrl = clean;
      safeSetItem(CLOUD_SYNC_URL_KEY, clean);
    } else {
      this.syncUrl = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(CLOUD_SYNC_URL_KEY);
        }
      } catch {
        // ignore
      }
    }
  }

  public isConfigured(): boolean {
    return !!this.getSyncUrl();
  }

  public getLastSyncTime(): string | null {
    return safeGetItem(CLOUD_LAST_SYNC_KEY);
  }

  /**
   * Compacts payload to keep size minimal and prevent hitting Google Sheets 50,000 char per cell limit
   */
  private compactPayload(payload: CloudPayload): CloudPayload {
    const compact: CloudPayload = { ...payload };

    if (Array.isArray(payload.bookings)) {
      compact.bookings = payload.bookings.map(b => {
        const copy: any = { ...b };

        // Strip duplicate avatar URLs from assignedPanel (can save ~400+ characters per booking)
        if (Array.isArray(b.assignedPanel)) {
          copy.assignedPanel = b.assignedPanel.map(p => ({
            memberId: p.memberId,
            name: p.name,
            role: p.role,
            panelRole: p.panelRole
          }));
        }

        // Omit default boilerplate strings
        if (copy.meetingLink === 'Video meeting link will be sent via email prior to interview') {
          delete copy.meetingLink;
        }
        if (copy.stageTitle === 'Interview Appointment') {
          delete copy.stageTitle;
        }
        if (copy.stageId === 'interview-standard') {
          delete copy.stageId;
        }

        // Omit empty optional fields
        if (!copy.candidatePhone) delete copy.candidatePhone;
        if (!copy.resumeUrl) delete copy.resumeUrl;
        if (!copy.notes) delete copy.notes;
        if (!copy.emailSent) delete copy.emailSent;
        if (!copy.emailSentAt) delete copy.emailSentAt;

        return copy as InterviewBooking;
      });
    }

    return compact;
  }

  /**
   * Rehydrates compacted payload with standard defaults and panel member avatars
   */
  private rehydratePayload(remote: CloudPayload): CloudPayload {
    if (!remote || typeof remote !== 'object') return remote;

    const panelMembers = Array.isArray(remote.panelMembers) ? remote.panelMembers : [];

    if (Array.isArray(remote.bookings)) {
      remote.bookings = remote.bookings.map(b => {
        const assignedPanel = (b.assignedPanel || []).map(p => {
          const matched = panelMembers.find(m => m.id === p.memberId);
          return {
            memberId: p.memberId,
            name: p.name || matched?.name || 'Panel Member',
            role: p.role || matched?.role || 'Interviewer',
            avatar: p.avatar || matched?.avatar || 'https://images.unsplash.com/photo-1500000000000?auto=format&fit=crop&w=256&h=256&q=80',
            panelRole: p.panelRole || 'Technical Evaluator'
          };
        });

        return {
          ...b,
          meetingLink: b.meetingLink || 'Video meeting link will be sent via email prior to interview',
          stageId: b.stageId || 'interview-standard',
          stageTitle: b.stageTitle || 'Interview Appointment',
          assignedPanel,
          updatedAt: b.updatedAt || b.bookedAt || new Date().toISOString()
        };
      });
    }

    return remote;
  }

  /**
   * Fetches latest data from the connected Google Apps Script / Cloud endpoint
   */
  public async pullFromCloud(): Promise<CloudPayload | null> {
    const url = this.getSyncUrl();
    if (!url) return null;

    try {
      this.isSyncing = true;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawText = await res.text();
      let data: CloudPayload;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.warn('Failed to parse cloud response:', rawText.substring(0, 100));
        this.isSyncing = false;
        return null;
      }

      const rehydrated = this.rehydratePayload(data);
      safeSetItem(CLOUD_LAST_SYNC_KEY, new Date().toISOString());
      this.isSyncing = false;
      return rehydrated;
    } catch (err) {
      console.warn('Cloud sync pull failed:', err);
      this.isSyncing = false;
      return null;
    }
  }

  /**
   * Pushes full or partial data to the connected Google Apps Script / Cloud endpoint
   */
  public async pushToCloud(payload: CloudPayload): Promise<boolean> {
    const url = this.getSyncUrl();
    if (!url) return false;

    try {
      this.isSyncing = true;
      const compacted = this.compactPayload(payload);
      const bodyWithMeta = {
        ...compacted,
        updatedAt: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(bodyWithMeta);

      // Use text/plain to avoid CORS preflight options failure with Google Apps Script
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: jsonString
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Read response to verify status
      const resText = await res.text().catch(() => '');
      if (resText) {
        try {
          const resObj = JSON.parse(resText);
          if (resObj && resObj.status === 'error') {
            console.error('Google Sheet push error returned by script:', resObj.message);
            this.isSyncing = false;
            return false;
          }
        } catch {
          // If non-JSON text returned, ignore parse error
        }
      }

      safeSetItem(CLOUD_LAST_SYNC_KEY, new Date().toISOString());
      this.isSyncing = false;
      return true;
    } catch (err) {
      console.warn('Cloud sync push failed:', err);
      this.isSyncing = false;
      return false;
    }
  }
}

export const cloudSyncService = new CloudSyncService();
