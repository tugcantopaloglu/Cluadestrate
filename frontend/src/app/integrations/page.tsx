"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plug,
  Github,
  MessageSquare,
  Globe,
  Database,
  Cloud,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink,
  Loader2,
  RefreshCw,
  Link2Off,
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
import { integrationsApi } from "@/lib/api";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  github: Github,
  gitlab: Globe,
  slack: MessageSquare,
  discord: MessageSquare,
  aws: Cloud,
  gcp: Cloud,
  azure: Cloud,
  postgres: Database,
  mongodb: Database,
  linear: Globe,
  jira: Globe,
  notion: Globe,
};

const categoryLabels: Record<string, string> = {
  vcs: "Version Control",
  communication: "Communication",
  cloud: "Cloud Services",
  database: "Databases",
  projectManagement: "Project Management",
};

export default function IntegrationsPage() {
  const [configureOpen, setConfigureOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<any | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);

  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: integrationsApi.list,
  });

  const { data: connected = [] } = useQuery({
    queryKey: ["integrations-connected"],
    queryFn: integrationsApi.getConnected,
  });

  const { data: definitions = [] } = useQuery({
    queryKey: ["integrations-definitions"],
    queryFn: integrationsApi.getDefinitions,
  });

  const { data: stats } = useQuery({
    queryKey: ["integrations-stats"],
    queryFn: integrationsApi.getStats,
  });

  const connectMutation = useMutation({
    mutationFn: integrationsApi.connect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-connected"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-stats"] });
      setConfigureOpen(false);
      setConfigValues({});
      setTestResult(null);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: integrationsApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-connected"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-stats"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: ({ integrationId, config }: { integrationId: string; config: Record<string, string> }) =>
      integrationsApi.test(integrationId, config),
    onSuccess: (result) => {
      setTestResult(result);
    },
    onError: (error: any) => {
      setTestResult({ success: false, message: error.message });
    },
  });

  const syncMutation = useMutation({
    mutationFn: integrationsApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-connected"] });
    },
  });

  const handleConfigure = (definition: any) => {
    setSelectedDefinition(definition);
    setConfigValues({});
    setTestResult(null);
    setConfigureOpen(true);
  };

  const handleTest = () => {
    if (selectedDefinition) {
      testMutation.mutate({
        integrationId: selectedDefinition.id,
        config: configValues,
      });
    }
  };

  const handleConnect = () => {
    if (selectedDefinition) {
      connectMutation.mutate({
        integrationId: selectedDefinition.id,
        config: configValues,
      });
    }
  };

  const getConnectedIntegration = (definitionId: string) => {
    return connected.find((c: any) => c.integrationId === definitionId);
  };

  const groupedDefinitions = definitions.reduce((acc: Record<string, any[]>, def: any) => {
    const category = def.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(def);
    return acc;
  }, {});

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
            <CardTitle className="text-3xl">{stats?.totalAvailable || definitions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Connected</CardDescription>
            <CardTitle className="text-3xl">{stats?.connected || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats?.active || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Errors</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats?.errors || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Integrations by Category */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : definitions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Integrations Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Integration definitions will appear here when available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.keys(groupedDefinitions).map((category) => (
              <TabsTrigger key={category} value={category}>
                {categoryLabels[category] || category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {Object.entries(groupedDefinitions).map(([category, defs]) => (
              <div key={category}>
                <h3 className="text-lg font-medium mb-3">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(defs as any[]).map((definition) => (
                    <IntegrationCard
                      key={definition.id}
                      definition={definition}
                      connectedIntegration={getConnectedIntegration(definition.id)}
                      onConfigure={() => handleConfigure(definition)}
                      onDisconnect={() => {
                        const conn = getConnectedIntegration(definition.id);
                        if (conn) disconnectMutation.mutate(conn.id);
                      }}
                      onSync={() => {
                        const conn = getConnectedIntegration(definition.id);
                        if (conn) syncMutation.mutate(conn.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {Object.entries(groupedDefinitions).map(([category, defs]) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(defs as any[]).map((definition) => (
                  <IntegrationCard
                    key={definition.id}
                    definition={definition}
                    connectedIntegration={getConnectedIntegration(definition.id)}
                    onConfigure={() => handleConfigure(definition)}
                    onDisconnect={() => {
                      const conn = getConnectedIntegration(definition.id);
                      if (conn) disconnectMutation.mutate(conn.id);
                    }}
                    onSync={() => {
                      const conn = getConnectedIntegration(definition.id);
                      if (conn) syncMutation.mutate(conn.id);
                    }}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Configure Dialog */}
      <Dialog open={configureOpen} onOpenChange={setConfigureOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDefinition && (
                <>
                  {(() => {
                    const Icon = iconMap[selectedDefinition.id] || Plug;
                    return <Icon className="w-5 h-5" />;
                  })()}
                  Connect {selectedDefinition.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Enter your credentials to connect this integration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedDefinition?.configFields?.map((field: any) => (
              <div key={field.name} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type={field.type === "password" ? "password" : "text"}
                  placeholder={field.placeholder}
                  value={configValues[field.name] || ""}
                  onChange={(e) =>
                    setConfigValues({ ...configValues, [field.name]: e.target.value })
                  }
                />
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}
            {testResult && (
              <div
                className={`p-3 rounded-lg ${
                  testResult.success
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {testResult.success ? "Connection successful!" : testResult.message || "Connection failed"}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? "Testing..." : "Test Connection"}
            </Button>
            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntegrationCard({
  definition,
  connectedIntegration,
  onConfigure,
  onDisconnect,
  onSync,
}: {
  definition: any;
  connectedIntegration?: any;
  onConfigure: () => void;
  onDisconnect: () => void;
  onSync: () => void;
}) {
  const Icon = iconMap[definition.id] || Plug;
  const isConnected = !!connectedIntegration;
  const status = connectedIntegration?.status;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">{definition.name}</CardTitle>
            </div>
          </div>
          <Switch
            checked={isConnected}
            onCheckedChange={() => {
              if (isConnected) {
                onDisconnect();
              } else {
                onConfigure();
              }
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {definition.description}
        </p>
        <div className="flex items-center justify-between">
          {isConnected ? (
            <div className="flex items-center gap-2">
              {status === "active" && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Connected</span>
                </>
              )}
              {status === "error" && (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">Error</span>
                </>
              )}
              {!status && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Connected</span>
                </>
              )}
            </div>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
          <div className="flex items-center gap-1">
            {isConnected && (
              <>
                <Button variant="ghost" size="sm" onClick={onSync}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onDisconnect}>
                  <Link2Off className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onConfigure}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {connectedIntegration?.lastSyncAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Last sync: {new Date(connectedIntegration.lastSyncAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
