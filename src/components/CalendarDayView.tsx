
import React, { useState, useEffect } from "react";
import { format, isSameDay, getHours, getMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { Event, hours, formatHour } from "@/lib/calendar-utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

type CalendarDayViewProps = {
  currentDate: Date;
  events: Event[];
  onTimeDoubleClick?: (date: Date) => void;
  onTimeClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
};

const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  currentDate,
  events,
  onTimeDoubleClick,
  onTimeClick,
  onEventClick,
}) => {
  // Filter events for the current day
  const dayEvents = events.filter((event) => isSameDay(event.start, currentDate));
  
  // State for current time position
  const [nowPosition, setNowPosition] = useState<number>(0);
  
  // Determine if current time line should be shown
  const showNowIndicator = isSameDay(currentDate, new Date());
  
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

  const handleDoubleClick = (hour: number) => {
    if (onTimeDoubleClick) {
      const timeSlotDate = new Date(currentDate);
      timeSlotDate.setHours(hour, 0, 0, 0);
      onTimeDoubleClick(timeSlotDate);
    }
  };

  const handleClick = (hour: number) => {
    if (onTimeClick) {
      const timeSlotDate = new Date(currentDate);
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
      <div className="calendar-grid-day min-h-full">
        <div className="flex flex-col">
          <div className="sticky top-0 z-30 h-20 bg-background/90 backdrop-blur-sm border-b border-border"></div>
          {hours.map((hour) => (
            <div key={hour} className="calendar-hour-cell h-16">{formatHour(hour)}</div>
          ))}
        </div>

        <div className="calendar-day-content relative">
          <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-sm border-b border-border p-2 h-20 flex flex-col justify-center">
            <h2 className="text-xl font-semibold">{format(currentDate, "EEEE")}</h2>
            <p className="text-muted-foreground">{format(currentDate, "MMMM d, yyyy")}</p>
          </div>

          {hours.map((hour) => (
            <div 
              key={hour} 
              className="h-16 border-b border-border relative cursor-pointer"
              onClick={() => handleClick(hour)}
              onDoubleClick={() => handleDoubleClick(hour)}
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
                              "absolute rounded-md p-2 overflow-hidden text-calendar-event-foreground cursor-pointer",
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
          ))}

          {showNowIndicator && (
            <div 
              className="absolute left-0 right-0 z-10 pointer-events-none" 
              style={{ 
                top: `calc(80px + (${nowPosition}% * (100% - 80px) / 100))` 
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
    </div>
  );
};

export default CalendarDayView;
