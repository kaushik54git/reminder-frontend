
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, ListTodo } from "lucide-react";

type CreateEventTaskDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: () => void;
  onCreateTask: () => void;
};

const CreateEventTaskDialog: React.FC<CreateEventTaskDialogProps> = ({
  isOpen,
  onClose,
  onCreateEvent,
  onCreateTask,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New</DialogTitle>
          <DialogDescription>
            Choose what you would like to create at this time.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 p-6 hover:bg-primary/10 transition-colors"
            onClick={() => {
              onClose();
              onCreateEvent();
            }}
          >
            <Calendar className="h-8 w-8 text-blue-500" />
            <span className="font-medium">Event</span>
            <span className="text-xs text-muted-foreground">Schedule a meeting or appointment</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 p-6 hover:bg-primary/10 transition-colors"
            onClick={() => {
              onClose();
              onCreateTask();
            }}
          >
            <ListTodo className="h-8 w-8 text-green-500" />
            <span className="font-medium">Task</span>
            <span className="text-xs text-muted-foreground">Create a to-do item</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventTaskDialog;
