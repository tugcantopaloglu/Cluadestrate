"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Workflow,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  ExternalLink,
  Loader2,
  Settings,
  Webhook,
  Play,
  Pause,
  Copy,
  Link,
  Activity,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { n8nApi } from "@/lib/api";
import { toast } from "sonner";

const eventTypes = [
  { value: "session.started", label: "Session Started" },
  { value: "session.completed", label: "Session Completed" },
  { value: "session.error", label: "Session Error" },
  { value: "workflow.started", label: "Workflow Started" },
  { value: "workflow.completed", label: "Workflow Completed" },
  { value: "task.created", label: "Task Created" },
  { value: "task.completed", label: "Task Completed" },
  { value: "alert.triggered", label: "Alert Triggered" },
];

export default function N8nPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const [addWebhookOpen, setAddWebhookOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    eventType: "session.completed",
  });

  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["n8n-stats"],
    queryFn: n8nApi.getStats,
  });

  const { data: config } = useQuery({
    queryKey: ["n8n-config"],
    queryFn: n8nApi.getConfig,
  });

  const { data: webhooks = [], isLoading: webhooksLoading } = useQuery({
    queryKey: ["n8n-webhooks"],
    queryFn: n8nApi.listWebhooks,
  });

  const { data: executions = [] } = useQuery({
    queryKey: ["n8n-executions"],
    queryFn: n8nApi.listExecutions,
  });

  const updateConfigMutation = useMutation({
    mutationFn: n8nApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-config"] });
      queryClient.invalidateQueries({ queryKey: ["n8n-stats"] });
      setConfigOpen(false);
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: n8nApi.testConnection,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Connection successful!");
      } else {
        toast.error("Connection failed");
      }
    },
  });

  const addWebhookMutation = useMutation({
    mutationFn: n8nApi.addWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["n8n-stats"] });
      setAddWebhookOpen(false);
      setNewWebhook({ name: "", url: "", eventType: "session.completed" });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: n8nApi.deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["n8n-stats"] });
    },
  });

  const toggleWebhookMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      n8nApi.updateWebhook(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-webhooks"] });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: n8nApi.testWebhook,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Webhook test successful!");
      } else {
        toast.error("Webhook test failed");
      }
    },
  });

  const isLoading = statsLoading || webhooksLoading;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const incomingWebhookUrl = config?.baseUrl
    ? `${window.location.origin}/api/n8n/incoming`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">n8n Integration</h1>
          <p className="text-muted-foreground">
            Connect with n8n workflow automation platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setConfigOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          {config?.baseUrl && (
            <Button variant="outline" asChild>
              <a href={config.baseUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open n8n
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <Card className={config?.enabled ? "border-green-500/20 bg-green-500/5" : "border-yellow-500/20 bg-yellow-500/5"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${config?.enabled ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
                <Workflow className={`w-6 h-6 ${config?.enabled ? "text-green-500" : "text-yellow-500"}`} />
              </div>
              <div>
                <h3 className="font-semibold">
                  {config?.enabled ? "Connected to n8n" : "Not Connected"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config?.baseUrl || "Configure your n8n instance URL"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnectionMutation.mutate()}
                disabled={!config?.baseUrl || testConnectionMutation.isPending}
              >
                {testConnectionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Test Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Webhooks</CardDescription>
            <CardTitle className="text-3xl">{stats?.activeWebhooks || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Executions</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalExecutions || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Successful</CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats?.successfulExecutions || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats?.failedExecutions || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Incoming Webhook URL */}
      {incomingWebhookUrl && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="w-4 h-4" />
              Incoming Webhook URL
            </CardTitle>
            <CardDescription>Use this URL in your n8n workflows to send data to Cluadestrate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                {incomingWebhookUrl}
              </code>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(incomingWebhookUrl)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="webhooks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="webhooks">Outgoing Webhooks</TabsTrigger>
            <TabsTrigger value="executions">Execution History</TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Outgoing Webhooks</h3>
              <Dialog open={addWebhookOpen} onOpenChange={setAddWebhookOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Outgoing Webhook</DialogTitle>
                    <DialogDescription>
                      Send events from Cluadestrate to n8n workflows
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newWebhook.name}
                        onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                        placeholder="My Webhook"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>n8n Webhook URL</Label>
                      <Input
                        value={newWebhook.url}
                        onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                        placeholder="https://your-n8n-instance.com/webhook/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select
                        value={newWebhook.eventType}
                        onValueChange={(value) => setNewWebhook({ ...newWebhook, eventType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddWebhookOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => addWebhookMutation.mutate(newWebhook)}
                      disabled={!newWebhook.name || !newWebhook.url || addWebhookMutation.isPending}
                    >
                      {addWebhookMutation.isPending ? "Adding..." : "Add Webhook"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {webhooks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Webhook className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Webhooks Configured</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Add outgoing webhooks to send events to your n8n workflows.
                  </p>
                  <Button onClick={() => setAddWebhookOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Webhook
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook: any) => (
                  <Card key={webhook.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${webhook.enabled ? "bg-green-500/20" : "bg-gray-500/20"}`}>
                            <Webhook className={`w-5 h-5 ${webhook.enabled ? "text-green-500" : "text-gray-500"}`} />
                          </div>
                          <div>
                            <h3 className="font-medium">{webhook.name}</h3>
                            <p className="text-sm text-muted-foreground truncate max-w-md">
                              {webhook.url}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">
                            {eventTypes.find((t) => t.value === webhook.eventType)?.label || webhook.eventType}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testWebhookMutation.mutate(webhook.id)}
                              disabled={testWebhookMutation.isPending}
                            >
                              <Activity className="w-4 h-4" />
                            </Button>
                            <Switch
                              checked={webhook.enabled}
                              onCheckedChange={(checked) =>
                                toggleWebhookMutation.mutate({ id: webhook.id, enabled: checked })
                              }
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {webhook.lastTriggeredAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
                <CardDescription>Recent webhook executions and their results</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Webhook</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No executions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      executions.map((exec: any) => (
                        <TableRow key={exec.id}>
                          <TableCell className="font-medium">{exec.webhookName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{exec.eventType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={exec.success ? "default" : "destructive"}
                            >
                              {exec.success ? "Success" : "Failed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {exec.statusCode || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(exec.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>n8n Configuration</DialogTitle>
            <DialogDescription>
              Configure your n8n instance connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Integration</Label>
                <p className="text-sm text-muted-foreground">Enable n8n webhook integration</p>
              </div>
              <Switch
                checked={config?.enabled}
                onCheckedChange={(checked) =>
                  updateConfigMutation.mutate({ enabled: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>n8n Base URL</Label>
              <Input
                defaultValue={config?.baseUrl || ""}
                placeholder="https://your-n8n-instance.com"
                onChange={(e) =>
                  updateConfigMutation.mutate({ baseUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>API Key (optional)</Label>
              <Input
                type="password"
                defaultValue={config?.apiKey || ""}
                placeholder="Your n8n API key"
                onChange={(e) =>
                  updateConfigMutation.mutate({ apiKey: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setConfigOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
