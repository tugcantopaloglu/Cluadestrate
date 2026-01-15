import { Hono } from "hono";
import { TaskManager } from "../services/TaskManager";
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from "../types/task";

export function createTaskRoutes(taskManager: TaskManager) {
  const app = new Hono();

  // List all tasks
  app.get("/", (c) => {
    const tasks = taskManager.list();
    return c.json(tasks);
  });

  // Get task board (kanban view)
  app.get("/board", (c) => {
    const board = taskManager.getBoard();
    return c.json(board);
  });

  // Get task stats
  app.get("/stats", (c) => {
    const stats = taskManager.getStats();
    return c.json(stats);
  });

  // Get overdue tasks
  app.get("/overdue", (c) => {
    const tasks = taskManager.getOverdue();
    return c.json(tasks);
  });

  // Get tasks by status
  app.get("/status/:status", (c) => {
    const { status } = c.req.param();
    const tasks = taskManager.getByStatus(status as TaskStatus);
    return c.json(tasks);
  });

  // Get tasks by session
  app.get("/session/:sessionId", (c) => {
    const { sessionId } = c.req.param();
    const tasks = taskManager.getBySession(sessionId);
    return c.json(tasks);
  });

  // Get a specific task
  app.get("/:id", (c) => {
    const { id } = c.req.param();
    const task = taskManager.get(id);
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json(task);
  });

  // Create a task
  app.post("/", async (c) => {
    try {
      const body = await c.req.json<CreateTaskInput>();
      const task = taskManager.create(body);
      return c.json(task, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create task" }, 400);
    }
  });

  // Update a task
  app.patch("/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const body = await c.req.json<UpdateTaskInput>();
      const task = taskManager.update(id, body);
      if (!task) {
        return c.json({ error: "Task not found" }, 404);
      }
      return c.json(task);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update task" }, 400);
    }
  });

  // Delete a task
  app.delete("/:id", (c) => {
    const { id } = c.req.param();
    const deleted = taskManager.delete(id);
    if (!deleted) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Move task to status (for drag-and-drop)
  app.post("/:id/move/:status", (c) => {
    const { id, status } = c.req.param();
    const task = taskManager.moveToStatus(id, status as TaskStatus);
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json(task);
  });

  // Assign task to session
  app.post("/:id/assign/:sessionId", (c) => {
    const { id, sessionId } = c.req.param();
    const task = taskManager.assignToSession(id, sessionId);
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json(task);
  });

  // Unassign task
  app.post("/:id/unassign", (c) => {
    const { id } = c.req.param();
    const task = taskManager.assignToSession(id, null);
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json(task);
  });

  return app;
}
