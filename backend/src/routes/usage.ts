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
  const includeDetails = c.req.query("details") === "true";

  const history = await tracker.getHistory(days);
  const summary = await tracker.getSummary();

  if (format === "csv") {
    let csv: string;

    if (includeDetails) {
      // Detailed export with session breakdown
      const headers = ["date", "session_id", "session_name", "input_tokens", "output_tokens", "total_tokens", "cost_usd"];
      const rows = [headers.join(",")];

      for (const day of history) {
        // Add daily summary row
        rows.push(`${day.date},_total_,Daily Total,${day.inputTokens || 0},${day.outputTokens || 0},${day.tokens},${day.cost.toFixed(4)}`);

        // Add session breakdown if available
        if (day.sessions) {
          for (const session of day.sessions) {
            rows.push(`${day.date},${session.sessionId},${session.sessionName},${session.inputTokens},${session.outputTokens},${session.totalTokens},${session.cost.toFixed(4)}`);
          }
        }
      }
      csv = rows.join("\n");
    } else {
      // Simple daily summary
      const headers = ["date", "total_tokens", "input_tokens", "output_tokens", "estimated_cost_usd", "session_count"];
      const rows = [headers.join(",")];

      for (const day of history) {
        rows.push(`${day.date},${day.tokens},${day.inputTokens || 0},${day.outputTokens || 0},${day.cost.toFixed(4)},${day.sessionCount || 0}`);
      }
      csv = rows.join("\n");
    }

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orchestrate-usage-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // JSON export with full details
  return c.json({
    exportDate: new Date().toISOString(),
    period: {
      days,
      startDate: history.length > 0 ? history[history.length - 1].date : null,
      endDate: history.length > 0 ? history[0].date : null,
    },
    summary: {
      totalTokens: summary.totalTokens,
      totalCost: summary.totalCost,
      bySession: summary.bySession,
    },
    daily: history,
  });
});

// Export sessions usage
usageRouter.get("/export/sessions", async (c) => {
  const tracker = await getUsageTracker();
  const format = c.req.query("format") || "json";
  const summary = await tracker.getSummary();

  const sessions = Object.entries(summary.bySession || {}).map(([sessionId, data]: [string, any]) => ({
    sessionId,
    sessionName: data.name || sessionId,
    totalTokens: data.tokens || 0,
    inputTokens: data.inputTokens || 0,
    outputTokens: data.outputTokens || 0,
    estimatedCost: data.cost || 0,
    requestCount: data.requests || 0,
    lastUsed: data.lastUsed,
  }));

  if (format === "csv") {
    const headers = ["session_id", "session_name", "total_tokens", "input_tokens", "output_tokens", "cost_usd", "request_count", "last_used"];
    const rows = [headers.join(",")];

    for (const session of sessions) {
      rows.push(`${session.sessionId},"${session.sessionName}",${session.totalTokens},${session.inputTokens},${session.outputTokens},${session.estimatedCost.toFixed(4)},${session.requestCount},${session.lastUsed || ""}`);
    }

    return new Response(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orchestrate-sessions-usage-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return c.json({
    exportDate: new Date().toISOString(),
    sessions,
  });
});
