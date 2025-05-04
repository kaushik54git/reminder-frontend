import { Event } from './calendar-utils';

// Use relative URL for API calls
const API_BASE_URL = '/api';

export const api = {
  // Events
  async getEvents() {
    const response = await fetch(`${API_BASE_URL}/events`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    return response.json();
  },

  async createEvent(event: Omit<Event, 'id'>) {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        title: event.title,
        start_time: event.start.toISOString(),
         end_time: event.end.toISOString(),
         description: event.description,
         color: event.color,
         reminder: event.reminder, // Send reminder
       }),
     });
    if (!response.ok) {
      throw new Error('Failed to create event');
    }
    return response.json();
  },

  async updateEvent(id: string, event: Partial<Event>) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        title: event.title,
        start_time: event.start?.toISOString(),
         end_time: event.end?.toISOString(),
         description: event.description,
         color: event.color,
         reminder: event.reminder, // Send reminder
       }),
     });
    if (!response.ok) {
      throw new Error('Failed to update event');
    }
    return response.json();
  },

  async deleteEvent(id: string) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to delete event');
    }
    return response.json();
  },

  // Tasks
  async getTasks() {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return response.json();
  },

  async createTask(task: Omit<Event, 'id'>) {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        title: task.title,
        due_date: task.start.toISOString(),
        description: task.description,
        color: task.color,
        is_completed: false,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json();
  },

  async updateTask(id: string, task: Partial<Event>) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        title: task.title,
        due_date: task.start?.toISOString(),
        description: task.description,
        color: task.color,
        is_completed: task.type === 'task',
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    return response.json();
  },

  async deleteTask(id: string) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
    return response.json();
  },

  // User
  async getUser() {
    const response = await fetch(`${API_BASE_URL}/user`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },
};
