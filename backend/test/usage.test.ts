import assert from "node:assert/strict";
import { test } from "node:test";
import { UsageTracker } from "../src/services/UsageTracker.js";

test("zero daily limit disables percentage alerts while finite limits retain alerts", async () => {
  const unlimited = new UsageTracker();
  unlimited.setDailyLimit(0);
  await unlimited.trackUsage("fixture", { input: 10, output: 10, total: 20 });
  assert.deepEqual(unlimited.getAlerts(), []);
  const limited = new UsageTracker();
  limited.setDailyLimit(20);
  await limited.trackUsage("fixture", { input: 10, output: 10, total: 20 });
  assert.equal(limited.getAlerts()[0].type, "critical");
  assert.equal(limited.getAlerts()[0].currentUsage, 100);
});

test("usage summaries and history retain measured request and token breakdowns", async () => {
  const tracker = new UsageTracker();
  await tracker.trackUsage("first", { input: 10, output: 20, total: 30 });
  await tracker.trackUsage("first", { input: 5, output: 15, total: 20 });
  await tracker.trackUsage("second", { input: 2, output: 3, total: 5 });
  const summary = await tracker.getSummary();
  assert.equal(summary.bySession.first.inputTokens, 15);
  assert.equal(summary.bySession.first.outputTokens, 35);
  assert.equal(summary.bySession.first.requests, 2);
  const history = await tracker.getHistory(3);
  assert.equal(history[0].tokens, 0);
  assert.equal(history[2].inputTokens, 17);
  assert.equal(history[2].outputTokens, 38);
  assert.equal(history[2].sessionCount, 2);
  assert.equal(history[2].sessions.find((session) => session.sessionId === "first")?.totalTokens, 50);
});
