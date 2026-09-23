export function getUpcomingWeekdays(count = 14) {
  const dates = [];
  const curr = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  while (dates.length < count) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      dates.push({
        dateStr,
        dayName: days[dayOfWeek],
        dayNumber: curr.getDate(),
        monthName: months[curr.getMonth()],
        isToday: dates.length === 0
      });
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}
