"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  Plug,
  ScrollText,
  GitBranch,
  Terminal,
  BarChart3,
  Settings,
  Workflow,
  Zap,
  BookOpen,
  Link2,
  Kanban,
  GitMerge,
  Bell,
  AlertTriangle,
  FolderSync,
  Download,
  Webhook,
  MessageSquare,
  PenTool,
  Users,
  Server,
  Mail,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sessions", href: "/sessions", icon: Bot },
  { name: "MCP Servers", href: "/mcp", icon: Plug },
  { name: "Rules", href: "/rules", icon: ScrollText },
  { name: "Git", href: "/git", icon: GitBranch },
  { name: "Terminal", href: "/terminal", icon: Terminal },
  { name: "Usage", href: "/usage", icon: BarChart3 },
];

const orchestrationNavigation = [
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Workflow Builder", href: "/workflow-builder", icon: PenTool },
  { name: "Supervisors", href: "/supervisors", icon: Users },
  { name: "Automation", href: "/automation", icon: Zap },
  { name: "Chains", href: "/chains", icon: GitMerge },
];

const managementNavigation = [
  { name: "Task Boards", href: "/tasks", icon: Kanban },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "File Sync", href: "/file-sync", icon: FolderSync },
];

const notificationsNavigation = [
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Email", href: "/email", icon: Mail },
];

const integrationsNavigation = [
  { name: "Integrations", href: "/integrations", icon: Link2 },
  { name: "n8n", href: "/n8n", icon: Webhook },
  { name: "Bots", href: "/bots", icon: MessageSquare },
];

const infrastructureNavigation = [
  { name: "MCP Hosts", href: "/mcp-hosts", icon: Server },
  { name: "Auto Update", href: "/auto-update", icon: Download },
];

const settingsNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const renderNavSection = (items: typeof navigation, title?: string) => (
    <>
      {title && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="flex flex-col w-64 border-r bg-card">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Cluadestrate</h1>
            <p className="text-xs text-muted-foreground">Command Your AI Fleet</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main Navigation */}
        {renderNavSection(navigation)}

        {/* Orchestration */}
        <div className="mt-6">
          {renderNavSection(orchestrationNavigation, "Orchestration")}
        </div>

        {/* Management */}
        <div className="mt-6">
          {renderNavSection(managementNavigation, "Management")}
        </div>

        {/* Notifications & Alerts */}
        <div className="mt-6">
          {renderNavSection(notificationsNavigation, "Notifications")}
        </div>

        {/* Integrations */}
        <div className="mt-6">
          {renderNavSection(integrationsNavigation, "Integrations")}
        </div>

        {/* Infrastructure */}
        <div className="mt-6">
          {renderNavSection(infrastructureNavigation, "Infrastructure")}
        </div>

        {/* Settings */}
        <div className="mt-6">
          {renderNavSection(settingsNavigation)}
        </div>
      </ScrollArea>

      {/* Status */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Backend Connected</span>
        </div>
      </div>
    </div>
  );
}
