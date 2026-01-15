"use client";

import { useState } from "react";
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  MoreVertical,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
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

// Mock workflow data for demonstration
const mockWorkflows = [
  {
    id: "wf-1",
    name: "Code Review Pipeline",
    description: "Automated code review with multiple Claude agents",
    status: "active",
    steps: [
      { name: "Lint Check", status: "completed" },
      { name: "Security Scan", status: "completed" },
      { name: "Code Review", status: "running" },
      { name: "Documentation", status: "pending" },
    ],
    lastRun: "2024-01-15T10:30:00Z",
    runsToday: 12,
  },
  {
    id: "wf-2",
    name: "Feature Development",
    description: "End-to-end feature implementation workflow",
    status: "idle",
    steps: [
      { name: "Requirements Analysis", status: "pending" },
      { name: "Design", status: "pending" },
      { name: "Implementation", status: "pending" },
      { name: "Testing", status: "pending" },
    ],
    lastRun: "2024-01-14T16:45:00Z",
    runsToday: 3,
  },
  {
    id: "wf-3",
    name: "Bug Fix Workflow",
    description: "Diagnose and fix bugs with AI assistance",
    status: "error",
    steps: [
      { name: "Reproduce", status: "completed" },
      { name: "Diagnose", status: "error" },
      { name: "Fix", status: "pending" },
      { name: "Verify", status: "pending" },
    ],
    lastRun: "2024-01-15T09:15:00Z",
    runsToday: 5,
  },
];

const statusColors = {
  active: "bg-green-500",
  idle: "bg-gray-500",
  error: "bg-red-500",
};

const stepStatusIcons = {
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  running: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  pending: <Clock className="w-4 h-4 text-gray-400" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function WorkflowsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: "", description: "" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Orchestrate multi-agent workflows for complex tasks
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Workflows</CardDescription>
            <CardTitle className="text-3xl">{mockWorkflows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Now</CardDescription>
            <CardTitle className="text-3xl">
              {mockWorkflows.filter((w) => w.status === "active").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Runs Today</CardDescription>
            <CardTitle className="text-3xl">
              {mockWorkflows.reduce((sum, w) => sum + w.runsToday, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Error Rate</CardDescription>
            <CardTitle className="text-3xl">
              {(
                (mockWorkflows.filter((w) => w.status === "error").length /
                  mockWorkflows.length) *
                100
              ).toFixed(0)}
              %
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Workflow List */}
      <div className="space-y-4">
        {mockWorkflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      statusColors[workflow.status as keyof typeof statusColors]
                    }`}
                  />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      {workflow.name}
                    </CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      workflow.status === "active"
                        ? "default"
                        : workflow.status === "error"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {workflow.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    {workflow.status === "active" ? (
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
                      <DropdownMenuItem>Edit Workflow</DropdownMenuItem>
                      <DropdownMenuItem>View History</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Workflow Steps */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {workflow.steps.map((step, index) => (
                  <div key={step.name} className="flex items-center">
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                        step.status === "running"
                          ? "border-blue-500 bg-blue-500/10"
                          : step.status === "completed"
                          ? "border-green-500/30 bg-green-500/5"
                          : step.status === "error"
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-border"
                      }`}
                    >
                      {stepStatusIcons[step.status as keyof typeof stepStatusIcons]}
                      <span className="text-sm whitespace-nowrap">{step.name}</span>
                    </div>
                    {index < workflow.steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span>Last run: {new Date(workflow.lastRun).toLocaleString()}</span>
                <span>Runs today: {workflow.runsToday}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <GitBranch className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Visual Workflow Builder Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Drag-and-drop workflow editor with conditional branching, parallel execution,
            and real-time monitoring will be available in a future update.
          </p>
        </CardContent>
      </Card>

      {/* Create Workflow Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Define a new multi-agent workflow for automated task orchestration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <Input
                value={newWorkflow.name}
                onChange={(e) =>
                  setNewWorkflow({ ...newWorkflow, name: e.target.value })
                }
                placeholder="e.g., Code Review Pipeline"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newWorkflow.description}
                onChange={(e) =>
                  setNewWorkflow({ ...newWorkflow, description: e.target.value })
                }
                placeholder="Describe what this workflow does..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!newWorkflow.name.trim()}>Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
