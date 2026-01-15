"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Kanban,
  Plus,
  MoreVertical,
  Clock,
  User,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { tasksApi, sessionsApi } from "@/lib/api";

const columns = [
  { id: "todo", title: "To Do", icon: Circle },
  { id: "in_progress", title: "In Progress", icon: Clock },
  { id: "review", title: "Review", icon: AlertCircle },
  { id: "done", title: "Done", icon: CheckCircle },
];

const priorityColors = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-red-500/10 text-red-500",
  critical: "bg-purple-500/10 text-purple-500",
};

export default function TasksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    tags: [] as string[],
    dueDate: "",
  });
  const [tagInput, setTagInput] = useState("");

  const queryClient = useQueryClient();

  const { data: board, isLoading } = useQuery({
    queryKey: ["tasks-board"],
    queryFn: tasksApi.getBoard,
  });

  const { data: stats } = useQuery({
    queryKey: ["tasks-stats"],
    queryFn: tasksApi.getStats,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-stats"] });
      setIsCreateOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        tags: [],
        dueDate: "",
      });
      setTagInput("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-stats"] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.move(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-stats"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, sessionId }: { id: string; sessionId: string }) =>
      tasksApi.assign(id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: tasksApi.unassign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-board"] });
    },
  });

  const getTasksByStatus = (status: string) =>
    board?.[status as keyof typeof board] || [];

  const addTag = () => {
    if (tagInput.trim() && !newTask.tags.includes(tagInput.trim())) {
      setNewTask({ ...newTask, tags: [...newTask.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setNewTask({ ...newTask, tags: newTask.tags.filter((t) => t !== tag) });
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusOrder = ["todo", "in_progress", "review", "done"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Boards</h1>
          <p className="text-muted-foreground">
            Manage and assign tasks to Claude sessions
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{stats?.inProgress || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Priority</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {stats?.highPriority || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {stats?.completed || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((column) => {
            const tasks = getTasksByStatus(column.id);
            const Icon = column.icon;

            return (
              <Card key={column.id} className="min-h-[500px]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="w-4 h-4" />
                    {column.title}
                    <Badge variant="secondary" className="ml-auto">
                      {tasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-2">
                    <div className="space-y-3">
                      {tasks.map((task: any) => (
                        <Card key={task.id} className="cursor-pointer hover:bg-accent">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {getNextStatus(task.status) && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        moveMutation.mutate({
                                          id: task.id,
                                          status: getNextStatus(task.status)!,
                                        })
                                      }
                                    >
                                      <ArrowRight className="w-4 h-4 mr-2" />
                                      Move to {columns.find((c) => c.id === getNextStatus(task.status))?.title}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {sessions.length > 0 && (
                                    <>
                                      {sessions.map((session: any) => (
                                        <DropdownMenuItem
                                          key={session.id}
                                          onClick={() =>
                                            assignMutation.mutate({
                                              id: task.id,
                                              sessionId: session.id,
                                            })
                                          }
                                        >
                                          <User className="w-4 h-4 mr-2" />
                                          Assign to {session.name}
                                        </DropdownMenuItem>
                                      ))}
                                      {task.assignedSessionId && (
                                        <DropdownMenuItem
                                          onClick={() => unassignMutation.mutate(task.id)}
                                        >
                                          <User className="w-4 h-4 mr-2" />
                                          Unassign
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => deleteMutation.mutate(task.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {task.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="secondary"
                                className={priorityColors[task.priority as keyof typeof priorityColors]}
                              >
                                {task.priority}
                              </Badge>
                              {task.assignedSessionId && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>{task.assignedSessionId.slice(0, 8)}</span>
                                </div>
                              )}
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <Calendar className="w-3 h-3" />
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {tasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No tasks
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Implement user authentication"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Describe the task..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: "low" | "medium" | "high" | "critical") =>
                    setNewTask({ ...newTask, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {newTask.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newTask.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} x
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newTask)}
              disabled={!newTask.title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
