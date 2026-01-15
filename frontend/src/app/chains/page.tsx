"use client";

import { useState } from "react";
import {
  GitMerge,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Clock,
  CheckCircle,
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChainStep {
  id: string;
  name: string;
  model: string;
  status: "pending" | "running" | "completed";
}

interface Chain {
  id: string;
  name: string;
  description: string;
  status: "idle" | "running" | "completed";
  steps: ChainStep[];
  lastRun?: string;
  runsCount: number;
}

const mockChains: Chain[] = [
  {
    id: "1",
    name: "Code Analysis Pipeline",
    description: "Multi-model code review and optimization",
    status: "running",
    steps: [
      { id: "1a", name: "Static Analysis", model: "Haiku", status: "completed" },
      { id: "1b", name: "Security Review", model: "Sonnet", status: "running" },
      { id: "1c", name: "Optimization Suggestions", model: "Opus", status: "pending" },
    ],
    lastRun: "2024-01-15T10:30:00Z",
    runsCount: 45,
  },
  {
    id: "2",
    name: "Documentation Generator",
    description: "Generate and refine documentation with multiple passes",
    status: "idle",
    steps: [
      { id: "2a", name: "Extract API Docs", model: "Haiku", status: "pending" },
      { id: "2b", name: "Write Examples", model: "Sonnet", status: "pending" },
      { id: "2c", name: "Review & Polish", model: "Opus", status: "pending" },
    ],
    lastRun: "2024-01-14T16:00:00Z",
    runsCount: 12,
  },
  {
    id: "3",
    name: "Test Generation",
    description: "Generate comprehensive test suites",
    status: "completed",
    steps: [
      { id: "3a", name: "Unit Tests", model: "Sonnet", status: "completed" },
      { id: "3b", name: "Integration Tests", model: "Sonnet", status: "completed" },
      { id: "3c", name: "Edge Cases", model: "Opus", status: "completed" },
    ],
    lastRun: "2024-01-15T08:00:00Z",
    runsCount: 28,
  },
];

const modelColors = {
  Haiku: "bg-green-500",
  Sonnet: "bg-blue-500",
  Opus: "bg-purple-500",
};

export default function ChainsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chains</h1>
          <p className="text-muted-foreground">
            Multi-model processing pipelines for complex tasks
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Chain
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Chains</CardDescription>
            <CardTitle className="text-3xl">{mockChains.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Running</CardDescription>
            <CardTitle className="text-3xl">
              {mockChains.filter((c) => c.status === "running").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Runs</CardDescription>
            <CardTitle className="text-3xl">
              {mockChains.reduce((sum, c) => sum + c.runsCount, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Steps</CardDescription>
            <CardTitle className="text-3xl">
              {(
                mockChains.reduce((sum, c) => sum + c.steps.length, 0) /
                mockChains.length
              ).toFixed(1)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Chains List */}
      <div className="space-y-4">
        {mockChains.map((chain) => (
          <Card key={chain.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <GitMerge className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{chain.name}</CardTitle>
                    <CardDescription>{chain.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      chain.status === "running"
                        ? "default"
                        : chain.status === "completed"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {chain.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    {chain.status === "running" ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chain Steps */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {chain.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                        step.status === "running"
                          ? "border-blue-500 bg-blue-500/10"
                          : step.status === "completed"
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-border"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : step.status === "running" ? (
                        <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <span className="text-sm whitespace-nowrap">{step.name}</span>
                        <div className="flex items-center gap-1 mt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              modelColors[step.model as keyof typeof modelColors]
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {step.model}
                          </span>
                        </div>
                      </div>
                    </div>
                    {index < chain.steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                {chain.lastRun && (
                  <span>Last run: {new Date(chain.lastRun).toLocaleString()}</span>
                )}
                <span>Total runs: {chain.runsCount}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <GitMerge className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Visual Chain Builder Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Drag-and-drop chain builder with conditional branching, parallel execution,
            and model-specific prompts will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
