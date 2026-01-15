import { Hono } from "hono";
import { SupervisorManager } from "../services/SupervisorManager";

export function createSupervisorRoutes(supervisorManager: SupervisorManager) {
  const router = new Hono();

  // Stats
  router.get("/stats", (c) => {
    return c.json(supervisorManager.getStats());
  });

  // Templates
  router.get("/templates", (c) => {
    return c.json(supervisorManager.getTemplates());
  });

  router.get("/templates/:id", (c) => {
    const { id } = c.req.param();
    const template = supervisorManager.getTemplate(id);
    if (!template) {
      return c.json({ error: "Template not found" }, 404);
    }
    return c.json(template);
  });

  // Create from template
  router.post("/from-template/:templateId", async (c) => {
    const { templateId } = c.req.param();
    const { name } = await c.req.json();
    const supervisor = supervisorManager.createFromTemplate(templateId, name);
    if (!supervisor) {
      return c.json({ error: "Template not found" }, 404);
    }
    return c.json(supervisor, 201);
  });

  // Supervisor CRUD
  router.get("/", (c) => {
    return c.json(supervisorManager.listSupervisors());
  });

  router.get("/:id", (c) => {
    const { id } = c.req.param();
    const supervisor = supervisorManager.getSupervisor(id);
    if (!supervisor) {
      return c.json({ error: "Supervisor not found" }, 404);
    }
    return c.json(supervisor);
  });

  router.post("/", async (c) => {
    const data = await c.req.json();
    const supervisor = supervisorManager.createSupervisor(data);
    return c.json(supervisor, 201);
  });

  router.patch("/:id", async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const supervisor = supervisorManager.updateSupervisor(id, updates);
    if (!supervisor) {
      return c.json({ error: "Supervisor not found" }, 404);
    }
    return c.json(supervisor);
  });

  router.delete("/:id", (c) => {
    const { id } = c.req.param();
    const success = supervisorManager.deleteSupervisor(id);
    if (!success) {
      return c.json({ error: "Supervisor not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Worker Management
  router.post("/:supervisorId/workers", async (c) => {
    const { supervisorId } = c.req.param();
    const worker = await c.req.json();
    const result = supervisorManager.addWorker(supervisorId, worker);
    if (!result) {
      return c.json({ error: "Supervisor not found" }, 404);
    }
    return c.json(result, 201);
  });

  router.patch("/:supervisorId/workers/:workerId", async (c) => {
    const { supervisorId, workerId } = c.req.param();
    const updates = await c.req.json();
    const result = supervisorManager.updateWorker(supervisorId, workerId, updates);
    if (!result) {
      return c.json({ error: "Worker not found" }, 404);
    }
    return c.json(result);
  });

  router.delete("/:supervisorId/workers/:workerId", (c) => {
    const { supervisorId, workerId } = c.req.param();
    const success = supervisorManager.removeWorker(supervisorId, workerId);
    if (!success) {
      return c.json({ error: "Worker not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Executions
  router.get("/executions", (c) => {
    const supervisorId = c.req.query("supervisorId");
    return c.json(supervisorManager.listExecutions(supervisorId));
  });

  router.get("/executions/:id", (c) => {
    const { id } = c.req.param();
    const execution = supervisorManager.getExecution(id);
    if (!execution) {
      return c.json({ error: "Execution not found" }, 404);
    }
    return c.json(execution);
  });

  router.post("/:id/execute", async (c) => {
    const { id } = c.req.param();
    const { task } = await c.req.json();
    try {
      const execution = await supervisorManager.execute(id, task);
      return c.json(execution);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  router.post("/executions/:id/stop", (c) => {
    const { id } = c.req.param();
    const success = supervisorManager.stopExecution(id);
    if (!success) {
      return c.json({ error: "Cannot stop execution" }, 400);
    }
    return c.json({ success: true });
  });

  return router;
}
