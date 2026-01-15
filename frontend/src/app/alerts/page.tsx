"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Plus,
  Bell,
  BellOff,
  Check,
  X,
  Settings,
  Clock,
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

interface Alert {
  id: string;
  type: "warning" | "critical" | "info";
  title: string;
  message: string;
  source: string;
  triggeredAt: string;
  acknowledged: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  type: "warning" | "critical" | "info";
  enabled: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "critical",
    title: "Token Limit Exceeded",
    message: "Daily token usage has exceeded 90% of the limit",
    source: "Usage Monitor",
    triggeredAt: "2024-01-15T10:30:00Z",
    acknowledged: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Session Idle",
    message: "Session 'api-development' has been idle for 2 hours",
    source: "Session Monitor",
    triggeredAt: "2024-01-15T09:45:00Z",
    acknowledged: false,
  },
  {
    id: "3",
    type: "info",
    title: "MCP Server Connected",
    message: "filesystem-server successfully connected",
    source: "MCP Manager",
    triggeredAt: "2024-01-15T08:00:00Z",
    acknowledged: true,
  },
  {
    id: "4",
    type: "warning",
    title: "High Error Rate",
    message: "Error rate above 10% in the last hour",
    source: "Session Monitor",
    triggeredAt: "2024-01-14T22:00:00Z",
    acknowledged: true,
  },
];

const mockRules: AlertRule[] = [
  {
    id: "1",
    name: "Token Limit Warning",
    condition: "Token usage > 75%",
    type: "warning",
    enabled: true,
  },
  {
    id: "2",
    name: "Token Limit Critical",
    condition: "Token usage > 90%",
    type: "critical",
    enabled: true,
  },
  {
    id: "3",
    name: "Session Idle Alert",
    condition: "Session idle > 1 hour",
    type: "warning",
    enabled: true,
  },
  {
    id: "4",
    name: "Error Rate Alert",
    condition: "Error rate > 10%",
    type: "warning",
    enabled: false,
  },
];

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
  const activeAlerts = mockAlerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">
            Monitor system alerts and configure alert rules
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Alert Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Alerts</CardDescription>
            <CardTitle className="text-3xl">{activeAlerts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {mockAlerts.filter((a) => a.type === "critical" && !a.acknowledged).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Warning</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              {mockAlerts.filter((a) => a.type === "warning" && !a.acknowledged).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alert Rules</CardDescription>
            <CardTitle className="text-3xl">
              {mockRules.filter((r) => r.enabled).length}/{mockRules.length}
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
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Unacknowledged alerts requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active alerts</p>
                  <p className="text-sm">All systems operating normally</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between p-4 border rounded-lg ${
                        typeColors[alert.type]
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
                            <Badge variant={typeBadgeColors[alert.type]}>
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
                        <Button size="sm" variant="outline">
                          <Check className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                        <Button size="sm" variant="ghost">
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
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {mockAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between p-4 border rounded-lg ${
                        alert.acknowledged ? "opacity-60" : typeColors[alert.type]
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant={typeBadgeColors[alert.type]}>
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
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
              <div className="space-y-3">
                {mockRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Switch checked={rule.enabled} />
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.condition}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={typeBadgeColors[rule.type]}>{rule.type}</Badge>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
