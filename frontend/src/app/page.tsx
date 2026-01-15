"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Play, Pause, Square, Bot, Clock, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sessionsApi, usageApi } from "@/lib/api";
import Link from "next/link";
import type { Session } from "@/types/session";

const statusColors = {
  idle: "bg-gray-500",
  running: "bg-green-500",
  paused: "bg-yellow-500",
  error: "bg-red-500",
};

const modeLabels = {
  planner: "Planner",
  doer: "Doer",
};

export default function DashboardPage() {
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.list,
  });

  const { data: usage } = useQuery({
    queryKey: ["usage"],
    queryFn: usageApi.getSummary,
  });

  const activeSessions = sessions.filter((s: Session) => s.status === "running");
  const totalTokens = usage?.totalTokens || 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle className="text-3xl">{activeSessions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {sessions.length} total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tokens Today</CardDescription>
            <CardTitle className="text-3xl">
              {(totalTokens / 1000).toFixed(1)}K
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              ${usage?.totalCost?.toFixed(2) || "0.00"} estimated cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>MCP Servers</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              0 running, 0 stopped
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Background Tasks</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              0 pending, 0 running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Currently running Claude Code sessions
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/sessions?new=true">
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first Claude Code session to get started
              </p>
              <Button asChild>
                <Link href="/sessions?new=true">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Session
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session: Session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              statusColors[session.status]
                            }`}
                          />
                          <h3 className="font-medium">{session.name}</h3>
                        </div>
                        <Badge variant="outline">
                          {modeLabels[session.mode]}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4" />
                          <span>
                            {(session.usage.tokensUsed / 1000).toFixed(1)}K tokens
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {session.process.startedAt
                              ? `Started ${new Date(
                                  session.process.startedAt
                                ).toLocaleTimeString()}`
                              : "Not started"}
                          </span>
                        </div>
                      </div>

                      {session.status === "running" && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.preventDefault();
                            }}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.preventDefault();
                            }}
                          >
                            <Square className="w-4 h-4 mr-1" />
                            Stop
                          </Button>
                        </div>
                      )}

                      {session.status === "idle" && (
                        <Button
                          size="sm"
                          className="w-full mt-4"
                          onClick={(e) => {
                            e.preventDefault();
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Session
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* Add new session card */}
              <Link href="/sessions?new=true" className="block">
                <Card className="hover:border-primary transition-colors cursor-pointer border-dashed h-full min-h-[180px]">
                  <CardContent className="flex flex-col items-center justify-center h-full p-4">
                    <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-muted-foreground">New Session</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/sessions?new=true&mode=planner">
                <Bot className="w-4 h-4 mr-2" />
                Start Planner Session
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/sessions?new=true&mode=doer">
                <Bot className="w-4 h-4 mr-2" />
                Start Doer Session
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/mcp">
                <Plus className="w-4 h-4 mr-2" />
                Add MCP Server
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/workflows/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p>No recent activity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
