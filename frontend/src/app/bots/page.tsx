"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  MessageSquare,
  Settings,
  Check,
  XCircle,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Hash,
  Users,
  Activity,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { botsApi } from "@/lib/api";
import { toast } from "sonner";

// Bot icons
const SlackIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

export default function BotsPage() {
  const [slackConfigOpen, setSlackConfigOpen] = useState(false);
  const [discordConfigOpen, setDiscordConfigOpen] = useState(false);
  const [telegramConfigOpen, setTelegramConfigOpen] = useState(false);

  const queryClient = useQueryClient();

  // Slack queries
  const { data: slackStats } = useQuery({
    queryKey: ["slack-stats"],
    queryFn: () => botsApi.getStats().then((stats) => stats.slack),
  });

  const { data: slackConfig } = useQuery({
    queryKey: ["slack-config"],
    queryFn: botsApi.slack.getConfig,
  });

  const { data: slackChannels = [] } = useQuery({
    queryKey: ["slack-channels"],
    queryFn: botsApi.slack.listChannels,
  });

  // Discord queries
  const { data: discordStats } = useQuery({
    queryKey: ["discord-stats"],
    queryFn: () => botsApi.getStats().then((stats) => stats.discord),
  });

  const { data: discordConfig } = useQuery({
    queryKey: ["discord-config"],
    queryFn: botsApi.discord.getConfig,
  });

  const { data: discordGuilds = [] } = useQuery({
    queryKey: ["discord-guilds"],
    queryFn: botsApi.discord.listGuilds,
  });

  // Telegram queries
  const { data: telegramStats } = useQuery({
    queryKey: ["telegram-stats"],
    queryFn: () => botsApi.getStats().then((stats) => stats.telegram),
  });

  const { data: telegramConfig } = useQuery({
    queryKey: ["telegram-config"],
    queryFn: botsApi.telegram.getConfig,
  });

  const { data: telegramChats = [] } = useQuery({
    queryKey: ["telegram-chats"],
    queryFn: botsApi.telegram.listChats,
  });

  // Mutations
  const updateSlackConfigMutation = useMutation({
    mutationFn: botsApi.slack.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-config"] });
      queryClient.invalidateQueries({ queryKey: ["slack-stats"] });
    },
  });

  const updateDiscordConfigMutation = useMutation({
    mutationFn: botsApi.discord.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discord-config"] });
      queryClient.invalidateQueries({ queryKey: ["discord-stats"] });
    },
  });

  const updateTelegramConfigMutation = useMutation({
    mutationFn: botsApi.telegram.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-config"] });
      queryClient.invalidateQueries({ queryKey: ["telegram-stats"] });
    },
  });

  const testSlackMutation = useMutation({
    mutationFn: botsApi.slack.connect,
    onSuccess: (result) => {
      if (result.success) toast.success("Slack connection successful!");
      else toast.error("Slack connection failed");
    },
  });

  const testDiscordMutation = useMutation({
    mutationFn: botsApi.discord.connect,
    onSuccess: (result) => {
      if (result.success) toast.success("Discord connection successful!");
      else toast.error("Discord connection failed");
    },
  });

  const testTelegramMutation = useMutation({
    mutationFn: botsApi.telegram.connect,
    onSuccess: (result) => {
      if (result.success) toast.success("Telegram connection successful!");
      else toast.error("Telegram connection failed");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integration Bots</h1>
          <p className="text-muted-foreground">
            Connect with Slack, Discord, and Telegram for real-time notifications and commands
          </p>
        </div>
      </div>

      {/* Bot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Slack */}
        <Card className={slackConfig?.status === "online" ? "border-[#4A154B]/50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#4A154B]/20">
                  <SlackIcon />
                </div>
                <div>
                  <CardTitle className="text-lg">Slack</CardTitle>
                  <CardDescription>Workspace messaging</CardDescription>
                </div>
              </div>
              <Switch
                checked={slackConfig?.enabled}
                onCheckedChange={(checked) =>
                  updateSlackConfigMutation.mutate({ enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium flex items-center gap-1">
                  {slackConfig?.status === "online" ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-500" />
                      Disconnected
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Channels</p>
                <p className="font-medium">{slackChannels.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Messages Sent</p>
                <p className="font-medium">{slackStats?.messagesSent || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Commands</p>
                <p className="font-medium">{slackStats?.commandsExecuted || 0}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSlackConfigOpen(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSlackMutation.mutate()}
                disabled={!slackConfig?.enabled || testSlackMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 ${testSlackMutation.isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Discord */}
        <Card className={discordConfig?.status === "online" ? "border-[#5865F2]/50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#5865F2]/20">
                  <DiscordIcon />
                </div>
                <div>
                  <CardTitle className="text-lg">Discord</CardTitle>
                  <CardDescription>Community servers</CardDescription>
                </div>
              </div>
              <Switch
                checked={discordConfig?.enabled}
                onCheckedChange={(checked) =>
                  updateDiscordConfigMutation.mutate({ enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium flex items-center gap-1">
                  {discordConfig?.status === "online" ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-500" />
                      Disconnected
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Servers</p>
                <p className="font-medium">{discordGuilds.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Messages Sent</p>
                <p className="font-medium">{discordStats?.messagesSent || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Commands</p>
                <p className="font-medium">{discordStats?.commandsExecuted || 0}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setDiscordConfigOpen(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testDiscordMutation.mutate()}
                disabled={!discordConfig?.enabled || testDiscordMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 ${testDiscordMutation.isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card className={telegramConfig?.status === "online" ? "border-[#0088cc]/50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0088cc]/20">
                  <TelegramIcon />
                </div>
                <div>
                  <CardTitle className="text-lg">Telegram</CardTitle>
                  <CardDescription>Instant messaging</CardDescription>
                </div>
              </div>
              <Switch
                checked={telegramConfig?.enabled}
                onCheckedChange={(checked) =>
                  updateTelegramConfigMutation.mutate({ enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium flex items-center gap-1">
                  {telegramConfig?.status === "online" ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-500" />
                      Disconnected
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Chats</p>
                <p className="font-medium">{telegramChats.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Messages Sent</p>
                <p className="font-medium">{telegramStats?.messagesSent || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Commands</p>
                <p className="font-medium">{telegramStats?.commandsExecuted || 0}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setTelegramConfigOpen(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testTelegramMutation.mutate()}
                disabled={!telegramConfig?.enabled || testTelegramMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 ${testTelegramMutation.isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Channels/Servers/Chats */}
      <Tabs defaultValue="slack" className="space-y-4">
        <TabsList>
          <TabsTrigger value="slack" className="flex items-center gap-2">
            <SlackIcon />
            Slack Channels
          </TabsTrigger>
          <TabsTrigger value="discord" className="flex items-center gap-2">
            <DiscordIcon />
            Discord Servers
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center gap-2">
            <TelegramIcon />
            Telegram Chats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slack">
          <Card>
            <CardHeader>
              <CardTitle>Connected Slack Channels</CardTitle>
              <CardDescription>Channels where the bot can send notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {slackChannels.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No Slack channels connected. Configure your Slack bot to get started.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Notifications</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slackChannels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            {channel.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{channel.isPrivate ? "Private" : "Public"}</Badge>
                        </TableCell>
                        <TableCell>{channel.memberCount}</TableCell>
                        <TableCell>
                          <Switch checked={false} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discord">
          <Card>
            <CardHeader>
              <CardTitle>Connected Discord Servers</CardTitle>
              <CardDescription>Servers where the bot has been added</CardDescription>
            </CardHeader>
            <CardContent>
              {discordGuilds.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No Discord servers connected. Add your bot to servers to get started.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Server</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Notifications</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discordGuilds.map((guild) => (
                      <TableRow key={guild.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {guild.name}
                          </div>
                        </TableCell>
                        <TableCell>{guild.memberCount}</TableCell>
                        <TableCell>{guild.memberCount}</TableCell>
                        <TableCell>
                          <Switch checked={false} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <CardTitle>Connected Telegram Chats</CardTitle>
              <CardDescription>Chats where the bot can send messages</CardDescription>
            </CardHeader>
            <CardContent>
              {telegramChats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No Telegram chats connected. Start a chat with your bot to get started.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chat</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Notifications</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {telegramChats.map((chat) => (
                      <TableRow key={chat.chatId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            {chat.name || chat.username}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{chat.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch checked={false} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

<Dialog open={slackConfigOpen} onOpenChange={setSlackConfigOpen}><DialogContent><DialogHeader><DialogTitle>Slack Configuration</DialogTitle><DialogDescription>Stored secrets are hidden. Leave secret fields blank to keep them.</DialogDescription></DialogHeader><form onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); updateSlackConfigMutation.mutate({ botToken: String(values.get("botToken") || "") || undefined, appToken: String(values.get("appToken") || "") || undefined, signingSecret: String(values.get("signingSecret") || "") || undefined }); }}><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="slack-botToken">botToken</Label><Input id="slack-botToken" name="botToken" type="password" defaultValue={""} /></div><div className="space-y-2"><Label htmlFor="slack-appToken">appToken</Label><Input id="slack-appToken" name="appToken" type="password" defaultValue={""} /></div><div className="space-y-2"><Label htmlFor="slack-signingSecret">signingSecret</Label><Input id="slack-signingSecret" name="signingSecret" type="password" defaultValue={""} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setSlackConfigOpen(false)}>Close</Button><Button type="submit" disabled={updateSlackConfigMutation.isPending}>Save</Button></DialogFooter></form></DialogContent></Dialog>

<Dialog open={discordConfigOpen} onOpenChange={setDiscordConfigOpen}><DialogContent><DialogHeader><DialogTitle>Discord Configuration</DialogTitle><DialogDescription>Stored secrets are hidden. Leave secret fields blank to keep them.</DialogDescription></DialogHeader><form onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); updateDiscordConfigMutation.mutate({ botToken: String(values.get("botToken") || "") || undefined, applicationId: String(values.get("applicationId") || "") || undefined, publicKey: String(values.get("publicKey") || "") || undefined }); }}><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="discord-botToken">botToken</Label><Input id="discord-botToken" name="botToken" type="password" defaultValue={""} /></div><div className="space-y-2"><Label htmlFor="discord-applicationId">applicationId</Label><Input id="discord-applicationId" name="applicationId" type="text" defaultValue={discordConfig?.applicationId || ""} /></div><div className="space-y-2"><Label htmlFor="discord-publicKey">publicKey</Label><Input id="discord-publicKey" name="publicKey" type="password" defaultValue={""} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDiscordConfigOpen(false)}>Close</Button><Button type="submit" disabled={updateDiscordConfigMutation.isPending}>Save</Button></DialogFooter></form></DialogContent></Dialog>

<Dialog open={telegramConfigOpen} onOpenChange={setTelegramConfigOpen}><DialogContent><DialogHeader><DialogTitle>Telegram Configuration</DialogTitle><DialogDescription>Stored secrets are hidden. Leave secret fields blank to keep them.</DialogDescription></DialogHeader><form onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); updateTelegramConfigMutation.mutate({ botToken: String(values.get("botToken") || "") || undefined, webhookUrl: String(values.get("webhookUrl") || "") || undefined }); }}><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="telegram-botToken">botToken</Label><Input id="telegram-botToken" name="botToken" type="password" defaultValue={""} /></div><div className="space-y-2"><Label htmlFor="telegram-webhookUrl">webhookUrl</Label><Input id="telegram-webhookUrl" name="webhookUrl" type="text" defaultValue={telegramConfig?.webhookUrl || ""} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setTelegramConfigOpen(false)}>Close</Button><Button type="submit" disabled={updateTelegramConfigMutation.isPending}>Save</Button></DialogFooter></form></DialogContent></Dialog>


    </div>
  );
}
