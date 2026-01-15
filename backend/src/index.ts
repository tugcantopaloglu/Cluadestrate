import { Hono } from "hono";
import { cors } from "hono/cors";
import { Server } from "socket.io";
import { createServer } from "http";

// Existing routes
import { sessionsRouter } from "./routes/sessions";
import { mcpRouter } from "./routes/mcp";
import { rulesRouter } from "./routes/rules";
import { usageRouter } from "./routes/usage";
import { gitRouter } from "./routes/git";
import { terminalRouter } from "./routes/terminal";

// New routes
import { createWorkflowRoutes } from "./routes/workflows";
import { createAutomationRoutes } from "./routes/automations";
import { createKnowledgeRoutes } from "./routes/knowledge";
import { createTaskRoutes } from "./routes/tasks";
import { createChainRoutes } from "./routes/chains";
import { createAlertRoutes } from "./routes/alerts";
import { createNotificationRoutes } from "./routes/notifications";
import { createIntegrationRoutes } from "./routes/integrations";

// Existing services
import { SessionManager } from "./services/SessionManager";
import { MCPManager } from "./services/MCPManager";
import { UsageTracker } from "./services/UsageTracker";
import { RulesEngine } from "./services/RulesEngine";

// New services
import { WorkflowManager } from "./services/WorkflowManager";
import { AutomationManager } from "./services/AutomationManager";
import { KnowledgeManager } from "./services/KnowledgeManager";
import { TaskManager } from "./services/TaskManager";
import { ChainManager } from "./services/ChainManager";
import { AlertManager } from "./services/AlertManager";
import { NotificationManager } from "./services/NotificationManager";
import { IntegrationManager } from "./services/IntegrationManager";

const app = new Hono();

// CORS middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Health check
app.get("/", (c) => {
  return c.json({
    name: "Cluadestrate API",
    version: "1.0.0",
    status: "running",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Create HTTP server for both Hono and Socket.io
const httpServer = createServer(async (req, res) => {
  // Convert Node.js request to fetch Request
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
  });

  const method = req.method || "GET";
  let body: BodyInit | null = null;

  if (method !== "GET" && method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    body = Buffer.concat(chunks);
  }

  const request = new Request(url.toString(), {
    method,
    headers,
    body,
  });

  const response = await app.fetch(request);

  // Convert Response back to Node.js response
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const responseBody = await response.arrayBuffer();
  res.end(Buffer.from(responseBody));
});

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  },
});

// Initialize services
const sessionManager = new SessionManager(io);
const mcpManager = new MCPManager(io);
const usageTracker = new UsageTracker();
const rulesEngine = new RulesEngine();

// Initialize new services
const workflowManager = new WorkflowManager(sessionManager);
const automationManager = new AutomationManager(workflowManager, sessionManager);
const knowledgeManager = new KnowledgeManager();
const taskManager = new TaskManager();
const chainManager = new ChainManager();
const alertManager = new AlertManager();
const notificationManager = new NotificationManager();
const integrationManager = new IntegrationManager();

// Export services for routes
export {
  sessionManager,
  mcpManager,
  usageTracker,
  rulesEngine,
  workflowManager,
  automationManager,
  knowledgeManager,
  taskManager,
  chainManager,
  alertManager,
  notificationManager,
  integrationManager,
  io,
};

// Existing API routes
app.route("/api/sessions", sessionsRouter);
app.route("/api/mcp", mcpRouter);
app.route("/api/rules", rulesRouter);
app.route("/api/usage", usageRouter);
app.route("/api/git", gitRouter);
app.route("/api/terminal", terminalRouter);

// New API routes
app.route("/api/workflows", createWorkflowRoutes(workflowManager));
app.route("/api/automations", createAutomationRoutes(automationManager));
app.route("/api/knowledge", createKnowledgeRoutes(knowledgeManager));
app.route("/api/tasks", createTaskRoutes(taskManager));
app.route("/api/chains", createChainRoutes(chainManager));
app.route("/api/alerts", createAlertRoutes(alertManager));
app.route("/api/notifications", createNotificationRoutes(notificationManager));
app.route("/api/integrations", createIntegrationRoutes(integrationManager));

// Wire up service events to notifications
sessionManager.on("session:started", ({ sessionId, session }) => {
  notificationManager.notifySessionStarted(sessionId, session.name);
});

sessionManager.on("session:stopped", ({ sessionId }) => {
  const session = sessionManager.get(sessionId);
  if (session) {
    notificationManager.notifySessionCompleted(sessionId, session.name);
  }
});

sessionManager.on("session:error", ({ sessionId, error }) => {
  const session = sessionManager.get(sessionId);
  if (session) {
    notificationManager.notifySessionError(sessionId, session.name, error);
  }
});

workflowManager.on("workflow:completed", ({ id }) => {
  const workflow = workflowManager.get(id);
  if (workflow) {
    notificationManager.notifyWorkflowCompleted(id, workflow.name);
  }
});

taskManager.on("task:status-changed", ({ task, from, to }) => {
  if (to === "in_progress" && task.assignedSessionId) {
    notificationManager.notifyTaskAssigned(task.id, task.title, task.assignedSessionId);
  }
});

// Update usage metrics for alerts
usageTracker.on("usage:updated", (data) => {
  const dailyLimit = parseInt(process.env.DAILY_TOKEN_LIMIT || "100000");
  const percent = (data.totalTokens / dailyLimit) * 100;
  alertManager.setMetric("usage.percent", percent);
  alertManager.setMetric("usage.tokens", data.totalTokens);
});

// Socket.io event handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join session room
  socket.on("session:join", (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    console.log(`Client ${socket.id} joined session room: ${sessionId}`);
  });

  // Leave session room
  socket.on("session:leave", (sessionId: string) => {
    socket.leave(`session:${sessionId}`);
    console.log(`Client ${socket.id} left session room: ${sessionId}`);
  });

  // Session input
  socket.on("session:input", async ({ sessionId, input }) => {
    try {
      await sessionManager.sendInput(sessionId, input);
    } catch (error) {
      socket.emit("error", { message: (error as Error).message });
    }
  });

  // Terminal events
  socket.on("terminal:join", (terminalId: string) => {
    socket.join(`terminal:${terminalId}`);
  });

  socket.on("terminal:input", ({ terminalId, data }) => {
    // Handle terminal input
    io.to(`terminal:${terminalId}`).emit("terminal:output", { terminalId, data });
  });

  // Notification subscription
  socket.on("notifications:subscribe", () => {
    socket.join("notifications");
  });

  // Alert subscription
  socket.on("alerts:subscribe", () => {
    socket.join("alerts");
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Forward notifications and alerts to WebSocket
notificationManager.on("notification:created", (notification) => {
  io.to("notifications").emit("notification:new", notification);
});

alertManager.on("alert:created", (alert) => {
  io.to("alerts").emit("alert:new", alert);
});

const PORT = parseInt(process.env.PORT || "3001", 10);

httpServer.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║     🎭 Cluadestrate Backend Server                        ║
  ║     "Command Your AI Fleet"                               ║
  ║                                                           ║
  ║     Server running on http://localhost:${PORT}              ║
  ║     WebSocket enabled                                     ║
  ║                                                           ║
  ║     API Endpoints:                                        ║
  ║     - /api/sessions     Session management                ║
  ║     - /api/mcp          MCP server management             ║
  ║     - /api/rules        Rules engine                      ║
  ║     - /api/usage        Usage tracking                    ║
  ║     - /api/git          Git operations                    ║
  ║     - /api/terminal     Terminal access                   ║
  ║     - /api/workflows    Workflow orchestration            ║
  ║     - /api/automations  Scheduled automations             ║
  ║     - /api/knowledge    Knowledge base                    ║
  ║     - /api/tasks        Task management                   ║
  ║     - /api/chains       Model chains                      ║
  ║     - /api/alerts       Alert system                      ║
  ║     - /api/notifications Notifications                    ║
  ║     - /api/integrations External integrations             ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});
