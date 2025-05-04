
import React from "react";
import { format, isSameMonth, isSameDay, isWeekend } from "date-fns";
import { cn } from "@/lib/utils";
import { Event } from "@/lib/calendar-utils";

type CalendarMonthViewProps = {
  currentDate: Date;
  monthDays: Date[];
  events: Event[];
  onDayClick: (date: Date) => void;
  onDayDoubleClick: (date: Date) => void;
};

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  monthDays,
  events,
  onDayClick,
  onDayDoubleClick,
}) => {
  // Filter events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.start, day));
  };

  // Days of the week
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="h-full overflow-y-auto">
      <div className="calendar-grid-month">
        {/* Weekday headers */}
        {weekdays.map((weekday, index) => (
          <div
            key={weekday}
            className={cn(
              "py-2 text-center text-sm font-medium border-b border-border",
              isWeekend(new Date().setDate(index)) ? "text-calendar-weekday bg-calendar-weekend" : "text-calendar-weekday"
            )}
          >
            {weekday}
          </div>
        ))}

        {/* Calendar days */}
        {monthDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const dayEvents = getEventsForDay(day);

          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-28 border-b border-r border-border p-1",
                !isCurrentMonth && "text-muted-foreground bg-muted/20",
                isWeekend(day) && isCurrentMonth && "bg-calendar-weekend",
                "cursor-pointer transition-colors hover:bg-muted/30"
              )}
              onClick={() => onDayClick(day)}
              onDoubleClick={() => onDayDoubleClick(day)}
            >
              <div className="flex justify-end">
                <span
                  className={cn(
                    "flex items-center justify-center text-sm font-medium h-6 w-6 rounded-full",
                    isToday && "bg-calendar-today text-white"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="mt-1 space-y-1 max-h-24 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs p-1 rounded truncate text-white", 
                      `bg-calendar-event-${event.color.split('-').pop()}`
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground text-right pr-1">
                    + {dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthView;
