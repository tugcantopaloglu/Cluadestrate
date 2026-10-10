"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Server,
  Plus,
  Trash2,
  RefreshCw,
  Settings,
  Loader2,
  Wifi,
  WifiOff,
  Power,
  PowerOff,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Terminal,
  Camera,
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { mcpHostsApi } from "@/lib/api";
import { toast } from "sonner";

export default function MCPHostsPage() {
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [addHostOpen, setAddHostOpen] = useState(false);
  const [discoveryConfigOpen, setDiscoveryConfigOpen] = useState(false);
  const [installScriptOpen, setInstallScriptOpen] = useState(false);
  const [newHost, setNewHost] = useState({
    name: "",
    hostname: "",
    port: "3002",
    version: "",
    platform: "linux" as "windows" | "macos" | "linux",
  });

  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["mcp-hosts-stats"],
    queryFn: mcpHostsApi.getStats,
  });

  const { data: hosts = [], isLoading: hostsLoading } = useQuery({
    queryKey: ["mcp-hosts"],
    queryFn: mcpHostsApi.listHosts,
  });

  const { data: onlineHosts = [] } = useQuery({
    queryKey: ["mcp-hosts-online"],
    queryFn: mcpHostsApi.getOnlineHosts,
  });

  const { data: discoveryConfig } = useQuery({
    queryKey: ["mcp-hosts-discovery-config"],
    queryFn: mcpHostsApi.getDiscoveryConfig,
  });

  const { data: discoveredHosts = [] } = useQuery({
    queryKey: ["mcp-hosts-discovered"],
    queryFn: mcpHostsApi.listDiscoveredHosts,
    refetchInterval: discoveryConfig?.enabled ? 5000 : false,
  });

  const { data: commands = [] } = useQuery({
    queryKey: ["mcp-hosts-commands", selectedHost],
    queryFn: () => (selectedHost ? mcpHostsApi.listCommands(selectedHost) : mcpHostsApi.listCommands()),
    enabled: true,
  });

  const { data: selectedHostData } = useQuery({
    queryKey: ["mcp-host", selectedHost],
    queryFn: () => (selectedHost ? mcpHostsApi.getHost(selectedHost) : null),
    enabled: !!selectedHost,
  });

  const registerHostMutation = useMutation({
    mutationFn: (data: typeof newHost) => mcpHostsApi.registerHost({ hostName: data.name, platform: data.platform, version: data.version || "unknown", capabilities: [], network: { ipAddress: data.hostname, port: Number(data.port) || 3002, protocol: "websocket" }, security: { tlsEnabled: false, authMethod: "token", authorizedClients: [] } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts"] });
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts-stats"] });
      setAddHostOpen(false);
      setNewHost({ name: "", hostname: "", port: "3002", version: "", platform: "linux" });
      toast.success("Host registered");
    },
  });

  const removeHostMutation = useMutation({
    mutationFn: mcpHostsApi.removeHost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts"] });
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts-stats"] });
      setSelectedHost(null);
      toast.success("Host removed");
    },
  });

  const connectHostMutation = useMutation({
    mutationFn: mcpHostsApi.connectHost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts"] });
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts-online"] });
      toast.success("Connected to host");
    },
  });

  const disconnectHostMutation = useMutation({
    mutationFn: mcpHostsApi.disconnectHost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts"] });
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts-online"] });
      toast.success("Disconnected from host");
    },
  });

  const startDiscoveryMutation = useMutation({
    mutationFn: mcpHostsApi.startDiscovery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts-discovery-config"] });
      toast.success("Discovery started");
    },
  });

  const stopDiscoveryMutation = useMutation({
    mutationFn: mcpHostsApi.stopDiscovery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts-discovery-config"] });
      toast.success("Discovery stopped");
    },
  });

  const connectDiscoveredHostMutation = useMutation({
    mutationFn: mcpHostsApi.connectDiscoveredHost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts"] });
      queryClient.invalidateQueries({ queryKey: ["mcp-hosts-discovered"] });
      toast.success("Host connected");
    },
  });

  const screenshotMutation = useMutation({
    mutationFn: mcpHostsApi.captureScreenshot,
    onSuccess: (result) => {
      toast.success("filename" in result ? `Screenshot captured: ${result.filename}` : `Screenshot requested: ${result.commandId}`);
    },
  });

  const triggerUpdateMutation = useMutation({
    mutationFn: mcpHostsApi.triggerUpdate,
    onSuccess: () => {
      toast.success("Update triggered");
    },
  });


  const isLoading = statsLoading || hostsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MCP Host Agents</h1>
          <p className="text-muted-foreground">
            Manage remote MCP host agents across your network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setInstallScriptOpen(true)}>
            <Terminal className="w-4 h-4 mr-2" />
            Install Script
          </Button>
          <Dialog open={addHostOpen} onOpenChange={setAddHostOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Host
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add MCP Host</DialogTitle>
                <DialogDescription>
                  Register a new MCP host agent
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newHost.name}
                    onChange={(e) => setNewHost({ ...newHost, name: e.target.value })}
                    placeholder="My Server"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hostname / IP</Label>
                  <Input
                    value={newHost.hostname}
                    onChange={(e) => setNewHost({ ...newHost, hostname: e.target.value })}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    value={newHost.port}
                    onChange={(e) => setNewHost({ ...newHost, port: e.target.value })}
                    placeholder="3002"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agent Version (optional)</Label>
                  <Input
                    type="text"
                    value={newHost.version}
                    onChange={(e) => setNewHost({ ...newHost, version: e.target.value })}
                    placeholder="Agent version"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={newHost.platform} onValueChange={(value) => setNewHost({ ...newHost, platform: value as typeof newHost.platform })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="linux">Linux</SelectItem><SelectItem value="windows">Windows</SelectItem><SelectItem value="macos">macOS</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddHostOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => registerHostMutation.mutate(newHost)}
                  disabled={!newHost.name || !newHost.hostname || registerHostMutation.isPending}
                >
                  {registerHostMutation.isPending ? "Adding..." : "Add Host"}
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
            <CardDescription>Total Hosts</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalHosts || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Online</CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats?.onlineHosts || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Offline</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{stats?.offlineHosts || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>MCP Servers</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalMCPServers || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Discovery</CardDescription>
            <CardTitle className="text-lg">
              {discoveryConfig?.enabled ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </CardTitle>
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
            <TabsTrigger value="hosts">Registered Hosts</TabsTrigger>
            <TabsTrigger value="discovery">
              Network Discovery {discoveredHosts.length > 0 && `(${discoveredHosts.length})`}
            </TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
          </TabsList>

          <TabsContent value="hosts" className="space-y-4">
            {hosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Hosts Registered</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Add MCP host agents to manage remote servers.
                  </p>
                  <Button onClick={() => setAddHostOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Host
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  {hosts.map((host) => (
                    <Card
                      key={host.id}
                      className={`cursor-pointer transition-colors ${
                        selectedHost === host.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedHost(host.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              host.status === "online" ? "bg-green-500/20" : "bg-gray-500/20"
                            }`}>
                              {host.status === "online" ? (
                                <Wifi className="w-5 h-5 text-green-500" />
                              ) : (
                                <WifiOff className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{host.hostName}</p>
                              <p className="text-xs text-muted-foreground">
                                {host.network.ipAddress}:{host.network.port}
                              </p>
                            </div>
                          </div>
                          <Badge variant={host.status === "online" ? "default" : "secondary"}>
                            {host.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  {selectedHost && selectedHostData ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{selectedHostData.hostName}</CardTitle>
                            <CardDescription>
                              {selectedHostData.network.ipAddress}:{selectedHostData.network.port}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedHostData.status === "online" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => disconnectHostMutation.mutate(selectedHost)}
                              >
                                <PowerOff className="w-4 h-4 mr-1" />
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => connectHostMutation.mutate(selectedHost)}
                              >
                                <Power className="w-4 h-4 mr-1" />
                                Connect
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => screenshotMutation.mutate(selectedHost)}
                              disabled={selectedHostData.status !== "online"}
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => triggerUpdateMutation.mutate(selectedHost)}
                              disabled={selectedHostData.status !== "online"}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeHostMutation.mutate(selectedHost)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* System Resources */}
                        {selectedHostData.resources && (
                          <div>
                            <h4 className="font-medium mb-3">System Resources</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-muted-foreground" />
                                    <span>CPU</span>
                                  </div>
                                  <span>{selectedHostData.resources.cpuPercent}%</span>
                                </div>
                                <Progress value={selectedHostData.resources.cpuPercent} />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <MemoryStick className="w-4 h-4 text-muted-foreground" />
                                    <span>Memory</span>
                                  </div>
                                  <span>{selectedHostData.resources.memoryPercent}%</span>
                                </div>
                                <Progress value={selectedHostData.resources.memoryPercent} />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                                    <span>Disk</span>
                                  </div>
                                  <span>{selectedHostData.resources.diskPercent}%</span>
                                </div>
                                <Progress value={selectedHostData.resources.diskPercent} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* MCP Servers */}
                        <div>
                          <h4 className="font-medium mb-3">MCP Servers</h4>
                          {selectedHostData.mcpServers?.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No MCP servers found</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedHostData.mcpServers?.map((server) => (
                                  <TableRow key={server.id}>
                                    <TableCell>{server.name}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={server.status === "running" ? "default" : "secondary"}
                                      >
                                        {server.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        {server.status === "running" ? (
                                          <Button variant="ghost" size="sm">
                                            <PowerOff className="w-4 h-4" />
                                          </Button>
                                        ) : (
                                          <Button variant="ghost" size="sm">
                                            <Power className="w-4 h-4" />
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="sm">
                                          <RefreshCw className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Version</p>
                            <p className="font-mono">{selectedHostData.version || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Platform</p>
                            <p>{selectedHostData.platform || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Heartbeat</p>
                            <p>
                              {selectedHostData.lastSeen
                                ? new Date(selectedHostData.lastSeen).toLocaleString()
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Connected Since</p>
                            <p>
                              {selectedHostData.connectedAt
                                ? new Date(selectedHostData.connectedAt).toLocaleString()
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="h-[400px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Select a host to view details</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discovery" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Network Discovery</CardTitle>
                    <CardDescription>
                      Automatically discover MCP host agents on your network
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDiscoveryConfigOpen(true)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Configure
                    </Button>
                    {discoveryConfig?.enabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopDiscoveryMutation.mutate()}
                      >
                        <PowerOff className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => startDiscoveryMutation.mutate()}>
                        <Search className="w-4 h-4 mr-1" />
                        Start Discovery
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {discoveredHosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hosts discovered yet</p>
                    <p className="text-sm">Start discovery to find MCP agents on your network</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hostname</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead>Discovery Method</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discoveredHosts.map((host) => (
                        <TableRow key={host.id}>
                          <TableCell>{host.name}</TableCell>
                          <TableCell className="font-mono">{host.address}</TableCell>
                          <TableCell>{host.port}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{host.discoveryMethod}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => connectDiscoveredHostMutation.mutate(host.id)}
                            >
                              Connect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commands" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Command History</CardTitle>
                <CardDescription>Recent commands sent to MCP hosts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>Command</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commands.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No commands yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      commands.map((cmd) => (
                        <TableRow key={cmd.id}>
                          <TableCell>{hosts.find((host) => host.id === cmd.hostId)?.hostName || cmd.hostId}</TableCell>
                          <TableCell className="font-mono text-sm">{cmd.type}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                cmd.status === "completed"
                                  ? "default"
                                  : cmd.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {cmd.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(cmd.sentAt || cmd.completedAt || "").toLocaleString()}
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

      <Dialog open={installScriptOpen} onOpenChange={setInstallScriptOpen}>
        <DialogContent><DialogHeader><DialogTitle>Agent Installation</DialogTitle><DialogDescription>Generated download scripts are unavailable. Build the agent from this repository.</DialogDescription></DialogHeader>
          <div className="space-y-3"><p>Run npm ci and npm run build in the agent directory, then node dist/index.js init. Configure server.url and server.authToken in the generated agent configuration before starting it.</p><p>Use the agent README for platform and tunnel instructions. Automatic service installation remains a prototype.</p></div>
          <DialogFooter><Button onClick={() => setInstallScriptOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discovery Config Dialog */}
      <Dialog open={discoveryConfigOpen} onOpenChange={setDiscoveryConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discovery Settings</DialogTitle>
            <DialogDescription>
              Configure network discovery settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable mDNS</Label>
                <p className="text-sm text-muted-foreground">Discover via multicast DNS</p>
              </div>
              <Switch checked={discoveryConfig?.enabled && discoveryConfig.discoveryMethod === "mdns"} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Tailscale</Label>
                <p className="text-sm text-muted-foreground">Discover via Tailscale network</p>
              </div>
              <Switch checked={discoveryConfig?.enabled && discoveryConfig.discoveryMethod === "tailscale"} />
            </div>
            <div className="space-y-2">
              <Label>Scan Interval (seconds)</Label>
              <Input
                type="number"
                defaultValue={discoveryConfig?.scanInterval || 30}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDiscoveryConfigOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
