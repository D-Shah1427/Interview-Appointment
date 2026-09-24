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
      const data: CloudPayload = await res.json();
      safeSetItem(CLOUD_LAST_SYNC_KEY, new Date().toISOString());
      this.isSyncing = false;
      return data;
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
      const bodyWithMeta = {
        ...payload,
        updatedAt: new Date().toISOString()
      };
      
      // Use text/plain to avoid CORS preflight options failure with Google Apps Script
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyWithMeta)
      });

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
