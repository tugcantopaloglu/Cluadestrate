"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  Settings,
  FolderOpen,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sessionsApi } from "@/lib/api";
import Link from "next/link";
import type { Session, SessionMode, ModelId } from "@/types/session";

const statusColors = {
  idle: "bg-gray-500",
  running: "bg-green-500",
  paused: "bg-yellow-500",
  error: "bg-red-500",
};

const statusLabels = {
  idle: "Idle",
  running: "Running",
  paused: "Paused",
  error: "Error",
};

export default function SessionsPage() {
  return (
    <Suspense fallback={<SessionsPageLoading />}>
      <SessionsPageContent />
    </Suspense>
  );
}

function SessionsPageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">
            Manage your Claude Code sessions
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </div>
  );
}

function SessionsPageContent() {
  const searchParams = useSearchParams();
  const showNewDialog = searchParams.get("new") === "true";
  const defaultMode = searchParams.get("mode") as SessionMode | null;

  const [isNewSessionOpen, setIsNewSessionOpen] = useState(showNewDialog);
  const [newSession, setNewSession] = useState({
    name: "",
    workingDirectory: "",
    mode: (defaultMode || "doer") as SessionMode,
    model: "claude-sonnet-4-20250514" as ModelId,
    autoApprove: false,
  });

  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newSession) =>
      sessionsApi.create({
        name: data.name,
        workingDirectory: data.workingDirectory,
        mode: data.mode,
        config: {
          model: data.model,
          autoApprove: data.autoApprove,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setIsNewSessionOpen(false);
      setNewSession({
        name: "",
        workingDirectory: "",
        mode: "doer",
        model: "claude-sonnet-4-20250514",
        autoApprove: false,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sessionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => sessionsApi.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => sessionsApi.stop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">
            Manage your Claude Code sessions
          </p>
        </div>
        <Button onClick={() => setIsNewSessionOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Sessions allow you to run Claude Code instances with different
              configurations and purposes.
            </p>
            <Button onClick={() => setIsNewSessionOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session: Session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        statusColors[session.status]
                      }`}
                    />
                    <div>
                      <Link
                        href={`/sessions/${session.id}`}
                        className="font-medium hover:underline"
                      >
                        {session.name}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {session.mode}
                        </Badge>
                        <span>{session.workingDirectory}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {(session.usage.tokensUsed / 1000).toFixed(1)}K tokens
                      </div>
                      <div className="text-muted-foreground">
                        {statusLabels[session.status]}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.status === "idle" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startMutation.mutate(session.id)}
                          disabled={startMutation.isPending}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      {session.status === "running" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => stopMutation.mutate(session.id)}
                          disabled={stopMutation.isPending}
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/sessions/${session.id}`}>
                          <Settings className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMutation.mutate(session.id)}
                        disabled={deleteMutation.isPending || session.status === "running"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Session Dialog */}
      <Dialog open={isNewSessionOpen} onOpenChange={setIsNewSessionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Configure a new Claude Code session with your preferred settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                placeholder="e.g., Frontend Refactor"
                value={newSession.name}
                onChange={(e) =>
                  setNewSession({ ...newSession, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workingDirectory">Working Directory</Label>
              <Input
                id="workingDirectory"
                placeholder="e.g., C:\Projects\MyApp"
                value={newSession.workingDirectory}
                onChange={(e) =>
                  setNewSession({ ...newSession, workingDirectory: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Mode</Label>
              <Select
                value={newSession.mode}
                onValueChange={(value: SessionMode) =>
                  setNewSession({ ...newSession, mode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doer">
                    Doer - Execute tasks directly
                  </SelectItem>
                  <SelectItem value="planner">
                    Planner - Plan before executing
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={newSession.model}
                onValueChange={(value: ModelId) =>
                  setNewSession({ ...newSession, model: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-opus-4-5-20251101">
                    Claude Opus 4.5 - Most capable
                  </SelectItem>
                  <SelectItem value="claude-sonnet-4-20250514">
                    Claude Sonnet 4 - Balanced
                  </SelectItem>
                  <SelectItem value="claude-haiku-3-5-20241022">
                    Claude Haiku 3.5 - Fast
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Approve</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically approve all tool uses
                </p>
              </div>
              <Switch
                checked={newSession.autoApprove}
                onCheckedChange={(checked) =>
                  setNewSession({ ...newSession, autoApprove: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewSessionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newSession)}
              disabled={
                createMutation.isPending ||
                !newSession.name ||
                !newSession.workingDirectory
              }
            >
              {createMutation.isPending ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
