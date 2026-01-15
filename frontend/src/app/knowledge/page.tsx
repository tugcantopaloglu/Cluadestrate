"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Code,
  FolderOpen,
  Upload,
  MoreVertical,
  Trash2,
  RefreshCw,
  Loader2,
  Link,
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { knowledgeApi } from "@/lib/api";

const typeIcons = {
  document: FileText,
  code: Code,
  snippet: Code,
  reference: FolderOpen,
};

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    type: "document" as "document" | "code" | "snippet" | "reference",
    content: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [importPath, setImportPath] = useState("");

  const queryClient = useQueryClient();

  const { data: knowledge = [], isLoading } = useQuery({
    queryKey: ["knowledge"],
    queryFn: knowledgeApi.list,
  });

  const { data: stats } = useQuery({
    queryKey: ["knowledge-stats"],
    queryFn: knowledgeApi.getStats,
  });

  const { data: searchResults } = useQuery({
    queryKey: ["knowledge-search", searchQuery],
    queryFn: () => knowledgeApi.search(searchQuery),
    enabled: searchQuery.length > 2,
  });

  const createMutation = useMutation({
    mutationFn: knowledgeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-stats"] });
      setIsCreateOpen(false);
      setNewItem({
        title: "",
        description: "",
        type: "document",
        content: "",
        tags: [],
      });
      setTagInput("");
    },
  });

  const importMutation = useMutation({
    mutationFn: knowledgeApi.import,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-stats"] });
      setIsImportOpen(false);
      setImportPath("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: knowledgeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-stats"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: knowledgeApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });

  const displayItems = searchQuery.length > 2 && searchResults ? searchResults : knowledge;

  const addTag = () => {
    if (tagInput.trim() && !newItem.tags.includes(tagInput.trim())) {
      setNewItem({ ...newItem, tags: [...newItem.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setNewItem({ ...newItem, tags: newItem.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Curated knowledge for Claude sessions via CLAUDE.md files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Knowledge
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge base..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Size</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.totalSize ? `${Math.round(stats.totalSize / 1024)}KB` : "0KB"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sessions Using</CardDescription>
            <CardTitle className="text-3xl">{stats?.sessionsUsing || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Updated</CardDescription>
            <CardTitle className="text-lg">
              {stats?.lastUpdated
                ? new Date(stats.lastUpdated).toLocaleDateString()
                : "Never"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Knowledge Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : displayItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Knowledge Items Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Add knowledge documents to enhance your Claude sessions.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Knowledge
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Knowledge documents available for sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {displayItems.map((item: any) => {
                  const Icon = typeIcons[item.type as keyof typeof typeIcons] || FileText;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {item.tags?.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{item.content?.length ? `${Math.round(item.content.length / 1024)}KB` : "0KB"}</p>
                          <p>{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.sourcePath && (
                              <DropdownMenuItem onClick={() => syncMutation.mutate(item.id)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Sync from Source
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Create Knowledge Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Knowledge Item</DialogTitle>
            <DialogDescription>
              Add a new knowledge document for Claude sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="e.g., Project Architecture"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Brief description of this knowledge..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newItem.type}
                onValueChange={(value: "document" | "code" | "snippet" | "reference") =>
                  setNewItem({ ...newItem, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="snippet">Snippet</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={newItem.content}
                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                placeholder="Knowledge content (Markdown supported)..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {newItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newItem.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newItem)}
              disabled={
                !newItem.title.trim() ||
                !newItem.content.trim() ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? "Creating..." : "Add Knowledge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Knowledge</DialogTitle>
            <DialogDescription>
              Import a file from the filesystem as knowledge.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>File Path</Label>
              <Input
                value={importPath}
                onChange={(e) => setImportPath(e.target.value)}
                placeholder="/path/to/file.md"
              />
              <p className="text-xs text-muted-foreground">
                Supports .md, .txt, .json, and code files
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => importMutation.mutate(importPath)}
              disabled={!importPath.trim() || importMutation.isPending}
            >
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
