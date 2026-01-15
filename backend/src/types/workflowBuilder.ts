// Visual Workflow Builder Types

export interface WorkflowCanvas {
  id: string;
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  gridSnap: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
  selected?: boolean;
  dragging?: boolean;
  width?: number;
  height?: number;
}

export type WorkflowNodeType =
  | "session"          // Claude session
  | "supervisor"       // Supervisor agent
  | "condition"        // Conditional branching
  | "merge"            // Merge parallel branches
  | "transform"        // Data transformation
  | "delay"            // Wait/delay
  | "trigger"          // External trigger
  | "webhook"          // Webhook call
  | "notification"     // Send notification
  | "loop"             // Loop/iteration
  | "subworkflow"      // Nested workflow
  | "start"            // Start node
  | "end";             // End node

export interface WorkflowNodeData {
  label: string;
  description?: string;
  config: NodeConfig;
  status?: "idle" | "running" | "completed" | "error" | "skipped";
  output?: unknown;
  error?: string;
  executionTime?: number;
}

export type NodeConfig =
  | SessionNodeConfig
  | SupervisorNodeConfig
  | ConditionNodeConfig
  | TransformNodeConfig
  | DelayNodeConfig
  | WebhookNodeConfig
  | NotificationNodeConfig
  | LoopNodeConfig
  | SubworkflowNodeConfig;

export interface SessionNodeConfig {
  type: "session";
  model: "claude-opus-4" | "claude-sonnet-4" | "claude-haiku-3.5";
  thinkingMode: "standard" | "extended";
  thinkingBudget?: number;
  prompt: string;
  systemPrompt?: string;
  mcpServers?: string[];
  autoApprove: boolean;
  timeout?: number;
  inputMapping: InputMapping[];
  outputCapture: OutputCapture;
}

export interface SupervisorNodeConfig {
  type: "supervisor";
  model: "claude-opus-4" | "claude-sonnet-4";
  strategy: "sequential" | "parallel" | "adaptive";
  workers: WorkerConfig[];
  aggregationPrompt: string;
  maxIterations?: number;
  consensusRequired?: boolean;
}

export interface WorkerConfig {
  id: string;
  name: string;
  role: "planner" | "coder" | "reviewer" | "tester" | "documenter" | "custom";
  model: string;
  prompt: string;
  capabilities?: string[];
}

export interface ConditionNodeConfig {
  type: "condition";
  conditions: ConditionRule[];
  defaultBranch: string; // Edge ID
}

export interface ConditionRule {
  id: string;
  expression: string; // JavaScript expression
  targetEdgeId: string;
  label: string;
}

export interface TransformNodeConfig {
  type: "transform";
  transformType: "jq" | "javascript" | "template" | "json-path";
  code: string;
}

export interface DelayNodeConfig {
  type: "delay";
  delayMs: number;
  reason?: string;
}

export interface WebhookNodeConfig {
  type: "webhook";
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
  responseMapping?: string;
}

export interface NotificationNodeConfig {
  type: "notification";
  channels: ("email" | "slack" | "discord" | "telegram" | "push")[];
  template: string;
  priority: "low" | "normal" | "high";
}

export interface LoopNodeConfig {
  type: "loop";
  loopType: "count" | "while" | "forEach";
  count?: number;
  condition?: string;
  itemsPath?: string;
  maxIterations: number;
}

export interface SubworkflowNodeConfig {
  type: "subworkflow";
  workflowId: string;
  inputMapping: InputMapping[];
}

export interface InputMapping {
  sourceNodeId: string | "trigger";
  sourcePath: string;
  targetVariable: string;
}

export interface OutputCapture {
  type: "full" | "json" | "text" | "files" | "custom";
  extractPath?: string;
  regex?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
  style?: EdgeStyle;
  data?: {
    condition?: string;
  };
}

export interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

// Node Templates
export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: WorkflowNodeType;
  defaultConfig: NodeConfig;
  icon: string;
  color: string;
}

// Workflow Builder State
export interface WorkflowBuilderState {
  canvas: WorkflowCanvas;
  selectedNodes: string[];
  selectedEdges: string[];
  clipboard: (WorkflowNode | WorkflowEdge)[];
  history: CanvasHistoryEntry[];
  historyIndex: number;
  isDragging: boolean;
  isConnecting: boolean;
  connectingFrom?: { nodeId: string; handleId: string };
  validationErrors: ValidationError[];
}

export interface CanvasHistoryEntry {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  timestamp: Date;
}

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  severity: "error" | "warning";
}

// API Types
export interface CreateWorkflowFromCanvasRequest {
  name: string;
  description: string;
  canvas: WorkflowCanvas;
}

export interface ValidateCanvasRequest {
  canvas: WorkflowCanvas;
}

export interface ValidateCanvasResponse {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
