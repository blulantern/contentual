import { WeeklyPlan } from '@/types/plans';
import { createEvents, EventAttributes } from 'ics';

export class CalendarService {
  async exportWeeklyPlan(plan: WeeklyPlan): Promise<string> {
    const events: EventAttributes[] = [];

    plan.days.forEach((day) => {
      day.tasks.forEach((task) => {
        const [hours, minutes] = task.time.split(':').map(Number);
        const startDate = new Date(day.date);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + task.duration);

        events.push({
          start: [
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate(),
            startDate.getHours(),
            startDate.getMinutes(),
          ],
          end: [
            endDate.getFullYear(),
            endDate.getMonth() + 1,
            endDate.getDate(),
            endDate.getHours(),
            endDate.getMinutes(),
          ],
          title: task.title,
          description: task.description + (task.notes ? `\n\nNotes: ${task.notes}` : ''),
          location: task.platform ? `Platform: ${task.platform}` : '',
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
        });
      });
    });

    const { error, value } = createEvents(events);

    if (error) {
      throw new Error(`Failed to create calendar: ${error}`);
    }

    return value || '';
  }

  downloadCalendar(icsContent: string, filename: string): void {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
