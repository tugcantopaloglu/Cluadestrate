import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import {
  UpdateInfo,
  HostVersion,
  UpdateSettings,
  UpdateOperation,
  UpdateResult,
  UpdateHistory,
  RollbackInfo,
} from "../types/autoUpdate";

export class AutoUpdateManager extends EventEmitter {
  private hostVersions: Map<string, HostVersion> = new Map();
  private operations: Map<string, UpdateOperation> = new Map();
  private history: UpdateHistory[] = [];
  private rollbacks: Map<string, RollbackInfo> = new Map();
  private checkInterval: NodeJS.Timer | null = null;
  private latestVersion: UpdateInfo | null = null;

  private settings: UpdateSettings = {
    autoCheck: true,
    checkIntervalHours: 24,
    schedule: {
      mode: "scheduled",
      scheduledTime: "02:00",
      scheduledDays: ["mon", "tue", "wed", "thu", "fri"],
      timezone: "UTC",
    },
    pauseSessions: true,
    createBackup: true,
    autoRollback: true,
    notifyOnUpdate: true,
  };

  constructor() {
    super();
    if (this.settings.autoCheck) {
      this.startAutoCheck();
    }
  }

  // Host Version Management
  registerHost(data: {
    hostId: string;
    hostName: string;
    platform: "windows" | "macos" | "linux";
    claudeVersion: string;
    agentVersion: string;
  }): HostVersion {
    const hostVersion: HostVersion = {
      ...data,
      status: "up_to_date",
      lastChecked: new Date(),
    };

    this.hostVersions.set(data.hostId, hostVersion);
    this.emit("host:registered", hostVersion);

    // Check if outdated
    if (this.latestVersion && data.claudeVersion < this.latestVersion.version) {
      hostVersion.status = "outdated";
      this.hostVersions.set(data.hostId, hostVersion);
    }

    return hostVersion;
  }

  unregisterHost(hostId: string): boolean {
    const result = this.hostVersions.delete(hostId);
    if (result) {
      this.emit("host:unregistered", { hostId });
    }
    return result;
  }

  getHostVersion(hostId: string): HostVersion | undefined {
    return this.hostVersions.get(hostId);
  }

  listHostVersions(): HostVersion[] {
    return Array.from(this.hostVersions.values());
  }

  // Update Checking
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      // Simulate checking for updates (in production, would fetch from Anthropic)
      const mockUpdate: UpdateInfo = {
        version: "1.0.53",
        releaseDate: new Date(),
        changelog: [
          "Improved streaming performance",
          "New MCP server support",
          "Bug fixes and stability improvements",
        ],
        downloadUrl: "https://api.anthropic.com/releases/claude-code/1.0.53",
        checksum: "abc123def456",
        size: 52428800, // 50MB
        mandatory: false,
      };

      this.latestVersion = mockUpdate;

      // Update host statuses
      for (const [hostId, host] of this.hostVersions) {
        if (host.claudeVersion < mockUpdate.version) {
          host.status = "outdated";
          host.lastChecked = new Date();
          this.hostVersions.set(hostId, host);
        }
      }

      this.emit("update:available", mockUpdate);
      return mockUpdate;
    } catch (error) {
      this.emit("update:check-failed", { error: (error as Error).message });
      return null;
    }
  }

  getLatestVersion(): UpdateInfo | null {
    return this.latestVersion;
  }

  // Update Operations
  async updateHosts(hostIds: string[]): Promise<UpdateOperation> {
    if (!this.latestVersion) {
      throw new Error("No update available");
    }

    const operation: UpdateOperation = {
      id: randomUUID(),
      type: "install",
      hostIds,
      targetVersion: this.latestVersion.version,
      status: "running",
      progress: 0,
      results: [],
      startedAt: new Date(),
    };

    this.operations.set(operation.id, operation);
    this.emit("update:started", operation);

    // Process updates sequentially
    for (let i = 0; i < hostIds.length; i++) {
      const hostId = hostIds[i];
      const host = this.hostVersions.get(hostId);

      if (!host) continue;

      operation.currentHost = hostId;
      operation.progress = Math.round((i / hostIds.length) * 100);
      this.operations.set(operation.id, operation);
      this.emit("update:progress", { operationId: operation.id, progress: operation.progress });

      // Update host status
      host.status = "updating";
      this.hostVersions.set(hostId, host);

      const startTime = Date.now();
      const result: UpdateResult = {
        hostId,
        hostName: host.hostName,
        success: false,
        previousVersion: host.claudeVersion,
        duration: 0,
      };

      try {
        // Create backup if enabled
        if (this.settings.createBackup) {
          await this.createBackup(hostId, host.claudeVersion);
        }

        // Simulate update process
        await new Promise((r) => setTimeout(r, 2000));

        result.success = true;
        result.newVersion = this.latestVersion!.version;
        host.claudeVersion = this.latestVersion!.version;
        host.status = "up_to_date";
        host.lastUpdated = new Date();
      } catch (error) {
        result.error = (error as Error).message;
        host.status = "error";
        host.updateError = result.error;

        // Auto rollback if enabled
        if (this.settings.autoRollback) {
          await this.rollbackHost(hostId);
        }
      }

      result.duration = Date.now() - startTime;
      operation.results.push(result);
      this.hostVersions.set(hostId, host);
    }

    operation.status = operation.results.every((r) => r.success) ? "completed" : "failed";
    operation.progress = 100;
    operation.completedAt = new Date();
    this.operations.set(operation.id, operation);

    // Add to history
    this.history.push({
      id: randomUUID(),
      timestamp: new Date(),
      fromVersion: operation.results[0]?.previousVersion || "unknown",
      toVersion: operation.targetVersion,
      hosts: hostIds,
      success: operation.status === "completed",
      rollbackAvailable: this.settings.createBackup,
    });

    this.emit("update:completed", operation);
    return operation;
  }

  async updateAllHosts(): Promise<UpdateOperation> {
    const hostIds = Array.from(this.hostVersions.keys());
    return this.updateHosts(hostIds);
  }

  // Backup and Rollback
  private async createBackup(hostId: string, version: string): Promise<void> {
    const backupPath = path.join(process.cwd(), "data", "backups", hostId, version);

    // Simulate backup creation
    if (!fs.existsSync(path.dirname(backupPath))) {
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    }

    const rollback: RollbackInfo = {
      version,
      backupPath,
      createdAt: new Date(),
      hosts: [hostId],
    };

    this.rollbacks.set(`${hostId}:${version}`, rollback);
    this.emit("backup:created", rollback);
  }

  async rollbackHost(hostId: string): Promise<UpdateResult> {
    const host = this.hostVersions.get(hostId);
    if (!host) throw new Error("Host not found");

    // Find latest backup for this host
    const backupKey = Array.from(this.rollbacks.keys())
      .filter((k) => k.startsWith(`${hostId}:`))
      .sort()
      .pop();

    if (!backupKey) {
      throw new Error("No backup available for rollback");
    }

    const rollback = this.rollbacks.get(backupKey)!;
    const startTime = Date.now();

    try {
      // Simulate rollback
      await new Promise((r) => setTimeout(r, 1000));

      host.claudeVersion = rollback.version;
      host.status = "up_to_date";
      host.updateError = undefined;
      this.hostVersions.set(hostId, host);

      this.emit("rollback:completed", { hostId, version: rollback.version });

      return {
        hostId,
        hostName: host.hostName,
        success: true,
        previousVersion: host.claudeVersion,
        newVersion: rollback.version,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        hostId,
        hostName: host.hostName,
        success: false,
        previousVersion: host.claudeVersion,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      };
    }
  }

  // Schedule Management
  private startAutoCheck(): void {
    const intervalMs = this.settings.checkIntervalHours * 60 * 60 * 1000;
    this.checkInterval = setInterval(() => {
      if (this.shouldCheckNow()) {
        this.checkForUpdates();
      }
    }, intervalMs);
  }

  private stopAutoCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private shouldCheckNow(): boolean {
    const schedule = this.settings.schedule;
    if (schedule.mode === "manual") return false;
    if (schedule.mode === "immediate") return true;

    const now = new Date();
    const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()];

    if (schedule.scheduledDays && !schedule.scheduledDays.includes(day as any)) {
      return false;
    }

    if (schedule.scheduledTime) {
      const [hours, minutes] = schedule.scheduledTime.split(":").map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check within 5 minute window
      if (currentHour !== hours || Math.abs(currentMinute - minutes) > 5) {
        return false;
      }
    }

    return true;
  }

  // Settings
  getSettings(): UpdateSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<UpdateSettings>): UpdateSettings {
    const wasAutoCheck = this.settings.autoCheck;
    this.settings = { ...this.settings, ...updates };

    if (updates.autoCheck !== undefined) {
      if (updates.autoCheck && !wasAutoCheck) {
        this.startAutoCheck();
      } else if (!updates.autoCheck && wasAutoCheck) {
        this.stopAutoCheck();
      }
    }

    this.emit("settings:updated", this.settings);
    return this.settings;
  }

  // Operations and History
  getOperation(id: string): UpdateOperation | undefined {
    return this.operations.get(id);
  }

  listOperations(): UpdateOperation[] {
    return Array.from(this.operations.values());
  }

  getHistory(): UpdateHistory[] {
    return [...this.history];
  }

  // Stats
  getStats() {
    const hosts = Array.from(this.hostVersions.values());
    return {
      totalHosts: hosts.length,
      upToDate: hosts.filter((h) => h.status === "up_to_date").length,
      outdated: hosts.filter((h) => h.status === "outdated").length,
      updating: hosts.filter((h) => h.status === "updating").length,
      errors: hosts.filter((h) => h.status === "error").length,
      latestVersion: this.latestVersion?.version,
      lastCheck: Math.max(...hosts.map((h) => h.lastChecked.getTime())),
      pendingUpdates: hosts.filter((h) => h.status === "outdated").length,
    };
  }
}
