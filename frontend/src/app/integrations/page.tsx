"use client";

import { useState } from "react";
import {
  Plug,
  Github,
  MessageSquare,
  Slack,
  Globe,
  Database,
  Cloud,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "vcs" | "communication" | "cloud" | "database";
  connected: boolean;
  status?: "active" | "error" | "pending";
  lastSync?: string;
}

const integrations: Integration[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Connect repositories, PRs, and issues",
    icon: Github,
    category: "vcs",
    connected: true,
    status: "active",
    lastSync: "2024-01-15T10:30:00Z",
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "GitLab repositories and CI/CD pipelines",
    icon: Globe,
    category: "vcs",
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send notifications and interact via Slack",
    icon: Slack,
    category: "communication",
    connected: true,
    status: "active",
    lastSync: "2024-01-15T11:00:00Z",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Discord bot for team notifications",
    icon: MessageSquare,
    category: "communication",
    connected: false,
  },
  {
    id: "aws",
    name: "AWS",
    description: "Amazon Web Services integration",
    icon: Cloud,
    category: "cloud",
    connected: false,
  },
  {
    id: "gcp",
    name: "Google Cloud",
    description: "Google Cloud Platform services",
    icon: Cloud,
    category: "cloud",
    connected: true,
    status: "error",
    lastSync: "2024-01-14T08:00:00Z",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Connect to PostgreSQL databases",
    icon: Database,
    category: "database",
    connected: false,
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "MongoDB database integration",
    icon: Database,
    category: "database",
    connected: false,
  },
];

const categoryLabels = {
  vcs: "Version Control",
  communication: "Communication",
  cloud: "Cloud Services",
  database: "Databases",
};

export default function IntegrationsPage() {
  const [configureOpen, setConfigureOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(
    null
  );

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigureOpen(true);
  };

  const connectedCount = integrations.filter((i) => i.connected).length;
  const activeCount = integrations.filter((i) => i.status === "active").length;
  const errorCount = integrations.filter((i) => i.status === "error").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect external services and tools to enhance your workflow
          </p>
        </div>
        <Button variant="outline">
          <ExternalLink className="w-4 h-4 mr-2" />
          Integration Docs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Available</CardDescription>
            <CardTitle className="text-3xl">{integrations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Connected</CardDescription>
            <CardTitle className="text-3xl">{connectedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-500">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Errors</CardDescription>
            <CardTitle className="text-3xl text-red-500">{errorCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Integrations by Category */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="vcs">Version Control</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="cloud">Cloud</TabsTrigger>
          <TabsTrigger value="database">Databases</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map(
            (category) => {
              const categoryIntegrations = integrations.filter(
                (i) => i.category === category
              );
              if (categoryIntegrations.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-lg font-medium mb-3">
                    {categoryLabels[category]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryIntegrations.map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onConfigure={() => handleConfigure(integration)}
                      />
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </TabsContent>

        {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map(
          (category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations
                  .filter((i) => i.category === category)
                  .map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onConfigure={() => handleConfigure(integration)}
                    />
                  ))}
              </div>
            </TabsContent>
          )
        )}
      </Tabs>

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">More Integrations Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We&apos;re working on adding more integrations including Jira, Linear, Notion,
            Azure DevOps, and custom webhook support.
          </p>
        </CardContent>
      </Card>

      {/* Configure Dialog */}
      <Dialog open={configureOpen} onOpenChange={setConfigureOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration && (
                <>
                  <selectedIntegration.icon className="w-5 h-5" />
                  Configure {selectedIntegration.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.connected
                ? "Update your integration settings"
                : "Connect this integration to your workspace"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedIntegration?.id === "github" && (
              <>
                <div className="space-y-2">
                  <Label>Personal Access Token</Label>
                  <Input type="password" placeholder="ghp_..." />
                </div>
                <div className="space-y-2">
                  <Label>Default Organization</Label>
                  <Input placeholder="your-org" />
                </div>
              </>
            )}
            {selectedIntegration?.id === "slack" && (
              <>
                <div className="space-y-2">
                  <Label>Bot Token</Label>
                  <Input type="password" placeholder="xoxb-..." />
                </div>
                <div className="space-y-2">
                  <Label>Default Channel</Label>
                  <Input placeholder="#general" />
                </div>
              </>
            )}
            {!["github", "slack"].includes(selectedIntegration?.id || "") && (
              <div className="space-y-2">
                <Label>API Key / Token</Label>
                <Input type="password" placeholder="Enter your API key..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureOpen(false)}>
              Cancel
            </Button>
            <Button>
              {selectedIntegration?.connected ? "Update" : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntegrationCard({
  integration,
  onConfigure,
}: {
  integration: Integration;
  onConfigure: () => void;
}) {
  const Icon = integration.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
            </div>
          </div>
          <Switch checked={integration.connected} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {integration.description}
        </p>
        <div className="flex items-center justify-between">
          {integration.connected ? (
            <div className="flex items-center gap-2">
              {integration.status === "active" && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Connected</span>
                </>
              )}
              {integration.status === "error" && (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">Error</span>
                </>
              )}
            </div>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onConfigure}>
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
        </div>
        {integration.lastSync && (
          <p className="text-xs text-muted-foreground mt-2">
            Last sync: {new Date(integration.lastSync).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
