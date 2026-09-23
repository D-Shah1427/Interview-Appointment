import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { PanelMember, InterviewBooking, SlotCapacityInfo, AuditLogEntry } from '../types';
import { storageService, playChime } from '../services/storage';
import { calculateSlotCapacity, dynamicallySelectPanel } from '../services/panelMatcher';
import { emailService } from '../services/emailService';
import { getUpcomingWeekdays } from '../utils/dateHelpers';

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
  updatePanelMember: (member: PanelMember) => void;
  addPanelMember: (member: Omit<PanelMember, 'id' | 'totalInterviewsConducted'>) => void;
  resetData: () => void;
  liveAlert: { id: string; message: string; type: 'lock' | 'booking' | 'info' } | null;
  dismissLiveAlert: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [panelMembers, setPanelMembers] = useState<PanelMember[]>(() => storageService.getPanelMembers());
  const [bookings, setBookings] = useState<InterviewBooking[]>(() => storageService.getBookings());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => storageService.getAuditLogs());

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
  }, []);

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
      } else if (event.type === 'PANEL_MEMBERS_UPDATED' || event.type === 'DATA_RESET' || event.type === 'STORAGE_CHANGE') {
        reloadFromStorage();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [reloadFromStorage]);

  const getSlotCapacity = useCallback((dateStr: string, timeStr: string): SlotCapacityInfo => {
    return calculateSlotCapacity(dateStr, timeStr, panelMembers, bookings);
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
    const capacityInfo = calculateSlotCapacity(data.date, data.time, panelMembers, bookings);

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
      durationMinutes: 60,
      meetingLink,
      assignedPanel,
      bookedAt: new Date().toISOString(),
      status: 'confirmed'
    };

    // Save booking and dispatch email notifications
    storageService.saveBooking(newBooking);
    emailService.sendInterviewBookingEmails(newBooking);
    reloadFromStorage();
    playChime('success');

    return newBooking;
  }, [panelMembers, bookings, reloadFromStorage]);

  const cancelInterview = useCallback((bookingId: string) => {
    storageService.cancelBooking(bookingId);
    reloadFromStorage();
  }, [reloadFromStorage]);

  const updatePanelMember = useCallback((member: PanelMember) => {
    storageService.updatePanelMember(member);
    reloadFromStorage();
  }, [reloadFromStorage]);

  const addPanelMember = useCallback((data: Omit<PanelMember, 'id' | 'totalInterviewsConducted'>) => {
    const newMember: PanelMember = {
      ...data,
      id: `panel-${Date.now()}`,
      totalInterviewsConducted: 0
    };
    storageService.updatePanelMember(newMember);
    reloadFromStorage();
  }, [reloadFromStorage]);

  const resetData = useCallback(() => {
    storageService.resetToDefaultSeed();
    reloadFromStorage();
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
        updatePanelMember,
        addPanelMember,
        resetData,
        liveAlert,
        dismissLiveAlert
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
