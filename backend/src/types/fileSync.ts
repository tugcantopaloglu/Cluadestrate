// File Sync Types

export interface SyncedFolder {
  id: string;
  hostId: string;
  hostName: string;
  remotePath: string;
  localPath: string;
  status: "synced" | "syncing" | "error" | "pending";
  fileCount: number;
  totalSize: number;
  lastSync?: Date;
  syncError?: string;
  patterns: {
    include: string[];
    exclude: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncedFile {
  id: string;
  folderId: string;
  hostId: string;
  remotePath: string;
  localPath: string;
  filename: string;
  size: number;
  mimeType: string;
  checksum: string;
  status: "synced" | "modified" | "conflict" | "deleted";
  versions: FileVersion[];
  lastModified: Date;
  syncedAt: Date;
}

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  checksum: string;
  size: number;
  source: "local" | "remote";
  createdAt: Date;
  storagePath: string;
}

export interface FileSyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncIntervalMs: number;
  maxVersionHistory: number;
  conflictResolution: "local" | "remote" | "newest" | "manual";
  watchForChanges: boolean;
}

export interface SyncOperation {
  id: string;
  type: "upload" | "download" | "delete" | "conflict";
  folderId: string;
  fileId?: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface FileSyncStats {
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
  syncedFiles: number;
  pendingFiles: number;
  conflictFiles: number;
  lastSyncAt?: Date;
}

export interface AttachFileToSessionRequest {
  fileId: string;
  sessionId: string;
}

export interface SessionAttachedFile {
  fileId: string;
  sessionId: string;
  filename: string;
  localPath: string;
  attachedAt: Date;
}

export interface ConflictResolution {
  fileId: string;
  resolution: "keep_local" | "keep_remote" | "keep_both" | "merge";
  mergedContent?: string;
}
