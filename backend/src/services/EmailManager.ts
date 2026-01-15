import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import * as nodemailer from "nodemailer";
import {
  EmailConfig,
  EmailTemplate,
  EmailCategory,
  EmailRecipient,
  EmailMessage,
  EmailAttachment,
  EmailStats,
  defaultEmailTemplates,
} from "../types/email";

export class EmailManager extends EventEmitter {
  private config: EmailConfig = {
    enabled: false,
    provider: "smtp",
    from: {
      email: "orchestrate@example.com",
      name: "Orchestrate",
    },
  };

  private templates: Map<string, EmailTemplate> = new Map();
  private recipients: Map<string, EmailRecipient> = new Map();
  private messages: Map<string, EmailMessage> = new Map();
  private transporter: nodemailer.Transporter | null = null;
  private stats = {
    totalSent: 0,
    totalFailed: 0,
    byCategory: {} as Record<string, number>,
    byRecipient: {} as Record<string, number>,
  };

  constructor() {
    super();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    for (const template of defaultEmailTemplates) {
      const id = randomUUID();
      this.templates.set(id, {
        ...template,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Configuration
  getConfig(): Omit<EmailConfig, "smtp" | "sendgrid" | "mailgun" | "ses"> & { configured: boolean } {
    return {
      enabled: this.config.enabled,
      provider: this.config.provider,
      from: this.config.from,
      configured: this.isConfigured(),
    };
  }

  async updateConfig(updates: Partial<EmailConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };

    if (this.config.enabled && this.isConfigured()) {
      await this.initializeTransporter();
    } else {
      this.transporter = null;
    }

    this.emit("config:updated", this.getConfig());
  }

  private isConfigured(): boolean {
    switch (this.config.provider) {
      case "smtp":
        return !!(this.config.smtp?.host && this.config.smtp?.auth?.user);
      case "sendgrid":
        return !!this.config.sendgrid?.apiKey;
      case "mailgun":
        return !!(this.config.mailgun?.apiKey && this.config.mailgun?.domain);
      case "ses":
        return !!(this.config.ses?.accessKeyId && this.config.ses?.secretAccessKey);
      default:
        return false;
    }
  }

  private async initializeTransporter(): Promise<void> {
    if (this.config.provider === "smtp" && this.config.smtp) {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: this.config.smtp.auth,
      });

      // Verify connection
      try {
        await this.transporter.verify();
        this.emit("transporter:ready");
      } catch (error) {
        this.emit("transporter:error", { error: (error as Error).message });
      }
    }
    // Other providers would be initialized here
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Templates
  createTemplate(data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">): EmailTemplate {
    const template: EmailTemplate = {
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(template.id, template);
    this.emit("template:created", template);
    return template;
  }

  updateTemplate(id: string, updates: Partial<EmailTemplate>): EmailTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    const updated = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(id, updated);
    this.emit("template:updated", updated);
    return updated;
  }

  deleteTemplate(id: string): boolean {
    const result = this.templates.delete(id);
    if (result) {
      this.emit("template:deleted", { id });
    }
    return result;
  }

  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplateByName(name: string): EmailTemplate | undefined {
    return Array.from(this.templates.values()).find((t) => t.name === name);
  }

  listTemplates(category?: EmailCategory): EmailTemplate[] {
    const all = Array.from(this.templates.values());
    if (category) {
      return all.filter((t) => t.category === category);
    }
    return all;
  }

  // Recipients
  addRecipient(data: Omit<EmailRecipient, "id" | "createdAt">): EmailRecipient {
    const recipient: EmailRecipient = {
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
    };

    this.recipients.set(recipient.id, recipient);
    this.emit("recipient:added", recipient);
    return recipient;
  }

  updateRecipient(id: string, updates: Partial<EmailRecipient>): EmailRecipient | null {
    const recipient = this.recipients.get(id);
    if (!recipient) return null;

    const updated = { ...recipient, ...updates };
    this.recipients.set(id, updated);
    this.emit("recipient:updated", updated);
    return updated;
  }

  removeRecipient(id: string): boolean {
    const result = this.recipients.delete(id);
    if (result) {
      this.emit("recipient:removed", { id });
    }
    return result;
  }

  getRecipient(id: string): EmailRecipient | undefined {
    return this.recipients.get(id);
  }

  getRecipientByEmail(email: string): EmailRecipient | undefined {
    return Array.from(this.recipients.values()).find((r) => r.email === email);
  }

  listRecipients(): EmailRecipient[] {
    return Array.from(this.recipients.values());
  }

  getRecipientsByCategory(category: EmailCategory): EmailRecipient[] {
    return Array.from(this.recipients.values()).filter(
      (r) => r.preferences.enabled && r.preferences.categories.includes(category)
    );
  }

  // Sending emails
  async sendEmail(data: {
    to: string[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    attachments?: EmailAttachment[];
    category?: EmailCategory;
  }): Promise<EmailMessage> {
    const message: EmailMessage = {
      id: randomUUID(),
      to: data.to,
      subject: data.subject,
      htmlContent: data.htmlContent,
      textContent: data.textContent,
      attachments: data.attachments,
      status: "queued",
      createdAt: new Date(),
    };

    this.messages.set(message.id, message);

    if (!this.config.enabled || !this.transporter) {
      message.status = "failed";
      message.error = "Email not configured";
      this.messages.set(message.id, message);
      return message;
    }

    try {
      message.status = "sending";
      this.messages.set(message.id, message);

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${this.config.from.name}" <${this.config.from.email}>`,
        to: data.to.join(", "),
        subject: data.subject,
        html: data.htmlContent,
        text: data.textContent,
        attachments: data.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content, "base64"),
          contentType: a.mimeType,
        })),
      };

      await this.transporter.sendMail(mailOptions);

      message.status = "sent";
      message.sentAt = new Date();
      this.stats.totalSent++;

      if (data.category) {
        this.stats.byCategory[data.category] = (this.stats.byCategory[data.category] || 0) + 1;
      }

      for (const email of data.to) {
        this.stats.byRecipient[email] = (this.stats.byRecipient[email] || 0) + 1;
      }

      this.emit("email:sent", message);
    } catch (error) {
      message.status = "failed";
      message.error = (error as Error).message;
      this.stats.totalFailed++;
      this.emit("email:failed", { message, error: message.error });
    }

    this.messages.set(message.id, message);
    return message;
  }

  async sendFromTemplate(
    templateId: string,
    to: string[],
    variables: Record<string, unknown>
  ): Promise<EmailMessage> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const subject = this.interpolate(template.subject, variables);
    const htmlContent = this.interpolate(template.htmlContent, variables);
    const textContent = template.textContent
      ? this.interpolate(template.textContent, variables)
      : undefined;

    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent,
      category: template.category,
    });
  }

  private interpolate(text: string, variables: Record<string, unknown>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() ?? match;
    });
  }

  // Notification shortcuts
  async notifySessionCompleted(
    sessionId: string,
    sessionName: string,
    duration: string,
    tokensUsed: number
  ): Promise<void> {
    const template = this.getTemplateByName("Session Completed");
    if (!template) return;

    const recipients = this.getRecipientsByCategory("session");
    if (recipients.length === 0) return;

    await this.sendFromTemplate(template.id, recipients.map((r) => r.email), {
      sessionId,
      sessionName,
      duration,
      tokensUsed,
      dashboardUrl: process.env.DASHBOARD_URL || "http://localhost:3000",
    });
  }

  async notifySessionError(sessionId: string, sessionName: string, error: string): Promise<void> {
    const template = this.getTemplateByName("Session Error");
    if (!template) return;

    const recipients = this.getRecipientsByCategory("session");
    if (recipients.length === 0) return;

    await this.sendFromTemplate(template.id, recipients.map((r) => r.email), {
      sessionId,
      sessionName,
      error,
      dashboardUrl: process.env.DASHBOARD_URL || "http://localhost:3000",
    });
  }

  async notifyUsageAlert(threshold: number, tokensUsed: number, tokenLimit: number): Promise<void> {
    const template = this.getTemplateByName("Usage Alert");
    if (!template) return;

    const recipients = this.getRecipientsByCategory("usage");
    if (recipients.length === 0) return;

    await this.sendFromTemplate(template.id, recipients.map((r) => r.email), {
      threshold,
      tokensUsed,
      tokenLimit,
      percentUsed: Math.round((tokensUsed / tokenLimit) * 100),
      dashboardUrl: process.env.DASHBOARD_URL || "http://localhost:3000",
    });
  }

  // Messages
  getMessage(id: string): EmailMessage | undefined {
    return this.messages.get(id);
  }

  listMessages(limit?: number): EmailMessage[] {
    const all = Array.from(this.messages.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (limit) {
      return all.slice(0, limit);
    }
    return all;
  }

  // Stats
  getStats(): EmailStats {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;

    const messages = Array.from(this.messages.values());
    const last24Hours = messages.filter(
      (m) => m.status === "sent" && m.sentAt && now - m.sentAt.getTime() < day
    ).length;
    const last7Days = messages.filter(
      (m) => m.status === "sent" && m.sentAt && now - m.sentAt.getTime() < week
    ).length;

    return {
      ...this.stats,
      last24Hours,
      last7Days,
    };
  }
}
