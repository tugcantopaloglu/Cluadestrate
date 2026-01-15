import { Hono } from "hono";
import { NotificationManager } from "../services/NotificationManager";
import type { CreateNotificationInput, NotificationPreferences } from "../types/notification";

export function createNotificationRoutes(notificationManager: NotificationManager) {
  const app = new Hono();

  // Get notification stats
  app.get("/stats", (c) => {
    const stats = notificationManager.getStats();
    return c.json(stats);
  });

  // List notifications
  app.get("/", (c) => {
    const limit = parseInt(c.req.query("limit") || "100");
    const notifications = notificationManager.list(limit);
    return c.json(notifications);
  });

  // Get unread notifications
  app.get("/unread", (c) => {
    const notifications = notificationManager.listUnread();
    return c.json(notifications);
  });

  // Get notification preferences
  app.get("/preferences", (c) => {
    const preferences = notificationManager.getPreferences();
    return c.json(preferences);
  });

  // Update notification preferences
  app.patch("/preferences", async (c) => {
    try {
      const body = await c.req.json<Partial<NotificationPreferences>>();
      const preferences = notificationManager.updatePreferences(body);
      return c.json(preferences);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update preferences" }, 400);
    }
  });

  // Get a specific notification
  app.get("/:id", (c) => {
    const { id } = c.req.param();
    const notification = notificationManager.get(id);
    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }
    return c.json(notification);
  });

  // Create a notification
  app.post("/", async (c) => {
    try {
      const body = await c.req.json<CreateNotificationInput>();
      const notification = notificationManager.create(body);
      if (!notification) {
        return c.json({ error: "Notification not created due to preferences" }, 400);
      }
      return c.json(notification, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create notification" }, 400);
    }
  });

  // Mark notification as read
  app.post("/:id/read", (c) => {
    const { id } = c.req.param();
    const notification = notificationManager.markAsRead(id);
    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }
    return c.json(notification);
  });

  // Mark all notifications as read
  app.post("/read-all", (c) => {
    const count = notificationManager.markAllAsRead();
    return c.json({ marked: count });
  });

  // Delete a notification
  app.delete("/:id", (c) => {
    const { id } = c.req.param();
    const deleted = notificationManager.delete(id);
    if (!deleted) {
      return c.json({ error: "Notification not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Delete all notifications
  app.delete("/", (c) => {
    const count = notificationManager.deleteAll();
    return c.json({ deleted: count });
  });

  // Delete read notifications
  app.delete("/read", (c) => {
    const count = notificationManager.deleteRead();
    return c.json({ deleted: count });
  });

  return app;
}
