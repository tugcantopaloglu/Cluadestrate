import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import chokidar, { FSWatcher } from "chokidar";
import {
  SyncedFolder,
  SyncedFile,
  FileVersion,
  FileSyncConfig,
  SyncOperation,
  FileSyncStats,
  SessionAttachedFile,
  ConflictResolution,
} from "../types/fileSync";

export class FileSyncManager extends EventEmitter {
  private folders: Map<string, SyncedFolder> = new Map();
  private files: Map<string, SyncedFile> = new Map();
  private versions: Map<string, FileVersion[]> = new Map();
  private operations: Map<string, SyncOperation> = new Map();
  private sessionAttachments: Map<string, SessionAttachedFile[]> = new Map();
  private watchers: Map<string, FSWatcher> = new Map();
  private syncBasePath: string;
  private config: FileSyncConfig = {
    enabled: true,
    autoSync: true,
    syncIntervalMs: 30000,
    maxVersionHistory: 10,
    conflictResolution: "newest",
    watchForChanges: true,
  };

  constructor() {
    super();
    this.syncBasePath = path.join(process.cwd(), "data", "synced-files");
    this.ensureSyncDirectory();
  }

  private ensureSyncDirectory(): void {
    if (!fs.existsSync(this.syncBasePath)) {
      fs.mkdirSync(this.syncBasePath, { recursive: true });
    }
  }

  // Folder Management
  addFolder(data: {
    hostId: string;
    hostName: string;
    remotePath: string;
    patterns?: { include?: string[]; exclude?: string[] };
  }): SyncedFolder {
    const id = randomUUID();
    const localPath = path.join(this.syncBasePath, id);

    fs.mkdirSync(localPath, { recursive: true });

    const folder: SyncedFolder = {
      id,
      hostId: data.hostId,
      hostName: data.hostName,
      remotePath: data.remotePath,
      localPath,
      status: "pending",
      fileCount: 0,
      totalSize: 0,
      patterns: {
        include: data.patterns?.include || ["*"],
        exclude: data.patterns?.exclude || ["node_modules", ".git", "*.log"],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.folders.set(id, folder);
    this.emit("folder:added", folder);

    if (this.config.watchForChanges) {
      this.startWatching(id);
    }

    return folder;
  }

  removeFolder(id: string): boolean {
    const folder = this.folders.get(id);
    if (!folder) return false;

    this.stopWatching(id);

    // Remove all files in folder
    for (const [fileId, file] of this.files) {
      if (file.folderId === id) {
        this.files.delete(fileId);
        this.versions.delete(fileId);
      }
    }

    // Remove local files
    if (fs.existsSync(folder.localPath)) {
      fs.rmSync(folder.localPath, { recursive: true, force: true });
    }

    this.folders.delete(id);
    this.emit("folder:removed", { id });
    return true;
  }

  getFolder(id: string): SyncedFolder | undefined {
    return this.folders.get(id);
  }

  listFolders(): SyncedFolder[] {
    return Array.from(this.folders.values());
  }

  getFoldersByHost(hostId: string): SyncedFolder[] {
    return Array.from(this.folders.values()).filter((f) => f.hostId === hostId);
  }

  // File Management
  async addFile(
    folderId: string,
    remotePath: string,
    content: Buffer | string
  ): Promise<SyncedFile> {
    const folder = this.folders.get(folderId);
    if (!folder) throw new Error("Folder not found");

    const id = randomUUID();
    const filename = path.basename(remotePath);
    const localPath = path.join(folder.localPath, remotePath);
    const localDir = path.dirname(localPath);

    // Ensure directory exists
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    // Write file
    const buffer = typeof content === "string" ? Buffer.from(content) : content;
    fs.writeFileSync(localPath, buffer);

    const checksum = this.calculateChecksum(buffer);
    const stats = fs.statSync(localPath);

    const file: SyncedFile = {
      id,
      folderId,
      hostId: folder.hostId,
      remotePath,
      localPath,
      filename,
      size: stats.size,
      mimeType: this.getMimeType(filename),
      checksum,
      status: "synced",
      versions: [],
      lastModified: stats.mtime,
      syncedAt: new Date(),
    };

    this.files.set(id, file);
    this.createVersion(id, buffer, "remote");

    // Update folder stats
    folder.fileCount++;
    folder.totalSize += stats.size;
    folder.updatedAt = new Date();
    this.folders.set(folderId, folder);

    this.emit("file:added", file);
    return file;
  }

  updateFile(id: string, content: Buffer | string): SyncedFile {
    const file = this.files.get(id);
    if (!file) throw new Error("File not found");

    const buffer = typeof content === "string" ? Buffer.from(content) : content;
    const newChecksum = this.calculateChecksum(buffer);

    if (newChecksum !== file.checksum) {
      // Create version before updating
      this.createVersion(id, fs.readFileSync(file.localPath), "local");

      fs.writeFileSync(file.localPath, buffer);
      const stats = fs.statSync(file.localPath);

      // Update folder size
      const folder = this.folders.get(file.folderId);
      if (folder) {
        folder.totalSize = folder.totalSize - file.size + stats.size;
        folder.updatedAt = new Date();
        this.folders.set(file.folderId, folder);
      }

      file.size = stats.size;
      file.checksum = newChecksum;
      file.lastModified = stats.mtime;
      file.status = "modified";
      this.files.set(id, file);

      this.emit("file:updated", file);
    }

    return file;
  }

  deleteFile(id: string): boolean {
    const file = this.files.get(id);
    if (!file) return false;

    // Update folder stats
    const folder = this.folders.get(file.folderId);
    if (folder) {
      folder.fileCount--;
      folder.totalSize -= file.size;
      folder.updatedAt = new Date();
      this.folders.set(file.folderId, folder);
    }

    // Delete local file
    if (fs.existsSync(file.localPath)) {
      fs.unlinkSync(file.localPath);
    }

    // Delete versions
    const versions = this.versions.get(id) || [];
    for (const version of versions) {
      if (fs.existsSync(version.storagePath)) {
        fs.unlinkSync(version.storagePath);
      }
    }
    this.versions.delete(id);

    this.files.delete(id);
    this.emit("file:deleted", { id });
    return true;
  }

  getFile(id: string): SyncedFile | undefined {
    return this.files.get(id);
  }

  getFileContent(id: string): Buffer | null {
    const file = this.files.get(id);
    if (!file || !fs.existsSync(file.localPath)) return null;
    return fs.readFileSync(file.localPath);
  }

  listFiles(folderId?: string): SyncedFile[] {
    const files = Array.from(this.files.values());
    if (folderId) {
      return files.filter((f) => f.folderId === folderId);
    }
    return files;
  }

  searchFiles(query: string): SyncedFile[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.files.values()).filter(
      (f) =>
        f.filename.toLowerCase().includes(lowerQuery) ||
        f.remotePath.toLowerCase().includes(lowerQuery)
    );
  }

  // Version Management
  private createVersion(
    fileId: string,
    content: Buffer,
    source: "local" | "remote"
  ): FileVersion {
    const file = this.files.get(fileId);
    if (!file) throw new Error("File not found");

    const versions = this.versions.get(fileId) || [];
    const versionNum = versions.length + 1;
    const id = randomUUID();

    const versionDir = path.join(this.syncBasePath, ".versions", fileId);
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }

    const storagePath = path.join(versionDir, `v${versionNum}`);
    fs.writeFileSync(storagePath, content);

    const version: FileVersion = {
      id,
      fileId,
      version: versionNum,
      checksum: this.calculateChecksum(content),
      size: content.length,
      source,
      createdAt: new Date(),
      storagePath,
    };

    versions.push(version);

    // Trim old versions
    while (versions.length > this.config.maxVersionHistory) {
      const oldest = versions.shift();
      if (oldest && fs.existsSync(oldest.storagePath)) {
        fs.unlinkSync(oldest.storagePath);
      }
    }

    this.versions.set(fileId, versions);
    return version;
  }

  getVersions(fileId: string): FileVersion[] {
    return this.versions.get(fileId) || [];
  }

  restoreVersion(fileId: string, versionId: string): SyncedFile {
    const file = this.files.get(fileId);
    if (!file) throw new Error("File not found");

    const versions = this.versions.get(fileId) || [];
    const version = versions.find((v) => v.id === versionId);
    if (!version) throw new Error("Version not found");

    const content = fs.readFileSync(version.storagePath);
    return this.updateFile(fileId, content);
  }

  // Conflict Resolution
  markConflict(fileId: string): void {
    const file = this.files.get(fileId);
    if (!file) return;

    file.status = "conflict";
    this.files.set(fileId, file);
    this.emit("file:conflict", file);
  }

  resolveConflict(resolution: ConflictResolution): SyncedFile {
    const file = this.files.get(resolution.fileId);
    if (!file) throw new Error("File not found");

    switch (resolution.resolution) {
      case "keep_local":
        file.status = "synced";
        break;
      case "keep_remote":
        // Would need to fetch from remote - for now just mark resolved
        file.status = "synced";
        break;
      case "keep_both":
        // Create a copy with conflict suffix
        const conflictPath = file.localPath.replace(
          /(\.[^.]+)$/,
          `_conflict_${Date.now()}$1`
        );
        fs.copyFileSync(file.localPath, conflictPath);
        file.status = "synced";
        break;
      case "merge":
        if (resolution.mergedContent) {
          this.updateFile(file.id, resolution.mergedContent);
        }
        file.status = "synced";
        break;
    }

    this.files.set(file.id, file);
    this.emit("conflict:resolved", { fileId: file.id, resolution: resolution.resolution });
    return file;
  }

  getConflicts(): SyncedFile[] {
    return Array.from(this.files.values()).filter((f) => f.status === "conflict");
  }

  // Session Attachments
  attachFileToSession(fileId: string, sessionId: string): SessionAttachedFile {
    const file = this.files.get(fileId);
    if (!file) throw new Error("File not found");

    const attachment: SessionAttachedFile = {
      fileId,
      sessionId,
      filename: file.filename,
      localPath: file.localPath,
      attachedAt: new Date(),
    };

    const attachments = this.sessionAttachments.get(sessionId) || [];
    if (!attachments.find((a) => a.fileId === fileId)) {
      attachments.push(attachment);
      this.sessionAttachments.set(sessionId, attachments);
      this.emit("file:attached", attachment);
    }

    return attachment;
  }

  detachFileFromSession(fileId: string, sessionId: string): boolean {
    const attachments = this.sessionAttachments.get(sessionId) || [];
    const index = attachments.findIndex((a) => a.fileId === fileId);
    if (index === -1) return false;

    attachments.splice(index, 1);
    this.sessionAttachments.set(sessionId, attachments);
    this.emit("file:detached", { fileId, sessionId });
    return true;
  }

  getSessionAttachments(sessionId: string): SessionAttachedFile[] {
    return this.sessionAttachments.get(sessionId) || [];
  }

  // File Watching
  private startWatching(folderId: string): void {
    const folder = this.folders.get(folderId);
    if (!folder) return;

    const watcher = chokidar.watch(folder.localPath, {
      ignoreInitial: true,
      ignored: folder.patterns.exclude.map((p) => `**/${p}`),
    });

    watcher.on("change", (filePath) => {
      const relativePath = path.relative(folder.localPath, filePath);
      const file = Array.from(this.files.values()).find(
        (f) => f.folderId === folderId && f.localPath === filePath
      );
      if (file) {
        const content = fs.readFileSync(filePath);
        this.updateFile(file.id, content);
      }
    });

    watcher.on("add", async (filePath) => {
      const relativePath = path.relative(folder.localPath, filePath);
      const existing = Array.from(this.files.values()).find(
        (f) => f.folderId === folderId && f.localPath === filePath
      );
      if (!existing) {
        const content = fs.readFileSync(filePath);
        await this.addFile(folderId, relativePath, content);
      }
    });

    watcher.on("unlink", (filePath) => {
      const file = Array.from(this.files.values()).find(
        (f) => f.folderId === folderId && f.localPath === filePath
      );
      if (file) {
        this.deleteFile(file.id);
      }
    });

    this.watchers.set(folderId, watcher);
  }

  private stopWatching(folderId: string): void {
    const watcher = this.watchers.get(folderId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(folderId);
    }
  }

  // Sync Operations
  async syncFolder(folderId: string): Promise<SyncOperation> {
    const folder = this.folders.get(folderId);
    if (!folder) throw new Error("Folder not found");

    const operation: SyncOperation = {
      id: randomUUID(),
      type: "download",
      folderId,
      status: "running",
      progress: 0,
      startedAt: new Date(),
    };

    this.operations.set(operation.id, operation);
    folder.status = "syncing";
    this.folders.set(folderId, folder);
    this.emit("sync:started", operation);

    try {
      // Simulate sync progress
      for (let i = 0; i <= 100; i += 10) {
        operation.progress = i;
        this.operations.set(operation.id, operation);
        this.emit("sync:progress", { operationId: operation.id, progress: i });
        await new Promise((r) => setTimeout(r, 100));
      }

      operation.status = "completed";
      operation.completedAt = new Date();
      folder.status = "synced";
      folder.lastSync = new Date();
    } catch (error) {
      operation.status = "failed";
      operation.error = (error as Error).message;
      folder.status = "error";
      folder.syncError = (error as Error).message;
    }

    this.operations.set(operation.id, operation);
    this.folders.set(folderId, folder);
    this.emit("sync:completed", operation);

    return operation;
  }

  getOperation(id: string): SyncOperation | undefined {
    return this.operations.get(id);
  }

  listOperations(): SyncOperation[] {
    return Array.from(this.operations.values());
  }

  // Stats
  getStats(): FileSyncStats {
    const files = Array.from(this.files.values());
    const folders = Array.from(this.folders.values());

    let lastSyncAt: Date | undefined;
    for (const folder of folders) {
      if (folder.lastSync && (!lastSyncAt || folder.lastSync > lastSyncAt)) {
        lastSyncAt = folder.lastSync;
      }
    }

    return {
      totalFolders: folders.length,
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      syncedFiles: files.filter((f) => f.status === "synced").length,
      pendingFiles: files.filter((f) => f.status === "modified").length,
      conflictFiles: files.filter((f) => f.status === "conflict").length,
      lastSyncAt,
    };
  }

  // Config
  getConfig(): FileSyncConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<FileSyncConfig>): FileSyncConfig {
    this.config = { ...this.config, ...updates };

    if (updates.watchForChanges !== undefined) {
      if (updates.watchForChanges) {
        for (const folderId of this.folders.keys()) {
          if (!this.watchers.has(folderId)) {
            this.startWatching(folderId);
          }
        }
      } else {
        for (const folderId of this.watchers.keys()) {
          this.stopWatching(folderId);
        }
      }
    }

    this.emit("config:updated", this.config);
    return this.config;
  }

  // Utilities
  private calculateChecksum(content: Buffer): string {
    return crypto.createHash("md5").update(content).digest("hex");
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".txt": "text/plain",
      ".md": "text/markdown",
      ".json": "application/json",
      ".js": "application/javascript",
      ".ts": "application/typescript",
      ".tsx": "application/typescript",
      ".jsx": "application/javascript",
      ".html": "text/html",
      ".css": "text/css",
      ".yaml": "text/yaml",
      ".yml": "text/yaml",
      ".xml": "application/xml",
      ".py": "text/x-python",
      ".rb": "text/x-ruby",
      ".go": "text/x-go",
      ".rs": "text/x-rust",
      ".java": "text/x-java",
      ".c": "text/x-c",
      ".cpp": "text/x-c++",
      ".h": "text/x-c",
      ".sh": "application/x-sh",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
}
