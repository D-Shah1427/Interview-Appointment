import type { InterviewBooking } from '../types';

export interface SentEmailNotification {
  id: string;
  bookingId: string;
  recipientType: 'candidate' | 'admin' | 'panelist';
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  sentAt: string;
  status: 'sent' | 'delivered';
}

const EMAIL_STORAGE_KEY = 'apex_sent_emails_v1';

class EmailService {
  private getStoredEmails(): SentEmailNotification[] {
    try {
      const data = localStorage.getItem(EMAIL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveEmails(emails: SentEmailNotification[]): void {
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(emails));
  }

  public getAllSentEmails(): SentEmailNotification[] {
    return this.getStoredEmails();
  }

  public getEmailsForBooking(bookingId: string): SentEmailNotification[] {
    return this.getStoredEmails().filter(e => e.bookingId === bookingId);
  }

  /**
   * Dispatches email notifications upon interview booking:
   * 1. Candidate confirmation email (informing that video link will be sent via email)
   * 2. Recruiter / Admin email (with full list of dynamically selected panel members)
   * 3. Panel Member emails (inviting each assigned interviewer with candidate details)
   */
  public sendInterviewBookingEmails(booking: InterviewBooking): SentEmailNotification[] {
    const now = new Date().toISOString();
    const newEmails: SentEmailNotification[] = [];

    // 1. Candidate Confirmation Email
    const candidateEmail: SentEmailNotification = {
      id: `email-cand-${Date.now()}`,
      bookingId: booking.id,
      recipientType: 'candidate',
      recipientEmail: booking.candidateEmail,
      recipientName: booking.candidateName,
      subject: `Appointment Confirmed: Interview on ${booking.date} at ${booking.time}`,
      bodyText: `Dear ${booking.candidateName},\n\nYour interview appointment has been successfully scheduled.\n\nDate: ${booking.date}\nTime: ${booking.time} (${booking.durationMinutes || 30} minutes)\n\nNote on Video Meeting Link:\nThe secure video meeting link will be sent directly to this email address (${booking.candidateEmail}) prior to your scheduled interview.\n\nPlease find your calendar invite attached or download it from your confirmation portal.\n\nBest regards,\nTalent Acquisition Team`,
      sentAt: now,
      status: 'delivered'
    };
    newEmails.push(candidateEmail);

    // 2. Admin / Recruiter Notification (with given panel members)
    const panelistListText = booking.assignedPanel
      .map((p, idx) => `  ${idx + 1}. ${p.name} (${p.role}) - Role on Panel: ${p.panelRole}`)
      .join('\n');

    const adminEmail: SentEmailNotification = {
      id: `email-admin-${Date.now()}`,
      bookingId: booking.id,
      recipientType: 'admin',
      recipientEmail: 'recruiting-team@company.internal',
      recipientName: 'Talent Acquisition & Admin',
      subject: `[Interview Scheduled] ${booking.candidateName} - ${booking.date} at ${booking.time} (${booking.assignedPanel.length} Panel Members Assigned)`,
      bodyText: `A new candidate interview has been booked.\n\nCandidate Details:\n- Name: ${booking.candidateName}\n- Email: ${booking.candidateEmail}\n- Phone: ${booking.candidatePhone || 'Not provided'}\n- Notes: ${booking.notes || 'None'}\n\nInterview Schedule:\n- Date: ${booking.date}\n- Time: ${booking.time} (${booking.durationMinutes || 30} minutes)\n\nDynamically Selected Panel (${booking.assignedPanel.length} Members):\n${panelistListText}\n\nAction Required:\nVideo conference link will be sent externally to candidate and panel members before the session.`,
      sentAt: now,
      status: 'delivered'
    };
    newEmails.push(adminEmail);

    // 3. Email to each assigned Panel Member
    booking.assignedPanel.forEach((panelist, index) => {
      const panelistEmail: SentEmailNotification = {
        id: `email-panel-${panelist.memberId}-${Date.now()}-${index}`,
        bookingId: booking.id,
        recipientType: 'panelist',
        recipientEmail: `${panelist.name.toLowerCase().replace(/\s+/g, '.')}@company.internal`,
        recipientName: panelist.name,
        subject: `Interview Panel Assignment: Candidate ${booking.candidateName} on ${booking.date} at ${booking.time}`,
        bodyText: `Hello ${panelist.name},\n\nYou have been dynamically assigned to an interview panel based on your availability.\n\nCandidate: ${booking.candidateName}\nDate: ${booking.date}\nTime: ${booking.time} (${booking.durationMinutes || 30} minutes)\nYour Role on Panel: ${panelist.panelRole}\n\nFull Panel (${booking.assignedPanel.length} members):\n${panelistListText}\n\nThe video meeting link will be dispatched prior to the interview session.\n\nThank you,\nEngineering & Talent Operations`,
        sentAt: now,
        status: 'delivered'
      };
      newEmails.push(panelistEmail);
    });

    const all = [...newEmails, ...this.getStoredEmails()];
    this.saveEmails(all);

    return newEmails;
  }
}

export const emailService = new EmailService();
