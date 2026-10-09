import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { Server } from "socket.io";
import { createAdaptorServer } from "@hono/node-server";
import { allowedOrigins, getListenHost, isLocalRequest } from "./localAccess.js";

// Existing routes
import { sessionsRouter } from "./routes/sessions.js";
import { mcpRouter } from "./routes/mcp.js";
import { rulesRouter } from "./routes/rules.js";
import { usageRouter } from "./routes/usage.js";
import { gitRouter } from "./routes/git.js";
import { terminalRouter } from "./routes/terminal.js";

// New routes
import { createWorkflowRoutes } from "./routes/workflows.js";
import { createAutomationRoutes } from "./routes/automations.js";
import { createKnowledgeRoutes } from "./routes/knowledge.js";
import { createTaskRoutes } from "./routes/tasks.js";
import { createChainRoutes } from "./routes/chains.js";
import { createAlertRoutes } from "./routes/alerts.js";
import { createNotificationRoutes } from "./routes/notifications.js";
import { createIntegrationRoutes } from "./routes/integrations.js";

// Additional new routes
import { createFileSyncRoutes } from "./routes/fileSync.js";
import { createAutoUpdateRoutes } from "./routes/autoUpdate.js";
import { createImageSharingRoutes } from "./routes/imageSharing.js";
import { createN8nRoutes } from "./routes/n8n.js";
import { createBotRoutes } from "./routes/bots.js";
import { createWorkflowBuilderRoutes } from "./routes/workflowBuilder.js";
import { createSupervisorRoutes } from "./routes/supervisor.js";
import { createMCPHostAgentRoutes } from "./routes/mcpHostAgent.js";
import { createEmailRoutes } from "./routes/email.js";

// Existing services
import { SessionManager } from "./services/SessionManager.js";
import { MCPManager } from "./services/MCPManager.js";
import { UsageTracker } from "./services/UsageTracker.js";
import { RulesEngine } from "./services/RulesEngine.js";

// New services
import { WorkflowManager } from "./services/WorkflowManager.js";
import { AutomationManager } from "./services/AutomationManager.js";
import { KnowledgeManager } from "./services/KnowledgeManager.js";
import { TaskManager } from "./services/TaskManager.js";
import { ChainManager } from "./services/ChainManager.js";
import { AlertManager } from "./services/AlertManager.js";
import { NotificationManager } from "./services/NotificationManager.js";
import { IntegrationManager } from "./services/IntegrationManager.js";

// Additional new services
import { FileSyncManager } from "./services/FileSyncManager.js";
import { AutoUpdateManager } from "./services/AutoUpdateManager.js";
import { ImageSharingManager } from "./services/ImageSharingManager.js";
import { N8nManager } from "./services/N8nManager.js";
import { SlackBotManager } from "./services/SlackBotManager.js";
import { DiscordBotManager } from "./services/DiscordBotManager.js";
import { TelegramBotManager } from "./services/TelegramBotManager.js";
import { WorkflowBuilderManager } from "./services/WorkflowBuilderManager.js";
import { SupervisorManager } from "./services/SupervisorManager.js";
import { MCPHostAgentManager } from "./services/MCPHostAgentManager.js";
import { EmailManager } from "./services/EmailManager.js";
import { AgentConnectionManager } from "./services/AgentConnectionManager.js";

const app = new Hono();
const HOST = getListenHost();

app.use("*", async (c, next) => {
  if (!isLocalRequest(c.req.header("host"), c.req.header("origin"))) {
    return c.json({ error: "Request origin or host is not allowed" }, 403);
  }
  await next();
});
app.use("*", bodyLimit({ maxSize: 25 * 1024 * 1024 }));

// CORS middleware
app.use(
  "*",
  cors({
    origin: allowedOrigins,
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
const httpServer = createAdaptorServer({ fetch: app.fetch });

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  allowRequest: (req, callback) => {
    callback(null, isLocalRequest(req.headers.host, req.headers.origin));
  },
});

// Initialize services
const sessionManager = new SessionManager(io);
const mcpManager = new MCPManager(io);
const usageTracker = new UsageTracker();
const dailyTokenLimit = parseInt(process.env.DAILY_TOKEN_LIMIT || "100000", 10);
usageTracker.setDailyLimit(Number.isFinite(dailyTokenLimit) ? dailyTokenLimit : 100000);
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

// Initialize additional services
const fileSyncManager = new FileSyncManager();
const autoUpdateManager = new AutoUpdateManager();
const imageSharingManager = new ImageSharingManager();
const n8nManager = new N8nManager();
const slackBotManager = new SlackBotManager();
const discordBotManager = new DiscordBotManager();
const telegramBotManager = new TelegramBotManager();
const workflowBuilderManager = new WorkflowBuilderManager();
const supervisorManager = new SupervisorManager();
const mcpHostAgentManager = new MCPHostAgentManager();
const emailManager = new EmailManager();

// Initialize agent connection manager (handles WebSocket connections from remote agents)
const agentConnectionManager = new AgentConnectionManager(io, mcpHostAgentManager);

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
  fileSyncManager,
  autoUpdateManager,
  imageSharingManager,
  n8nManager,
  slackBotManager,
  discordBotManager,
  telegramBotManager,
  workflowBuilderManager,
  supervisorManager,
  mcpHostAgentManager,
  emailManager,
  agentConnectionManager,
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

// Additional new API routes
app.route("/api/file-sync", createFileSyncRoutes(fileSyncManager));
app.route("/api/auto-update", createAutoUpdateRoutes(autoUpdateManager));
app.route("/api/images", createImageSharingRoutes(imageSharingManager));
app.route("/api/n8n", createN8nRoutes(n8nManager));
app.route("/api/bots", createBotRoutes(slackBotManager, discordBotManager, telegramBotManager));
app.route("/api/workflow-builder", createWorkflowBuilderRoutes(workflowBuilderManager));
app.route("/api/supervisors", createSupervisorRoutes(supervisorManager));
app.route("/api/mcp-hosts", createMCPHostAgentRoutes(mcpHostAgentManager, agentConnectionManager));
app.route("/api/email", createEmailRoutes(emailManager));

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
  const percent = dailyTokenLimit > 0 ? (data.totalTokens / dailyTokenLimit) * 100 : 0;
  alertManager.setMetric("usage.percent", percent);
  alertManager.setMetric("usage.tokens", data.totalTokens);
});

// Agent connection events
agentConnectionManager.on("agent:connected", (host) => {
  console.log(`Agent connected: ${host.hostName} (${host.id})`);
  notificationManager.create({
    type: "system",
    title: "Agent Connected",
    message: `Remote agent "${host.hostName}" has connected`,
    metadata: { hostId: host.id, platform: host.platform },
  });
});

agentConnectionManager.on("agent:disconnected", ({ hostId, reason }) => {
  console.log(`Agent disconnected: ${hostId} (${reason})`);
  notificationManager.create({
    type: "system",
    title: "Agent Disconnected",
    message: `Remote agent has disconnected: ${reason}`,
    metadata: { hostId, reason },
  });
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

httpServer.listen(PORT, HOST, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║     🎭 Cluadestrate Backend Server                            ║
  ║     "Command Your AI Fleet"                                   ║
  ║                                                               ║
  ║     Server running on http://localhost:${PORT}                  ║
  ║     WebSocket enabled                                         ║
  ║                                                               ║
  ║     Core API Endpoints:                                       ║
  ║     - /api/sessions        Session management                 ║
  ║     - /api/mcp             MCP server management              ║
  ║     - /api/rules           Rules engine                       ║
  ║     - /api/usage           Usage tracking & export            ║
  ║     - /api/git             Git operations                     ║
  ║     - /api/terminal        Terminal access                    ║
  ║                                                               ║
  ║     Orchestration:                                            ║
  ║     - /api/workflows       Workflow orchestration             ║
  ║     - /api/workflow-builder Visual workflow builder           ║
  ║     - /api/supervisors     Multi-agent supervisors            ║
  ║     - /api/automations     Scheduled automations              ║
  ║     - /api/chains          Model chains                       ║
  ║                                                               ║
  ║     Management:                                               ║
  ║     - /api/tasks           Task management                    ║
  ║     - /api/knowledge       Knowledge base                     ║
  ║     - /api/file-sync       File synchronization               ║
  ║     - /api/images          Image sharing                      ║
  ║                                                               ║
  ║     Notifications & Alerts:                                   ║
  ║     - /api/alerts          Alert system                       ║
  ║     - /api/notifications   In-app notifications               ║
  ║     - /api/email           Email notifications                ║
  ║                                                               ║
  ║     Integrations:                                             ║
  ║     - /api/integrations    External integrations              ║
  ║     - /api/n8n             n8n workflow automation            ║
  ║     - /api/bots            Slack/Discord/Telegram bots        ║
  ║                                                               ║
  ║     Infrastructure:                                           ║
  ║     - /api/mcp-hosts       Remote MCP host agents             ║
  ║     - /api/auto-update     Auto-update management             ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
  `);
});
