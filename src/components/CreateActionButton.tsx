
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, ListTodo } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type CreateActionButtonProps = {
  onCreateEvent: () => void;
  onCreateTask: () => void;
};

const CreateActionButton: React.FC<CreateActionButtonProps> = ({
  onCreateEvent,
  onCreateTask,
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="w-full justify-start mb-6">
          <Plus className="mr-2 h-4 w-4" />
          Create
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
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
  );
};

export default CreateActionButton;
