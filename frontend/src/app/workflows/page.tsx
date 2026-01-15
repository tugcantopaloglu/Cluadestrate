"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { workflowsApi } from "@/lib/api";

const stepStatusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  running: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  pending: <Clock className="w-4 h-4 text-gray-400" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function WorkflowsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    steps: [{ name: "", prompt: "", model: "claude-sonnet-4-20250514" }],
  });

  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: workflowsApi.list,
  });

  const { data: stats } = useQuery({
    queryKey: ["workflows-stats"],
    queryFn: workflowsApi.getStats,
  });

  const createMutation = useMutation({
    mutationFn: workflowsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflows-stats"] });
      setIsCreateOpen(false);
      setNewWorkflow({
        name: "",
        description: "",
        steps: [{ name: "", prompt: "", model: "claude-sonnet-4-20250514" }],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: workflowsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflows-stats"] });
    },
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.run(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: workflowsApi.stop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  const addStep = () => {
    setNewWorkflow({
      ...newWorkflow,
      steps: [...newWorkflow.steps, { name: "", prompt: "", model: "claude-sonnet-4-20250514" }],
    });
  };

  const removeStep = (index: number) => {
    setNewWorkflow({
      ...newWorkflow,
      steps: newWorkflow.steps.filter((_, i) => i !== index),
    });
  };

  const updateStep = (index: number, field: string, value: string) => {
    const updatedSteps = [...newWorkflow.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setNewWorkflow({ ...newWorkflow, steps: updatedSteps });
  };

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
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Running</CardDescription>
            <CardTitle className="text-3xl">{stats?.running || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{stats?.completed || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Runs</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalRuns || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Workflow List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Workflows Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Create your first workflow to orchestrate multi-step tasks with Claude.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow: any) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        workflow.status === "running"
                          ? "bg-green-500"
                          : workflow.status === "error"
                          ? "bg-red-500"
                          : "bg-gray-500"
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
                        workflow.status === "running"
                          ? "default"
                          : workflow.status === "error"
                          ? "destructive"
                          : workflow.status === "completed"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {workflow.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        workflow.status === "running"
                          ? stopMutation.mutate(workflow.id)
                          : runMutation.mutate(workflow.id)
                      }
                      disabled={runMutation.isPending || stopMutation.isPending}
                    >
                      {workflow.status === "running" ? (
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
                        <DropdownMenuItem onClick={() => runMutation.mutate(workflow.id)}>
                          Run Workflow
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(workflow.id)}
                        >
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
                  {workflow.steps?.map((step: any, index: number) => (
                    <div key={step.id} className="flex items-center">
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
                        {stepStatusIcons[step.status] || stepStatusIcons.pending}
                        <span className="text-sm whitespace-nowrap">{step.name}</span>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  {workflow.lastRunAt && (
                    <span>Last run: {new Date(workflow.lastRunAt).toLocaleString()}</span>
                  )}
                  <span>Runs: {workflow.runsCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Workflow Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Define a multi-step workflow for automated task orchestration.
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
                rows={2}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </div>
              {newWorkflow.steps.map((step, index) => (
                <Card key={index}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Step {index + 1}</Label>
                      {newWorkflow.steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={step.name}
                      onChange={(e) => updateStep(index, "name", e.target.value)}
                      placeholder="Step name"
                    />
                    <Textarea
                      value={step.prompt}
                      onChange={(e) => updateStep(index, "prompt", e.target.value)}
                      placeholder="Prompt for this step (use {{input}} for previous step output)"
                      rows={2}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newWorkflow)}
              disabled={
                !newWorkflow.name.trim() ||
                !newWorkflow.steps[0]?.name?.trim() ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
