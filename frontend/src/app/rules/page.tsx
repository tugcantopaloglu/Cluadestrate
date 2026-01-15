"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Shield, FileText, Settings } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { rulesApi, sessionsApi } from "@/lib/api";

export default function RulesPage() {
  const [isAddHardRuleOpen, setIsAddHardRuleOpen] = useState(false);
  const [newHardRule, setNewHardRule] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [editingDefaultRules, setEditingDefaultRules] = useState(false);
  const [defaultRulesText, setDefaultRulesText] = useState("");
  const [sessionRulesText, setSessionRulesText] = useState("");

  const queryClient = useQueryClient();

  const { data: rulesConfig } = useQuery({
    queryKey: ["rules"],
    queryFn: rulesApi.getAll,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.list,
  });

  const addHardRuleMutation = useMutation({
    mutationFn: () => rulesApi.addHardRule(newHardRule, "user"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      setIsAddHardRuleOpen(false);
      setNewHardRule("");
    },
  });

  const removeHardRuleMutation = useMutation({
    mutationFn: (id: string) => rulesApi.removeHardRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });

  const updateDefaultRulesMutation = useMutation({
    mutationFn: (rules: string[]) => rulesApi.setDefaultRules(rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      setEditingDefaultRules(false);
    },
  });

  const updateSessionRulesMutation = useMutation({
    mutationFn: ({ sessionId, rules }: { sessionId: string; rules: string[] }) =>
      rulesApi.setSessionRules(sessionId, rules),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });

  const handleEditDefaultRules = () => {
    setDefaultRulesText(rulesConfig?.defaultRules?.join("\n") || "");
    setEditingDefaultRules(true);
  };

  const handleSaveDefaultRules = () => {
    const rules = defaultRulesText.split("\n").filter((r) => r.trim());
    updateDefaultRulesMutation.mutate(rules);
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const sessionRules = rulesConfig?.sessionRules?.[sessionId] || [];
    setSessionRulesText(sessionRules.join("\n"));
  };

  const handleSaveSessionRules = () => {
    if (!selectedSessionId) return;
    const rules = sessionRulesText.split("\n").filter((r) => r.trim());
    updateSessionRulesMutation.mutate({ sessionId: selectedSessionId, rules });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rules & Configuration</h1>
        <p className="text-muted-foreground">
          Configure rules that govern Claude&apos;s behavior across sessions
        </p>
      </div>

      <Tabs defaultValue="hard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hard" className="gap-2">
            <Shield className="w-4 h-4" />
            Hard Rules
          </TabsTrigger>
          <TabsTrigger value="default" className="gap-2">
            <FileText className="w-4 h-4" />
            Default Rules
          </TabsTrigger>
          <TabsTrigger value="session" className="gap-2">
            <Settings className="w-4 h-4" />
            Session Rules
          </TabsTrigger>
        </TabsList>

        {/* Hard Rules */}
        <TabsContent value="hard">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    Hard Rules
                  </CardTitle>
                  <CardDescription>
                    These rules cannot be overridden by any session. They are always enforced.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddHardRuleOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hard Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rulesConfig?.hardRules?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hard rules configured</p>
                  <p className="text-sm">
                    Hard rules are critical constraints that Claude must always follow
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rulesConfig?.hardRules?.map((rule: any, index: number) => (
                    <div
                      key={rule.id}
                      className="flex items-start justify-between p-4 border rounded-lg bg-red-500/5 border-red-500/20"
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant="destructive" className="mt-0.5">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{rule.rule}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added {new Date(rule.createdAt).toLocaleDateString()} by{" "}
                            {rule.createdBy}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeHardRuleMutation.mutate(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Default Rules */}
        <TabsContent value="default">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Default Rules
                  </CardTitle>
                  <CardDescription>
                    These rules are applied to all new sessions by default
                  </CardDescription>
                </div>
                {!editingDefaultRules && (
                  <Button variant="outline" onClick={handleEditDefaultRules}>
                    Edit Rules
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingDefaultRules ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rules (one per line)</Label>
                    <Textarea
                      value={defaultRulesText}
                      onChange={(e) => setDefaultRulesText(e.target.value)}
                      rows={10}
                      placeholder="Enter rules, one per line..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveDefaultRules}>Save Changes</Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingDefaultRules(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {rulesConfig?.defaultRules?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No default rules configured
                    </p>
                  ) : (
                    rulesConfig?.defaultRules?.map((rule: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span>{rule}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Rules */}
        <TabsContent value="session">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-500" />
                Session-Specific Rules
              </CardTitle>
              <CardDescription>
                Configure custom rules for individual sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Session</Label>
                <Select value={selectedSessionId} onValueChange={handleSelectSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a session..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session: any) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSessionId && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Session Rules (one per line)</Label>
                    <Textarea
                      value={sessionRulesText}
                      onChange={(e) => setSessionRulesText(e.target.value)}
                      rows={8}
                      placeholder="Enter session-specific rules..."
                    />
                  </div>
                  <Button onClick={handleSaveSessionRules}>
                    Save Session Rules
                  </Button>
                </div>
              )}

              {!selectedSessionId && sessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No sessions available</p>
                  <p className="text-sm">Create a session first to configure its rules</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Hard Rule Dialog */}
      <Dialog open={isAddHardRuleOpen} onOpenChange={setIsAddHardRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hard Rule</DialogTitle>
            <DialogDescription>
              Hard rules are mandatory constraints that cannot be overridden by any session.
              Use them for critical safety or compliance requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule</Label>
              <Textarea
                value={newHardRule}
                onChange={(e) => setNewHardRule(e.target.value)}
                placeholder="e.g., Never delete files in /production directory"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddHardRuleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addHardRuleMutation.mutate()}
              disabled={!newHardRule.trim() || addHardRuleMutation.isPending}
            >
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
