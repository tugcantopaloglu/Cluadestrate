"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  RefreshCw,
  Check,
  AlertTriangle,
  Server,
  Clock,
  ArrowUpCircle,
  RotateCcw,
  Loader2,
  Settings,
  Calendar,
  CheckCircle,
  XCircle,
  History,
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
import { Progress } from "@/components/ui/progress";
import { autoUpdateApi } from "@/lib/api";

export default function AutoUpdatePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["auto-update-stats"],
    queryFn: autoUpdateApi.getStats,
  });

  const { data: settings } = useQuery({
    queryKey: ["auto-update-settings"],
    queryFn: autoUpdateApi.getSettings,
  });

  const { data: hosts = [], isLoading: hostsLoading } = useQuery({
    queryKey: ["auto-update-hosts"],
    queryFn: autoUpdateApi.listHosts,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["auto-update-schedules"],
    queryFn: autoUpdateApi.listSchedules,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["auto-update-history"],
    queryFn: autoUpdateApi.getHistory,
  });

  const { data: latestVersion } = useQuery({
    queryKey: ["auto-update-latest"],
    queryFn: autoUpdateApi.checkUpdates,
    refetchInterval: 60000,
  });

  const checkUpdatesMutation = useMutation({
    mutationFn: autoUpdateApi.checkUpdates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-update-latest"] });
    },
  });

  const updateHostMutation = useMutation({
    mutationFn: autoUpdateApi.updateHost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-update-hosts"] });
      queryClient.invalidateQueries({ queryKey: ["auto-update-stats"] });
      queryClient.invalidateQueries({ queryKey: ["auto-update-history"] });
    },
  });

  const updateAllMutation = useMutation({
    mutationFn: autoUpdateApi.updateAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-update-hosts"] });
      queryClient.invalidateQueries({ queryKey: ["auto-update-stats"] });
      queryClient.invalidateQueries({ queryKey: ["auto-update-history"] });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ hostId, version }: { hostId: string; version: string }) =>
      autoUpdateApi.rollback(hostId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-update-hosts"] });
      queryClient.invalidateQueries({ queryKey: ["auto-update-history"] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: autoUpdateApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-update-settings"] });
      setSettingsOpen(false);
    },
  });

  const isLoading = statsLoading || hostsLoading;

  const outdatedHosts = hosts.filter(
    (h: any) => latestVersion && h.currentVersion !== latestVersion.version
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auto Update</h1>
          <p className="text-muted-foreground">
            Manage automatic updates for MCP host agents across your network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => checkUpdatesMutation.mutate()}
            disabled={checkUpdatesMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checkUpdatesMutation.isPending ? "animate-spin" : ""}`} />
            Check Updates
          </Button>
          {outdatedHosts.length > 0 && (
            <Button
              onClick={() => updateAllMutation.mutate()}
              disabled={updateAllMutation.isPending}
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Update All ({outdatedHosts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Latest Version Banner */}
      {latestVersion && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Download className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Latest Version: {latestVersion.version}</h3>
                  <p className="text-sm text-muted-foreground">
                    Released {latestVersion.releaseDate ? new Date(latestVersion.releaseDate).toLocaleDateString() : "recently"}
                  </p>
                </div>
              </div>
              {outdatedHosts.length > 0 && (
                <Badge variant="secondary" className="text-yellow-500">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {outdatedHosts.length} hosts need updates
                </Badge>
              )}
            </div>
            {latestVersion.changelog && (
              <div className="mt-4 p-3 bg-background/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Changelog:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestVersion.changelog}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Hosts</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalHosts || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Up to Date</CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats?.upToDate || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outdated</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">{stats?.outdated || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Updating</CardDescription>
            <CardTitle className="text-3xl text-blue-500">{stats?.updating || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats?.failed || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="hosts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="hosts">Hosts</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="hosts" className="space-y-4">
            {hosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Hosts Registered</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Register MCP host agents to manage their updates automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {hosts.map((host: any) => (
                  <Card key={host.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            host.status === "online" ? "bg-green-500/20" : "bg-gray-500/20"
                          }`}>
                            <Server className={`w-5 h-5 ${
                              host.status === "online" ? "text-green-500" : "text-gray-500"
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-medium">{host.name}</h3>
                            <p className="text-sm text-muted-foreground">{host.hostname}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm">
                              Version: <span className="font-mono">{host.currentVersion}</span>
                            </p>
                            {latestVersion && host.currentVersion !== latestVersion.version && (
                              <p className="text-xs text-yellow-500">
                                Update available: {latestVersion.version}
                              </p>
                            )}
                          </div>
                          {host.updateStatus === "updating" ? (
                            <div className="w-32">
                              <Progress value={host.updateProgress || 0} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1 text-center">
                                {host.updateProgress || 0}%
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {latestVersion && host.currentVersion !== latestVersion.version && (
                                <Button
                                  size="sm"
                                  onClick={() => updateHostMutation.mutate(host.id)}
                                  disabled={updateHostMutation.isPending}
                                >
                                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                                  Update
                                </Button>
                              )}
                              {host.previousVersions?.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    rollbackMutation.mutate({
                                      hostId: host.id,
                                      version: host.previousVersions[0],
                                    })
                                  }
                                >
                                  <RotateCcw className="w-4 h-4 mr-1" />
                                  Rollback
                                </Button>
                              )}
                            </div>
                          )}
                          <Badge
                            variant={
                              host.updateStatus === "up_to_date"
                                ? "default"
                                : host.updateStatus === "updating"
                                ? "secondary"
                                : host.updateStatus === "failed"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {host.updateStatus === "up_to_date" && <Check className="w-3 h-3 mr-1" />}
                            {host.updateStatus?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Update Schedules</CardTitle>
                <CardDescription>Configure automatic update schedules for your hosts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Hosts</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No schedules configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      schedules.map((schedule: any) => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {schedule.cronExpression}
                            </code>
                          </TableCell>
                          <TableCell>{schedule.hostIds?.length || "All"} hosts</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={schedule.enabled ? "default" : "secondary"}>
                              {schedule.enabled ? "Active" : "Paused"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Update History</CardTitle>
                <CardDescription>Recent update operations across all hosts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No update history
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((op: any) => (
                        <TableRow key={op.id}>
                          <TableCell className="font-medium">{op.hostName}</TableCell>
                          <TableCell>
                            <code className="text-xs">{op.fromVersion}</code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{op.toVersion}</code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                op.status === "completed"
                                  ? "default"
                                  : op.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {op.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {op.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                              {op.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(op.timestamp).toLocaleString()}
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

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto Update Settings</DialogTitle>
            <DialogDescription>
              Configure automatic update behavior
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Update</Label>
                <p className="text-sm text-muted-foreground">Automatically install updates when available</p>
              </div>
              <Switch
                checked={settings?.autoUpdate}
                onCheckedChange={(checked) =>
                  updateSettingsMutation.mutate({ autoUpdate: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Check for Updates Automatically</Label>
                <p className="text-sm text-muted-foreground">Periodically check for new versions</p>
              </div>
              <Switch
                checked={settings?.checkAutomatically}
                onCheckedChange={(checked) =>
                  updateSettingsMutation.mutate({ checkAutomatically: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Check Interval (hours)</Label>
              <Input
                type="number"
                defaultValue={settings?.checkIntervalHours || 24}
                onChange={(e) =>
                  updateSettingsMutation.mutate({ checkIntervalHours: parseInt(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Update Channel</Label>
              <Select
                defaultValue={settings?.channel || "stable"}
                onValueChange={(value) =>
                  updateSettingsMutation.mutate({ channel: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="nightly">Nightly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notify on Updates</Label>
                <p className="text-sm text-muted-foreground">Send notifications when updates are available</p>
              </div>
              <Switch
                checked={settings?.notifyOnUpdate}
                onCheckedChange={(checked) =>
                  updateSettingsMutation.mutate({ notifyOnUpdate: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSettingsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
