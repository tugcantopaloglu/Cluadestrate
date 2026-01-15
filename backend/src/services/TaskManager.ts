import { EventEmitter } from "events";
import { Storage, generateId } from "./Storage";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskBoard,
  TaskStatus,
} from "../types/task";

export class TaskManager extends EventEmitter {
  private storage: Storage<Task>;

  constructor() {
    super();
    this.storage = new Storage<Task>("tasks");
  }

  list(): Task[] {
    return this.storage.getAll().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  get(id: string): Task | undefined {
    return this.storage.getById(id);
  }

  getBoard(): TaskBoard {
    const tasks = this.list();
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      review: tasks.filter((t) => t.status === "review"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }

  create(input: CreateTaskInput, createdBy: string = "user"): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId(),
      title: input.title,
      description: input.description,
      status: "todo",
      priority: input.priority,
      tags: input.tags || [],
      dueDate: input.dueDate,
      assignedSessionId: input.assignedSessionId,
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    this.storage.create(task);
    this.emit("task:created", task);
    return task;
  }

  update(id: string, updates: UpdateTaskInput): Task | undefined {
    const task = this.storage.getById(id);
    if (!task) return undefined;

    const now = new Date().toISOString();
    const updateData: Partial<Task> = {
      ...updates,
      updatedAt: now,
    };

    // Track completion
    if (updates.status === "done" && task.status !== "done") {
      updateData.completedAt = now;
    } else if (updates.status && updates.status !== "done") {
      updateData.completedAt = undefined;
    }

    const updated = this.storage.update(id, updateData);
    if (updated) {
      this.emit("task:updated", updated);

      // Emit status change event
      if (updates.status && updates.status !== task.status) {
        this.emit("task:status-changed", {
          task: updated,
          from: task.status,
          to: updates.status,
        });
      }
    }
    return updated;
  }

  delete(id: string): boolean {
    const deleted = this.storage.delete(id);
    if (deleted) {
      this.emit("task:deleted", { id });
    }
    return deleted;
  }

  moveToStatus(id: string, status: TaskStatus): Task | undefined {
    return this.update(id, { status });
  }

  assignToSession(id: string, sessionId: string | null): Task | undefined {
    return this.update(id, { assignedSessionId: sessionId ?? undefined });
  }

  getBySession(sessionId: string): Task[] {
    return this.storage.find((task) => task.assignedSessionId === sessionId);
  }

  getByStatus(status: TaskStatus): Task[] {
    return this.storage.find((task) => task.status === status);
  }

  getByPriority(priority: Task["priority"]): Task[] {
    return this.storage.find((task) => task.priority === priority);
  }

  getOverdue(): Task[] {
    const now = new Date();
    return this.storage.find((task) => {
      if (!task.dueDate || task.status === "done") return false;
      return new Date(task.dueDate) < now;
    });
  }

  getStats(): {
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<string, number>;
    overdue: number;
    completedToday: number;
  } {
    const tasks = this.storage.getAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byStatus: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    const byPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let overdue = 0;
    let completedToday = 0;

    for (const task of tasks) {
      byStatus[task.status]++;
      byPriority[task.priority]++;

      if (task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date()) {
        overdue++;
      }

      if (task.completedAt && new Date(task.completedAt) >= today) {
        completedToday++;
      }
    }

    return {
      total: tasks.length,
      byStatus,
      byPriority,
      overdue,
      completedToday,
    };
  }
}
