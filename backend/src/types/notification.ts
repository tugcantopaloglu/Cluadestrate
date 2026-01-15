export type NotificationType = "session" | "workflow" | "alert" | "system" | "task";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  readAt?: string;
  actionUrl?: string; // URL to navigate to when clicked
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  sessionUpdates: boolean;
  workflowUpdates: boolean;
  usageAlerts: boolean;
  systemUpdates: boolean;
  taskUpdates: boolean;
  deliveryMethods: {
    inApp: boolean;
    browser: boolean;
    email: boolean;
  };
  emailAddress?: string;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}
