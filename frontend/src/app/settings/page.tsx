"use client";

import { useState } from "react";
import {
  Settings,
  Cpu,
  Brain,
  Bell,
  Shield,
  Database,
  Globe,
  Key,
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function SettingsPage() {
  const [defaultModel, setDefaultModel] = useState("claude-sonnet-4-20250514");
  const [thinkingMode, setThinkingMode] = useState("standard");
  const [thinkingBudget, setThinkingBudget] = useState([16384]);
  const [autoApprove, setAutoApprove] = useState(false);
  const [usageAlertWarning, setUsageAlertWarning] = useState(75);
  const [usageAlertCritical, setUsageAlertCritical] = useState(90);
  const [dailyTokenLimit, setDailyTokenLimit] = useState(100000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure Cluadestrate to match your preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="thinking">Thinking</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Auto-Approve</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve all tool uses in new sessions
                  </p>
                </div>
                <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Default Working Directory</Label>
                <Input placeholder="C:\Projects" />
                <p className="text-xs text-muted-foreground">
                  Used when creating new sessions without specifying a directory
                </p>
              </div>

              <div className="space-y-2">
                <Label>Claude Binary Path</Label>
                <Input defaultValue="claude" />
                <p className="text-xs text-muted-foreground">
                  Path to the Claude Code CLI binary
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Concurrent Sessions</Label>
                <Input type="number" defaultValue="10" />
                <p className="text-xs text-muted-foreground">
                  Maximum number of sessions that can run simultaneously
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Settings */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Model Configuration
              </CardTitle>
              <CardDescription>
                Choose and configure Claude models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Model</Label>
                <Select value={defaultModel} onValueChange={setDefaultModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-opus-4-5-20251101">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        Claude Opus 4.5 - Most Capable
                      </div>
                    </SelectItem>
                    <SelectItem value="claude-sonnet-4-20250514">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        Claude Sonnet 4 - Balanced
                      </div>
                    </SelectItem>
                    <SelectItem value="claude-haiku-3-5-20241022">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Claude Haiku 3.5 - Fast
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <h4 className="font-medium">Opus 4.5</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Most capable model for complex reasoning
                    </p>
                    <div className="text-xs space-y-1">
                      <p>Context: 200K tokens</p>
                      <p>Input: $15/M tokens</p>
                      <p>Output: $75/M tokens</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <h4 className="font-medium">Sonnet 4</h4>
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Balanced performance and capability
                    </p>
                    <div className="text-xs space-y-1">
                      <p>Context: 200K tokens</p>
                      <p>Input: $3/M tokens</p>
                      <p>Output: $15/M tokens</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <h4 className="font-medium">Haiku 3.5</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Fast and efficient for simpler tasks
                    </p>
                    <div className="text-xs space-y-1">
                      <p>Context: 200K tokens</p>
                      <p>Input: $0.25/M tokens</p>
                      <p>Output: $1.25/M tokens</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thinking Mode Settings */}
        <TabsContent value="thinking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Thinking Mode Configuration
              </CardTitle>
              <CardDescription>
                Configure extended thinking / reasoning modes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Thinking Mode</Label>
                <Select value={thinkingMode} onValueChange={setThinkingMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      Standard - Normal responses
                    </SelectItem>
                    <SelectItem value="extended">
                      Extended - Step-by-step reasoning
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {thinkingMode === "extended" && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Thinking Budget</Label>
                      <span className="text-sm text-muted-foreground">
                        {(thinkingBudget[0] / 1000).toFixed(0)}K tokens
                      </span>
                    </div>
                    <Slider
                      value={thinkingBudget}
                      onValueChange={setThinkingBudget}
                      min={4096}
                      max={131072}
                      step={4096}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>4K (Light)</span>
                      <span>16K (Medium)</span>
                      <span>32K (Deep)</span>
                      <span>64K (Ultra)</span>
                      <span>128K (Max)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Light", value: 4096 },
                      { label: "Medium", value: 16384 },
                      { label: "Deep", value: 32768 },
                      { label: "Ultra", value: 65536 },
                      { label: "Max", value: 131072 },
                    ].map((preset) => (
                      <Button
                        key={preset.label}
                        variant={thinkingBudget[0] === preset.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setThinkingBudget([preset.value])}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Display Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Show thinking in output</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Collapsible thinking blocks</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show thinking token count</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Settings */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Usage Alerts & Limits
              </CardTitle>
              <CardDescription>
                Configure usage monitoring and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Daily Token Limit</Label>
                <Input
                  type="number"
                  value={dailyTokenLimit}
                  onChange={(e) => setDailyTokenLimit(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum tokens allowed per day across all sessions
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Alert Thresholds</h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Warning threshold</Label>
                      <span className="text-sm">{usageAlertWarning}%</span>
                    </div>
                    <Slider
                      value={[usageAlertWarning]}
                      onValueChange={([value]) => setUsageAlertWarning(value)}
                      min={50}
                      max={95}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Critical threshold</Label>
                      <span className="text-sm">{usageAlertCritical}%</span>
                    </div>
                    <Slider
                      value={[usageAlertCritical]}
                      onValueChange={([value]) => setUsageAlertCritical(value)}
                      min={70}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for Claude and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Anthropic API Key</Label>
                <Input type="password" placeholder="sk-ant-..." />
                <p className="text-xs text-muted-foreground">
                  Your Anthropic API key for Claude access
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Integration Keys</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>GitHub Token</Label>
                    <Input type="password" placeholder="ghp_..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Slack Bot Token</Label>
                    <Input type="password" placeholder="xoxb-..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Discord Bot Token</Label>
                    <Input type="password" placeholder="..." />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  );
}
