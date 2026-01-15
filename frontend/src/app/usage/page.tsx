"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Download, AlertTriangle, TrendingUp, DollarSign, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { usageApi } from "@/lib/api";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F", "#FFBB28"];

export default function UsagePage() {
  const { data: summary } = useQuery({
    queryKey: ["usage"],
    queryFn: usageApi.getSummary,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["usage-history"],
    queryFn: () => usageApi.getHistory(7),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["usage-alerts"],
    queryFn: usageApi.getAlerts,
  });

  const dailyLimit = 100000;
  const usagePercent = summary ? (summary.totalTokens / dailyLimit) * 100 : 0;

  // Transform session data for pie chart
  const sessionData = summary?.bySession
    ? Object.entries(summary.bySession).map(([id, data]: [string, any]) => ({
        name: id.slice(0, 8),
        tokens: data.tokens,
        cost: data.cost,
      }))
    : [];

  const handleExport = async () => {
    window.open("/api/usage/export?format=csv&days=30", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage & Analytics</h1>
          <p className="text-muted-foreground">
            Monitor token usage, costs, and resource consumption
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    alert.type === "critical"
                      ? "bg-red-500/10 border border-red-500/30"
                      : "bg-yellow-500/10 border border-yellow-500/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={alert.type === "critical" ? "destructive" : "secondary"}>
                      {alert.type}
                    </Badge>
                    <span>{alert.message}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(alert.triggeredAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Tokens Today
            </CardDescription>
            <CardTitle className="text-3xl">
              {((summary?.totalTokens || 0) / 1000).toFixed(1)}K
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={usagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {usagePercent.toFixed(1)}% of {(dailyLimit / 1000).toFixed(0)}K daily limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Cost Today
            </CardDescription>
            <CardTitle className="text-3xl">
              ${(summary?.totalCost || 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Estimated based on current pricing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              7-Day Average
            </CardDescription>
            <CardTitle className="text-3xl">
              {(
                (history.reduce((sum: number, h: any) => sum + h.tokens, 0) /
                  Math.max(history.length, 1)) /
                1000
              ).toFixed(1)}
              K
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">tokens per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle className="text-3xl">
              {Object.keys(summary?.bySession || {}).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">sessions using tokens today</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Over Time (Last 7 Days)</CardTitle>
            <CardDescription>Daily token consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", { weekday: "short" })
                    }
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${((value as number) / 1000).toFixed(1)}K tokens`,
                      "Usage",
                    ]}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <Bar dataKey="tokens" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Over Time (Last 7 Days)</CardTitle>
            <CardDescription>Daily estimated cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", { weekday: "short" })
                    }
                    className="text-xs"
                  />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} className="text-xs" />
                  <Tooltip
                    formatter={(value) => [`$${(value as number).toFixed(4)}`, "Cost"]}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ fill: "#82ca9d" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Usage by Session */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Session</CardTitle>
            <CardDescription>Token distribution across sessions today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {sessionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sessionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="tokens"
                    >
                      {sessionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `${((value as number) / 1000).toFixed(1)}K tokens`,
                        "Usage",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No session data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Session Breakdown</CardTitle>
            <CardDescription>Detailed usage per session</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionData.length > 0 ? (
              <div className="space-y-3">
                {sessionData.map((session, index) => (
                  <div
                    key={session.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-mono">{session.name}...</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {(session.tokens / 1000).toFixed(1)}K tokens
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${session.cost.toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No sessions have used tokens today
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
