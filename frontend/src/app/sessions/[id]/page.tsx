"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Square,
  Send,
  Settings,
  Trash2,
  ChevronLeft,
  Cpu,
  Clock,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { sessionsApi } from "@/lib/api";
import { subscribeToSession, sendSessionInput, connectSocket } from "@/lib/socket";
import { useSessionStore } from "@/stores/sessionStore";
import Link from "next/link";
import type { Session, SessionOutput } from "@/types/session";

const statusColors = {
  idle: "bg-gray-500",
  running: "bg-green-500",
  paused: "bg-yellow-500",
  error: "bg-red-500",
};

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState("");
  const outputEndRef = useRef<HTMLDivElement>(null);

  const { outputs, addOutput, clearOutputs } = useSessionStore();
  const sessionOutputs = outputs[sessionId] || [];

  const { data: session, isLoading } = useQuery<Session>({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsApi.get(sessionId),
  });

  const startMutation = useMutation({
    mutationFn: (prompt?: string) => sessionsApi.start(sessionId, prompt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
  });

  const stopMutation = useMutation({
    mutationFn: () => sessionsApi.stop(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
  });

  const pauseMutation = useMutation({
    mutationFn: () => sessionsApi.pause(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
  });

  const resumeMutation = useMutation({
    mutationFn: () => sessionsApi.resume(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
  });

  // Subscribe to session events
  useEffect(() => {
    connectSocket().catch(console.error);

    const unsubscribe = subscribeToSession(sessionId, {
      onOutput: (data) => {
        addOutput(sessionId, {
          sessionId: data.sessionId,
          type: data.type as SessionOutput["type"],
          content: data.content,
          timestamp: data.timestamp,
        });
      },
      onStatus: (data) => {
        queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      },
      onUsage: (data) => {
        queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      },
      onError: (data) => {
        console.error("Session error:", data.error);
      },
    });

    return unsubscribe;
  }, [sessionId, addOutput, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionOutputs]);

  const handleSendInput = () => {
    if (!inputValue.trim()) return;

    if (session?.status === "running") {
      sendSessionInput(sessionId, inputValue);
    } else {
      startMutation.mutate(inputValue);
    }

    setInputValue("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium mb-2">Session not found</h2>
        <Button asChild>
          <Link href="/sessions">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/sessions">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${statusColors[session.status]}`}
              />
              <h1 className="text-2xl font-bold">{session.name}</h1>
              <Badge variant="outline">{session.mode}</Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <FolderOpen className="w-4 h-4" />
              {session.workingDirectory}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session.status === "idle" && (
            <Button onClick={() => startMutation.mutate(undefined)}>
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
          {session.status === "running" && (
            <>
              <Button variant="outline" onClick={() => pauseMutation.mutate()}>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button variant="destructive" onClick={() => stopMutation.mutate()}>
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </>
          )}
          {session.status === "paused" && (
            <Button onClick={() => resumeMutation.mutate()}>
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Cpu className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Tokens Used</p>
              <p className="text-lg font-semibold">
                {(session.usage.tokensUsed / 1000).toFixed(1)}K
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Requests</p>
              <p className="text-lg font-semibold">{session.usage.requestCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-5 h-5 text-muted-foreground">$</div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Cost</p>
              <p className="text-lg font-semibold">
                ${session.usage.estimatedCost.toFixed(4)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="output" className="space-y-4">
        <TabsList>
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="output" className="space-y-4">
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Live Output</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearOutputs(sessionId)}
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full font-mono text-sm">
                <div className="space-y-1 p-1">
                  {sessionOutputs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No output yet. Start the session or send a message.
                    </p>
                  ) : (
                    sessionOutputs.map((output, i) => (
                      <div
                        key={i}
                        className={`px-2 py-1 rounded ${
                          output.type === "stderr"
                            ? "bg-red-500/10 text-red-500"
                            : output.type === "system"
                            ? "bg-blue-500/10 text-blue-500"
                            : output.type === "thinking"
                            ? "bg-purple-500/10 text-purple-500"
                            : ""
                        }`}
                      >
                        <span className="text-muted-foreground text-xs mr-2">
                          [{new Date(output.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="whitespace-pre-wrap">{output.content}</span>
                      </div>
                    ))
                  )}
                  <div ref={outputEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              placeholder={
                session.status === "running"
                  ? "Send a message to Claude..."
                  : "Type a message to start the session..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendInput()}
              className="flex-1"
            />
            <Button onClick={handleSendInput} disabled={!inputValue.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle>Input History</CardTitle>
              <CardDescription>
                Messages sent to this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No input history yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Files Changed</CardTitle>
              <CardDescription>
                Files modified during this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No files changed yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Background Tasks</CardTitle>
              <CardDescription>
                Tasks running in the background
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No background tasks
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Session Configuration</CardTitle>
              <CardDescription>
                Settings for this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{session.config.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thinking Mode</p>
                  <p className="font-medium">{session.config.thinkingMode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auto-Approve</p>
                  <p className="font-medium">
                    {session.config.autoApprove ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MCP Servers</p>
                  <p className="font-medium">
                    {session.config.mcpServers.length || "None"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
