import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { Server } from "socket.io";
import { createServer } from "http";
import { sessionsRouter } from "./routes/sessions";
import { mcpRouter } from "./routes/mcp";
import { rulesRouter } from "./routes/rules";
import { usageRouter } from "./routes/usage";
import { gitRouter } from "./routes/git";
import { terminalRouter } from "./routes/terminal";
import { SessionManager } from "./services/SessionManager";
import { MCPManager } from "./services/MCPManager";
import { UsageTracker } from "./services/UsageTracker";
import { RulesEngine } from "./services/RulesEngine";

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

// API routes
app.route("/api/sessions", sessionsRouter);
app.route("/api/mcp", mcpRouter);
app.route("/api/rules", rulesRouter);
app.route("/api/usage", usageRouter);
app.route("/api/git", gitRouter);
app.route("/api/terminal", terminalRouter);

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

// Export services for routes
export { sessionManager, mcpManager, usageTracker, rulesEngine, io };

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

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = parseInt(process.env.PORT || "8000", 10);

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
  ╚═══════════════════════════════════════════════════════════╝
  `);
});
