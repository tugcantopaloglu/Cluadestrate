"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Code,
  FolderOpen,
  Upload,
  MoreVertical,
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

const mockKnowledgeItems = [
  {
    id: "1",
    title: "Project Architecture",
    type: "document",
    description: "Overview of the system architecture and design decisions",
    lastUpdated: "2024-01-15T10:00:00Z",
    size: "15KB",
    tags: ["architecture", "design"],
  },
  {
    id: "2",
    title: "API Documentation",
    type: "document",
    description: "REST API endpoints and usage examples",
    lastUpdated: "2024-01-14T15:30:00Z",
    size: "45KB",
    tags: ["api", "documentation"],
  },
  {
    id: "3",
    title: "Code Style Guide",
    type: "code",
    description: "Coding conventions and best practices",
    lastUpdated: "2024-01-13T09:00:00Z",
    size: "8KB",
    tags: ["style", "conventions"],
  },
  {
    id: "4",
    title: "Database Schema",
    type: "code",
    description: "Database models and relationships",
    lastUpdated: "2024-01-12T14:00:00Z",
    size: "12KB",
    tags: ["database", "schema"],
  },
];

const typeIcons = {
  document: FileText,
  code: Code,
  folder: FolderOpen,
};

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = mockKnowledgeItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button>
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
            <CardTitle className="text-3xl">{mockKnowledgeItems.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Size</CardDescription>
            <CardTitle className="text-3xl">80KB</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sessions Using</CardDescription>
            <CardTitle className="text-3xl">5</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Updated</CardDescription>
            <CardTitle className="text-lg">Today</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Knowledge Items */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Knowledge documents available for sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const Icon = typeIcons[item.type as keyof typeof typeIcons] || FileText;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
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
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{item.size}</p>
                        <p>{new Date(item.lastUpdated).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Advanced Knowledge Management Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vector embeddings for semantic search, automatic CLAUDE.md generation,
            and knowledge sharing across sessions will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
