"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap,
  Plus,
  Clock,
  Play,
  Pause,
  MoreVertical,
  Trash2,
  Loader2,
  Webhook,
  Calendar,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { automationsApi, workflowsApi } from "@/lib/api";

export default function AutomationPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    description: "",
    trigger: {
      type: "schedule" as "schedule" | "webhook" | "event",
      schedule: "0 9 * * *",
      webhookPath: "",
      eventType: "",
    },
    workflowId: "",
  });

  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: automationsApi.list,
  });

  const { data: stats } = useQuery({
    queryKey: ["automations-stats"],
    queryFn: automationsApi.getStats,
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ["workflows"],
    queryFn: workflowsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: automationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      queryClient.invalidateQueries({ queryKey: ["automations-stats"] });
      setIsCreateOpen(false);
      setNewAutomation({
        name: "",
        description: "",
        trigger: {
          type: "schedule",
          schedule: "0 9 * * *",
          webhookPath: "",
          eventType: "",
        },
        workflowId: "",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: automationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      queryClient.invalidateQueries({ queryKey: ["automations-stats"] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: automationsApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: automationsApi.pause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  const runMutation = useMutation({
    mutationFn: automationsApi.run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation</h1>
          <p className="text-muted-foreground">
            Schedule and automate recurring Claude tasks
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Automations</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl">{stats?.active || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Runs Today</CardDescription>
            <CardTitle className="text-3xl">{stats?.runsToday || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl">{stats?.successRate || 0}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Automation List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Automations Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Create your first automation to schedule recurring tasks.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {automations.map((automation: any) => (
            <Card key={automation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      {automation.trigger?.type === "webhook" ? (
                        <Webhook className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Zap className="w-5 h-5 text-yellow-500" />
                      )}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        automation.status === "active"
                          ? pauseMutation.mutate(automation.id)
                          : activateMutation.mutate(automation.id)
                      }
                      disabled={activateMutation.isPending || pauseMutation.isPending}
                    >
                      {automation.status === "active" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => runMutation.mutate(automation.id)}>
                          <Play className="w-4 h-4 mr-2" />
                          Run Now
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(automation.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {automation.trigger?.type === "schedule" ? (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Schedule: {automation.trigger.schedule}</span>
                      </>
                    ) : automation.trigger?.type === "webhook" ? (
                      <>
                        <Webhook className="w-4 h-4" />
                        <span>Webhook: {automation.trigger.webhookPath}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Event: {automation.trigger?.eventType}</span>
                      </>
                    )}
                  </div>
                  {automation.lastRunAt && (
                    <span>Last run: {new Date(automation.lastRunAt).toLocaleString()}</span>
                  )}
                  <span>Runs: {automation.runsCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Automation Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Automation</DialogTitle>
            <DialogDescription>
              Set up a scheduled or triggered automation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newAutomation.name}
                onChange={(e) =>
                  setNewAutomation({ ...newAutomation, name: e.target.value })
                }
                placeholder="e.g., Daily Code Review"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newAutomation.description}
                onChange={(e) =>
                  setNewAutomation({ ...newAutomation, description: e.target.value })
                }
                placeholder="Describe what this automation does..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select
                value={newAutomation.trigger.type}
                onValueChange={(value: "schedule" | "webhook" | "event") =>
                  setNewAutomation({
                    ...newAutomation,
                    trigger: { ...newAutomation.trigger, type: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">Schedule (Cron)</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newAutomation.trigger.type === "schedule" && (
              <div className="space-y-2">
                <Label>Cron Schedule</Label>
                <Input
                  value={newAutomation.trigger.schedule}
                  onChange={(e) =>
                    setNewAutomation({
                      ...newAutomation,
                      trigger: { ...newAutomation.trigger, schedule: e.target.value },
                    })
                  }
                  placeholder="0 9 * * * (every day at 9 AM)"
                />
                <p className="text-xs text-muted-foreground">
                  Use cron syntax: minute hour day month weekday
                </p>
              </div>
            )}
            {newAutomation.trigger.type === "webhook" && (
              <div className="space-y-2">
                <Label>Webhook Path</Label>
                <Input
                  value={newAutomation.trigger.webhookPath}
                  onChange={(e) =>
                    setNewAutomation({
                      ...newAutomation,
                      trigger: { ...newAutomation.trigger, webhookPath: e.target.value },
                    })
                  }
                  placeholder="/hooks/my-automation"
                />
              </div>
            )}
            {newAutomation.trigger.type === "event" && (
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={newAutomation.trigger.eventType}
                  onValueChange={(value) =>
                    setNewAutomation({
                      ...newAutomation,
                      trigger: { ...newAutomation.trigger, eventType: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session:completed">Session Completed</SelectItem>
                    <SelectItem value="workflow:completed">Workflow Completed</SelectItem>
                    <SelectItem value="task:completed">Task Completed</SelectItem>
                    <SelectItem value="alert:triggered">Alert Triggered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {workflows.length > 0 && (
              <div className="space-y-2">
                <Label>Linked Workflow (Optional)</Label>
                <Select
                  value={newAutomation.workflowId}
                  onValueChange={(value) =>
                    setNewAutomation({ ...newAutomation, workflowId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workflow to run" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((wf: any) => (
                      <SelectItem key={wf.id} value={wf.id}>
                        {wf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newAutomation)}
              disabled={!newAutomation.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Automation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
