"use client";

import type { ApiRequests } from "@/types/api";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Trash2,
  Play,
  Pause,
  Settings,
  Loader2,
  User,
  Brain,
  Network,
  GitMerge,
  Layers,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supervisorsApi } from "@/lib/api";
import { toast } from "sonner";

const strategies = [
  { value: "sequential", label: "Sequential", icon: ArrowRight, description: "Execute workers one after another" },
  { value: "parallel", label: "Parallel", icon: Layers, description: "Execute all workers simultaneously" },
  { value: "consensus", label: "Consensus", icon: GitMerge, description: "Workers vote on decisions" },
  { value: "adaptive", label: "Adaptive", icon: Brain, description: "Dynamically adjust based on performance" },
  { value: "hierarchical", label: "Hierarchical", icon: Network, description: "Multi-level worker coordination" },
];

const workerRoles = [
  { value: "coder", label: "Coder", description: "Runs commands and tasks" },
  { value: "reviewer", label: "Reviewer", description: "Reviews and validates output" },
  { value: "planner", label: "Planner", description: "Plans and breaks down tasks" },
  { value: "tester", label: "Tester", description: "Gathers information" },
  { value: "custom", label: "Custom", description: "Coordinates other workers" },
];

export default function SupervisorsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [newSupervisor, setNewSupervisor] = useState({
    name: "",
    description: "",
    strategy: "sequential",
  });
  const [addWorkerOpen, setAddWorkerOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: "",
    role: "coder",
    sessionId: "",
  });

  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["supervisors-stats"],
    queryFn: supervisorsApi.getStats,
  });

  const { data: supervisors = [], isLoading: supervisorsLoading } = useQuery({
    queryKey: ["supervisors"],
    queryFn: supervisorsApi.list,
  });

  const { data: supervisor } = useQuery({
    queryKey: ["supervisor", selectedSupervisor],
    queryFn: () => (selectedSupervisor ? supervisorsApi.get(selectedSupervisor) : null),
    enabled: !!selectedSupervisor,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["supervisor-workers", selectedSupervisor],
    queryFn: () => (selectedSupervisor ? supervisorsApi.get(selectedSupervisor).then((item) => item.workers) : []),
    enabled: !!selectedSupervisor,
  });

  const { data: executions = [] } = useQuery({
    queryKey: ["supervisor-executions", selectedSupervisor],
    queryFn: () => (selectedSupervisor ? supervisorsApi.listExecutions(selectedSupervisor) : []),
    enabled: !!selectedSupervisor,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["supervisor-templates"],
    queryFn: supervisorsApi.getTemplates,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newSupervisor) => supervisorsApi.create({ name: data.name, model: "claude-sonnet-4", strategy: data.strategy as ApiRequests["POST /api/supervisors"]["strategy"], systemPrompt: data.description, workers: [] }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["supervisors-stats"] });
      setSelectedSupervisor(result.id);
      setCreateOpen(false);
      setNewSupervisor({ name: "", description: "", strategy: "sequential" });
      toast.success("Supervisor created");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: supervisorsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["supervisors-stats"] });
      setSelectedSupervisor(null);
      toast.success("Supervisor deleted");
    },
  });

  const addWorkerMutation = useMutation({
    mutationFn: ({ supervisorId, data }: { supervisorId: string; data: Parameters<typeof supervisorsApi.addWorker>[1] }) =>
      supervisorsApi.addWorker(supervisorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervisor-workers", selectedSupervisor] });
      setAddWorkerOpen(false);
      setNewWorker({ name: "", role: "coder", sessionId: "" });
      toast.success("Worker added");
    },
  });

  const removeWorkerMutation = useMutation({
    mutationFn: ({ supervisorId, workerId }: { supervisorId: string; workerId: string }) =>
      supervisorsApi.removeWorker(supervisorId, workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervisor-workers", selectedSupervisor] });
      toast.success("Worker removed");
    },
  });

  const startExecutionMutation = useMutation({
    mutationFn: ({ supervisorId, task }: { supervisorId: string; task: string }) =>
      supervisorsApi.execute(supervisorId, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervisor-executions", selectedSupervisor] });
      queryClient.invalidateQueries({ queryKey: ["supervisors-stats"] });
      toast.success("Execution started");
    },
  });

  const isLoading = statsLoading || supervisorsLoading;

  const updateSettingsMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof supervisorsApi.update>[1] }) => supervisorsApi.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supervisor", selectedSupervisor] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-Agent Supervisors</h1>
          <p className="text-muted-foreground">
            Coordinate multiple AI agents working together on complex tasks
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Supervisor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Supervisor</DialogTitle>
              <DialogDescription>
                Set up a new multi-agent supervisor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newSupervisor.name}
                  onChange={(e) => setNewSupervisor({ ...newSupervisor, name: e.target.value })}
                  placeholder="My Supervisor"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newSupervisor.description}
                  onChange={(e) => setNewSupervisor({ ...newSupervisor, description: e.target.value })}
                  placeholder="Describe the supervisor's purpose..."
                />
              </div>
              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select
                  value={newSupervisor.strategy}
                  onValueChange={(value) => setNewSupervisor({ ...newSupervisor, strategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <s.icon className="w-4 h-4" />
                          <span>{s.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {strategies.find((s) => s.value === newSupervisor.strategy)?.description}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newSupervisor)}
                disabled={!newSupervisor.name || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Supervisors</CardDescription>
            <CardTitle className="text-3xl">{supervisors.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Configured</CardDescription>
            <CardTitle className="text-3xl text-green-500">{supervisors.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Workers</CardDescription>
            <CardTitle className="text-3xl">{supervisors.reduce((total, item) => total + item.workers.length, 0) || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Executions Today</CardDescription>
            <CardTitle className="text-3xl">{executions.filter((item) => new Date(item.startedAt).toDateString() === new Date().toDateString()).length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl">{((stats?.successRate || 0) * 100).toFixed(0)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Supervisor List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Supervisors</h3>
            {supervisors.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No supervisors yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {supervisors.map((s) => {
                  const strategy = strategies.find((st) => st.value === s.strategy);
                  const StrategyIcon = strategy?.icon || Network;

                  return (
                    <Card
                      key={s.id}
                      className={`cursor-pointer transition-colors ${
                        selectedSupervisor === s.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedSupervisor(s.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <StrategyIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.workers?.length || 0} workers
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              true
                                ? "default"
                                : false
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {"configured"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Templates */}
            <h3 className="text-lg font-medium mt-6">Templates</h3>
            <div className="space-y-2">
              {templates.map((t) => (
                <Card key={t.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Supervisor Details */}
          <div className="lg:col-span-2">
            {selectedSupervisor && supervisor ? (
              <Tabs defaultValue="workers" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{supervisor.name}</h3>
                    <p className="text-sm text-muted-foreground">{supervisor.systemPrompt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const task = prompt("Enter task for execution:");
                        if (task) {
                          startExecutionMutation.mutate({ supervisorId: selectedSupervisor, task });
                        }
                      }}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Execute
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(selectedSupervisor)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <TabsList>
                  <TabsTrigger value="workers">Workers ({workers.length})</TabsTrigger>
                  <TabsTrigger value="executions">Executions</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="workers" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Manage worker agents for this supervisor
                    </p>
                    <Dialog open={addWorkerOpen} onOpenChange={setAddWorkerOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Worker
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Worker</DialogTitle>
                          <DialogDescription>
                            Add a new worker agent to this supervisor
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              value={newWorker.name}
                              onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                              placeholder="Worker name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                              value={newWorker.role}
                              onValueChange={(value) => setNewWorker({ ...newWorker, role: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {workerRoles.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {workerRoles.find((r) => r.value === newWorker.role)?.description}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>System Prompt</Label>
                            <Input
                              value={newWorker.sessionId}
                              onChange={(e) => setNewWorker({ ...newWorker, sessionId: e.target.value })}
                              placeholder="Existing session ID"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddWorkerOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() =>
                              addWorkerMutation.mutate({
                                supervisorId: selectedSupervisor,
                                data: { name: newWorker.name, role: newWorker.role as Parameters<typeof supervisorsApi.addWorker>[1]["role"], model: "claude-sonnet-4", systemPrompt: newWorker.sessionId, enabled: true, priority: 0, capabilities: [] },
                              })
                            }
                            disabled={!newWorker.name || addWorkerMutation.isPending}
                          >
                            Add Worker
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {workers.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No workers yet. Add workers to start executing tasks.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {workers.map((worker) => (
                        <Card key={worker.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${
                                  worker.enabled ? "bg-green-500/20" : "bg-gray-500/20"
                                }`}>
                                  <User className={`w-4 h-4 ${
                                    worker.enabled ? "text-green-500" : "text-gray-500"
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-medium">{worker.name}</p>
                                  <p className="text-xs text-muted-foreground">{worker.role}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeWorkerMutation.mutate({
                                    supervisorId: selectedSupervisor,
                                    workerId: worker.id,
                                  })
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <Badge variant={worker.enabled ? "default" : "secondary"}>
                                  {worker.enabled ? "enabled" : "disabled"}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Tasks</p>
                                <p>{executions.reduce((total, item) => total + item.workerExecutions.filter((run) => run.workerId === worker.id && run.status === "completed").length, 0)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="executions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Execution History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Started</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {executions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                No executions yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            executions.map((exec) => (
                              <TableRow key={exec.id}>
                                <TableCell className="max-w-[200px] truncate">
                                  {exec.task}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      exec.status === "completed"
                                        ? "default"
                                        : ["planning", "executing", "aggregating"].includes(exec.status)
                                        ? "secondary"
                                        : exec.status === "failed"
                                        ? "destructive"
                                        : "outline"
                                    }
                                  >
                                    {exec.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                                    {["planning", "executing", "aggregating"].includes(exec.status) && <Activity className="w-3 h-3 mr-1 animate-pulse" />}
                                    {exec.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                                    {exec.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {exec.metrics.totalDuration ? `${exec.metrics.totalDuration}ms` : "-"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(exec.startedAt).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Supervisor Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Strategy</Label>
                        <Select defaultValue={supervisor.strategy}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {strategies.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                <div className="flex items-center gap-2">
                                  <s.icon className="w-4 h-4" />
                                  <span>{s.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Max Iterations</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          defaultValue={supervisor.settings.maxIterations || 3}
                          onBlur={(event) => {
                            const value = event.target.valueAsNumber;
                            if (Number.isInteger(value) && value >= 1 && value <= 100) updateSettingsMutation.mutate({ id: supervisor.id, updates: { settings: { ...supervisor.settings, maxIterations: value } } });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Timeout (ms)</Label>
                        <Input
                          type="number"
                          min="1000"
                          defaultValue={supervisor.settings.timeout || 300000}
                          onBlur={(event) => {
                            const value = event.target.valueAsNumber;
                            if (Number.isInteger(value) && value >= 1000) updateSettingsMutation.mutate({ id: supervisor.id, updates: { settings: { ...supervisor.settings, timeout: value } } });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Aggregate Worker Results</Label>
                          <p className="text-sm text-muted-foreground">
                            Combine worker outputs into one result
                          </p>
                        </div>
                        <Switch checked={supervisor.settings.aggregationEnabled} onCheckedChange={(checked) => updateSettingsMutation.mutate({ id: supervisor.id, updates: { settings: { ...supervisor.settings, aggregationEnabled: checked } } })} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a supervisor to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
