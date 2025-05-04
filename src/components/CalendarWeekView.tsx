import React, { useState, useEffect } from "react";
import { format, isSameDay, isWeekend, getHours, getMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { Event, hours, formatHour } from "@/lib/calendar-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

type CalendarWeekViewProps = {
  currentDate: Date;
  weekDays: Date[];
  events: Event[];
  onDayClick: (date: Date) => void;
  onDayDoubleClick: (date: Date) => void;
  onTimeClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
};

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  currentDate,
  weekDays,
  events,
  onDayClick,
  onDayDoubleClick,
  onTimeClick,
  onEventClick,
}) => {
  // State for current time position
  const [nowPosition, setNowPosition] = useState<number>(0);

  // Update time position
  useEffect(() => {
    const updateNowPosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const position = (hours * 60 + minutes) / (24 * 60) * 100;
      setNowPosition(position);
    };
    
    updateNowPosition();
    
    // Update every minute
    const interval = setInterval(updateNowPosition, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.start, day));
  };

  // Determine if current time line should be shown
  const showNowIndicator = weekDays.some(day => isSameDay(day, new Date()));

  const handleTimeClick = (day: Date, hour: number) => {
    if (onTimeClick) {
      const timeSlotDate = new Date(day);
      timeSlotDate.setHours(hour, 0, 0, 0);
      onTimeClick(timeSlotDate);
    }
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering cell click
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const renderEventTooltip = (event: Event) => {
    return (
      <div className="max-w-xs">
        <div className="font-semibold">{event.title}</div>
        <div className="text-xs mt-1">
          {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
        </div>
        {event.location && (
          <div className="text-xs mt-1">📍 {event.location}</div>
        )}
        {event.description && (
          <div className="text-xs mt-1">
            <strong>Description:</strong> {event.description}
          </div>
        )}
        {event.notes && (
          <div className="text-xs mt-1">
            <strong>Notes:</strong> {event.notes}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="calendar-grid min-w-[800px] relative">
        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-sm border-b border-border">
          <div className="h-10"></div>
        </div>

        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toString()}
              className={cn(
                "sticky top-0 z-30 text-center p-2 border-b border-border bg-background/90 backdrop-blur-sm",
                isWeekend(day) && "bg-calendar-weekend",
                isToday && "text-calendar-today font-medium"
              )}
              onClick={() => onDayClick(day)}
              onDoubleClick={() => onDayDoubleClick(day)}
            >
              <div>{format(day, "EEE")}</div>
              <div className={cn(
                "text-lg",
                isToday && "h-8 w-8 rounded-full bg-calendar-today text-white mx-auto flex items-center justify-center"
              )}>
                {format(day, "d")}
              </div>
            </div>
          );
        })}

        {hours.map((hour) => (
          <React.Fragment key={`hour-${hour}`}>
            <div className="calendar-hour-cell">{formatHour(hour)}</div>
            {weekDays.map((day) => {
              const timeSlotDate = new Date(day);
              timeSlotDate.setHours(hour, 0, 0, 0);
              
              const dayEvents = getEventsForDay(day);
              
              return (
                <div 
                  key={`${day.toString()}-${hour}`} 
                  className={cn(
                    "calendar-cell relative cursor-pointer",
                    isWeekend(day) && "bg-calendar-weekend/50"
                  )}
                  onClick={() => handleTimeClick(day, hour)}
                  onDoubleClick={() => onDayDoubleClick(timeSlotDate)}
                >
                  {dayEvents.map((event) => {
                    const eventHour = getHours(event.start);
                    const eventMinutes = getMinutes(event.start);
                    
                    if (eventHour === hour) {
                      const topOffset = (eventMinutes / 60) * 100;
                      
                      const endHour = getHours(event.end);
                      const endMinutes = getMinutes(event.end);
                      
                      let heightPercentage;
                      if (endHour === eventHour) {
                        heightPercentage = ((endMinutes - eventMinutes) / 60) * 100;
                      } else {
                        const hoursSpan = endHour - eventHour;
                        const totalMinutes = (hoursSpan * 60) - eventMinutes + endMinutes;
                        heightPercentage = (totalMinutes / 60) * 100;
                      }
                      
                      heightPercentage = Math.max(heightPercentage, 10);
                      
                      return (
                        <TooltipProvider key={event.id}>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute rounded-md p-1 text-sm overflow-hidden text-calendar-event-foreground cursor-pointer",
                                  `bg-calendar-event-${event.color.split('-').pop()}`
                                )}
                                style={{
                                  top: `${topOffset}%`,
                                  height: `${heightPercentage}%`,
                                  left: '2%',
                                  width: '96%',
                                  zIndex: 5
                                }}
                                onClick={(e) => handleEventClick(event, e)}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                {event.description && heightPercentage > 20 && (
                                  <div className="text-xs opacity-90 truncate">{event.description}</div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-popover border z-50">
                              {renderEventTooltip(event)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }
                    return null;
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}

        {showNowIndicator && (
          <div 
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ 
              top: `calc(41px + (${nowPosition}% * (100% - 41px) / 100))`,
              gridColumn: '1 / -1'
            }}
          >
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <div className="h-[2px] flex-grow bg-blue-500"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarWeekView;
