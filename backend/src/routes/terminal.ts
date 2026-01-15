import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";

// Terminal sessions are managed via WebSocket primarily
// These endpoints are for creating/listing/resizing terminals

interface TerminalSession {
  id: string;
  shell: string;
  cwd: string;
  cols: number;
  rows: number;
  createdAt: Date;
}

const terminals: Map<string, TerminalSession> = new Map();

export const terminalRouter = new Hono();

// List terminals
terminalRouter.get("/", async (c) => {
  return c.json(Array.from(terminals.values()));
});

// Create terminal
terminalRouter.post("/", async (c) => {
  const body = await c.req.json<{
    shell?: string;
    cwd?: string;
    cols?: number;
    rows?: number;
  }>();

  const id = uuidv4();
  const terminal: TerminalSession = {
    id,
    shell: body.shell || (process.platform === "win32" ? "powershell" : "bash"),
    cwd: body.cwd || process.cwd(),
    cols: body.cols || 80,
    rows: body.rows || 24,
    createdAt: new Date(),
  };

  terminals.set(id, terminal);

  return c.json(terminal, 201);
});

// Get terminal
terminalRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const terminal = terminals.get(id);

  if (!terminal) {
    return c.json({ error: "Terminal not found" }, 404);
  }

  return c.json(terminal);
});

// Resize terminal
terminalRouter.post("/:id/resize", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ cols: number; rows: number }>();

  const terminal = terminals.get(id);
  if (!terminal) {
    return c.json({ error: "Terminal not found" }, 404);
  }

  terminal.cols = body.cols;
  terminal.rows = body.rows;

  return c.json({ success: true });
});

// Close terminal
terminalRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  if (!terminals.has(id)) {
    return c.json({ error: "Terminal not found" }, 404);
  }

  terminals.delete(id);
  return c.json({ success: true });
});
