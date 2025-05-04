
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ListTodo } from "lucide-react";

type TaskDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
  onDelete?: () => void;
  task?: any;
  date?: Date;
};

const TaskDialog: React.FC<TaskDialogProps> = ({ 
  isOpen, 
  onClose,
  onSave,
  onDelete,
  task,
  date
}) => {
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    notes: "",
    dueDate: "",
    priority: "medium",
    type: "task"
  });

  const isNewTask = !task;

  useEffect(() => {
    if (task) {
      setFormData({
        id: task.id,
        title: task.title || "",
        description: task.description || "",
        notes: task.notes || "",
        dueDate: task.dueDate || "",
        priority: task.priority || "medium",
        type: "task"
      });
    } else {
      // Reset form for new task
      setFormData({
        id: Math.random().toString(36).substr(2, 9),
        title: "",
        description: "",
        notes: "",
        dueDate: date ? new Date(date).toISOString().split('T')[0] : "",
        priority: "medium",
        type: "task"
      });
    }
  }, [task, date, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            {isNewTask ? "Create Task" : "Edit Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                name="title" 
                value={formData.title}
                onChange={handleChange}
                placeholder="Task title" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Task description"
                className="resize-none"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <div className="flex">
                <FileText className="mr-2 h-4 w-4 opacity-50 mt-2" />
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes"
                  className="flex-grow resize-none"
                  rows={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate" 
                  name="dueDate" 
                  type="date" 
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <select 
                  id="priority" 
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {!isNewTask && onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            )}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Task</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
