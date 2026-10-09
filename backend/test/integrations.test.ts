import assert from "node:assert/strict";
import { test } from "node:test";
import { createIntegrationRoutes } from "../src/routes/integrations.js";

test("every integration response redacts credential values", async () => {
  const integration = { id: "fixture", config: { token: "fixture-secret", endpoint: "fixture-endpoint" } };
  const manager = {
    list: () => [integration], get: () => integration,
    connect: async () => integration, sync: async () => integration,
  };
  const router = createIntegrationRoutes(manager as never);
  for (const [endpoint, method] of [["/connected", "GET"], ["/fixture", "GET"], ["/connect", "POST"], ["/fixture/sync", "POST"]]) {
    const response = await router.request(endpoint, {
      method, headers: { "content-type": "application/json" },
      ...(method === "POST" ? { body: "{}" } : {}),
    });
    const data = await response.json();
    assert.deepEqual((Array.isArray(data) ? data[0] : data).config, { token: "***", endpoint: "***" });
    assert.equal(JSON.stringify(data).includes("fixture-secret"), false);
  }
  assert.equal(integration.config.token, "fixture-secret");
});
