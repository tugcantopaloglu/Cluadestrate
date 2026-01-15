// Email Notification Types

export interface EmailConfig {
  enabled: boolean;
  provider: "smtp" | "sendgrid" | "mailgun" | "ses";
  from: {
    email: string;
    name: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: EmailCategory;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailCategory =
  | "session"
  | "workflow"
  | "alert"
  | "usage"
  | "system"
  | "report";

export interface EmailRecipient {
  id: string;
  email: string;
  name?: string;
  preferences: {
    enabled: boolean;
    categories: EmailCategory[];
    digest: "immediate" | "hourly" | "daily" | "weekly";
  };
  createdAt: Date;
}

export interface EmailMessage {
  id: string;
  templateId?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: Record<string, unknown>;
  attachments?: EmailAttachment[];
  status: "queued" | "sending" | "sent" | "failed";
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64
  mimeType: string;
}

export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  byCategory: Record<string, number>;
  byRecipient: Record<string, number>;
  last24Hours: number;
  last7Days: number;
}

// Default email templates
export const defaultEmailTemplates: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Session Completed",
    subject: "Session Completed: {{sessionName}}",
    category: "session",
    variables: ["sessionName", "sessionId", "duration", "tokensUsed"],
    htmlContent: `
      <h2>Session Completed</h2>
      <p>Your Claude session <strong>{{sessionName}}</strong> has completed.</p>
      <table>
        <tr><td>Session ID:</td><td>{{sessionId}}</td></tr>
        <tr><td>Duration:</td><td>{{duration}}</td></tr>
        <tr><td>Tokens Used:</td><td>{{tokensUsed}}</td></tr>
      </table>
      <p><a href="{{dashboardUrl}}/sessions/{{sessionId}}">View Session</a></p>
    `,
    textContent: `Session Completed: {{sessionName}}\n\nDuration: {{duration}}\nTokens Used: {{tokensUsed}}`,
  },
  {
    name: "Session Error",
    subject: "⚠️ Session Error: {{sessionName}}",
    category: "session",
    variables: ["sessionName", "sessionId", "error"],
    htmlContent: `
      <h2>Session Error</h2>
      <p>Your Claude session <strong>{{sessionName}}</strong> encountered an error.</p>
      <div style="background: #fee; padding: 10px; border-radius: 4px;">
        <strong>Error:</strong> {{error}}
      </div>
      <p><a href="{{dashboardUrl}}/sessions/{{sessionId}}">View Session</a></p>
    `,
    textContent: `Session Error: {{sessionName}}\n\nError: {{error}}`,
  },
  {
    name: "Usage Alert",
    subject: "Usage Alert: {{threshold}}% of limit reached",
    category: "usage",
    variables: ["threshold", "tokensUsed", "tokenLimit", "percentUsed"],
    htmlContent: `
      <h2>Usage Alert</h2>
      <p>Your token usage has reached <strong>{{threshold}}%</strong> of your daily limit.</p>
      <table>
        <tr><td>Tokens Used:</td><td>{{tokensUsed}}</td></tr>
        <tr><td>Token Limit:</td><td>{{tokenLimit}}</td></tr>
        <tr><td>Percentage:</td><td>{{percentUsed}}%</td></tr>
      </table>
      <p><a href="{{dashboardUrl}}/usage">View Usage</a></p>
    `,
    textContent: `Usage Alert: {{threshold}}% of limit reached\n\nTokens Used: {{tokensUsed}} / {{tokenLimit}}`,
  },
  {
    name: "Daily Report",
    subject: "Daily Report: {{date}}",
    category: "report",
    variables: ["date", "totalSessions", "totalTokens", "totalCost", "topSessions"],
    htmlContent: `
      <h2>Daily Report - {{date}}</h2>
      <h3>Summary</h3>
      <table>
        <tr><td>Total Sessions:</td><td>{{totalSessions}}</td></tr>
        <tr><td>Total Tokens:</td><td>{{totalTokens}}</td></tr>
        <tr><td>Estimated Cost:</td><td>{{totalCost}}</td></tr>
      </table>
      <h3>Top Sessions</h3>
      {{topSessions}}
      <p><a href="{{dashboardUrl}}/usage">View Full Report</a></p>
    `,
    textContent: `Daily Report - {{date}}\n\nTotal Sessions: {{totalSessions}}\nTotal Tokens: {{totalTokens}}\nEstimated Cost: {{totalCost}}`,
  },
];
