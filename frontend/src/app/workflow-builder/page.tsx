"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Workflow,
  Plus,
  Trash2,
  Save,
  Play,
  Pause,
  Copy,
  Download,
  Upload,
  Loader2,
  Settings,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitBranch,
  Box,
  Circle,
  Square,
  Diamond,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { workflowBuilderApi } from "@/lib/api";
import { toast } from "sonner";

const nodeTypes = [
  { type: "session", label: "Session", icon: Box, color: "bg-blue-500" },
  { type: "condition", label: "Condition", icon: Diamond, color: "bg-yellow-500" },
  { type: "transform", label: "Transform", icon: Square, color: "bg-purple-500" },
  { type: "aggregator", label: "Aggregator", icon: Circle, color: "bg-green-500" },
  { type: "trigger", label: "Trigger", icon: Play, color: "bg-red-500" },
  { type: "output", label: "Output", icon: GitBranch, color: "bg-orange-500" },
];

export default function WorkflowBuilderPage() {
  const [selectedCanvas, setSelectedCanvas] = useState<string | null>(null);
  const [newCanvasOpen, setNewCanvasOpen] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [newCanvasDescription, setNewCanvasDescription] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [newNodeType, setNewNodeType] = useState("session");
  const [newNodeLabel, setNewNodeLabel] = useState("");

  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["workflow-builder-stats"],
    queryFn: workflowBuilderApi.getStats,
  });

  const { data: canvases = [], isLoading } = useQuery({
    queryKey: ["workflow-builder-canvases"],
    queryFn: workflowBuilderApi.listCanvases,
  });

  const { data: canvas } = useQuery({
    queryKey: ["workflow-builder-canvas", selectedCanvas],
    queryFn: () => (selectedCanvas ? workflowBuilderApi.getCanvas(selectedCanvas) : null),
    enabled: !!selectedCanvas,
  });

  const { data: nodes = [] } = useQuery({
    queryKey: ["workflow-builder-nodes", selectedCanvas],
    queryFn: () => (selectedCanvas ? workflowBuilderApi.listNodes(selectedCanvas) : []),
    enabled: !!selectedCanvas,
  });

  const { data: edges = [] } = useQuery({
    queryKey: ["workflow-builder-edges", selectedCanvas],
    queryFn: () => (selectedCanvas ? workflowBuilderApi.listEdges(selectedCanvas) : []),
    enabled: !!selectedCanvas,
  });

  const createCanvasMutation = useMutation({
    mutationFn: workflowBuilderApi.createCanvas,
    onSuccess: (newCanvas) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-builder-canvases"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-builder-stats"] });
      setSelectedCanvas(newCanvas.id);
      setNewCanvasOpen(false);
      setNewCanvasName("");
      setNewCanvasDescription("");
      toast.success("Canvas created");
    },
  });

  const deleteCanvasMutation = useMutation({
    mutationFn: workflowBuilderApi.deleteCanvas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-builder-canvases"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-builder-stats"] });
      setSelectedCanvas(null);
      toast.success("Canvas deleted");
    },
  });

  const addNodeMutation = useMutation({
    mutationFn: ({ canvasId, data }: { canvasId: string; data: any }) =>
      workflowBuilderApi.addNode(canvasId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-builder-nodes", selectedCanvas] });
      setAddNodeOpen(false);
      setNewNodeType("session");
      setNewNodeLabel("");
      toast.success("Node added");
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: ({ canvasId, nodeId }: { canvasId: string; nodeId: string }) =>
      workflowBuilderApi.deleteNode(canvasId, nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-builder-nodes", selectedCanvas] });
      queryClient.invalidateQueries({ queryKey: ["workflow-builder-edges", selectedCanvas] });
      setSelectedNode(null);
      toast.success("Node deleted");
    },
  });

  const validateCanvasMutation = useMutation({
    mutationFn: workflowBuilderApi.validateCanvas,
    onSuccess: (result) => {
      if (result.valid) {
        toast.success("Workflow is valid!");
      } else {
        toast.error(`Validation failed: ${result.errors?.join(", ")}`);
      }
    },
  });

  const exportCanvasMutation = useMutation({
    mutationFn: workflowBuilderApi.exportCanvas,
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workflow-${selectedCanvas}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Workflow exported");
    },
  });

  const handleAddNode = () => {
    if (selectedCanvas && newNodeLabel) {
      addNodeMutation.mutate({
        canvasId: selectedCanvas,
        data: {
          type: newNodeType,
          label: newNodeLabel,
          position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
          config: {},
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visual Workflow Builder</h1>
          <p className="text-muted-foreground">
            Design and build complex workflows with a visual drag-and-drop interface
          </p>
        </div>
        <Dialog open={newCanvasOpen} onOpenChange={setNewCanvasOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Start building a new visual workflow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  placeholder="My Workflow"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newCanvasDescription}
                  onChange={(e) => setNewCanvasDescription(e.target.value)}
                  placeholder="Describe what this workflow does..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewCanvasOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createCanvasMutation.mutate({ name: newCanvasName, description: newCanvasDescription })}
                disabled={!newCanvasName || createCanvasMutation.isPending}
              >
                {createCanvasMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Workflows</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalCanvases || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats?.activeCanvases || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Nodes</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalNodes || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Edges</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalEdges || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Workflow List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Workflows</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {canvases.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      No workflows yet
                    </p>
                  ) : (
                    <div className="space-y-1 p-2">
                      {canvases.map((c: any) => (
                        <div
                          key={c.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedCanvas === c.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => setSelectedCanvas(c.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{c.name}</p>
                              <p className={`text-xs ${
                                selectedCanvas === c.id ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                {c.nodes?.length || 0} nodes
                              </p>
                            </div>
                            <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">
                              {c.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Node Palette */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Node Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {nodeTypes.map((nt) => (
                    <div
                      key={nt.type}
                      className="p-2 rounded-lg border cursor-move hover:border-primary transition-colors text-center"
                      draggable
                    >
                      <div className={`w-8 h-8 mx-auto rounded ${nt.color} flex items-center justify-center mb-1`}>
                        <nt.icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs">{nt.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3">
            {selectedCanvas && canvas ? (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-2 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{canvas.name}</CardTitle>
                      <CardDescription>{canvas.description || "No description"}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => validateCanvasMutation.mutate(selectedCanvas)}
                        disabled={validateCanvasMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Validate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportCanvasMutation.mutate(selectedCanvas)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                      <Dialog open={addNodeOpen} onOpenChange={setAddNodeOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            Add Node
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Node</DialogTitle>
                            <DialogDescription>
                              Add a new node to the workflow
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Node Type</Label>
                              <Select value={newNodeType} onValueChange={setNewNodeType}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {nodeTypes.map((nt) => (
                                    <SelectItem key={nt.type} value={nt.type}>
                                      {nt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Label</Label>
                              <Input
                                value={newNodeLabel}
                                onChange={(e) => setNewNodeLabel(e.target.value)}
                                placeholder="Node label"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setAddNodeOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddNode}
                              disabled={!newNodeLabel || addNodeMutation.isPending}
                            >
                              Add Node
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCanvasMutation.mutate(selectedCanvas)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 relative">
                  {/* Canvas Visualization */}
                  <div className="absolute inset-0 bg-muted/30 overflow-auto">
                    <div className="min-h-full min-w-full p-8" style={{ minWidth: "800px", minHeight: "500px" }}>
                      {/* Grid Background */}
                      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>

                      {/* Edges */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                        {edges.map((edge: any) => {
                          const sourceNode = nodes.find((n: any) => n.id === edge.sourceId);
                          const targetNode = nodes.find((n: any) => n.id === edge.targetId);
                          if (!sourceNode || !targetNode) return null;

                          const x1 = sourceNode.position.x + 60;
                          const y1 = sourceNode.position.y + 30;
                          const x2 = targetNode.position.x;
                          const y2 = targetNode.position.y + 30;

                          return (
                            <line
                              key={edge.id}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-muted-foreground"
                              markerEnd="url(#arrowhead)"
                            />
                          );
                        })}
                        <defs>
                          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-muted-foreground" />
                          </marker>
                        </defs>
                      </svg>

                      {/* Nodes */}
                      <div className="relative" style={{ zIndex: 2 }}>
                        {nodes.map((node: any) => {
                          const nodeType = nodeTypes.find((nt) => nt.type === node.type);
                          const NodeIcon = nodeType?.icon || Box;

                          return (
                            <div
                              key={node.id}
                              className={`absolute p-3 rounded-lg border-2 bg-background shadow-md cursor-pointer transition-all ${
                                selectedNode === node.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                              }`}
                              style={{ left: node.position.x, top: node.position.y, minWidth: "120px" }}
                              onClick={() => setSelectedNode(node.id)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded ${nodeType?.color || "bg-gray-500"}`}>
                                  <NodeIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{node.label}</p>
                                  <p className="text-xs text-muted-foreground">{node.type}</p>
                                </div>
                              </div>
                              {selectedNode === node.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNodeMutation.mutate({ canvasId: selectedCanvas, nodeId: node.id });
                                  }}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {nodes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Click "Add Node" to start building your workflow</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background border rounded-lg p-2 shadow-lg">
                    <Button variant="ghost" size="sm">
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">100%</span>
                    <Button variant="ghost" size="sm">
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-border" />
                    <Button variant="ghost" size="sm">
                      <Maximize className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Grid className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Workflow className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Workflow Selected</h3>
                  <p className="mb-4">Select a workflow from the list or create a new one</p>
                  <Button onClick={() => setNewCanvasOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Workflow
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
