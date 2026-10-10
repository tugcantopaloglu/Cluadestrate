"use client";

import type { ApiRequests } from "@/types/api";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderSync,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  AlertTriangle,
  FileText,
  History,
  Link,
  Unlink,
  Loader2,
  FolderOpen,
  Clock,
  GitMerge,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fileSyncApi } from "@/lib/api";

export default function FileSyncPage() {
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["file-sync-stats"],
    queryFn: fileSyncApi.getStats,
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["file-sync-folders"],
    queryFn: fileSyncApi.listFolders,
  });

  const { data: config } = useQuery({
    queryKey: ["file-sync-config"],
    queryFn: fileSyncApi.getConfig,
  });

  const { data: conflicts = [] } = useQuery({
    queryKey: ["file-sync-conflicts"],
    queryFn: fileSyncApi.getConflicts,
  });

  const { data: operations = [] } = useQuery({
    queryKey: ["file-sync-operations"],
    queryFn: () => fileSyncApi.listOperations(),
  });

  const { data: selectedFolderData } = useQuery({
    queryKey: ["file-sync-folder", selectedFolder],
    queryFn: () => (selectedFolder ? fileSyncApi.getFolder(selectedFolder) : null),
    enabled: !!selectedFolder,
  });

  const { data: folderFiles = [] } = useQuery({
    queryKey: ["file-sync-folder-files", selectedFolder],
    queryFn: () => (selectedFolder ? fileSyncApi.listFiles(selectedFolder) : []),
    enabled: !!selectedFolder,
  });

  const addFolderMutation = useMutation({
    mutationFn: (data: { path: string; name: string }) => fileSyncApi.addFolder({ hostId: "local", hostName: data.name, remotePath: data.path }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-sync-folders"] });
      queryClient.invalidateQueries({ queryKey: ["file-sync-stats"] });
      setAddFolderOpen(false);
      setNewFolderPath("");
      setNewFolderName("");
    },
  });

  const removeFolderMutation = useMutation({
    mutationFn: fileSyncApi.removeFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-sync-folders"] });
      queryClient.invalidateQueries({ queryKey: ["file-sync-stats"] });
      setSelectedFolder(null);
    },
  });

  const syncFolderMutation = useMutation({
    mutationFn: fileSyncApi.syncFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-sync-folders"] });
      queryClient.invalidateQueries({ queryKey: ["file-sync-stats"] });
      queryClient.invalidateQueries({ queryKey: ["file-sync-operations"] });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: fileSyncApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-sync-config"] });
      setConfigOpen(false);
    },
  });

  const resolveConflictMutation = useMutation({
    mutationFn: ({ fileId, resolution }: { fileId: string; resolution: "local" | "remote" }) =>
      fileSyncApi.resolveConflict({ fileId, resolution: resolution === "local" ? "keep_local" : "keep_remote" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-sync-conflicts"] });
      queryClient.invalidateQueries({ queryKey: ["file-sync-stats"] });
    },
  });

  const isLoading = statsLoading || foldersLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">File Sync</h1>
          <p className="text-muted-foreground">
            Synchronize files between your local machine and Claude Code sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setConfigOpen(true)}>
            Settings
          </Button>
          <Dialog open={addFolderOpen} onOpenChange={setAddFolderOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Synced Folder</DialogTitle>
                <DialogDescription>
                  Add a folder to synchronize with Claude Code sessions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Folder Path</Label>
                  <Input
                    value={newFolderPath}
                    onChange={(e) => setNewFolderPath(e.target.value)}
                    placeholder="/path/to/folder"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name (optional)</Label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="My Project"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddFolderOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addFolderMutation.mutate({ path: newFolderPath, name: newFolderName })}
                  disabled={!newFolderPath || addFolderMutation.isPending}
                >
                  {addFolderMutation.isPending ? "Adding..." : "Add Folder"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Synced Folders</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalFolders || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Files</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalFiles || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Changes</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">{stats?.pendingFiles || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conflicts</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats?.conflictFiles || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Sync</CardDescription>
            <CardTitle className="text-sm">
              {stats?.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString() : "Never"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="folders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="folders">Folders</TabsTrigger>
            <TabsTrigger value="conflicts">
              Conflicts {conflicts.length > 0 && `(${conflicts.length})`}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="folders" className="space-y-4">
            {folders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderSync className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Synced Folders</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Add folders to start synchronizing files with your Claude Code sessions.
                  </p>
                  <Button onClick={() => setAddFolderOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Folder
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-2">
                  {folders.map((folder) => (
                    <Card
                      key={folder.id}
                      className={`cursor-pointer transition-colors ${
                        selectedFolder === folder.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FolderOpen className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="font-medium">{folder.hostName || folder.remotePath}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {folder.remotePath}
                              </p>
                            </div>
                          </div>
                          <Badge variant={folder.status === "synced" ? "default" : "secondary"}>
                            {folder.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  {selectedFolder && selectedFolderData ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{selectedFolderData.hostName || selectedFolderData.remotePath}</CardTitle>
                            <CardDescription>{selectedFolderData.remotePath}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => syncFolderMutation.mutate(selectedFolder)}
                              disabled={syncFolderMutation.isPending}
                            >
                              <RefreshCw className={`w-4 h-4 mr-2 ${syncFolderMutation.isPending ? "animate-spin" : ""}`} />
                              Sync Now
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeFolderMutation.mutate(selectedFolder)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>File</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Modified</TableHead>
                              <TableHead>Versions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {folderFiles.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  No files in this folder
                                </TableCell>
                              </TableRow>
                            ) : (
                              folderFiles.map((file) => (
                                <TableRow key={file.id}>
                                  <TableCell className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    {file.remotePath}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        file.status === "synced"
                                          ? "default"
                                          : file.status === "modified"
                                          ? "secondary"
                                          : "destructive"
                                      }
                                    >
                                      {file.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {new Date(file.lastModified).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{file.versions?.length || 0}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        Select a folder to view its files
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-4">
            {conflicts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">No Conflicts</h3>
                  <p className="text-muted-foreground">
                    All files are synchronized without conflicts.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {conflicts.map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          <div>
                            <p className="font-medium">{file.remotePath}</p>
                            <p className="text-sm text-muted-foreground">
                              Local: {new Date(file.lastModified).toLocaleString()} |
                              Remote: {new Date(file.syncedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveConflictMutation.mutate({ fileId: file.id, resolution: "local" })}
                          >
                            Keep Local
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveConflictMutation.mutate({ fileId: file.id, resolution: "remote" })}
                          >
                            Keep Remote
                          </Button>
                          <Button
                            size="sm"
                            disabled title="Merge requires edited content; keep local or remote instead"
                          >
                            <GitMerge className="w-4 h-4 mr-2" />
                            Merge
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
                <CardDescription>Recent file synchronization operations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No sync operations yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      operations.slice(0, 20).map((op) => (
                        <TableRow key={op.id}>
                          <TableCell>
                            <Badge variant="outline">{op.type}</Badge>
                          </TableCell>
                          <TableCell>{op.fileId || op.folderId}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                op.status === "completed"
                                  ? "default"
                                  : op.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {op.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(op.startedAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Sync Settings</DialogTitle>
            <DialogDescription>
              Configure file synchronization behavior
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Sync</Label>
                <p className="text-sm text-muted-foreground">Automatically sync on file changes</p>
              </div>
              <Switch
                checked={config?.autoSync}
                onCheckedChange={(checked) =>
                  updateConfigMutation.mutate({ autoSync: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sync Interval (seconds)</Label>
              <Input
                type="number"
                defaultValue={config?.syncIntervalMs ? config.syncIntervalMs / 1000 : 30}
                onChange={(e) =>
                  updateConfigMutation.mutate({ syncIntervalMs: parseInt(e.target.value) * 1000 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Version History Limit</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                step="1"
                defaultValue={config?.maxVersionHistory || 10}
                onChange={(e) =>
                  Number.isInteger(e.target.valueAsNumber) && e.target.valueAsNumber >= 1 && e.target.valueAsNumber <= 1000 && updateConfigMutation.mutate({ maxVersionHistory: e.target.valueAsNumber })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Conflict Resolution</Label>
              <Select
                defaultValue={config?.conflictResolution || "manual"}
                onValueChange={(value) =>
                  updateConfigMutation.mutate({ conflictResolution: value as NonNullable<ApiRequests["PATCH /api/file-sync/config"]["conflictResolution"]> })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="local">Keep Local</SelectItem>
                  <SelectItem value="remote">Keep Remote</SelectItem>
                  <SelectItem value="newest">Keep Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setConfigOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
