import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import CreateActionButton from "./CreateActionButton";
import { Event } from "@/lib/calendar-utils";
import { format } from "date-fns";

type CalendarSidebarProps = {
  date: Date;
  onDateChange: (date: Date) => void;
  onCreateEvent: () => void;
  onCreateTask: () => void;
  isAiViewActive: boolean;
  events: Event[];
};

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  date,
  onDateChange,
  onCreateEvent,
  onCreateTask,
  isAiViewActive,
  events
}) => {
  const [myCalendarsExpanded, setMyCalendarsExpanded] = useState(true);
  const [otherCalendarsExpanded, setOtherCalendarsExpanded] = useState(false);

  const myCalendars = [
    { id: "1", name: "My Calendar", color: "#4285f4", checked: true },
    { id: "2", name: "Work", color: "#0f9d58", checked: true },
    { id: "3", name: "Personal", color: "#db4437", checked: true },
  ];

  const otherCalendars = [
    { id: "4", name: "Holidays", color: "#f4b400", checked: true },
    { id: "5", name: "Birthdays", color: "#a142f4", checked: false },
  ];

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex flex-col border-r border-border w-80 p-4 h-screen overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Calendar</h1>
      </div>

      <CreateActionButton onCreateEvent={onCreateEvent} onCreateTask={onCreateTask} />

      <div className="mb-6">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && onDateChange(date)}
          className="rounded-md border w-full"
        />
      </div>

      <div className="space-y-4">
        <div
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-sidebar-accent rounded-md"
          onClick={() => setMyCalendarsExpanded(!myCalendarsExpanded)}
        >
          <span className="font-medium">My calendars</span>
          {myCalendarsExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
        {myCalendarsExpanded && (
          <div className="mt-2 space-y-2 pl-4">
            {myCalendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center space-x-2">
                <div
                  className={cn(
                    "w-3 h-3 rounded-sm",
                    calendar.checked ? "" : "opacity-40"
                  )}
                  style={{ backgroundColor: calendar.color }}
                ></div>
                <span className={calendar.checked ? "" : "text-muted-foreground"}>
                  {calendar.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-sidebar-accent rounded-md"
          onClick={() => setOtherCalendarsExpanded(!otherCalendarsExpanded)}
        >
          <span className="font-medium">Other calendars</span>
          {otherCalendarsExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
        {otherCalendarsExpanded && (
          <div className="mt-2 space-y-2 pl-4">
            {otherCalendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center space-x-2">
                <div
                  className={cn(
                    "w-3 h-3 rounded-sm",
                    calendar.checked ? "" : "opacity-40"
                  )}
                  style={{ backgroundColor: calendar.color }}
                ></div>
                <span className={calendar.checked ? "" : "text-muted-foreground"}>
                  {calendar.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAiViewActive && (
        <div className="mt-4">
          <Separator className="my-2" />
          <h2 className="text-lg font-semibold mb-2">Events with Reminders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Event</th>
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Reminder</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b">
                    <td className="py-2">{event.title}</td>
                    <td className="py-2">{format(event.start, 'h:mm a')}</td>
                    <td className="py-2">{event.reminder || '20 minutes'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <Separator className="my-4" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            © 2025 Calendar Clone
          </span>
        </div>
      </div>
    </aside>
  );
};

export default CalendarSidebar;
