"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GitMerge,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Clock,
  CheckCircle,
  MoreVertical,
  Trash2,
  Loader2,
  XCircle,
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
import { chainsApi } from "@/lib/api";

const modelColors = {
  haiku: "bg-green-500",
  sonnet: "bg-blue-500",
  opus: "bg-purple-500",
};

const modelLabels = {
  haiku: "Haiku",
  sonnet: "Sonnet",
  opus: "Opus",
};

export default function ChainsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newChain, setNewChain] = useState({
    name: "",
    description: "",
    steps: [{ name: "", model: "sonnet" as "haiku" | "sonnet" | "opus", prompt: "", systemPrompt: "" }],
  });

  const queryClient = useQueryClient();

  const { data: chains = [], isLoading } = useQuery({
    queryKey: ["chains"],
    queryFn: chainsApi.list,
  });

  const { data: stats } = useQuery({
    queryKey: ["chains-stats"],
    queryFn: chainsApi.getStats,
  });

  const createMutation = useMutation({
    mutationFn: chainsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
      queryClient.invalidateQueries({ queryKey: ["chains-stats"] });
      setIsCreateOpen(false);
      setNewChain({
        name: "",
        description: "",
        steps: [{ name: "", model: "sonnet", prompt: "", systemPrompt: "" }],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: chainsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
      queryClient.invalidateQueries({ queryKey: ["chains-stats"] });
    },
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => chainsApi.run(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: chainsApi.stop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
    },
  });

  const addStep = () => {
    setNewChain({
      ...newChain,
      steps: [...newChain.steps, { name: "", model: "sonnet", prompt: "", systemPrompt: "" }],
    });
  };

  const removeStep = (index: number) => {
    setNewChain({
      ...newChain,
      steps: newChain.steps.filter((_, i) => i !== index),
    });
  };

  const updateStep = (index: number, field: string, value: string) => {
    const updatedSteps = [...newChain.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setNewChain({ ...newChain, steps: updatedSteps });
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chains</h1>
          <p className="text-muted-foreground">
            Multi-model processing pipelines for complex tasks
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Chain
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Chains</CardDescription>
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
            <CardDescription>Total Runs</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalRuns || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Steps</CardDescription>
            <CardTitle className="text-3xl">{stats?.avgSteps?.toFixed(1) || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Chains List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : chains.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitMerge className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Chains Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Create your first chain to orchestrate multi-model processing.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Chain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {chains.map((chain: any) => (
            <Card key={chain.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <GitMerge className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{chain.name}</CardTitle>
                      <CardDescription>{chain.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        chain.status === "running"
                          ? "default"
                          : chain.status === "completed"
                          ? "secondary"
                          : chain.status === "error"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {chain.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        chain.status === "running"
                          ? stopMutation.mutate(chain.id)
                          : runMutation.mutate(chain.id)
                      }
                      disabled={runMutation.isPending || stopMutation.isPending}
                    >
                      {chain.status === "running" ? (
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
                        <DropdownMenuItem onClick={() => runMutation.mutate(chain.id)}>
                          <Play className="w-4 h-4 mr-2" />
                          Run Chain
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(chain.id)}
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
                {/* Chain Steps */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {chain.steps?.map((step: any, index: number) => (
                    <div key={step.id || index} className="flex items-center">
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
                        {getStepStatusIcon(step.status)}
                        <div>
                          <span className="text-sm whitespace-nowrap">{step.name}</span>
                          <div className="flex items-center gap-1 mt-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                modelColors[step.model as keyof typeof modelColors] || "bg-gray-400"
                              }`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {modelLabels[step.model as keyof typeof modelLabels] || step.model}
                            </span>
                          </div>
                        </div>
                      </div>
                      {index < chain.steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  {chain.lastRunAt && (
                    <span>Last run: {new Date(chain.lastRunAt).toLocaleString()}</span>
                  )}
                  <span>Total runs: {chain.runsCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Chain Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Chain</DialogTitle>
            <DialogDescription>
              Define a multi-model processing pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chain Name</Label>
              <Input
                value={newChain.name}
                onChange={(e) => setNewChain({ ...newChain, name: e.target.value })}
                placeholder="e.g., Code Analysis Pipeline"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newChain.description}
                onChange={(e) => setNewChain({ ...newChain, description: e.target.value })}
                placeholder="Describe what this chain does..."
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
              {newChain.steps.map((step, index) => (
                <Card key={index}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Step {index + 1}</Label>
                      {newChain.steps.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(index, "name", e.target.value)}
                        placeholder="Step name"
                      />
                      <Select
                        value={step.model}
                        onValueChange={(value) => updateStep(index, "model", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="haiku">Haiku (Fast)</SelectItem>
                          <SelectItem value="sonnet">Sonnet (Balanced)</SelectItem>
                          <SelectItem value="opus">Opus (Powerful)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={step.prompt}
                      onChange={(e) => updateStep(index, "prompt", e.target.value)}
                      placeholder="Prompt for this step (use {{input}} for previous step output)"
                      rows={2}
                    />
                    <Textarea
                      value={step.systemPrompt}
                      onChange={(e) => updateStep(index, "systemPrompt", e.target.value)}
                      placeholder="System prompt (optional)"
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
              onClick={() => createMutation.mutate(newChain)}
              disabled={
                !newChain.name.trim() ||
                !newChain.steps[0]?.name?.trim() ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? "Creating..." : "Create Chain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
