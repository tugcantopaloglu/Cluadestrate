import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import * as crypto from "crypto";
import {
  N8nConfig,
  N8nOutgoingWebhook,
  N8nEventType,
  N8nWebhookPayload,
  N8nCreateSessionRequest,
  N8nSessionInputRequest,
  N8nCreateTaskRequest,
  N8nTriggerWorkflowRequest,
  N8nApiResponse,
} from "../types/n8n";

export class N8nManager extends EventEmitter {
  private config: N8nConfig = {
    enabled: false,
    instanceUrl: "",
    apiKey: "",
    webhookSecret: crypto.randomBytes(32).toString("hex"),
    outgoingWebhooks: [],
    status: "disconnected",
  };

  constructor() {
    super();
  }

  // Configuration
  getConfig(): Omit<N8nConfig, "apiKey" | "webhookSecret"> & { hasApiKey: boolean; hasWebhookSecret: boolean } {
    return {
      enabled: this.config.enabled,
      instanceUrl: this.config.instanceUrl,
      outgoingWebhooks: this.config.outgoingWebhooks,
      status: this.config.status,
      lastConnected: this.config.lastConnected,
      error: this.config.error,
      hasApiKey: !!this.config.apiKey,
      hasWebhookSecret: !!this.config.webhookSecret,
    };
  }

  async updateConfig(updates: {
    enabled?: boolean;
    instanceUrl?: string;
    apiKey?: string;
  }): Promise<void> {
    if (updates.enabled !== undefined) this.config.enabled = updates.enabled;
    if (updates.instanceUrl) this.config.instanceUrl = updates.instanceUrl;
    if (updates.apiKey) this.config.apiKey = updates.apiKey;

    if (this.config.enabled && this.config.instanceUrl && this.config.apiKey) {
      await this.testConnection();
    } else {
      this.config.status = "disconnected";
    }

    this.emit("config:updated", this.getConfig());
  }

  // Connection
  async testConnection(): Promise<boolean> {
    try {
      // In production, would actually ping n8n instance
      const response = await fetch(`${this.config.instanceUrl}/api/v1/workflows`, {
        headers: {
          "X-N8N-API-KEY": this.config.apiKey,
        },
      }).catch(() => null);

      if (response?.ok) {
        this.config.status = "connected";
        this.config.lastConnected = new Date();
        this.config.error = undefined;
        this.emit("connection:success");
        return true;
      } else {
        throw new Error("Failed to connect to n8n instance");
      }
    } catch (error) {
      this.config.status = "error";
      this.config.error = (error as Error).message;
      this.emit("connection:failed", { error: this.config.error });
      return false;
    }
  }

  // Outgoing Webhooks
  addOutgoingWebhook(data: {
    eventType: N8nEventType;
    webhookUrl: string;
    headers?: Record<string, string>;
    retryOnFailure?: boolean;
    maxRetries?: number;
  }): N8nOutgoingWebhook {
    const webhook: N8nOutgoingWebhook = {
      id: randomUUID(),
      eventType: data.eventType,
      webhookUrl: data.webhookUrl,
      enabled: true,
      headers: data.headers,
      retryOnFailure: data.retryOnFailure ?? true,
      maxRetries: data.maxRetries ?? 3,
      successCount: 0,
      failureCount: 0,
    };

    this.config.outgoingWebhooks.push(webhook);
    this.emit("webhook:added", webhook);
    return webhook;
  }

  removeOutgoingWebhook(id: string): boolean {
    const index = this.config.outgoingWebhooks.findIndex((w) => w.id === id);
    if (index === -1) return false;

    this.config.outgoingWebhooks.splice(index, 1);
    this.emit("webhook:removed", { id });
    return true;
  }

  toggleOutgoingWebhook(id: string): N8nOutgoingWebhook | null {
    const webhook = this.config.outgoingWebhooks.find((w) => w.id === id);
    if (!webhook) return null;

    webhook.enabled = !webhook.enabled;
    this.emit("webhook:toggled", webhook);
    return webhook;
  }

  listOutgoingWebhooks(): N8nOutgoingWebhook[] {
    return [...this.config.outgoingWebhooks];
  }

  // Trigger webhook for event
  async triggerWebhook(eventType: N8nEventType, data: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled) return;

    const webhooks = this.config.outgoingWebhooks.filter(
      (w) => w.enabled && w.eventType === eventType
    );

    for (const webhook of webhooks) {
      const payload: N8nWebhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data,
        signature: this.generateSignature(data),
      };

      await this.sendWebhook(webhook, payload);
    }
  }

  private async sendWebhook(
    webhook: N8nOutgoingWebhook,
    payload: N8nWebhookPayload,
    attempt: number = 1
  ): Promise<void> {
    try {
      const response = await fetch(webhook.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Orchestrate-Signature": payload.signature,
          ...webhook.headers,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        webhook.successCount++;
        webhook.lastTriggered = new Date();
        this.emit("webhook:success", { webhookId: webhook.id, event: payload.event });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      webhook.failureCount++;
      this.emit("webhook:failed", {
        webhookId: webhook.id,
        event: payload.event,
        error: (error as Error).message,
        attempt,
      });

      // Retry if enabled
      if (webhook.retryOnFailure && attempt < webhook.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise((r) => setTimeout(r, delay));
        await this.sendWebhook(webhook, payload, attempt + 1);
      }
    }
  }

  // Generate HMAC signature
  private generateSignature(data: unknown): string {
    const hmac = crypto.createHmac("sha256", this.config.webhookSecret);
    hmac.update(JSON.stringify(data));
    return hmac.digest("hex");
  }

  // Verify incoming webhook signature
  verifySignature(payload: unknown, signature: string): boolean {
    const expected = this.generateSignature(payload);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  // Incoming API handlers (called from routes)
  async handleCreateSession(request: N8nCreateSessionRequest): Promise<N8nApiResponse> {
    // This would integrate with SessionManager
    this.emit("api:create-session", request);
    return {
      success: true,
      data: { message: "Session creation queued", request },
      requestId: randomUUID(),
    };
  }

  async handleSessionInput(
    sessionId: string,
    request: N8nSessionInputRequest
  ): Promise<N8nApiResponse> {
    this.emit("api:session-input", { sessionId, ...request });
    return {
      success: true,
      data: { message: "Input sent", sessionId },
      requestId: randomUUID(),
    };
  }

  async handleCreateTask(request: N8nCreateTaskRequest): Promise<N8nApiResponse> {
    this.emit("api:create-task", request);
    return {
      success: true,
      data: { message: "Task creation queued", request },
      requestId: randomUUID(),
    };
  }

  async handleTriggerWorkflow(request: N8nTriggerWorkflowRequest): Promise<N8nApiResponse> {
    this.emit("api:trigger-workflow", request);
    return {
      success: true,
      data: { message: "Workflow trigger queued", request },
      requestId: randomUUID(),
    };
  }

  // Stats
  getStats() {
    const webhooks = this.config.outgoingWebhooks;
    return {
      enabled: this.config.enabled,
      status: this.config.status,
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter((w) => w.enabled).length,
      totalSuccess: webhooks.reduce((sum, w) => sum + w.successCount, 0),
      totalFailures: webhooks.reduce((sum, w) => sum + w.failureCount, 0),
      lastConnected: this.config.lastConnected,
    };
  }
}
