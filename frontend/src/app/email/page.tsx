"use client";

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
  { value: "notification", label: "Notification" },
  { value: "alert", label: "Alert" },
  { value: "report", label: "Report" },
  { value: "custom", label: "Custom" },
];

export default function EmailPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const [addTemplateOpen, setAddTemplateOpen] = useState(false);
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    body: "",
    category: "notification",
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
    mutationFn: emailApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      setAddTemplateOpen(false);
      setNewTemplate({ name: "", subject: "", body: "", category: "notification" });
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
    mutationFn: emailApi.addRecipient,
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
    mutationFn: emailApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-messages"] });
      queryClient.invalidateQueries({ queryKey: ["email-stats"] });
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
                    value={composeData.templateId}
                    onValueChange={(value) => {
                      const template = templates.find((t: any) => t.id === value);
                      if (template) {
                        setComposeData({
                          ...composeData,
                          templateId: value,
                          subject: template.subject,
                          body: template.body,
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
                      <SelectItem value="">None</SelectItem>
                      {templates.map((t: any) => (
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
      <Card className={config?.enabled ? "border-green-500/20 bg-green-500/5" : "border-yellow-500/20 bg-yellow-500/5"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${config?.enabled ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
                <Mail className={`w-6 h-6 ${config?.enabled ? "text-green-500" : "text-yellow-500"}`} />
              </div>
              <div>
                <h3 className="font-semibold">
                  {config?.enabled ? "Email Service Connected" : "Email Service Not Configured"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Provider: {config?.provider || "Not set"} | From: {config?.fromEmail || "Not set"}
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
            <CardTitle className="text-3xl text-green-500">{stats?.delivered || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats?.failed || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Templates</CardDescription>
            <CardTitle className="text-3xl">{stats?.templates || templates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recipients</CardDescription>
            <CardTitle className="text-3xl">{stats?.recipients || recipients.length}</CardTitle>
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
                {templates.map((template: any) => (
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
                        {template.body}
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
                              body: template.body,
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
                      {recipients.map((recipient: any) => (
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
                              {recipient.subscriptions?.map((sub: string) => (
                                <Badge key={sub} variant="outline" className="text-xs">
                                  {sub}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={recipient.enabled ? "default" : "secondary"}>
                              {recipient.enabled ? "Active" : "Inactive"}
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
                      messages.map((message: any) => (
                        <TableRow key={message.id}>
                          <TableCell>{message.to}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {message.subject}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                message.status === "delivered"
                                  ? "default"
                                  : message.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {message.status === "delivered" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {message.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                              {message.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {message.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(message.sentAt).toLocaleString()}
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

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Configuration</DialogTitle>
            <DialogDescription>
              Configure your email service provider
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Email</Label>
                <p className="text-sm text-muted-foreground">Enable email notifications</p>
              </div>
              <Switch
                checked={config?.enabled}
                onCheckedChange={(checked) =>
                  updateConfigMutation.mutate({ enabled: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                defaultValue={config?.provider || "smtp"}
                onValueChange={(value) =>
                  updateConfigMutation.mutate({ provider: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="ses">Amazon SES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                defaultValue={config?.fromEmail || ""}
                placeholder="noreply@example.com"
                onChange={(e) =>
                  updateConfigMutation.mutate({ fromEmail: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                defaultValue={config?.fromName || ""}
                placeholder="Cluadestrate"
                onChange={(e) =>
                  updateConfigMutation.mutate({ fromName: e.target.value })
                }
              />
            </div>
            {config?.provider === "smtp" && (
              <>
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    defaultValue={config?.smtpHost || ""}
                    placeholder="smtp.example.com"
                    onChange={(e) =>
                      updateConfigMutation.mutate({ smtpHost: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    defaultValue={config?.smtpPort || 587}
                    onChange={(e) =>
                      updateConfigMutation.mutate({ smtpPort: parseInt(e.target.value) })
                    }
                  />
                </div>
              </>
            )}
            {config?.provider !== "smtp" && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  defaultValue={config?.apiKey || ""}
                  placeholder="Your API key"
                  onChange={(e) =>
                    updateConfigMutation.mutate({ apiKey: e.target.value })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setConfigOpen(false)}>Close</Button>
          </DialogFooter>
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
                      selectedMessage.status === "delivered" ? "default" : "destructive"
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
                  {selectedMessage.body}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label className="text-muted-foreground">Sent At</Label>
                  <p>{new Date(selectedMessage.sentAt).toLocaleString()}</p>
                </div>
                {selectedMessage.deliveredAt && (
                  <div>
                    <Label className="text-muted-foreground">Delivered At</Label>
                    <p>{new Date(selectedMessage.deliveredAt).toLocaleString()}</p>
                  </div>
                )}
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
