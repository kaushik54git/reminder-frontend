
import { addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, format, isSameDay, parseISO, sub, add } from "date-fns";

// Calendar view types
export type CalendarView = "day" | "week" | "month";

// Event type
export type Event = {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  location?: string;
  start: Date;
  end: Date;
  color: string;
  type?: string;
  reminder?: number; // Reminder time in minutes
};

// Function to get calendar title based on view and date
export const getCalendarTitle = (date: Date, view: CalendarView): string => {
  switch (view) {
    case "day":
      return format(date, "MMMM d, yyyy");
    case "week":
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, "MMMM d")} - ${format(weekEnd, "d, yyyy")}`;
      } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
        return `${format(weekStart, "MMMM d")} - ${format(weekEnd, "MMMM d, yyyy")}`;
      } else {
        return `${format(weekStart, "MMMM d, yyyy")} - ${format(weekEnd, "MMMM d, yyyy")}`;
      }
    case "month":
      return format(date, "MMMM yyyy");
    default:
      return "";
  }
};

// Function to generate days for the calendar based on view and date
export const getCalendarDays = (date: Date, view: CalendarView): Date[] => {
  switch (view) {
    case "day":
      return [date];
    case "week":
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    case "month":
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd);
      
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    default:
      return [];
  }
};

// Function to get the end of the week
const endOfWeek = (date: Date, options = { weekStartsOn: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6 }) => {
  const weekStart = startOfWeek(date, options);
  return addDays(weekStart, 6);
};

// Function to format hour
export const formatHour = (hour: number): string => {
  return format(new Date().setHours(hour, 0, 0, 0), 'h a');
};

// Hours for the calendar
export const hours = Array.from({ length: 24 }, (_, i) => i);

// Function to get event position for rendering
export const getEventPosition = (event: Event, dayStartHour: number = 0, dayEndHour: number = 24): { top: number, height: number } => {
  const eventStartHour = event.start.getHours() + (event.start.getMinutes() / 60);
  const eventEndHour = event.end.getHours() + (event.end.getMinutes() / 60);
  
  // Clamp to visible hours
  const visibleStartHour = Math.max(eventStartHour, dayStartHour);
  const visibleEndHour = Math.min(eventEndHour, dayEndHour);
  
  // Calculate position as percentage
  const dayDuration = dayEndHour - dayStartHour;
  const top = ((visibleStartHour - dayStartHour) / dayDuration) * 100;
  const height = ((visibleEndHour - visibleStartHour) / dayDuration) * 100;
  
  return { top, height: Math.max(height, 5) }; // Minimum height for visibility
};

// Mock events for testing
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly team sync',
    notes: 'Prepare project updates',
    location: 'Conference Room A',
    start: add(new Date(), { days: 0, hours: 2 }),
    end: add(new Date(), { days: 0, hours: 3 }),
    color: 'blue',
  },
  {
    id: '2',
    title: 'Product Demo',
    description: 'Showcase new features',
    notes: 'Focus on UI improvements',
    location: 'Client Office',
    start: add(new Date(), { days: 1, hours: -1 }),
    end: add(new Date(), { days: 1, hours: 1 }),
    color: 'green',
  },
  {
    id: '3',
    title: 'Lunch with Client',
    description: 'Discuss partnership',
    notes: 'Reserve table at Olive Garden',
    location: 'Downtown Restaurant',
    start: add(new Date(), { days: 2, hours: 0 }),
    end: add(new Date(), { days: 2, hours: 2 }),
    color: 'purple',
  },
  {
    id: '4',
    title: 'Training Session',
    description: 'New tool onboarding',
    location: 'Training Room',
    start: add(new Date(), { days: -1, hours: 3 }),
    end: add(new Date(), { days: -1, hours: 5 }),
    color: 'yellow',
  },
  {
    id: '5',
    title: 'Interview Candidate',
    description: 'Frontend Developer position',
    notes: 'Check portfolio beforehand',
    location: 'Meeting Room B',
    start: add(new Date(), { days: 3, hours: -2 }),
    end: add(new Date(), { days: 3, hours: -1 }),
    color: 'red',
  },
  {
    id: '6',
    title: 'Project Review',
    description: 'Q2 Project Milestones',
    notes: 'Prepare slides and demos',
    start: add(new Date(), { days: -2, hours: 4 }),
    end: add(new Date(), { days: -2, hours: 5, minutes: 30 }),
    color: 'blue',
  },
  {
    id: '7',
    title: 'Dentist Appointment',
    location: 'Dental Clinic',
    start: add(new Date(), { days: 4, hours: 2 }),
    end: add(new Date(), { days: 4, hours: 3, minutes: 30 }),
    color: 'red',
    type: 'task',
  },
  {
    id: '8',
    title: 'Submit Report',
    description: 'Monthly progress report',
    notes: 'Include all team metrics',
    start: add(new Date(), { days: 0, hours: -3 }),
    end: add(new Date(), { days: 0, hours: -2 }),
    color: 'green',
    type: 'task',
  }
];
