"use client";

import { Zap, Plus, Clock, Play, Pause, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockAutomations = [
  {
    id: "1",
    name: "Daily Code Review",
    description: "Run code review on all PRs every morning",
    trigger: "schedule",
    schedule: "0 9 * * *",
    lastRun: "2024-01-15T09:00:00Z",
    status: "active",
  },
  {
    id: "2",
    name: "PR Comment Handler",
    description: "Auto-respond to PR comments with AI assistance",
    trigger: "webhook",
    lastRun: "2024-01-15T10:30:00Z",
    status: "active",
  },
  {
    id: "3",
    name: "Nightly Tests",
    description: "Run full test suite every night",
    trigger: "schedule",
    schedule: "0 2 * * *",
    lastRun: "2024-01-15T02:00:00Z",
    status: "paused",
  },
];

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation</h1>
          <p className="text-muted-foreground">
            Schedule and automate recurring Claude tasks
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Automations</CardDescription>
            <CardTitle className="text-3xl">{mockAutomations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl">
              {mockAutomations.filter((a) => a.status === "active").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Runs Today</CardDescription>
            <CardTitle className="text-3xl">24</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl">98%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Automation List */}
      <div className="space-y-4">
        {mockAutomations.map((automation) => (
          <Card key={automation.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{automation.name}</CardTitle>
                    <CardDescription>{automation.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={automation.status === "active" ? "default" : "secondary"}
                  >
                    {automation.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    {automation.status === "active" ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {automation.trigger === "schedule"
                      ? `Schedule: ${automation.schedule}`
                      : "Webhook trigger"}
                  </span>
                </div>
                <span>Last run: {new Date(automation.lastRun).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Advanced Automation Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Cron expressions, webhook triggers, conditional execution, and integration
            with external services will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
