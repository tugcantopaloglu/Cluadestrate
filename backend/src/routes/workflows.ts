import { Hono } from "hono";
import { WorkflowManager } from "../services/WorkflowManager";
import type { CreateWorkflowInput } from "../types/workflow";

export function createWorkflowRoutes(workflowManager: WorkflowManager) {
  const app = new Hono();

  // List all workflows
  app.get("/", (c) => {
    const workflows = workflowManager.list();
    return c.json(workflows);
  });

  // Get workflow stats
  app.get("/stats", (c) => {
    const stats = workflowManager.getStats();
    return c.json(stats);
  });

  // Get a specific workflow
  app.get("/:id", (c) => {
    const { id } = c.req.param();
    const workflow = workflowManager.get(id);
    if (!workflow) {
      return c.json({ error: "Workflow not found" }, 404);
    }
    return c.json(workflow);
  });

  // Create a workflow
  app.post("/", async (c) => {
    try {
      const body = await c.req.json<CreateWorkflowInput>();
      const workflow = workflowManager.create(body);
      return c.json(workflow, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create workflow" }, 400);
    }
  });

  // Update a workflow
  app.patch("/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const body = await c.req.json();
      const workflow = workflowManager.update(id, body);
      if (!workflow) {
        return c.json({ error: "Workflow not found" }, 404);
      }
      return c.json(workflow);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update workflow" }, 400);
    }
  });

  // Delete a workflow
  app.delete("/:id", (c) => {
    const { id } = c.req.param();
    const deleted = workflowManager.delete(id);
    if (!deleted) {
      return c.json({ error: "Workflow not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Run a workflow
  app.post("/:id/run", async (c) => {
    const { id } = c.req.param();
    try {
      const body = await c.req.json().catch(() => ({}));
      const result = await workflowManager.run(id, body.initialInput);
      return c.json(result);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to run workflow" }, 400);
    }
  });

  // Stop a workflow
  app.post("/:id/stop", (c) => {
    const { id } = c.req.param();
    const stopped = workflowManager.stop(id);
    if (!stopped) {
      return c.json({ error: "Workflow not running or not found" }, 400);
    }
    return c.json({ success: true });
  });

  return app;
}
