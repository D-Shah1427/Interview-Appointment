# Interview Appointment

A web-based interview appointment platform with dynamic background panel allocation and real-time slot conflict resolution.

---

## Overview

When candidates choose an available date and time slot, the platform dynamically selects an optimal interview panel in the background based on panelist schedules. Once a slot reaches capacity, it locks immediately across all sessions to prevent double-booking.

---

## Features

- **Anonymous Candidate Booking**: Candidates view and book available time slots without seeing panelist identities.
- **Dynamic Panel Allocation**:
  - Minimum 3 panelists, maximum 5 panelists, **optimum 4 panelists**.
  - If 6 panelists are available, the system allocates 1 interview with the optimal 4 members.
  - Slots with 7 or more available panelists support 2 concurrent bookings.
- **Real-Time Slot Locking**: Multi-tab synchronization via `BroadcastChannel` and local storage prevents conflicting bookings.
- **External Meeting & Email Notifications**: Dispatches automated email confirmations to the candidate and recruiter (with assigned panel details).
- **Calendar Integration**: Downloadable `.ics` calendar files and direct Google Calendar creation.
- **Panel Management**: Dashboard to inspect panelist schedules and toggle out-of-office overrides.
- **Role-Based URL Separation**: Candidates only see the booking interface, while internal staff have dedicated routes.

---

## Role-Based URL Routing

The platform isolates views based on URL routes:

| Role | URL Route | Description |
| :--- | :--- | :--- |
| **Candidate** | `/book` or `/` | Public booking portal. Internal panelist and admin tabs are completely hidden. |
| **Panelist** | `/panelists` | Internal portal to inspect weekly schedules and toggle Out of Office status. |
| **Recruiter / Admin** | `/admin` | Dashboard to manage interviews, inspect assigned panels, and copy shareable links. |

> Compatible with direct paths, hash routes (`/#/admin`, `/#/panelists`, `/#/book`), and query parameters (`?role=candidate`, `?role=admin`).

---

## Tech Stack

- **Framework**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS (Light Theme)
- **Icons**: Lucide React
- **Synchronization**: `BroadcastChannel` API & Web Storage

---

## Getting Started

### Installation

```bash
git clone https://github.com/your-username/Interview-Appointment.git
cd Interview-Appointment
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## License

MIT
