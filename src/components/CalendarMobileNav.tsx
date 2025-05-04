
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Menu, ListTodo, Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type CalendarMobileNavProps = {
  onCreateEvent: () => void;
  onCreateTask: () => void;
  onOpenSidebar: () => void;
};

const CalendarMobileNav: React.FC<CalendarMobileNavProps> = ({
  onCreateEvent,
  onCreateTask,
  onOpenSidebar,
}) => {
  const [open, setOpen] = useState(false);

  const handleEventClick = () => {
    setOpen(false);
    onCreateEvent();
  };

  const handleTaskClick = () => {
    setOpen(false);
    onCreateTask();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 md:hidden z-40">
      <div className="flex items-center justify-around">
        <Button variant="ghost" size="icon" onClick={onOpenSidebar}>
          <Menu className="h-6 w-6" />
        </Button>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="rounded-full h-12 w-12 shadow-lg"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 mb-16" align="center">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={handleEventClick}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Event
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={handleTaskClick}
              >
                <ListTodo className="mr-2 h-4 w-4" />
                Task
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button variant="ghost" size="icon">
          <Calendar className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default CalendarMobileNav;
