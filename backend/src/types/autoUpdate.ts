// Auto-Update Types

export interface UpdateInfo {
  version: string;
  releaseDate: Date;
  changelog: string[];
  downloadUrl: string;
  checksum: string;
  size: number;
  mandatory: boolean;
}

export interface HostVersion {
  hostId: string;
  hostName: string;
  platform: "windows" | "macos" | "linux";
  claudeVersion: string;
  agentVersion: string;
  status: "up_to_date" | "outdated" | "updating" | "error";
  lastChecked: Date;
  lastUpdated?: Date;
  updateError?: string;
}

export interface UpdateSchedule {
  mode: "immediate" | "scheduled" | "manual";
  scheduledTime?: string; // "02:00"
  scheduledDays?: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  timezone: string;
}

export interface UpdateSettings {
  autoCheck: boolean;
  checkIntervalHours: number;
  schedule: UpdateSchedule;
  pauseSessions: boolean;
  createBackup: boolean;
  autoRollback: boolean;
  notifyOnUpdate: boolean;
}

export interface UpdateOperation {
  id: string;
  type: "check" | "download" | "install" | "rollback";
  hostIds: string[];
  targetVersion: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  currentHost?: string;
  results: UpdateResult[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface UpdateResult {
  hostId: string;
  hostName: string;
  success: boolean;
  previousVersion: string;
  newVersion?: string;
  error?: string;
  duration: number;
}

export interface UpdateHistory {
  id: string;
  timestamp: Date;
  fromVersion: string;
  toVersion: string;
  hosts: string[];
  success: boolean;
  rollbackAvailable: boolean;
}

export interface RollbackInfo {
  version: string;
  backupPath: string;
  createdAt: Date;
  hosts: string[];
}
