import { EventEmitter } from "events";
import { Storage, generateId } from "./Storage";
import type {
  Notification,
  NotificationPreferences,
  CreateNotificationInput,
  NotificationStats,
  NotificationType,
} from "../types/notification";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  sessionUpdates: true,
  workflowUpdates: true,
  usageAlerts: true,
  systemUpdates: true,
  taskUpdates: true,
  deliveryMethods: {
    inApp: true,
    browser: false,
    email: false,
  },
};

export class NotificationManager extends EventEmitter {
  private storage: Storage<Notification>;
  private preferences: NotificationPreferences;
  private preferencesPath: string = "notification-preferences";

  constructor() {
    super();
    this.storage = new Storage<Notification>("notifications");
    this.preferences = this.loadPreferences();
  }

  private loadPreferences(): NotificationPreferences {
    try {
      const prefsStorage = new Storage<{ id: string; data: NotificationPreferences }>(this.preferencesPath);
      const prefs = prefsStorage.getById("default");
      return prefs?.data || DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  private savePreferences(): void {
    const prefsStorage = new Storage<{ id: string; data: NotificationPreferences }>(this.preferencesPath);
    prefsStorage.update("default", { data: this.preferences }) ||
      prefsStorage.create({ id: "default", data: this.preferences });
  }

  list(limit: number = 100): Notification[] {
    return this.storage
      .getAll()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  listUnread(): Notification[] {
    return this.storage
      .find((n) => !n.read)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  get(id: string): Notification | undefined {
    return this.storage.getById(id);
  }

  create(input: CreateNotificationInput): Notification | null {
    // Check preferences
    if (!this.shouldNotify(input.type)) {
      return null;
    }

    const notification: Notification = {
      id: generateId(),
      type: input.type,
      title: input.title,
      message: input.message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: input.actionUrl,
      metadata: input.metadata,
    };

    this.storage.create(notification);
    this.emit("notification:created", notification);

    // Handle delivery methods
    if (this.preferences.deliveryMethods.browser) {
      this.emit("notification:browser", notification);
    }
    if (this.preferences.deliveryMethods.email && this.preferences.emailAddress) {
      this.emit("notification:email", {
        notification,
        email: this.preferences.emailAddress,
      });
    }

    return notification;
  }

  private shouldNotify(type: NotificationType): boolean {
    switch (type) {
      case "session":
        return this.preferences.sessionUpdates;
      case "workflow":
        return this.preferences.workflowUpdates;
      case "alert":
        return this.preferences.usageAlerts;
      case "system":
        return this.preferences.systemUpdates;
      case "task":
        return this.preferences.taskUpdates;
      default:
        return true;
    }
  }

  markAsRead(id: string): Notification | undefined {
    const notification = this.storage.update(id, {
      read: true,
      readAt: new Date().toISOString(),
    });

    if (notification) {
      this.emit("notification:read", notification);
    }
    return notification;
  }

  markAllAsRead(): number {
    const unread = this.storage.find((n) => !n.read);
    const now = new Date().toISOString();

    unread.forEach((notification) => {
      this.storage.update(notification.id, {
        read: true,
        readAt: now,
      });
    });

    this.emit("notifications:read-all", { count: unread.length });
    return unread.length;
  }

  delete(id: string): boolean {
    const deleted = this.storage.delete(id);
    if (deleted) {
      this.emit("notification:deleted", { id });
    }
    return deleted;
  }

  deleteAll(): number {
    const count = this.storage.count();
    this.storage.clear();
    this.emit("notifications:deleted-all", { count });
    return count;
  }

  deleteRead(): number {
    const read = this.storage.find((n) => n.read);
    read.forEach((n) => this.storage.delete(n.id));
    this.emit("notifications:deleted-read", { count: read.length });
    return read.length;
  }

  // Preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<NotificationPreferences>): NotificationPreferences {
    this.preferences = {
      ...this.preferences,
      ...updates,
      deliveryMethods: {
        ...this.preferences.deliveryMethods,
        ...(updates.deliveryMethods || {}),
      },
    };
    this.savePreferences();
    this.emit("preferences:updated", this.preferences);
    return this.preferences;
  }

  // Stats
  getStats(): NotificationStats {
    const notifications = this.storage.getAll();
    const byType: Record<NotificationType, number> = {
      session: 0,
      workflow: 0,
      alert: 0,
      system: 0,
      task: 0,
    };

    for (const notification of notifications) {
      byType[notification.type]++;
    }

    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      byType,
    };
  }

  // Helper methods to create common notifications
  notifySessionStarted(sessionId: string, sessionName: string): Notification | null {
    return this.create({
      type: "session",
      title: "Session Started",
      message: `Session "${sessionName}" has started`,
      actionUrl: `/sessions/${sessionId}`,
      metadata: { sessionId },
    });
  }

  notifySessionCompleted(sessionId: string, sessionName: string): Notification | null {
    return this.create({
      type: "session",
      title: "Session Completed",
      message: `Session "${sessionName}" has completed successfully`,
      actionUrl: `/sessions/${sessionId}`,
      metadata: { sessionId },
    });
  }

  notifySessionError(sessionId: string, sessionName: string, error: string): Notification | null {
    return this.create({
      type: "session",
      title: "Session Error",
      message: `Session "${sessionName}" encountered an error: ${error}`,
      actionUrl: `/sessions/${sessionId}`,
      metadata: { sessionId, error },
    });
  }

  notifyWorkflowCompleted(workflowId: string, workflowName: string): Notification | null {
    return this.create({
      type: "workflow",
      title: "Workflow Completed",
      message: `Workflow "${workflowName}" has completed`,
      actionUrl: `/workflows`,
      metadata: { workflowId },
    });
  }

  notifyUsageAlert(message: string, percentage: number): Notification | null {
    return this.create({
      type: "alert",
      title: "Usage Alert",
      message,
      actionUrl: `/usage`,
      metadata: { percentage },
    });
  }

  notifyTaskAssigned(taskId: string, taskTitle: string, sessionId: string): Notification | null {
    return this.create({
      type: "task",
      title: "Task Assigned",
      message: `Task "${taskTitle}" has been assigned to a session`,
      actionUrl: `/tasks`,
      metadata: { taskId, sessionId },
    });
  }
}
