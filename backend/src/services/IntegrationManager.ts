import { EventEmitter } from "events";
import { Storage, generateId } from "./Storage";
import type {
  Integration,
  IntegrationDefinition,
  IntegrationStatus,
  IntegrationCategory,
  ConnectIntegrationInput,
  IntegrationStats,
  INTEGRATION_DEFINITIONS,
} from "../types/integration";

// Re-export definitions
export { INTEGRATION_DEFINITIONS } from "../types/integration";

export class IntegrationManager extends EventEmitter {
  private storage: Storage<Integration>;

  constructor() {
    super();
    this.storage = new Storage<Integration>("integrations");
  }

  // Get all available integration definitions
  getDefinitions(): IntegrationDefinition[] {
    const { INTEGRATION_DEFINITIONS } = require("../types/integration");
    return INTEGRATION_DEFINITIONS;
  }

  // Get a specific definition
  getDefinition(integrationId: string): IntegrationDefinition | undefined {
    return this.getDefinitions().find((d) => d.id === integrationId);
  }

  // List connected integrations
  list(): Integration[] {
    return this.storage.getAll().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Get a connected integration
  get(id: string): Integration | undefined {
    return this.storage.getById(id);
  }

  // Get integration by definition ID
  getByDefinitionId(integrationId: string): Integration | undefined {
    return this.storage.findOne((i) => i.id === integrationId);
  }

  // Connect an integration
  async connect(input: ConnectIntegrationInput): Promise<Integration> {
    const definition = this.getDefinition(input.integrationId);
    if (!definition) {
      throw new Error(`Integration ${input.integrationId} not found`);
    }

    // Validate required fields
    for (const field of definition.configFields) {
      if (field.required && !input.config[field.name]) {
        throw new Error(`Missing required field: ${field.label}`);
      }
    }

    // Test the connection
    const testResult = await this.testConnection(input.integrationId, input.config);
    if (!testResult.success) {
      throw new Error(`Connection test failed: ${testResult.error}`);
    }

    const now = new Date().toISOString();
    const existing = this.getByDefinitionId(input.integrationId);

    if (existing) {
      // Update existing integration
      const updated = this.storage.update(existing.id, {
        config: input.config,
        status: "connected",
        lastSyncAt: now,
        lastError: undefined,
        updatedAt: now,
      });
      this.emit("integration:updated", updated);
      return updated!;
    }

    // Create new integration
    const integration: Integration = {
      id: input.integrationId,
      name: definition.name,
      description: definition.description,
      category: definition.category,
      status: "connected",
      config: input.config,
      lastSyncAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.storage.create(integration);
    this.emit("integration:connected", integration);
    return integration;
  }

  // Disconnect an integration
  disconnect(id: string): boolean {
    const deleted = this.storage.delete(id);
    if (deleted) {
      this.emit("integration:disconnected", { id });
    }
    return deleted;
  }

  // Test a connection
  async testConnection(
    integrationId: string,
    config: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    const definition = this.getDefinition(integrationId);
    if (!definition) {
      return { success: false, error: "Integration not found" };
    }

    try {
      // Perform integration-specific connection tests
      switch (integrationId) {
        case "github":
          return await this.testGitHubConnection(config);
        case "gitlab":
          return await this.testGitLabConnection(config);
        case "slack":
          return await this.testSlackConnection(config);
        case "discord":
          return await this.testDiscordConnection(config);
        case "aws":
          return await this.testAWSConnection(config);
        case "gcp":
          return await this.testGCPConnection(config);
        case "postgres":
          return await this.testPostgresConnection(config);
        case "mongodb":
          return await this.testMongoDBConnection(config);
        default:
          // Generic validation - just check that required fields are present
          return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
      };
    }
  }

  // Integration-specific test methods (simplified versions)
  private async testGitHubConnection(config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    if (!config.token || !config.token.startsWith("ghp_")) {
      return { success: false, error: "Invalid GitHub token format" };
    }
    // In real implementation, would make API call to verify token
    return { success: true };
  }

  private async testGitLabConnection(config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    if (!config.token) {
      return { success: false, error: "GitLab token is required" };
    }
    return { success: true };
  }

  private async testSlackConnection(config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    if (!config.botToken || !config.botToken.startsWith("xoxb-")) {
      return { success: false, error: "Invalid Slack bot token format" };
    }
    return { success: true };
  }

  private async testDiscordConnection(config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    if (!config.botToken || !config.guildId) {
      return { success: false, error: "Bot token and Guild ID are required" };
    }
    return { success: true };
  }

  private async testAWSConnection(config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    if (!config.accessKeyId || !config.secretAccessKey || !config.region) {
      return { success: false, error: "All AWS credentials are required" };
    }
    return { success: true };
  }

  private async testGCPConnection(config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    if (!config.projectId || !config.credentials) {
      return { success: false, error: "Project ID and credentials are required" };
    }
    try {
      JSON.parse(config.credentials);
    } catch {
      return { success: false, error: "Invalid JSON credentials" };
    }
    return { success: true };
  }

  private async testPostgresConnection(config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    if (!config.host || !config.database || !config.user || !config.password) {
      return { success: false, error: "All connection fields are required" };
    }
    return { success: true };
  }

  private async testMongoDBConnection(config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    if (!config.connectionString || !config.connectionString.startsWith("mongodb")) {
      return { success: false, error: "Invalid MongoDB connection string" };
    }
    return { success: true };
  }

  // Sync an integration
  async sync(id: string): Promise<Integration | undefined> {
    const integration = this.storage.getById(id);
    if (!integration) return undefined;

    try {
      // Test connection
      const testResult = await this.testConnection(id, integration.config);
      if (!testResult.success) {
        throw new Error(testResult.error);
      }

      const now = new Date().toISOString();
      const updated = this.storage.update(id, {
        status: "connected",
        lastSyncAt: now,
        lastError: undefined,
        updatedAt: now,
      });

      this.emit("integration:synced", updated);
      return updated;
    } catch (error) {
      const updated = this.storage.update(id, {
        status: "error",
        lastError: error instanceof Error ? error.message : "Sync failed",
        updatedAt: new Date().toISOString(),
      });

      this.emit("integration:sync-failed", { id, error });
      return updated;
    }
  }

  // Get stats
  getStats(): IntegrationStats {
    const integrations = this.storage.getAll();
    const definitions = this.getDefinitions();

    const byCategory: Record<IntegrationCategory, number> = {
      vcs: 0,
      communication: 0,
      cloud: 0,
      database: 0,
    };

    for (const integration of integrations) {
      byCategory[integration.category]++;
    }

    return {
      total: definitions.length,
      connected: integrations.filter((i) => i.status === "connected").length,
      error: integrations.filter((i) => i.status === "error").length,
      byCategory,
    };
  }

  // Get combined view of definitions with connection status
  getIntegrationsWithStatus(): (IntegrationDefinition & { connected: boolean; status?: IntegrationStatus; lastSyncAt?: string })[] {
    const definitions = this.getDefinitions();
    const connections = this.storage.getAll();

    return definitions.map((def) => {
      const connection = connections.find((c) => c.id === def.id);
      return {
        ...def,
        connected: !!connection,
        status: connection?.status,
        lastSyncAt: connection?.lastSyncAt,
      };
    });
  }
}
