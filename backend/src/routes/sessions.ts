import { Hono } from "hono";
import type { CreateSessionRequest, UpdateSessionRequest } from "../types";

// We'll import the manager from index.ts via dynamic import to avoid circular deps
let sessionManager: any = null;

const getSessionManager = async () => {
  if (!sessionManager) {
    const module = await import("../index");
    sessionManager = module.sessionManager;
  }
  return sessionManager;
};

export const sessionsRouter = new Hono();

// List all sessions
sessionsRouter.get("/", async (c) => {
  const manager = await getSessionManager();
  const sessions = await manager.getSessions();
  return c.json(sessions);
});

// Get single session
sessionsRouter.get("/:id", async (c) => {
  const manager = await getSessionManager();
  const id = c.req.param("id");
  const session = await manager.getSession(id);

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json(session);
});

// Create session
sessionsRouter.post("/", async (c) => {
  const manager = await getSessionManager();
  const body = await c.req.json<CreateSessionRequest>();

  if (!body.name || !body.workingDirectory) {
    return c.json(
      { error: "name and workingDirectory are required" },
      400
    );
  }

  const session = await manager.createSession(body);
  return c.json(session, 201);
});

// Update session
sessionsRouter.patch("/:id", async (c) => {
  const manager = await getSessionManager();
  const id = c.req.param("id");
  const body = await c.req.json<UpdateSessionRequest>();

  const session = await manager.updateSession(id, body);

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json(session);
});

// Delete session
sessionsRouter.delete("/:id", async (c) => {
  const manager = await getSessionManager();
  const id = c.req.param("id");
  const deleted = await manager.deleteSession(id);

  if (!deleted) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json({ success: true });
});

// Start session
sessionsRouter.post("/:id/start", async (c) => {
  const manager = await getSessionManager();
  const id = c.req.param("id");
  const body = await c.req.json<{ prompt?: string }>().catch(() => ({ prompt: undefined }));

  const started = await manager.startSession(id, body.prompt);

  if (!started) {
    return c.json({ error: "Could not start session" }, 400);
  }

  return c.json({ success: true });
});

// Stop session
sessionsRouter.post("/:id/stop", async (c) => {
  const manager = await getSessionManager();
  const id = c.req.param("id");
  const stopped = await manager.stopSession(id);

  if (!stopped) {
    return c.json({ error: "Could not stop session" }, 400);
  }

  return c.json({ success: true });
});

// Pause session
sessionsRouter.post("/:id/pause", async (c) => {
  const manager = await getSessionManager();
  const id = c.req.param("id");
  const paused = await manager.pauseSession(id);

  if (!paused) {
    return c.json({ error: "Could not pause session" }, 400);
  }

  return c.json({ success: true });
});

// Resume session
sessionsRouter.post("/:id/resume", async (c) => {
  const manager = await getSessionManager();
  const id = c.req.param("id");
  const resumed = await manager.resumeSession(id);

  if (!resumed) {
    return c.json({ error: "Could not resume session" }, 400);
  }

  return c.json({ success: true });
});

// Send input to session
sessionsRouter.post("/:id/input", async (c) => {
  const manager = await getSessionManager();
  const id = c.req.param("id");
  const body = await c.req.json<{ input: string }>();

  if (!body.input) {
    return c.json({ error: "input is required" }, 400);
  }

  const sent = await manager.sendInput(id, body.input);

  if (!sent) {
    return c.json({ error: "Could not send input" }, 400);
  }

  return c.json({ success: true });
});

// Get session output buffer
sessionsRouter.get("/:id/output", async (c) => {
  const manager = await getSessionManager();
  const id = c.req.param("id");
  const output = manager.getOutputBuffer(id);

  return c.json({ output });
});
