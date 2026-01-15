export type IntegrationCategory = "vcs" | "communication" | "cloud" | "database";
export type IntegrationStatus = "connected" | "disconnected" | "error";

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  config: Record<string, string>; // Encrypted config values
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  icon: string;
  configFields: IntegrationConfigField[];
  available: boolean;
}

export interface IntegrationConfigField {
  name: string;
  label: string;
  type: "text" | "password" | "select";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface ConnectIntegrationInput {
  integrationId: string;
  config: Record<string, string>;
}

export interface IntegrationStats {
  total: number;
  connected: number;
  error: number;
  byCategory: Record<IntegrationCategory, number>;
}

// Available integrations definitions
export const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Connect repositories, PRs, and issues",
    category: "vcs",
    icon: "github",
    available: true,
    configFields: [
      { name: "token", label: "Personal Access Token", type: "password", required: true, placeholder: "ghp_..." },
      { name: "org", label: "Default Organization", type: "text", required: false, placeholder: "your-org" },
    ],
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "GitLab repositories and CI/CD pipelines",
    category: "vcs",
    icon: "gitlab",
    available: true,
    configFields: [
      { name: "token", label: "Access Token", type: "password", required: true, placeholder: "glpat-..." },
      { name: "url", label: "GitLab URL", type: "text", required: false, placeholder: "https://gitlab.com" },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send notifications and interact via Slack",
    category: "communication",
    icon: "slack",
    available: true,
    configFields: [
      { name: "botToken", label: "Bot Token", type: "password", required: true, placeholder: "xoxb-..." },
      { name: "channel", label: "Default Channel", type: "text", required: false, placeholder: "#general" },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Discord bot for team notifications",
    category: "communication",
    icon: "discord",
    available: true,
    configFields: [
      { name: "botToken", label: "Bot Token", type: "password", required: true },
      { name: "guildId", label: "Server ID", type: "text", required: true },
    ],
  },
  {
    id: "aws",
    name: "AWS",
    description: "Amazon Web Services integration",
    category: "cloud",
    icon: "aws",
    available: true,
    configFields: [
      { name: "accessKeyId", label: "Access Key ID", type: "password", required: true },
      { name: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
      { name: "region", label: "Region", type: "text", required: true, placeholder: "us-east-1" },
    ],
  },
  {
    id: "gcp",
    name: "Google Cloud",
    description: "Google Cloud Platform services",
    category: "cloud",
    icon: "gcp",
    available: true,
    configFields: [
      { name: "projectId", label: "Project ID", type: "text", required: true },
      { name: "credentials", label: "Service Account JSON", type: "password", required: true },
    ],
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Connect to PostgreSQL databases",
    category: "database",
    icon: "postgres",
    available: true,
    configFields: [
      { name: "host", label: "Host", type: "text", required: true, placeholder: "localhost" },
      { name: "port", label: "Port", type: "text", required: true, placeholder: "5432" },
      { name: "database", label: "Database", type: "text", required: true },
      { name: "user", label: "Username", type: "text", required: true },
      { name: "password", label: "Password", type: "password", required: true },
    ],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "MongoDB database integration",
    category: "database",
    icon: "mongodb",
    available: true,
    configFields: [
      { name: "connectionString", label: "Connection String", type: "password", required: true, placeholder: "mongodb://..." },
    ],
  },
];
