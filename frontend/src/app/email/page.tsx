"use client";

import type { ApiResponses } from "@/types/api";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Plus,
  Trash2,
  Send,
  Settings,
  Loader2,
  User,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
  Eye,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { emailApi } from "@/lib/api";
import { toast } from "sonner";

const templateCategories = [
  { value: "session", label: "Session" },
  { value: "alert", label: "Alert" },
  { value: "report", label: "Report" },
  { value: "system", label: "System" },
];

export default function EmailPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const [addTemplateOpen, setAddTemplateOpen] = useState(false);
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ApiResponses["GET /api/email/templates"][number] | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ApiResponses["GET /api/email/messages"][number] | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    body: "",
    category: "session",
  });

  const [newRecipient, setNewRecipient] = useState({
    name: "",
    email: "",
    subscriptions: [] as string[],
  });

  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "",
    templateId: "",
  });

  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["email-stats"],
    queryFn: emailApi.getStats,
  });

  const { data: config } = useQuery({
    queryKey: ["email-config"],
    queryFn: emailApi.getConfig,
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => emailApi.listTemplates(),
  });

  const { data: recipients = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ["email-recipients"],
    queryFn: emailApi.listRecipients,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["email-messages"],
    queryFn: () => emailApi.listMessages(50),
  });

  const updateConfigMutation = useMutation({
    mutationFn: emailApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-config"] });
      toast.success("Configuration updated");
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: emailApi.testConnection,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Connection successful!");
      } else {
        toast.error("Connection failed");
      }
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: typeof newTemplate) => emailApi.createTemplate({ name: data.name, subject: data.subject, textContent: data.body, htmlContent: "", variables: [...new Set([...`${data.subject}\n${data.body}`.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]))], category: data.category as Parameters<typeof emailApi.createTemplate>[0]["category"] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      setAddTemplateOpen(false);
      setNewTemplate({ name: "", subject: "", body: "", category: "session" });
      toast.success("Template created");
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: emailApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template deleted");
    },
  });

  const addRecipientMutation = useMutation({
    mutationFn: (data: typeof newRecipient) => emailApi.addRecipient({ name: data.name, email: data.email, preferences: { enabled: true, categories: ["session", "workflow", "alert", "usage", "system", "report"], digest: "immediate" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-recipients"] });
      setAddRecipientOpen(false);
      setNewRecipient({ name: "", email: "", subscriptions: [] });
      toast.success("Recipient added");
    },
  });

  const removeRecipientMutation = useMutation({
    mutationFn: emailApi.removeRecipient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-recipients"] });
      toast.success("Recipient removed");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: typeof composeData) => emailApi.sendEmail({ to: data.to.split(/[,;]+/).map((email) => email.trim()).filter(Boolean), subject: data.subject, htmlContent: "", textContent: data.body }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["email-messages"] });
      queryClient.invalidateQueries({ queryKey: ["email-stats"] });
      if (result.status === "failed") {
        toast.error(result.error || "Email could not be sent");
        return;
      }
      setComposeOpen(false);
      setComposeData({ to: "", subject: "", body: "", templateId: "" });
      toast.success("Email sent");
    },
  });

  const isLoading = statsLoading || templatesLoading || recipientsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Notifications</h1>
          <p className="text-muted-foreground">
            Configure email notifications and manage recipients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setConfigOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Compose Email</DialogTitle>
                <DialogDescription>
                  Send an email to one or more recipients
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input
                    value={composeData.to}
                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Template (optional)</Label>
                  <Select
                    value={composeData.templateId || "none"}
                    onValueChange={(value) => {
                      const template = templates.find((t) => t.id === value);
                      if (template) {
                        setComposeData({
                          ...composeData,
                        templateId: value === "none" ? "" : value,
                          subject: template.subject,
                          body: template.textContent,
                        });
                      } else {
                        setComposeData({ ...composeData, templateId: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    placeholder="Email subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    value={composeData.body}
                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                    placeholder="Email body..."
                    rows={8}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => sendEmailMutation.mutate(composeData)}
                  disabled={!composeData.to || !composeData.subject || sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Connection Status */}
      <Card className={config?.enabled && config.configured ? "border-green-500/20 bg-green-500/5" : "border-yellow-500/20 bg-yellow-500/5"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${config?.enabled && config.configured ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
                <Mail className={`w-6 h-6 ${config?.enabled && config.configured ? "text-green-500" : "text-yellow-500"}`} />
              </div>
              <div>
                <h3 className="font-semibold">
                  {config?.enabled && config.configured ? "Email Service Configured" : "Email Service Not Configured"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Provider: {config?.provider || "Not set"} | From: {config?.from.email || "Not set"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testConnectionMutation.mutate()}
              disabled={!config?.enabled || testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sent</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalSent || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Delivered</CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats?.totalSent || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats?.totalFailed || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Templates</CardDescription>
            <CardTitle className="text-3xl">{templates.length || templates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recipients</CardDescription>
            <CardTitle className="text-3xl">{recipients.length || recipients.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Email Templates</h3>
              <Dialog open={addTemplateOpen} onOpenChange={setAddTemplateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Template</DialogTitle>
                    <DialogDescription>
                      Create a reusable email template
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                          placeholder="Template name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={newTemplate.category}
                          onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {templateCategories.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={newTemplate.subject}
                        onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                        placeholder="Email subject"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Body</Label>
                      <Textarea
                        value={newTemplate.body}
                        onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                        placeholder="Email body... Use {{variable}} for placeholders"
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {"{{variable}}"} syntax for dynamic content
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddTemplateOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createTemplateMutation.mutate(newTemplate)}
                      disabled={!newTemplate.name || !newTemplate.subject || createTemplateMutation.isPending}
                    >
                      Create Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Templates</h3>
                  <p className="text-muted-foreground mb-4">
                    Create email templates for consistent messaging
                  </p>
                  <Button onClick={() => setAddTemplateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <CardDescription className="truncate">{template.subject}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {template.textContent}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setComposeData({
                              ...composeData,
                              templateId: template.id,
                              subject: template.subject,
                              body: template.textContent,
                            });
                            setComposeOpen(true);
                          }}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Use
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recipients" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recipients</h3>
              <Dialog open={addRecipientOpen} onOpenChange={setAddRecipientOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Recipient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Recipient</DialogTitle>
                    <DialogDescription>
                      Add a new email recipient
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newRecipient.name}
                        onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newRecipient.email}
                        onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddRecipientOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => addRecipientMutation.mutate(newRecipient)}
                      disabled={!newRecipient.name || !newRecipient.email || addRecipientMutation.isPending}
                    >
                      Add Recipient
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {recipients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Recipients</h3>
                  <p className="text-muted-foreground mb-4">
                    Add recipients to send email notifications
                  </p>
                  <Button onClick={() => setAddRecipientOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Recipient
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subscriptions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.map((recipient) => (
                        <TableRow key={recipient.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {recipient.name}
                            </div>
                          </TableCell>
                          <TableCell>{recipient.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {recipient.preferences.categories?.map((sub: string) => (
                                <Badge key={sub} variant="outline" className="text-xs">
                                  {sub}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={recipient.preferences.enabled ? "default" : "secondary"}>
                              {recipient.preferences.enabled ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setComposeData({ ...composeData, to: recipient.email });
                                  setComposeOpen(true);
                                }}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRecipientMutation.mutate(recipient.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email History</CardTitle>
                <CardDescription>Recent emails sent from the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>To</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No emails sent yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      messages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell>{message.to}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {message.subject}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                message.status === "sent"
                                  ? "default"
                                  : message.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {message.status === "sent" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {message.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                              {message.status === "queued" && <Clock className="w-3 h-3 mr-1" />}
                              {message.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {message.sentAt ? new Date(message.sentAt).toLocaleString() : "Not sent"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMessage(message)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
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

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent><DialogHeader><DialogTitle>Email Configuration</DialogTitle><DialogDescription>SMTP is the implemented provider. Stored credentials are hidden. Leave SMTP fields blank to keep them.</DialogDescription></DialogHeader>
          <form onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const host = String(values.get("host") || "");
            const user = String(values.get("user") || "");
            updateConfigMutation.mutate({
              enabled: values.has("enabled"),
              provider: "smtp",
              from: { email: String(values.get("fromEmail") || ""), name: String(values.get("fromName") || "") },
              ...(host && user ? { smtp: { host, port: Number(values.get("port")) || 587, secure: values.has("secure"), auth: { user, pass: String(values.get("pass") || "") } } } : {}),
            });
          }}>
            <div className="space-y-4 py-4">
              <Label><input name="enabled" type="checkbox" defaultChecked={config?.enabled} /> Enable Email</Label>
              <div><Label htmlFor="email-from">From Email</Label><Input id="email-from" name="fromEmail" type="email" required defaultValue={config?.from.email || ""} /></div>
              <div><Label htmlFor="email-name">From Name</Label><Input id="email-name" name="fromName" defaultValue={config?.from.name || ""} /></div>
              <div><Label htmlFor="email-host">SMTP Host</Label><Input id="email-host" name="host" placeholder="smtp.example.com" /></div>
              <div><Label htmlFor="email-port">SMTP Port</Label><Input id="email-port" name="port" type="number" min="1" max="65535" defaultValue="587" /></div>
              <Label><input name="secure" type="checkbox" /> Use TLS from connection start</Label>
              <div><Label htmlFor="email-user">SMTP User</Label><Input id="email-user" name="user" /></div>
              <div><Label htmlFor="email-pass">SMTP Password</Label><Input id="email-pass" name="pass" type="password" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setConfigOpen(false)}>Close</Button><Button type="submit" disabled={updateConfigMutation.isPending}>Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Message Preview Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">To</Label>
                  <p>{selectedMessage.to}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    variant={
                      selectedMessage.status === "sent" ? "default" : "destructive"
                    }
                  >
                    {selectedMessage.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium">{selectedMessage.subject}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Body</Label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                  {selectedMessage.textContent || selectedMessage.htmlContent}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label className="text-muted-foreground">Sent At</Label>
                  <p>{selectedMessage.sentAt ? new Date(selectedMessage.sentAt).toLocaleString() : "Not sent"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedMessage(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
