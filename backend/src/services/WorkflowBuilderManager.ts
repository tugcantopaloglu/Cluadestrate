import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import {
  WorkflowCanvas,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeType,
  NodeTemplate,
  ValidationError,
  ValidateCanvasResponse,
  NodeConfig,
} from "../types/workflowBuilder";

export class WorkflowBuilderManager extends EventEmitter {
  private canvases: Map<string, WorkflowCanvas> = new Map();

  private nodeTemplates: NodeTemplate[] = [
    {
      id: "start",
      name: "Start",
      description: "Workflow entry point",
      category: "Control",
      type: "start",
      defaultConfig: { type: "session", model: "claude-sonnet-4", prompt: "", thinkingMode: "standard", autoApprove: false, inputMapping: [], outputCapture: { type: "full" } },
      icon: "Play",
      color: "#22c55e",
    },
    {
      id: "end",
      name: "End",
      description: "Workflow exit point",
      category: "Control",
      type: "end",
      defaultConfig: { type: "session", model: "claude-sonnet-4", prompt: "", thinkingMode: "standard", autoApprove: false, inputMapping: [], outputCapture: { type: "full" } },
      icon: "Square",
      color: "#ef4444",
    },
    {
      id: "session",
      name: "Claude Session",
      description: "Run a Claude Code session",
      category: "Agents",
      type: "session",
      defaultConfig: {
        type: "session",
        model: "claude-sonnet-4",
        thinkingMode: "standard",
        prompt: "",
        autoApprove: false,
        inputMapping: [],
        outputCapture: { type: "full" },
      },
      icon: "Bot",
      color: "#8b5cf6",
    },
    {
      id: "supervisor",
      name: "Supervisor Agent",
      description: "Coordinate multiple worker agents",
      category: "Agents",
      type: "supervisor",
      defaultConfig: {
        type: "supervisor",
        model: "claude-opus-4",
        strategy: "sequential",
        workers: [],
        aggregationPrompt: "Summarize the results from all workers.",
      },
      icon: "Users",
      color: "#f59e0b",
    },
    {
      id: "condition",
      name: "Condition",
      description: "Branch based on conditions",
      category: "Control",
      type: "condition",
      defaultConfig: {
        type: "condition",
        conditions: [],
        defaultBranch: "",
      },
      icon: "GitBranch",
      color: "#3b82f6",
    },
    {
      id: "merge",
      name: "Merge",
      description: "Merge parallel branches",
      category: "Control",
      type: "merge",
      defaultConfig: { type: "session", model: "claude-sonnet-4", prompt: "", thinkingMode: "standard", autoApprove: false, inputMapping: [], outputCapture: { type: "full" } },
      icon: "GitMerge",
      color: "#3b82f6",
    },
    {
      id: "transform",
      name: "Transform",
      description: "Transform data between nodes",
      category: "Data",
      type: "transform",
      defaultConfig: {
        type: "transform",
        transformType: "javascript",
        code: "return input;",
      },
      icon: "Wand2",
      color: "#ec4899",
    },
    {
      id: "delay",
      name: "Delay",
      description: "Wait for a specified time",
      category: "Control",
      type: "delay",
      defaultConfig: {
        type: "delay",
        delayMs: 5000,
        reason: "Wait before next step",
      },
      icon: "Clock",
      color: "#6b7280",
    },
    {
      id: "webhook",
      name: "Webhook",
      description: "Call external webhook",
      category: "Integration",
      type: "webhook",
      defaultConfig: {
        type: "webhook",
        method: "POST",
        url: "",
        headers: {},
      },
      icon: "Webhook",
      color: "#10b981",
    },
    {
      id: "notification",
      name: "Notification",
      description: "Send notification",
      category: "Integration",
      type: "notification",
      defaultConfig: {
        type: "notification",
        channels: ["push"],
        template: "",
        priority: "normal",
      },
      icon: "Bell",
      color: "#f97316",
    },
    {
      id: "loop",
      name: "Loop",
      description: "Iterate over items or count",
      category: "Control",
      type: "loop",
      defaultConfig: {
        type: "loop",
        loopType: "count",
        count: 3,
        maxIterations: 10,
      },
      icon: "Repeat",
      color: "#14b8a6",
    },
    {
      id: "subworkflow",
      name: "Subworkflow",
      description: "Run another workflow",
      category: "Control",
      type: "subworkflow",
      defaultConfig: {
        type: "subworkflow",
        workflowId: "",
        inputMapping: [],
      },
      icon: "Layers",
      color: "#a855f7",
    },
  ];

  constructor() {
    super();
  }

  // Canvas Management
  createCanvas(workflowId: string): WorkflowCanvas {
    const canvas: WorkflowCanvas = {
      id: randomUUID(),
      workflowId,
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 200 },
          data: {
            label: "Start",
            config: this.nodeTemplates.find((t) => t.id === "start")!.defaultConfig,
          },
        },
        {
          id: "end-1",
          type: "end",
          position: { x: 600, y: 200 },
          data: {
            label: "End",
            config: this.nodeTemplates.find((t) => t.id === "end")!.defaultConfig,
          },
        },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      gridSnap: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.canvases.set(canvas.id, canvas);
    this.emit("canvas:created", canvas);
    return canvas;
  }

  getCanvas(id: string): WorkflowCanvas | undefined {
    return this.canvases.get(id);
  }

  getCanvasByWorkflow(workflowId: string): WorkflowCanvas | undefined {
    return Array.from(this.canvases.values()).find((c) => c.workflowId === workflowId);
  }

  updateCanvas(id: string, updates: Partial<WorkflowCanvas>): WorkflowCanvas | null {
    const canvas = this.canvases.get(id);
    if (!canvas) return null;

    const updated = {
      ...canvas,
      ...updates,
      updatedAt: new Date(),
    };

    this.canvases.set(id, updated);
    this.emit("canvas:updated", updated);
    return updated;
  }

  deleteCanvas(id: string): boolean {
    const result = this.canvases.delete(id);
    if (result) {
      this.emit("canvas:deleted", { id });
    }
    return result;
  }

  // Node Management
  addNode(canvasId: string, type: WorkflowNodeType, position: { x: number; y: number }): WorkflowNode | null {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) return null;

    const template = this.nodeTemplates.find((t) => t.type === type);
    if (!template) return null;

    const node: WorkflowNode = {
      id: randomUUID(),
      type,
      position,
      data: {
        label: template.name,
        config: { ...template.defaultConfig },
      },
    };

    canvas.nodes.push(node);
    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);

    this.emit("node:added", { canvasId, node });
    return node;
  }

  updateNode(canvasId: string, nodeId: string, updates: Partial<WorkflowNode>): WorkflowNode | null {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) return null;

    const nodeIndex = canvas.nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) return null;

    const updatedNode = {
      ...canvas.nodes[nodeIndex],
      ...updates,
      data: updates.data
        ? { ...canvas.nodes[nodeIndex].data, ...updates.data }
        : canvas.nodes[nodeIndex].data,
    };

    canvas.nodes[nodeIndex] = updatedNode;
    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);

    this.emit("node:updated", { canvasId, node: updatedNode });
    return updatedNode;
  }

  deleteNode(canvasId: string, nodeId: string): boolean {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) return false;

    const nodeIndex = canvas.nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) return false;

    // Don't allow deleting start/end nodes
    const node = canvas.nodes[nodeIndex];
    if (node.type === "start" || node.type === "end") {
      return false;
    }

    canvas.nodes.splice(nodeIndex, 1);

    // Remove connected edges
    canvas.edges = canvas.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );

    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);

    this.emit("node:deleted", { canvasId, nodeId });
    return true;
  }

  // Edge Management
  addEdge(canvasId: string, source: string, target: string, sourceHandle?: string, targetHandle?: string): WorkflowEdge | null {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) return null;

    // Validate nodes exist
    const sourceNode = canvas.nodes.find((n) => n.id === source);
    const targetNode = canvas.nodes.find((n) => n.id === target);
    if (!sourceNode || !targetNode) return null;

    // Check for duplicate edge
    const duplicate = canvas.edges.find(
      (e) => e.source === source && e.target === target
    );
    if (duplicate) return null;

    // Prevent self-connections
    if (source === target) return null;

    const edge: WorkflowEdge = {
      id: randomUUID(),
      source,
      target,
      sourceHandle,
      targetHandle,
    };

    canvas.edges.push(edge);
    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);

    this.emit("edge:added", { canvasId, edge });
    return edge;
  }

  updateEdge(canvasId: string, edgeId: string, updates: Partial<WorkflowEdge>): WorkflowEdge | null {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) return null;

    const edgeIndex = canvas.edges.findIndex((e) => e.id === edgeId);
    if (edgeIndex === -1) return null;

    const updatedEdge = { ...canvas.edges[edgeIndex], ...updates };
    canvas.edges[edgeIndex] = updatedEdge;
    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);

    this.emit("edge:updated", { canvasId, edge: updatedEdge });
    return updatedEdge;
  }

  deleteEdge(canvasId: string, edgeId: string): boolean {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) return false;

    const edgeIndex = canvas.edges.findIndex((e) => e.id === edgeId);
    if (edgeIndex === -1) return false;

    canvas.edges.splice(edgeIndex, 1);
    canvas.updatedAt = new Date();
    this.canvases.set(canvasId, canvas);

    this.emit("edge:deleted", { canvasId, edgeId });
    return true;
  }

  // Validation
  validateCanvas(canvas: WorkflowCanvas): ValidateCanvasResponse {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check for start node
    const startNodes = canvas.nodes.filter((n) => n.type === "start");
    if (startNodes.length === 0) {
      errors.push({ message: "Workflow must have a start node", severity: "error" });
    } else if (startNodes.length > 1) {
      errors.push({ message: "Workflow can only have one start node", severity: "error" });
    }

    // Check for end node
    const endNodes = canvas.nodes.filter((n) => n.type === "end");
    if (endNodes.length === 0) {
      errors.push({ message: "Workflow must have an end node", severity: "error" });
    }

    // Check for disconnected nodes
    for (const node of canvas.nodes) {
      if (node.type === "start" || node.type === "end") continue;

      const hasIncoming = canvas.edges.some((e) => e.target === node.id);
      const hasOutgoing = canvas.edges.some((e) => e.source === node.id);

      if (!hasIncoming && !hasOutgoing) {
        errors.push({
          nodeId: node.id,
          message: `Node "${node.data.label}" is disconnected`,
          severity: "error",
        });
      } else if (!hasIncoming) {
        warnings.push({
          nodeId: node.id,
          message: `Node "${node.data.label}" has no incoming connections`,
          severity: "warning",
        });
      } else if (!hasOutgoing && node.type !== "end") {
        warnings.push({
          nodeId: node.id,
          message: `Node "${node.data.label}" has no outgoing connections`,
          severity: "warning",
        });
      }
    }

    // Validate node configs
    for (const node of canvas.nodes) {
      const nodeErrors = this.validateNodeConfig(node);
      errors.push(...nodeErrors);
    }

    // Check for cycles (simple detection)
    if (this.hasCycle(canvas)) {
      warnings.push({
        message: "Workflow contains cycles - ensure loop conditions are properly configured",
        severity: "warning",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateNodeConfig(node: WorkflowNode): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.data.config as NodeConfig;

    if (!config) return errors;

    switch (config.type) {
      case "session":
        if (!config.prompt?.trim()) {
          errors.push({
            nodeId: node.id,
            message: `Session node "${node.data.label}" requires a prompt`,
            severity: "error",
          });
        }
        break;

      case "supervisor":
        if (!config.workers || config.workers.length === 0) {
          errors.push({
            nodeId: node.id,
            message: `Supervisor node "${node.data.label}" requires at least one worker`,
            severity: "error",
          });
        }
        break;

      case "webhook":
        if (!config.url?.trim()) {
          errors.push({
            nodeId: node.id,
            message: `Webhook node "${node.data.label}" requires a URL`,
            severity: "error",
          });
        }
        break;

      case "subworkflow":
        if (!config.workflowId) {
          errors.push({
            nodeId: node.id,
            message: `Subworkflow node "${node.data.label}" requires a workflow selection`,
            severity: "error",
          });
        }
        break;
    }

    return errors;
  }

  private hasCycle(canvas: WorkflowCanvas): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const outEdges = canvas.edges.filter((e) => e.source === nodeId);
      for (const edge of outEdges) {
        if (!visited.has(edge.target)) {
          if (dfs(edge.target)) return true;
        } else if (recStack.has(edge.target)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const node of canvas.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }

    return false;
  }

  // Templates
  getNodeTemplates(): NodeTemplate[] {
    return [...this.nodeTemplates];
  }

  getNodeTemplate(id: string): NodeTemplate | undefined {
    return this.nodeTemplates.find((t) => t.id === id);
  }

  // Convert canvas to workflow steps
  canvasToWorkflowSteps(canvas: WorkflowCanvas): unknown[] {
    const steps: unknown[] = [];
    const visited = new Set<string>();

    // Find start node
    const startNode = canvas.nodes.find((n) => n.type === "start");
    if (!startNode) return steps;

    // BFS from start
    const queue: string[] = [startNode.id];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = canvas.nodes.find((n) => n.id === nodeId);
      if (!node || node.type === "start" || node.type === "end") {
        // Add connected nodes
        const outEdges = canvas.edges.filter((e) => e.source === nodeId);
        for (const edge of outEdges) {
          queue.push(edge.target);
        }
        continue;
      }

      // Convert node to step
      const step = {
        id: node.id,
        name: node.data.label,
        type: node.type,
        config: node.data.config,
        dependsOn: canvas.edges
          .filter((e) => e.target === nodeId)
          .map((e) => e.source)
          .filter((id) => {
            const n = canvas.nodes.find((n) => n.id === id);
            return n && n.type !== "start";
          }),
      };

      steps.push(step);

      // Add connected nodes
      const outEdges = canvas.edges.filter((e) => e.source === nodeId);
      for (const edge of outEdges) {
        queue.push(edge.target);
      }
    }

    return steps;
  }

  // Import workflow to canvas
  workflowToCanvas(workflow: { id: string; steps: unknown[] }): WorkflowCanvas {
    const canvas = this.createCanvas(workflow.id);

    // This is a simplified import - in production would need proper layout algorithm
    let x = 200;
    const y = 200;

    for (const step of workflow.steps as any[]) {
      const node: WorkflowNode = {
        id: step.id,
        type: step.type || "session",
        position: { x, y },
        data: {
          label: step.name,
          config: step.config || this.nodeTemplates[2].defaultConfig,
        },
      };

      canvas.nodes.push(node);
      x += 200;
    }

    // Auto-connect nodes
    const nonControlNodes = canvas.nodes.filter((n) => n.type !== "start" && n.type !== "end");

    if (nonControlNodes.length > 0) {
      // Connect start to first
      canvas.edges.push({
        id: randomUUID(),
        source: "start-1",
        target: nonControlNodes[0].id,
      });

      // Connect sequential
      for (let i = 0; i < nonControlNodes.length - 1; i++) {
        canvas.edges.push({
          id: randomUUID(),
          source: nonControlNodes[i].id,
          target: nonControlNodes[i + 1].id,
        });
      }

      // Connect last to end
      canvas.edges.push({
        id: randomUUID(),
        source: nonControlNodes[nonControlNodes.length - 1].id,
        target: "end-1",
      });
    } else {
      // Connect start directly to end
      canvas.edges.push({
        id: randomUUID(),
        source: "start-1",
        target: "end-1",
      });
    }

    this.canvases.set(canvas.id, canvas);
    return canvas;
  }
}
