"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  GitBranch,
  GitCommit,
  FileEdit,
  FilePlus,
  FileX,
  RefreshCw,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gitApi } from "@/lib/api";

const statusIcons = {
  added: FilePlus,
  modified: FileEdit,
  deleted: FileX,
  renamed: FileEdit,
  untracked: FilePlus,
};

const statusColors = {
  added: "text-green-500",
  modified: "text-yellow-500",
  deleted: "text-red-500",
  renamed: "text-blue-500",
  untracked: "text-gray-500",
};

export default function GitPage() {
  const [directory, setDirectory] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["git-status", directory],
    queryFn: () => gitApi.getStatus(directory || undefined),
    enabled: true,
  });

  const { data: branches } = useQuery({
    queryKey: ["git-branches", directory],
    queryFn: () => gitApi.getBranches(directory || undefined),
  });

  const { data: log } = useQuery({
    queryKey: ["git-log", directory],
    queryFn: () => gitApi.getLog(directory || undefined, 20),
  });

  const { data: diff } = useQuery({
    queryKey: ["git-diff", directory, selectedFile],
    queryFn: () => gitApi.getDiff(directory || undefined, selectedFile || undefined),
    enabled: !!selectedFile,
  });

  const commandMutation = useMutation({
    mutationFn: (command: string) => gitApi.runCommand(command, directory || undefined),
    onSuccess: () => refetchStatus(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Git Management</h1>
          <p className="text-muted-foreground">
            View repository status, branches, and commit history
          </p>
        </div>
        <Button variant="outline" onClick={() => refetchStatus()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Directory Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label>Working Directory</Label>
              <div className="flex gap-2">
                <Input
                  value={directory}
                  onChange={(e) => setDirectory(e.target.value)}
                  placeholder="Enter directory path or leave empty for current directory"
                />
                <Button variant="outline" onClick={() => refetchStatus()}>
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branch Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Branch</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              {status?.branch || "N/A"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Uncommitted Changes</CardDescription>
            <CardTitle>{status?.uncommittedCount || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Branches</CardDescription>
            <CardTitle>{branches?.branches?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="diff">Diff</TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Working Tree Status</CardTitle>
              <CardDescription>Files with uncommitted changes</CardDescription>
            </CardHeader>
            <CardContent>
              {status?.changes?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Working tree clean</p>
                  <p className="text-sm">No uncommitted changes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {status?.changes?.map((change: any, index: number) => {
                    const Icon = statusIcons[change.status as keyof typeof statusIcons] || FileEdit;
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                          selectedFile === change.file ? "bg-accent" : ""
                        }`}
                        onClick={() => setSelectedFile(change.file)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 ${
                              statusColors[change.status as keyof typeof statusColors]
                            }`}
                          />
                          <span className="font-mono text-sm">{change.file}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {change.staged && (
                            <Badge variant="secondary" className="text-xs">
                              Staged
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={statusColors[change.status as keyof typeof statusColors]}
                          >
                            {change.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle>Branches</CardTitle>
              <CardDescription>Local and remote branches</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {branches?.branches?.map((branch: string, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        branch === branches.current ? "bg-primary/10 border-primary" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className="w-4 h-4" />
                        <span className="font-mono">{branch}</span>
                      </div>
                      {branch === branches.current && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Commit History</CardTitle>
              <CardDescription>Recent commits</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {log?.map((commit: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <GitCommit className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {commit.shortHash}
                          </code>
                          <span className="text-sm text-muted-foreground truncate">
                            {commit.author}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{commit.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(commit.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diff Tab */}
        <TabsContent value="diff">
          <Card>
            <CardHeader>
              <CardTitle>File Diff</CardTitle>
              <CardDescription>
                {selectedFile
                  ? `Changes in ${selectedFile}`
                  : "Select a file from Status tab to view diff"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFile ? (
                <ScrollArea className="h-[400px]">
                  <pre className="text-sm font-mono whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {diff?.diff || "No changes"}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileEdit className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file to view its diff</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Commands</CardTitle>
          <CardDescription>Common git operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => commandMutation.mutate("git status")}
            >
              git status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => commandMutation.mutate("git pull")}
            >
              git pull
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => commandMutation.mutate("git fetch")}
            >
              git fetch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => commandMutation.mutate("git add .")}
            >
              git add .
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => commandMutation.mutate("git stash")}
            >
              git stash
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => commandMutation.mutate("git stash pop")}
            >
              git stash pop
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
