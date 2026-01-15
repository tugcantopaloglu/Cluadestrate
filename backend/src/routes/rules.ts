import { Hono } from "hono";
import type { CreateHardRuleRequest } from "../types";

let rulesEngine: any = null;

const getRulesEngine = async () => {
  if (!rulesEngine) {
    const module = await import("../index");
    rulesEngine = module.rulesEngine;
  }
  return rulesEngine;
};

export const rulesRouter = new Hono();

// Get all rules configuration
rulesRouter.get("/", async (c) => {
  const engine = await getRulesEngine();
  const config = engine.getConfig();
  return c.json(config);
});

// Get hard rules
rulesRouter.get("/hard", async (c) => {
  const engine = await getRulesEngine();
  const rules = engine.getHardRules();
  return c.json(rules);
});

// Add hard rule
rulesRouter.post("/hard", async (c) => {
  const engine = await getRulesEngine();
  const body = await c.req.json<CreateHardRuleRequest>();

  if (!body.rule || !body.createdBy) {
    return c.json({ error: "rule and createdBy are required" }, 400);
  }

  const rule = engine.addHardRule(body);
  return c.json(rule, 201);
});

// Delete hard rule
rulesRouter.delete("/hard/:id", async (c) => {
  const engine = await getRulesEngine();
  const id = c.req.param("id");
  const deleted = engine.removeHardRule(id);

  if (!deleted) {
    return c.json({ error: "Hard rule not found" }, 404);
  }

  return c.json({ success: true });
});

// Get default rules
rulesRouter.get("/default", async (c) => {
  const engine = await getRulesEngine();
  const rules = engine.getDefaultRules();
  return c.json(rules);
});

// Update default rules
rulesRouter.put("/default", async (c) => {
  const engine = await getRulesEngine();
  const body = await c.req.json<{ rules: string[] }>();

  if (!body.rules || !Array.isArray(body.rules)) {
    return c.json({ error: "rules array is required" }, 400);
  }

  engine.setDefaultRules(body.rules);
  return c.json({ success: true });
});

// Get session rules
rulesRouter.get("/session/:sessionId", async (c) => {
  const engine = await getRulesEngine();
  const sessionId = c.req.param("sessionId");
  const rules = engine.getSessionRules(sessionId);
  return c.json(rules);
});

// Update session rules
rulesRouter.put("/session/:sessionId", async (c) => {
  const engine = await getRulesEngine();
  const sessionId = c.req.param("sessionId");
  const body = await c.req.json<{ rules: string[] }>();

  if (!body.rules || !Array.isArray(body.rules)) {
    return c.json({ error: "rules array is required" }, 400);
  }

  engine.setSessionRules(sessionId, body.rules);
  return c.json({ success: true });
});

// Delete session rules
rulesRouter.delete("/session/:sessionId", async (c) => {
  const engine = await getRulesEngine();
  const sessionId = c.req.param("sessionId");
  engine.removeSessionRules(sessionId);
  return c.json({ success: true });
});

// Generate system prompt with rules for a session
rulesRouter.get("/prompt/:sessionId", async (c) => {
  const engine = await getRulesEngine();
  const sessionId = c.req.param("sessionId");
  const customPrompt = c.req.query("customPrompt");

  const prompt = engine.generateSystemPromptWithRules(sessionId, customPrompt);
  return c.json({ prompt });
});
