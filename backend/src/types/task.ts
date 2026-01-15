export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedSessionId?: string;
  workflowId?: string; // Optional linked workflow
  tags: string[];
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  tags?: string[];
  dueDate?: string;
  assignedSessionId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedSessionId?: string | null;
  tags?: string[];
  dueDate?: string | null;
}

export interface TaskBoard {
  todo: Task[];
  in_progress: Task[];
  review: Task[];
  done: Task[];
}
