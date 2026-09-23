import React from 'react';
import { useInterview } from '../../context/InterviewContext';
import { Calendar as CalendarIcon } from 'lucide-react';

export const CalendarBar: React.FC = () => {
  const { availableDates, selectedDate, setSelectedDate } = useInterview();

  return (
    <div className="calendar-bar-wrapper">
      <div className="calendar-header">
        <div className="calendar-title">
          <CalendarIcon size={18} color="var(--primary)" />
          <span>Select Date</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing next 2 weeks (business days)
        </div>
      </div>

      <div className="date-chips-scroll">
        {availableDates.map((item) => {
          const isActive = item.dateStr === selectedDate;
          return (
            <button
              key={item.dateStr}
              type="button"
              className={`date-chip ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedDate(item.dateStr)}
            >
              <div className="day-name">{item.dayName}</div>
              <div className="day-num">{item.dayNumber}</div>
              <div className="month-name">{item.monthName}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
