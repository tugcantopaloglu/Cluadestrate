import { Hono } from "hono";
import { WorkflowBuilderManager } from "../services/WorkflowBuilderManager";

export function createWorkflowBuilderRoutes(workflowBuilderManager: WorkflowBuilderManager) {
  const router = new Hono();

  // Node Templates
  router.get("/templates", (c) => {
    return c.json(workflowBuilderManager.getNodeTemplates());
  });

  router.get("/templates/:id", (c) => {
    const { id } = c.req.param();
    const template = workflowBuilderManager.getNodeTemplate(id);
    if (!template) {
      return c.json({ error: "Template not found" }, 404);
    }
    return c.json(template);
  });

  // Canvas Management
  router.post("/canvas", async (c) => {
    const { workflowId } = await c.req.json();
    const canvas = workflowBuilderManager.createCanvas(workflowId);
    return c.json(canvas, 201);
  });

  router.get("/canvas/:id", (c) => {
    const { id } = c.req.param();
    const canvas = workflowBuilderManager.getCanvas(id);
    if (!canvas) {
      return c.json({ error: "Canvas not found" }, 404);
    }
    return c.json(canvas);
  });

  router.get("/canvas/workflow/:workflowId", (c) => {
    const { workflowId } = c.req.param();
    const canvas = workflowBuilderManager.getCanvasByWorkflow(workflowId);
    if (!canvas) {
      return c.json({ error: "Canvas not found" }, 404);
    }
    return c.json(canvas);
  });

  router.patch("/canvas/:id", async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const canvas = workflowBuilderManager.updateCanvas(id, updates);
    if (!canvas) {
      return c.json({ error: "Canvas not found" }, 404);
    }
    return c.json(canvas);
  });

  router.delete("/canvas/:id", (c) => {
    const { id } = c.req.param();
    const success = workflowBuilderManager.deleteCanvas(id);
    if (!success) {
      return c.json({ error: "Canvas not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Node Management
  router.post("/canvas/:canvasId/nodes", async (c) => {
    const { canvasId } = c.req.param();
    const { type, position } = await c.req.json();
    const node = workflowBuilderManager.addNode(canvasId, type, position);
    if (!node) {
      return c.json({ error: "Failed to add node" }, 400);
    }
    return c.json(node, 201);
  });

  router.patch("/canvas/:canvasId/nodes/:nodeId", async (c) => {
    const { canvasId, nodeId } = c.req.param();
    const updates = await c.req.json();
    const node = workflowBuilderManager.updateNode(canvasId, nodeId, updates);
    if (!node) {
      return c.json({ error: "Node not found" }, 404);
    }
    return c.json(node);
  });

  router.delete("/canvas/:canvasId/nodes/:nodeId", (c) => {
    const { canvasId, nodeId } = c.req.param();
    const success = workflowBuilderManager.deleteNode(canvasId, nodeId);
    if (!success) {
      return c.json({ error: "Cannot delete node" }, 400);
    }
    return c.json({ success: true });
  });

  // Edge Management
  router.post("/canvas/:canvasId/edges", async (c) => {
    const { canvasId } = c.req.param();
    const { source, target, sourceHandle, targetHandle } = await c.req.json();
    const edge = workflowBuilderManager.addEdge(canvasId, source, target, sourceHandle, targetHandle);
    if (!edge) {
      return c.json({ error: "Failed to add edge" }, 400);
    }
    return c.json(edge, 201);
  });

  router.patch("/canvas/:canvasId/edges/:edgeId", async (c) => {
    const { canvasId, edgeId } = c.req.param();
    const updates = await c.req.json();
    const edge = workflowBuilderManager.updateEdge(canvasId, edgeId, updates);
    if (!edge) {
      return c.json({ error: "Edge not found" }, 404);
    }
    return c.json(edge);
  });

  router.delete("/canvas/:canvasId/edges/:edgeId", (c) => {
    const { canvasId, edgeId } = c.req.param();
    const success = workflowBuilderManager.deleteEdge(canvasId, edgeId);
    if (!success) {
      return c.json({ error: "Edge not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Validation
  router.post("/validate", async (c) => {
    const { canvas } = await c.req.json();
    const result = workflowBuilderManager.validateCanvas(canvas);
    return c.json(result);
  });

  // Convert canvas to workflow steps
  router.post("/canvas/:canvasId/export", (c) => {
    const { canvasId } = c.req.param();
    const canvas = workflowBuilderManager.getCanvas(canvasId);
    if (!canvas) {
      return c.json({ error: "Canvas not found" }, 404);
    }
    const steps = workflowBuilderManager.canvasToWorkflowSteps(canvas);
    return c.json({ steps });
  });

  // Import workflow to canvas
  router.post("/import", async (c) => {
    const workflow = await c.req.json();
    const canvas = workflowBuilderManager.workflowToCanvas(workflow);
    return c.json(canvas);
  });

  return router;
}
