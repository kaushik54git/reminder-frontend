import React, { useState, useEffect, useCallback } from "react";
import { CalendarView, getCalendarDays, Event } from "@/lib/calendar-utils";
import CalendarHeader from "./CalendarHeader";
import CalendarSidebar from "./CalendarSidebar";
import CalendarMonthView from "./CalendarMonthView";
import CalendarWeekView from "./CalendarWeekView";
import CalendarDayView from "./CalendarDayView";
import CalendarEventDialog from "./CalendarEventDialog";
import TaskDialog from "./TaskDialog";
import CalendarMobileNav from "./CalendarMobileNav";
import CreateEventTaskDialog from "./CreateEventTaskDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { startOfToday, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import io from 'socket.io-client'; // Import socket.io-client

// Function to save last focused date to local storage
const saveLastFocusedDate = (date: Date) => {
  localStorage.setItem('calendarLastFocusedDate', date.toISOString());
};

// Function to get last focused date from local storage
const getLastFocusedDate = (): Date | null => {
  const savedDate = localStorage.getItem('calendarLastFocusedDate');
  if (savedDate) {
    try {
      return parseISO(savedDate);
    } catch (e) {
      console.error('Error parsing saved date:', e);
      return null;
    }
  }
  return null;
};

// Function to save view type to local storage
const saveViewType = (view: CalendarView) => {
  localStorage.setItem('calendarViewType', view);
};

// Function to get view type from local storage
const getViewType = (): CalendarView | null => {
  const savedView = localStorage.getItem('calendarViewType') as CalendarView | null;
  if (savedView && ['day', 'week', 'month'].includes(savedView)) {
    return savedView;
  }
  return null;
};

const CalendarApp: React.FC = () => {
  // Check for saved date on initial load, or use today
  const initialDate = getLastFocusedDate() || startOfToday();
  const [date, setDate] = useState<Date>(initialDate);
  const [view, setView] = useState<CalendarView>(getViewType() || "week");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<any | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isAiViewActive, setIsAiViewActive] = useState(false);

  const isMobile = useIsMobile();
  const { toast } = useToast();

  // --- Socket.IO Connection and Notifications ---
  useEffect(() => {
    // Request notification permission on component mount
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
        } else {
          console.warn("Notification permission denied.");
        }
      });
    }

    const socket = io('http://localhost:5000'); // Connect to your Flask backend URL

    socket.on('connect', () => {
      console.log('Socket.IO connected');
      // Join a room based on user ID
      console.log('Attempting to fetch user for socket room joining...');
      api.getUser().then(user => {
        console.log('User fetched:', user);
        if (user && user.id) {
          const roomName = `user_${user.id}`;
          socket.emit('join', { room: roomName });
          console.log(`Emitted 'join' event for room: ${roomName}`);
        } else {
          console.warn('User or user ID not available for socket room joining.');
        }
      }).catch(error => {
        console.error("Error fetching user for socket connection:", error);
      });
    });

    socket.on('notification', (data) => {
      console.log('Notification received:', data);
      // Display a browser notification if permission is granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(
          data.type === 'event' ? `Event Reminder: ${data.title}` : `Task Reminder: ${data.title}`,
          {
            body: data.description || data.note || 'No details provided.',
            // You can add an icon here if you have one
            // icon: '/path/to/icon.png'
          }
        );
      } else {
        // Fallback to toast notification if permission is not granted
        toast({
          title: data.type === 'event' ? `Event Reminder: ${data.title}` : `Task Reminder: ${data.title}`,
          description: data.description || data.note || 'No details provided.',
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, [toast]); // Add toast as a dependency


  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch events
      const eventsResponse = await fetch('/api/events', { credentials: 'include' });
      if (!eventsResponse.ok) {
        throw new Error(`Failed to fetch events: ${eventsResponse.statusText}`);
      }
      const backendEvents = await eventsResponse.json();

      // Fetch tasks
      const tasksResponse = await fetch('/api/tasks', { credentials: 'include' });
      if (!tasksResponse.ok) {
        throw new Error(`Failed to fetch tasks: ${tasksResponse.statusText}`);
      }
      const backendTasks = await tasksResponse.json();

      // Transform and combine data
      const transformedEvents: Event[] = backendEvents.map((event: any) => ({
        id: String(event.id),
        title: event.title,
        description: event.description,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        color: event.color || 'blue',
        type: 'event',
        reminder: event.reminder,
      }));

      const transformedTasks: Event[] = backendTasks.map((task: any) => ({
        id: String(task.id),
        title: task.title,
        description: task.description,
        start: task.due_date ? new Date(task.due_date) : new Date(),
        end: task.due_date ? new Date(task.due_date) : new Date(),
        color: task.color || 'green',
        type: 'task',
      }));

      setEvents([...transformedEvents, ...transformedTasks]);

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error fetching data",
        description: err.message,
        variant: "destructive",
      });
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleToggleAiView = () => {
    setIsAiViewActive(!isAiViewActive);
  };

  const handleCreateEvent = () => {
    if (isMobile && sidebarVisible) {
      setSidebarVisible(false);
    }
    setCreateDialogOpen(false);
    setSelectedEvent(undefined);
    setSelectedTask(undefined);
    setEventDialogOpen(true);
  };

  const handleCreateTask = () => {
    if (isMobile && sidebarVisible) {
      setSidebarVisible(false);
    }
    setCreateDialogOpen(false);
    setSelectedTask(undefined);
    setSelectedEvent(undefined);
    setTaskDialogOpen(true);
  };

  const handleSaveEvent = async (eventData: Partial<Event>) => {
    try {
      if (selectedEvent) {
        // Update existing event
        const updatedEvent = await api.updateEvent(selectedEvent.id, eventData);

        // Update local state
        const updatedEvents = events.map((event) =>
          event.id === selectedEvent.id ? {
            ...event,
            ...eventData,
            start: new Date(updatedEvent.start_time),
            end: new Date(updatedEvent.end_time),
            reminder: updatedEvent.reminder
          } : event
        );
        setEvents(updatedEvents);
        
        // Focus on event date and set appropriate view
        const eventDate = new Date(updatedEvent.start_time);
        setDate(eventDate);
        setView("day");
        saveViewType("day");
        saveLastFocusedDate(eventDate);
        
        toast({
          title: "Event updated",
          description: `${eventData.title} has been updated.`,
        });
      } else {
        // Create new event
        const newEventData = eventData as Omit<Event, 'id'>;
        const createdEvent = await api.createEvent(newEventData);
        
        // Add to local state with server-generated ID and proper dates/reminder
        const newEvent = {
          ...eventData,
          id: String(createdEvent.id),
          start: new Date(createdEvent.start_time),
          end: new Date(createdEvent.end_time),
          reminder: createdEvent.reminder,
          type: 'event'
        } as Event;
        
        setEvents([...events, newEvent]);
        
        // Focus on new event date and set appropriate view
        const eventDate = new Date(createdEvent.start_time);
        setDate(eventDate);
        setView("day");
        saveViewType("day");
        saveLastFocusedDate(eventDate);
        
        toast({
          title: "Event created",
          description: `${newEvent.title} has been added to your calendar.`,
        });
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      if (selectedTask) {
        // Update existing task
        const updatedTask = await api.updateTask(selectedTask.id, taskData);

        // Update local state
        const updatedEvents = events.map((event) =>
          event.id === selectedTask.id ? {
            ...event,
            ...taskData,
            start: updatedTask.due_date ? new Date(updatedTask.due_date) : new Date(),
            end: updatedTask.due_date ? new Date(updatedTask.due_date) : new Date(),
          } : event
        );
        setEvents(updatedEvents);

        // Focus on task date
        if (updatedTask.due_date) {
          const taskDate = new Date(updatedTask.due_date);
          setDate(taskDate);
          setView("day");
          saveViewType("day");
          saveLastFocusedDate(taskDate);
        }

        toast({
          title: "Task updated",
          description: `${taskData.title} has been updated.`,
        });
      } else {
        // Create new task
        const newTaskData = {
          title: taskData.title,
          description: taskData.description,
          start: taskData.dueDate ? new Date(taskData.dueDate) : new Date(),
          end: taskData.dueDate ? new Date(taskData.dueDate) : new Date(),
          color: taskData.priority === 'high' ? 'red' :
                 taskData.priority === 'medium' ? 'orange' : 'green',
          type: 'task'
        } as Omit<Event, 'id'>;

        const createdTask = await api.createTask(newTaskData);

        // Add to local state with server-generated ID and proper dates
        const newTask = {
          ...taskData,
          id: String(createdTask.id),
          start: createdTask.due_date ? new Date(createdTask.due_date) : new Date(),
          end: createdTask.due_date ? new Date(createdTask.due_date) : new Date(),
          type: 'task'
        } as Event;

        setEvents([...events, newTask]);

        // Focus on new task date
        if (createdTask.due_date) {
          const taskDate = new Date(createdTask.due_date);
          setDate(taskDate);
          setView("day");
          saveViewType("day");
          saveLastFocusedDate(taskDate);
        }

        toast({
          title: "Task created",
          description: `${newTask.title} has been added to your tasks.`,
        });
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent) {
      try {
        await api.deleteEvent(selectedEvent.id);
        const updatedEvents = events.filter((event) => event.id !== selectedEvent.id);
        setEvents(updatedEvents);
        setEventDialogOpen(false);

        toast({
          title: "Event deleted",
          description: `${selectedEvent.title} has been removed from your calendar.`,
          variant: "destructive",
        });
      } catch (error) {
        console.error("Error deleting event:", error);
        toast({
          title: "Error",
          description: "Failed to delete event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteTask = async () => {
    if (selectedTask) {
      try {
        await api.deleteTask(selectedTask.id);
        const updatedEvents = events.filter((event) => event.id !== selectedTask.id);
        setEvents(updatedEvents);
        setTaskDialogOpen(false);

        toast({
          title: "Task deleted",
          description: `${selectedTask.title} has been removed from your tasks.`,
          variant: "destructive",
        });
      } catch (error) {
        console.error("Error deleting task:", error);
        toast({
          title: "Error",
          description: "Failed to delete task. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isMobile) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
  }, [isMobile]);

  const days = getCalendarDays(date, view);

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
    saveViewType(newView);
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handleTodayClick = () => {
    setDate(startOfToday());
  };

  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleDayClick = (clickedDate: Date) => {
    setSelectedDate(clickedDate);
    setSelectedEvent(undefined);
    setSelectedTask(undefined);
    setCreateDialogOpen(true);
  };

  const handleTimeClick = (clickedDate: Date) => {
    setSelectedDate(clickedDate);
    setSelectedEvent(undefined);
    setSelectedTask(undefined);
    setEventDialogOpen(true);
  };

  const handleDayDoubleClick = (clickedDate: Date) => {
    setSelectedDate(clickedDate);
    setSelectedEvent(undefined);
    setSelectedTask(undefined);
    setCreateDialogOpen(true);
  };

  const handleEventClick = (event: Event) => {
    const isTask = event.type === "task";
    if (isTask) {
      setSelectedTask(event);
      setSelectedEvent(undefined);
      setSelectedDate(undefined);
      setTaskDialogOpen(true);
    } else {
      setSelectedEvent(event);
      setSelectedTask(undefined);
      setSelectedDate(undefined);
      setEventDialogOpen(true);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarVisible && (
        <div className={`${isMobile ? "fixed inset-0 z-50 animate-slide-in-right" : "animate-fade-in"}`}>
          <div className="h-full flex flex-col bg-sidebar">
            <div className="flex justify-end p-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSidebar}
                className="ml-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                <span className="sr-only">Close sidebar</span>
              </Button>
            </div>
            <CalendarSidebar
              date={date}
              onDateChange={handleDateChange}
              onCreateEvent={handleCreateEvent}
              onCreateTask={handleCreateTask}
              isAiViewActive={isAiViewActive}
              events={events}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <CalendarHeader
          date={date}
          view={view}
          onViewChange={handleViewChange}
          onDateChange={handleDateChange}
          onToday={handleTodayClick}
          onToggleSidebar={handleToggleSidebar}
          sidebarVisible={sidebarVisible}
          isAiViewActive={isAiViewActive}
          onToggleAiView={handleToggleAiView}
        />

        <main className="flex-1 overflow-hidden">
          {view === "month" && (
            <CalendarMonthView
              currentDate={date}
              monthDays={days}
              events={events}
              onDayClick={handleDayClick}
              onDayDoubleClick={handleDayDoubleClick}
            />
          )}

          {view === "week" && (
            <CalendarWeekView
              currentDate={date}
              weekDays={days}
              events={events}
              onDayClick={handleDayClick}
              onDayDoubleClick={handleDayDoubleClick}
              onTimeClick={handleTimeClick}
              onEventClick={handleEventClick}
            />
          )}

          {view === "day" && (
            <CalendarDayView
              currentDate={date}
              events={events}
              onTimeDoubleClick={handleDayDoubleClick}
              onTimeClick={handleTimeClick}
              onEventClick={handleEventClick}
            />
          )}
        </main>

        {isMobile && (
          <CalendarMobileNav
            onCreateEvent={handleCreateEvent}
            onCreateTask={handleCreateTask}
            onOpenSidebar={handleToggleSidebar}
          />
        )}

        <CalendarEventDialog
          isOpen={eventDialogOpen}
          onClose={() => setEventDialogOpen(false)}
          event={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          date={selectedDate}
        />

        <TaskDialog
          isOpen={taskDialogOpen}
          onClose={() => setTaskDialogOpen(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          task={selectedTask}
          date={selectedDate}
        />

        <CreateEventTaskDialog
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onCreateEvent={handleCreateEvent}
          onCreateTask={handleCreateTask}
        />
      </div>
    </div>
  );
};

export default CalendarApp;
