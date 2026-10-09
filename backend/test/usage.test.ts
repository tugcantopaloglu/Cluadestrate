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
