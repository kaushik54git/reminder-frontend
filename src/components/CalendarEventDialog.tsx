import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Event } from "@/lib/calendar-utils";

type CalendarEventDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  event?: Event;
  onSave: (event: Partial<Event>) => void;
  onDelete?: () => void;
  date?: Date;
};

const CalendarEventDialog: React.FC<CalendarEventDialogProps> = ({
  isOpen,
  onClose,
  event,
  onSave,
  onDelete,
  date,
}) => {
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [notes, setNotes] = useState(event?.notes || "");
  const [location, setLocation] = useState(event?.location || "");
  const [startDate, setStartDate] = useState<Date | undefined>(event?.start || date || new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(event?.end || date || new Date());
  const [color, setColor] = useState(event?.color || "blue");
  const [reminder, setReminder] = useState<number>(event?.reminder || 20);

  // Update the form when the event or date prop changes
  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setNotes(event.notes || "");
      setLocation(event.location || "");
      setStartDate(event.start);
      setEndDate(event.end);
      setColor(event.color || "blue");
      setReminder(event.reminder || 20);
    } else if (date) {
      setStartDate(date);
      // Set end date to 1 hour after start date
      const newEndDate = new Date(date);
      newEndDate.setHours(date.getHours() + 1);
      setEndDate(newEndDate);
      // Reset other fields for new event
      setTitle("");
      setDescription("");
      setNotes("");
      setLocation("");
      setColor("blue");
      setReminder(20);
    }
  }, [event, date, isOpen]);

  const isNewEvent = !event;

  const handleSave = () => {
    if (!startDate || !endDate) return;
    
    onSave({
      id: event?.id || Date.now().toString(),
      title,
      description,
      notes,
      location,
      start: startDate,
      end: endDate,
      color,
      reminder,
    });
    
    onClose();
  };

  const colorOptions = [
    { value: "blue", label: "Blue", bgClass: "bg-calendar-event-blue" },
    { value: "green", label: "Green", bgClass: "bg-calendar-event-green" },
    { value: "red", label: "Red", bgClass: "bg-calendar-event-red" },
    { value: "yellow", label: "Yellow", bgClass: "bg-calendar-event-yellow" },
    { value: "purple", label: "Purple", bgClass: "bg-calendar-event-purple" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isNewEvent ? "Add Event" : "Edit Event"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Event title"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Start</Label>
            <div className="col-span-3 flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "pl-3 text-left font-normal flex-grow",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <div className="relative w-32">
                <Input
                  type="time"
                  value={startDate ? format(startDate, "HH:mm") : ""}
                  onChange={(e) => {
                    if (startDate) {
                      const [hours, minutes] = e.target.value.split(":");
                      const newDate = new Date(startDate);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setStartDate(newDate);
                    }
                  }}
                  className="pl-8"
                />
                <Clock className="absolute left-2 top-2.5 h-4 w-4 opacity-50" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">End</Label>
            <div className="col-span-3 flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "pl-3 text-left font-normal flex-grow",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <div className="relative w-32">
                <Input
                  type="time"
                  value={endDate ? format(endDate, "HH:mm") : ""}
                  onChange={(e) => {
                    if (endDate) {
                      const [hours, minutes] = e.target.value.split(":");
                      const newDate = new Date(endDate);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setEndDate(newDate);
                    }
                  }}
                  className="pl-8"
                />
                <Clock className="absolute left-2 top-2.5 h-4 w-4 opacity-50" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <div className="col-span-3 flex">
              <MapPin className="mr-2 h-4 w-4 opacity-50 mt-2" />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Add description"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <div className="col-span-3 flex">
              <FileText className="mr-2 h-4 w-4 opacity-50 mt-2" />
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-grow"
                placeholder="Add additional notes"
                rows={2}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminder" className="text-right">
              Reminder
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="reminder"
                type="number"
                value={reminder}
                onChange={(e) => setReminder(Number(e.target.value))}
                className="w-24"
                min="0"
                max="1440"
              />
              <span className="text-sm text-muted-foreground">minutes before</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Color</Label>
            <div className="flex space-x-2 col-span-3">
              {colorOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "w-6 h-6 rounded-full cursor-pointer",
                    option.bgClass,
                    color === option.value && "ring-2 ring-ring ring-offset-2"
                  )}
                  onClick={() => setColor(option.value)}
                  title={option.label}
                ></div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {!isNewEvent && (
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEventDialog;
