"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Plus,
  Bell,
  Check,
  X,
  Settings,
  Clock,
  Loader2,
  Trash2,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { alertsApi } from "@/lib/api";

const typeColors = {
  critical: "border-red-500/50 bg-red-500/5",
  warning: "border-yellow-500/50 bg-yellow-500/5",
  info: "border-blue-500/50 bg-blue-500/5",
};

const typeBadgeColors = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
} as const;

export default function AlertsPage() {
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    type: "warning" as "critical" | "warning" | "info",
    condition: {
      metric: "usage.percent",
      operator: ">" as ">" | ">=" | "<" | "<=" | "==" | "!=",
      value: 75,
    },
  });

  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => alertsApi.list(true),
  });

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ["alerts-active"],
    queryFn: alertsApi.getActive,
  });

  const { data: stats } = useQuery({
    queryKey: ["alerts-stats"],
    queryFn: alertsApi.getStats,
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["alert-rules"],
    queryFn: alertsApi.listRules,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: alertsApi.acknowledge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-active"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-stats"] });
    },
  });

  const acknowledgeAllMutation = useMutation({
    mutationFn: alertsApi.acknowledgeAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-active"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-stats"] });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: alertsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-active"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-stats"] });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: alertsApi.createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-stats"] });
      setIsCreateRuleOpen(false);
      setNewRule({
        name: "",
        description: "",
        type: "warning",
        condition: {
          metric: "usage.percent",
          operator: ">",
          value: 75,
        },
      });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: alertsApi.toggleRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-stats"] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: alertsApi.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-stats"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">
            Monitor system alerts and configure alert rules
          </p>
        </div>
        <Button onClick={() => setIsCreateRuleOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Alert Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Alerts</CardDescription>
            <CardTitle className="text-3xl">{stats?.active || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats?.critical || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Warning</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">{stats?.warning || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alert Rules</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.enabledRules || 0}/{stats?.totalRules || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Alerts</CardTitle>
                  <CardDescription>Unacknowledged alerts requiring attention</CardDescription>
                </div>
                {activeAlerts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledgeAllMutation.mutate()}
                    disabled={acknowledgeAllMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Acknowledge All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active alerts</p>
                  <p className="text-sm">All systems operating normally</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between p-4 border rounded-lg ${
                        typeColors[alert.type as keyof typeof typeColors]
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`w-5 h-5 mt-0.5 ${
                            alert.type === "critical"
                              ? "text-red-500"
                              : alert.type === "warning"
                              ? "text-yellow-500"
                              : "text-blue-500"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant={typeBadgeColors[alert.type as keyof typeof typeBadgeColors]}>
                              {alert.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Source: {alert.source}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(alert.triggeredAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAlertMutation.mutate(alert.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>All alerts including acknowledged ones</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No alert history</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {alerts.map((alert: any) => (
                      <div
                        key={alert.id}
                        className={`flex items-start justify-between p-4 border rounded-lg ${
                          alert.acknowledged ? "opacity-60" : typeColors[alert.type as keyof typeof typeColors]
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{alert.title}</h4>
                              <Badge variant={typeBadgeColors[alert.type as keyof typeof typeBadgeColors]}>
                                {alert.type}
                              </Badge>
                              {alert.acknowledged && (
                                <Badge variant="secondary">Acknowledged</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.triggeredAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAlertMutation.mutate(alert.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>Configure when alerts are triggered</CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No alert rules configured</p>
                  <Button className="mt-4" onClick={() => setIsCreateRuleOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule: any) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRuleMutation.mutate(rule.id)}
                        />
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {rule.condition?.metric} {rule.condition?.operator} {rule.condition?.value}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={typeBadgeColors[rule.type as keyof typeof typeBadgeColors]}>
                          {rule.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Alert Rule</DialogTitle>
            <DialogDescription>
              Configure a new alert rule to monitor specific metrics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="e.g., Token Limit Warning"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Describe when this alert should trigger..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Alert Type</Label>
              <Select
                value={newRule.type}
                onValueChange={(value: "critical" | "warning" | "info") =>
                  setNewRule({ ...newRule, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={newRule.condition.metric}
                  onValueChange={(value) =>
                    setNewRule({
                      ...newRule,
                      condition: { ...newRule.condition, metric: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usage.percent">Usage %</SelectItem>
                    <SelectItem value="usage.tokens">Tokens</SelectItem>
                    <SelectItem value="sessions.active">Active Sessions</SelectItem>
                    <SelectItem value="sessions.errors">Error Count</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newRule.condition.operator}
                  onValueChange={(value: ">" | ">=" | "<" | "<=" | "==" | "!=") =>
                    setNewRule({
                      ...newRule,
                      condition: { ...newRule.condition, operator: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">">{">"}</SelectItem>
                    <SelectItem value=">=">{">="}</SelectItem>
                    <SelectItem value="<">{"<"}</SelectItem>
                    <SelectItem value="<=">{"<="}</SelectItem>
                    <SelectItem value="==">{"=="}</SelectItem>
                    <SelectItem value="!=">{"!="}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={newRule.condition.value}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      condition: { ...newRule.condition, value: parseInt(e.target.value) || 0 },
                    })
                  }
                  placeholder="Value"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateRuleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createRuleMutation.mutate(newRule)}
              disabled={!newRule.name.trim() || createRuleMutation.isPending}
            >
              {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
