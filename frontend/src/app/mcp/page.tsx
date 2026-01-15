"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Play, Square, RefreshCw, Trash2, Terminal } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mcpApi } from "@/lib/api";

const statusColors = {
  running: "bg-green-500",
  stopped: "bg-gray-500",
  error: "bg-red-500",
  starting: "bg-yellow-500",
};

export default function MCPPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedMCP, setSelectedMCP] = useState<string | null>(null);
  const [newMCP, setNewMCP] = useState({
    name: "",
    command: "",
    args: "",
    env: "",
  });

  const queryClient = useQueryClient();

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ["mcp"],
    queryFn: mcpApi.list,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["mcp-logs", selectedMCP],
    queryFn: () => (selectedMCP ? mcpApi.getLogs(selectedMCP) : Promise.resolve({ logs: [] })),
    enabled: !!selectedMCP,
    refetchInterval: 2000,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      mcpApi.create({
        name: newMCP.name,
        config: {
          command: newMCP.command,
          args: newMCP.args.split(" ").filter(Boolean),
          env: newMCP.env
            ? Object.fromEntries(
                newMCP.env.split("\n").map((line) => line.split("="))
              )
            : {},
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp"] });
      setIsNewDialogOpen(false);
      setNewMCP({ name: "", command: "", args: "", env: "" });
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => mcpApi.start(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mcp"] }),
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => mcpApi.stop(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mcp"] }),
  });

  const restartMutation = useMutation({
    mutationFn: (id: string) => mcpApi.restart(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mcp"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mcpApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mcp"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MCP Servers</h1>
          <p className="text-muted-foreground">
            Manage Model Context Protocol servers
          </p>
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add MCP Server
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Servers</CardTitle>
            <CardDescription>
              MCP servers available for your sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : servers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Terminal className="w-12 h-12 mx-auto mb-4" />
                <p>No MCP servers configured</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsNewDialogOpen(true)}
                >
                  Add your first MCP server
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {servers.map((server: any) => (
                  <div
                    key={server.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMCP === server.id
                        ? "border-primary bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedMCP(server.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            statusColors[server.status as keyof typeof statusColors]
                          }`}
                        />
                        <div>
                          <h4 className="font-medium">{server.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {server.config.command}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {server.status === "stopped" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              startMutation.mutate(server.id);
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {server.status === "running" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                restartMutation.mutate(server.id);
                              }}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                stopMutation.mutate(server.id);
                              }}
                            >
                              <Square className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(server.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Server Logs</CardTitle>
            <CardDescription>
              {selectedMCP
                ? `Logs for ${servers.find((s: any) => s.id === selectedMCP)?.name || "selected server"}`
                : "Select a server to view logs"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] font-mono text-sm">
              {selectedMCP ? (
                (logs as any).logs?.length > 0 ? (
                  <div className="space-y-1">
                    {(logs as any).logs.map((log: any, i: number) => (
                      <div
                        key={i}
                        className={`px-2 py-1 rounded ${
                          log.level === "error"
                            ? "bg-red-500/10 text-red-500"
                            : log.level === "warn"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : ""
                        }`}
                      >
                        <span className="text-muted-foreground text-xs mr-2">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No logs available
                  </p>
                )
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a server to view its logs
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* New MCP Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Configure a new Model Context Protocol server
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., filesystem"
                value={newMCP.name}
                onChange={(e) => setNewMCP({ ...newMCP, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="command">Command</Label>
              <Input
                id="command"
                placeholder="e.g., npx @modelcontextprotocol/server-filesystem"
                value={newMCP.command}
                onChange={(e) => setNewMCP({ ...newMCP, command: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="args">Arguments (space-separated)</Label>
              <Input
                id="args"
                placeholder="e.g., --root /projects"
                value={newMCP.args}
                onChange={(e) => setNewMCP({ ...newMCP, args: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="env">Environment Variables (one per line, KEY=value)</Label>
              <textarea
                id="env"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-background"
                placeholder="GITHUB_TOKEN=xxx\nDATABASE_URL=xxx"
                value={newMCP.env}
                onChange={(e) => setNewMCP({ ...newMCP, env: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newMCP.name || !newMCP.command || createMutation.isPending}
            >
              Add Server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
