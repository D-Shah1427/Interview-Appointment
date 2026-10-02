import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { PanelMember, InterviewBooking, SlotCapacityInfo, AuditLogEntry } from '../types';
import { storageService, playChime, safeGetItem, safeSetItem } from '../services/storage';
import { calculateSlotCapacity, dynamicallySelectPanel } from '../services/panelMatcher';
import { getUpcomingWeekdays, isBookingPast } from '../utils/dateHelpers';
import { cloudSyncService } from '../services/cloudSyncService';
import { emailService } from '../services/emailService';

interface InterviewContextType {
  panelMembers: PanelMember[];
  bookings: InterviewBooking[];
  auditLogs: AuditLogEntry[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableDates: { dateStr: string; dayName: string; dayNumber: number; monthName: string; isToday: boolean }[];
  getSlotCapacity: (dateStr: string, timeStr: string) => SlotCapacityInfo;
  bookInterview: (data: {
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    resumeUrl?: string;
    notes?: string;
    date: string;
    time: string;
  }) => Promise<InterviewBooking>;
  cancelInterview: (bookingId: string) => void;
  restoreInterview: (bookingId: string) => { success: boolean; message?: string };
  completeInterview: (bookingId: string) => void;
  reopenInterview: (bookingId: string) => void;
  markAllPastAsCompleted: () => number;
  toggleEmailSent: (bookingId: string) => boolean;
  updatePanelMember: (member: PanelMember) => void;
  addPanelMember: (member: Omit<PanelMember, 'id' | 'totalInterviewsConducted'>) => void;
  deletePanelMember: (memberId: string) => void;
  resetData: () => void;
  liveAlert: { id: string; message: string; type: 'lock' | 'booking' | 'info' } | null;
  dismissLiveAlert: () => void;
  triggerCloudSync: () => Promise<boolean>;
  isCloudConfigured: boolean;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [panelMembers, setPanelMembers] = useState<PanelMember[]>(() => storageService.getPanelMembers());
  const [bookings, setBookings] = useState<InterviewBooking[]>(() => storageService.getBookings());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => storageService.getAuditLogs());
  const [isCloudConfigured, setIsCloudConfigured] = useState<boolean>(() => cloudSyncService.isConfigured());

  const availableDates = useMemo(() => getUpcomingWeekdays(14), []);
  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0]?.dateStr || '');

  const [liveAlert, setLiveAlert] = useState<{ id: string; message: string; type: 'lock' | 'booking' | 'info' } | null>(null);

  const dismissLiveAlert = useCallback(() => {
    setLiveAlert(null);
  }, []);

  const reloadFromStorage = useCallback(() => {
    setPanelMembers(storageService.getPanelMembers());
    setBookings(storageService.getBookings());
    setAuditLogs(storageService.getAuditLogs());
    setIsCloudConfigured(cloudSyncService.isConfigured());
  }, []);

  const triggerCloudSync = useCallback(async (): Promise<boolean> => {
    if (!cloudSyncService.isConfigured()) return false;
    try {
      const remote = await cloudSyncService.pullFromCloud();
      if (remote) {
        let changed = false;

        // 1. Sync panel members if changed
        if (Array.isArray(remote.panelMembers) && remote.panelMembers.length > 0) {
          const localPanel = storageService.getPanelMembers();
          if (JSON.stringify(localPanel) !== JSON.stringify(remote.panelMembers)) {
            storageService.savePanelMembers(remote.panelMembers);
            changed = true;
          }
        }

        // 2. Non-destructive bidirectional merge for bookings
        const localBookings = storageService.getBookings();
        const remoteBookings = Array.isArray(remote.bookings) ? remote.bookings : [];

        const bookingMap = new Map<string, InterviewBooking>();
        localBookings.forEach(b => bookingMap.set(b.id, b));

        let localHasUnsyncedBookings = false;
        let remoteHasNewBookings = false;

        remoteBookings.forEach(remoteB => {
          const localB = bookingMap.get(remoteB.id);
          if (!localB) {
            // New booking from remote that wasn't in local (e.g. from an external candidate)
            bookingMap.set(remoteB.id, remoteB);
            remoteHasNewBookings = true;
            changed = true;
          } else {
            // Both have it - compare updatedAt / bookedAt
            const localTime = new Date(localB.updatedAt || localB.bookedAt).getTime() || 0;
            const remoteTime = new Date(remoteB.updatedAt || remoteB.bookedAt).getTime() || 0;

            if (remoteTime > localTime) {
              bookingMap.set(remoteB.id, remoteB);
              changed = true;
            } else if (localTime > remoteTime) {
              localHasUnsyncedBookings = true;
            } else {
              // Same timestamp - merge statuses non-destructively
              const merged: InterviewBooking = {
                ...remoteB,
                ...localB,
                emailSent: localB.emailSent || remoteB.emailSent,
                emailSentAt: localB.emailSentAt || remoteB.emailSentAt,
                status: (localB.status === 'cancelled' || remoteB.status === 'cancelled')
                  ? 'cancelled'
                  : 'confirmed'
              };
              if (JSON.stringify(merged) !== JSON.stringify(localB)) {
                changed = true;
              }
              bookingMap.set(remoteB.id, merged);
            }
          }
        });

        // Check if local has bookings that remote lacks completely
        localBookings.forEach(localB => {
          if (!remoteBookings.some(rb => rb.id === localB.id)) {
            localHasUnsyncedBookings = true;
          }
        });

        const mergedBookings = Array.from(bookingMap.values());

        // Save merged list if changes detected or unsynced items found
        if (changed || localHasUnsyncedBookings) {
          safeSetItem('interview_bookings_v1', JSON.stringify(mergedBookings));
          reloadFromStorage();
        }

        // If local has bookings that remote lacked, immediately push to cloud
        if (localHasUnsyncedBookings) {
          await cloudSyncService.pushToCloud({
            bookings: mergedBookings,
            panelMembers: storageService.getPanelMembers(),
            passcode: safeGetItem('staff_portal_passcode') || undefined
          });
        }

        // Passcode sync
        if (remote.passcode && typeof remote.passcode === 'string' && remote.passcode.length >= 4) {
          if (safeGetItem('staff_portal_passcode') !== remote.passcode) {
            safeSetItem('staff_portal_passcode', remote.passcode);
            changed = true;
            reloadFromStorage();
          }
        }

        if (remoteHasNewBookings) {
          playChime('alert');
          setLiveAlert({
            id: String(Date.now()),
            message: 'New candidate bookings synchronized from cloud.',
            type: 'booking'
          });
        }

        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [reloadFromStorage]);

  // Initial cloud sync pull on mount, plus periodic background poll and focus sync
  useEffect(() => {
    if (cloudSyncService.isConfigured()) {
      triggerCloudSync();
      const interval = setInterval(() => {
        triggerCloudSync();
      }, 30000);

      const onFocus = () => {
        triggerCloudSync();
      };
      window.addEventListener('focus', onFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
      };
    }
  }, [triggerCloudSync]);

  useEffect(() => {
    const unsubscribe = storageService.subscribe((event) => {
      if (event.type === 'SLOT_BOOKED') {
        reloadFromStorage();
        playChime('alert');
        setLiveAlert({
          id: String(Date.now()),
          message: `Slot ${event.booking.date} at ${event.booking.time} was just booked by another candidate.`,
          type: 'booking'
        });
      } else if (event.type === 'BOOKING_CANCELLED') {
        reloadFromStorage();
        setLiveAlert({
          id: String(Date.now()),
          message: `An interview slot has been released back into available capacity.`,
          type: 'info'
        });
      } else if (event.type === 'BOOKING_RESTORED') {
        reloadFromStorage();
        playChime('success');
        setLiveAlert({
          id: String(Date.now()),
          message: `An interview has been restored to the confirmed schedule.`,
          type: 'booking'
        });
      } else if (event.type === 'BOOKING_COMPLETED') {
        reloadFromStorage();
        playChime('success');
        setLiveAlert({
          id: String(Date.now()),
          message: `Interview marked as completed and moved to completed section.`,
          type: 'info'
        });
      } else if (event.type === 'PANEL_MEMBERS_UPDATED' || event.type === 'DATA_RESET' || event.type === 'STORAGE_CHANGE') {
        reloadFromStorage();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [reloadFromStorage]);

  const getSlotCapacity = useCallback((dateStr: string, timeStr: string): SlotCapacityInfo => {
    return calculateSlotCapacity(dateStr, timeStr, panelMembers, bookings, 30);
  }, [panelMembers, bookings]);

  const bookInterview = useCallback(async (data: {
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    resumeUrl?: string;
    notes?: string;
    date: string;
    time: string;
  }): Promise<InterviewBooking> => {
    const capacityInfo = calculateSlotCapacity(data.date, data.time, panelMembers, bookings, 30);

    if (capacityInfo.isLocked || capacityInfo.remainingInterviewsCapacity <= 0) {
      playChime('lock');
      throw new Error(`This slot (${data.date} at ${data.time}) is no longer available. It was just selected by another candidate or does not have enough available panel members.`);
    }

    // Dynamically select panel members in background (3-5 members, optimum 4)
    const assignedPanel = dynamicallySelectPanel(capacityInfo.freePanelists);

    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const meetingLink = 'Video meeting link will be sent via email prior to interview';

    const newBooking: InterviewBooking = {
      id: bookingId,
      candidateName: data.candidateName.trim(),
      candidateEmail: data.candidateEmail.trim(),
      candidatePhone: data.candidatePhone?.trim(),
      resumeUrl: data.resumeUrl?.trim(),
      notes: data.notes?.trim(),
      stageId: 'interview-standard',
      stageTitle: 'Interview Appointment',
      date: data.date,
      time: data.time,
      durationMinutes: 30,
      meetingLink,
      assignedPanel,
      bookedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'confirmed'
    };

    // Save booking and dispatch email notifications
    storageService.saveBooking(newBooking);
    emailService.sendInterviewBookingEmails(newBooking);
    reloadFromStorage();
    playChime('success');

    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({
        bookings: storageService.getBookings(),
        panelMembers: storageService.getPanelMembers(),
        passcode: safeGetItem('staff_portal_passcode') || undefined
      });
    }

    return newBooking;
  }, [panelMembers, bookings, reloadFromStorage]);

  const cancelInterview = useCallback((bookingId: string) => {
    storageService.cancelBooking(bookingId);
    reloadFromStorage();
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({
        bookings: storageService.getBookings(),
        panelMembers: storageService.getPanelMembers()
      });
    }
  }, [reloadFromStorage]);

  const restoreInterview = useCallback((bookingId: string): { success: boolean; message?: string } => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) {
      return { success: false, message: 'Booking record not found.' };
    }

    // Check if slot capacity allows re-activation
    const capacityInfo = calculateSlotCapacity(target.date, target.time, panelMembers, bookings, target.durationMinutes || 30);
    if (capacityInfo.isLocked || capacityInfo.remainingInterviewsCapacity <= 0) {
      playChime('lock');
      return {
        success: false,
        message: `Cannot restore: Slot ${target.date} at ${target.time} is no longer available (panel capacity is full).`
      };
    }

    const ok = storageService.restoreBooking(bookingId);
    if (ok) {
      reloadFromStorage();
      playChime('success');
      if (cloudSyncService.isConfigured()) {
        cloudSyncService.pushToCloud({
          bookings: storageService.getBookings(),
          panelMembers: storageService.getPanelMembers(),
          passcode: safeGetItem('staff_portal_passcode') || undefined
        });
      }
      return { success: true };
    }
    return { success: false, message: 'Failed to restore booking.' };
  }, [bookings, panelMembers, reloadFromStorage]);

  const completeInterview = useCallback((bookingId: string) => {
    storageService.completeBooking(bookingId);
    reloadFromStorage();
    playChime('success');
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({
        bookings: storageService.getBookings(),
        panelMembers: storageService.getPanelMembers(),
        passcode: safeGetItem('staff_portal_passcode') || undefined
      });
    }
  }, [reloadFromStorage]);

  const reopenInterview = useCallback((bookingId: string) => {
    storageService.reopenBooking(bookingId);
    reloadFromStorage();
    playChime('success');
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({
        bookings: storageService.getBookings(),
        panelMembers: storageService.getPanelMembers(),
        passcode: safeGetItem('staff_portal_passcode') || undefined
      });
    }
  }, [reloadFromStorage]);

  const markAllPastAsCompleted = useCallback((): number => {
    const all = storageService.getBookings();
    let count = 0;
    all.forEach(b => {
      if (b.status === 'confirmed' && isBookingPast(b)) {
        b.status = 'completed';
        b.updatedAt = new Date().toISOString();
        count++;
      }
    });
    if (count > 0) {
      safeSetItem('interview_bookings_v1', JSON.stringify(all));
      reloadFromStorage();
      playChime('success');
      if (cloudSyncService.isConfigured()) {
        cloudSyncService.pushToCloud({
          bookings: all,
          panelMembers: storageService.getPanelMembers(),
          passcode: safeGetItem('staff_portal_passcode') || undefined
        });
      }
    }
    return count;
  }, [reloadFromStorage]);

  const toggleEmailSent = useCallback((bookingId: string): boolean => {
    const res = storageService.toggleBookingEmailSent(bookingId);
    reloadFromStorage();
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({
        bookings: storageService.getBookings(),
        panelMembers: storageService.getPanelMembers()
      });
    }
    return res;
  }, [reloadFromStorage]);

  const updatePanelMember = useCallback((member: PanelMember) => {
    storageService.updatePanelMember(member);
    reloadFromStorage();
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({
        panelMembers: storageService.getPanelMembers(),
        bookings: storageService.getBookings()
      });
    }
  }, [reloadFromStorage]);

  const addPanelMember = useCallback((data: Omit<PanelMember, 'id' | 'totalInterviewsConducted'>) => {
    const newMember: PanelMember = {
      ...data,
      id: `panel-${Date.now()}`,
      totalInterviewsConducted: 0
    };
    storageService.updatePanelMember(newMember);
    reloadFromStorage();
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({
        panelMembers: storageService.getPanelMembers(),
        bookings: storageService.getBookings()
      });
    }
  }, [reloadFromStorage]);

  const deletePanelMember = useCallback((memberId: string) => {
    storageService.deletePanelMember(memberId);
    reloadFromStorage();
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({
        panelMembers: storageService.getPanelMembers(),
        bookings: storageService.getBookings()
      });
    }
  }, [reloadFromStorage]);

  const resetData = useCallback(() => {
    storageService.resetToDefaultSeed();
    reloadFromStorage();
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({
        panelMembers: [],
        bookings: []
      });
    }
    setLiveAlert({
      id: String(Date.now()),
      message: 'System data reset to default.',
      type: 'info'
    });
  }, [reloadFromStorage]);

  return (
    <InterviewContext.Provider
      value={{
        panelMembers,
        bookings,
        auditLogs,
        selectedDate,
        setSelectedDate,
        availableDates,
        getSlotCapacity,
        bookInterview,
        cancelInterview,
        restoreInterview,
        completeInterview,
        reopenInterview,
        markAllPastAsCompleted,
        toggleEmailSent,
        updatePanelMember,
        addPanelMember,
        deletePanelMember,
        resetData,
        liveAlert,
        dismissLiveAlert,
        triggerCloudSync,
        isCloudConfigured
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};
