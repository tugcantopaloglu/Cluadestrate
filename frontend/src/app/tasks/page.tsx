"use client";

import { useState } from "react";
import {
  Kanban,
  Plus,
  MoreVertical,
  Clock,
  User,
  CheckCircle,
  Circle,
  AlertCircle,
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

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignedSession?: string;
  createdAt: string;
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Implement user authentication",
    description: "Add OAuth 2.0 login flow",
    status: "in_progress",
    priority: "high",
    assignedSession: "session-1",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "2",
    title: "Fix pagination bug",
    description: "List not updating on page change",
    status: "review",
    priority: "medium",
    assignedSession: "session-2",
    createdAt: "2024-01-14T14:00:00Z",
  },
  {
    id: "3",
    title: "Add dark mode support",
    description: "Implement theme switching",
    status: "todo",
    priority: "low",
    createdAt: "2024-01-14T10:00:00Z",
  },
  {
    id: "4",
    title: "Write API documentation",
    description: "Document all REST endpoints",
    status: "done",
    priority: "medium",
    assignedSession: "session-1",
    createdAt: "2024-01-13T09:00:00Z",
  },
  {
    id: "5",
    title: "Optimize database queries",
    description: "Reduce N+1 queries in product listing",
    status: "todo",
    priority: "high",
    createdAt: "2024-01-13T15:00:00Z",
  },
];

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
};

export default function TasksPage() {
  const getTasksByStatus = (status: string) =>
    mockTasks.filter((task) => task.status === status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Boards</h1>
          <p className="text-muted-foreground">
            Manage and assign tasks to Claude sessions
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-3xl">{mockTasks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">
              {mockTasks.filter((t) => t.status === "in_progress").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Priority</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {mockTasks.filter((t) => t.priority === "high").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {mockTasks.filter((t) => t.status === "done").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Kanban Board */}
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
                    {tasks.map((task) => (
                      <Card key={task.id} className="cursor-pointer hover:bg-accent">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            {task.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className={priorityColors[task.priority]}
                            >
                              {task.priority}
                            </Badge>
                            {task.assignedSession && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>{task.assignedSession.slice(0, 8)}</span>
                              </div>
                            )}
                          </div>
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

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Kanban className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Drag & Drop Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Full kanban functionality with drag-and-drop, auto-assignment to sessions,
            and task dependencies will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
