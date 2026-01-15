import { Hono } from "hono";

let usageTracker: any = null;

const getUsageTracker = async () => {
  if (!usageTracker) {
    const module = await import("../index");
    usageTracker = module.usageTracker;
  }
  return usageTracker;
};

export const usageRouter = new Hono();

// Get usage summary
usageRouter.get("/", async (c) => {
  const tracker = await getUsageTracker();
  const summary = await tracker.getSummary();
  return c.json(summary);
});

// Get usage history
usageRouter.get("/history", async (c) => {
  const tracker = await getUsageTracker();
  const days = parseInt(c.req.query("days") || "7", 10);
  const history = await tracker.getHistory(days);
  return c.json(history);
});

// Get usage by session
usageRouter.get("/sessions", async (c) => {
  const tracker = await getUsageTracker();
  const summary = await tracker.getSummary();
  return c.json(summary.bySession);
});

// Get usage for specific session
usageRouter.get("/sessions/:sessionId", async (c) => {
  const tracker = await getUsageTracker();
  const sessionId = c.req.param("sessionId");
  const records = await tracker.getBySession(sessionId);
  return c.json(records);
});

// Get alerts
usageRouter.get("/alerts", async (c) => {
  const tracker = await getUsageTracker();
  const alerts = tracker.getAlerts();
  return c.json(alerts);
});

// Update thresholds
usageRouter.put("/thresholds", async (c) => {
  const tracker = await getUsageTracker();
  const body = await c.req.json<{ warning?: number; critical?: number }>();

  tracker.setThresholds(body);
  return c.json({ success: true });
});

// Set daily limit
usageRouter.put("/limit", async (c) => {
  const tracker = await getUsageTracker();
  const body = await c.req.json<{ limit: number }>();

  if (!body.limit || body.limit <= 0) {
    return c.json({ error: "limit must be a positive number" }, 400);
  }

  tracker.setDailyLimit(body.limit);
  return c.json({ success: true });
});

// Export usage data
usageRouter.get("/export", async (c) => {
  const tracker = await getUsageTracker();
  const days = parseInt(c.req.query("days") || "30", 10);
  const format = c.req.query("format") || "json";

  const history = await tracker.getHistory(days);

  if (format === "csv") {
    const csv = [
      "date,tokens,cost",
      ...history.map((h: any) => `${h.date},${h.tokens},${h.cost.toFixed(4)}`),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="usage-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return c.json(history);
});
