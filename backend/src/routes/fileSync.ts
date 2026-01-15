import { Hono } from "hono";
import { FileSyncManager } from "../services/FileSyncManager";

export function createFileSyncRoutes(fileSyncManager: FileSyncManager) {
  const router = new Hono();

  // Get stats
  router.get("/stats", (c) => {
    return c.json(fileSyncManager.getStats());
  });

  // Get config
  router.get("/config", (c) => {
    return c.json(fileSyncManager.getConfig());
  });

  // Update config
  router.patch("/config", async (c) => {
    const updates = await c.req.json();
    const config = fileSyncManager.updateConfig(updates);
    return c.json(config);
  });

  // List all folders
  router.get("/folders", (c) => {
    return c.json(fileSyncManager.listFolders());
  });

  // Get folders by host
  router.get("/folders/host/:hostId", (c) => {
    const { hostId } = c.req.param();
    return c.json(fileSyncManager.getFoldersByHost(hostId));
  });

  // Get folder by ID
  router.get("/folders/:id", (c) => {
    const { id } = c.req.param();
    const folder = fileSyncManager.getFolder(id);
    if (!folder) {
      return c.json({ error: "Folder not found" }, 404);
    }
    return c.json(folder);
  });

  // Add folder
  router.post("/folders", async (c) => {
    const data = await c.req.json();
    const folder = fileSyncManager.addFolder(data);
    return c.json(folder, 201);
  });

  // Remove folder
  router.delete("/folders/:id", (c) => {
    const { id } = c.req.param();
    const success = fileSyncManager.removeFolder(id);
    if (!success) {
      return c.json({ error: "Folder not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Sync folder
  router.post("/folders/:id/sync", async (c) => {
    const { id } = c.req.param();
    try {
      const operation = await fileSyncManager.syncFolder(id);
      return c.json(operation);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // List files
  router.get("/files", (c) => {
    const folderId = c.req.query("folderId");
    return c.json(fileSyncManager.listFiles(folderId));
  });

  // Search files
  router.get("/files/search", (c) => {
    const query = c.req.query("q") || "";
    return c.json(fileSyncManager.searchFiles(query));
  });

  // Get file
  router.get("/files/:id", (c) => {
    const { id } = c.req.param();
    const file = fileSyncManager.getFile(id);
    if (!file) {
      return c.json({ error: "File not found" }, 404);
    }
    return c.json(file);
  });

  // Get file content
  router.get("/files/:id/content", (c) => {
    const { id } = c.req.param();
    const content = fileSyncManager.getFileContent(id);
    if (!content) {
      return c.json({ error: "File not found" }, 404);
    }
    const file = fileSyncManager.getFile(id);
    c.header("Content-Type", file?.mimeType || "application/octet-stream");
    return c.body(content);
  });

  // Add file
  router.post("/files", async (c) => {
    const data = await c.req.json();
    try {
      const file = await fileSyncManager.addFile(
        data.folderId,
        data.remotePath,
        data.content
      );
      return c.json(file, 201);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Update file
  router.put("/files/:id", async (c) => {
    const { id } = c.req.param();
    const { content } = await c.req.json();
    try {
      const file = fileSyncManager.updateFile(id, content);
      return c.json(file);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Delete file
  router.delete("/files/:id", (c) => {
    const { id } = c.req.param();
    const success = fileSyncManager.deleteFile(id);
    if (!success) {
      return c.json({ error: "File not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Get file versions
  router.get("/files/:id/versions", (c) => {
    const { id } = c.req.param();
    return c.json(fileSyncManager.getVersions(id));
  });

  // Restore file version
  router.post("/files/:id/versions/:versionId/restore", (c) => {
    const { id, versionId } = c.req.param();
    try {
      const file = fileSyncManager.restoreVersion(id, versionId);
      return c.json(file);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Get conflicts
  router.get("/conflicts", (c) => {
    return c.json(fileSyncManager.getConflicts());
  });

  // Resolve conflict
  router.post("/conflicts/resolve", async (c) => {
    const resolution = await c.req.json();
    try {
      const file = fileSyncManager.resolveConflict(resolution);
      return c.json(file);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Attach file to session
  router.post("/files/:id/sessions/:sessionId", (c) => {
    const { id, sessionId } = c.req.param();
    try {
      const attachment = fileSyncManager.attachFileToSession(id, sessionId);
      return c.json(attachment);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Detach file from session
  router.delete("/files/:id/sessions/:sessionId", (c) => {
    const { id, sessionId } = c.req.param();
    const success = fileSyncManager.detachFileFromSession(id, sessionId);
    if (!success) {
      return c.json({ error: "Attachment not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Get session attachments
  router.get("/sessions/:sessionId/files", (c) => {
    const { sessionId } = c.req.param();
    return c.json(fileSyncManager.getSessionAttachments(sessionId));
  });

  // Get sync operations
  router.get("/operations", (c) => {
    return c.json(fileSyncManager.listOperations());
  });

  // Get sync operation
  router.get("/operations/:id", (c) => {
    const { id } = c.req.param();
    const operation = fileSyncManager.getOperation(id);
    if (!operation) {
      return c.json({ error: "Operation not found" }, 404);
    }
    return c.json(operation);
  });

  return router;
}
