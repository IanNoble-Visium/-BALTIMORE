import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  Zap,
  Network,
  TrendingUp,
  MapPin,
  LogOut,
  Menu,
  Database,
  Brain,
  BarChart3,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapboxMap } from "@/components/Map";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  Area,
  AreaChart,
  RadialBar,
  RadialBarChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  Scatter,
  ScatterChart,
  ZAxis,
  ComposedChart,
} from "recharts";
import { toast as sonnerToast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function AnimatedNumber({
  value,
  duration = 800,
  prefix = "",
  suffix = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const start = performance.now();

    let frame: number;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * Main Dashboard for Baltimore Smart City
 * Features KPI cards, maps, analytics charts, AI assistant, and real-time monitoring
 */
export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect to landing if authenticated is required via OAuth
  useEffect(() => {
    const hasOAuthConfig = Boolean(
      import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID,
    );

    if (hasOAuthConfig && !user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Fetch dashboard data with light polling for "real-time" feel
  const { data: kpis, isLoading: kpisLoading } = trpc.kpis.getLatest.useQuery(undefined, {
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });
  const { data: deviceStats, isLoading: deviceStatsLoading } =
    trpc.devices.getStatistics.useQuery(undefined, {
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
    });
  const { data: alertStats, isLoading: alertsLoading } =
    trpc.alerts.getStatistics.useQuery(undefined, {
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
    });
  const { data: devices, isLoading: devicesLoading } = trpc.devices.getAll.useQuery(undefined, {
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });
  const { data: activeAlerts, isLoading: activeAlertsLoading } =
    trpc.alerts.getActive.useQuery(undefined, {
      refetchInterval: 10000,
      refetchIntervalInBackground: true,
    });
  const { data: baltimoreData, isLoading: baltimoreLoading } =
    trpc.baltimore.getRecent.useQuery(
      {
        limit: 10,
      },
      {
        refetchInterval: 60000,
        refetchIntervalInBackground: true,
      },
    );
  const { data: kpiHistory } = trpc.kpis.getHistory.useQuery(
    { limit: 24 },
    {
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
    },
  );
  const { data: alertHistory } = trpc.alerts.getAll.useQuery(undefined, {
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Client-side derived KPI metrics (to match map/device list exactly)
  const totalDevices = devices?.length ?? 0;
  const onlineDevices = useMemo(
    () =>
      (devices ?? []).filter(
        d => (d.nodeStatus ?? "").toString().toUpperCase() === "ONLINE",
      ).length,
    [devices],
  );
  const offlineDevices = useMemo(
    () =>
      (devices ?? []).filter(
        d => (d.nodeStatus ?? "").toString().toUpperCase() !== "ONLINE",
      ).length,
    [devices],
  );
  const activeAlertCount = activeAlerts?.length ?? 0;

  // AI assistant state
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "You are an AI assistant embedded in the Baltimore Smart City TruContext dashboard. You help city stakeholders interpret KPIs, alerts, Ubicell device data, and network health in clear, non-technical language.",
    },
  ]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: response => {
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: response.content,
        },
      ]);
    },
    onError: error => {
      console.error("[AI Chat] Error:", error);
      sonnerToast.error("AI assistant error", {
        description: error.message ?? "Something went wrong. Please try again.",
      });
    },
  });

  const handleChatSend = (content: string) => {
    if (chatMutation.isPending) return;
    const newMessages: Message[] = [...chatMessages, { role: "user", content }];
    setChatMessages(newMessages);
    chatMutation.mutate({ messages: newMessages });
  };

  const speakText = trpc.ai.speakText.useMutation();
  const [chatSpeechCache, setChatSpeechCache] = useState<{
    lastAssistantText: string | null;
    audioUrl: string | null;
  }>({ lastAssistantText: null, audioUrl: null });
  const [kpiBriefingAudioUrl, setKpiBriefingAudioUrl] = useState<string | null>(null);
  const [alertBriefingAudioUrl, setAlertBriefingAudioUrl] = useState<string | null>(null);

  const playAudioUrl = (url: string | null, logLabel: string) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(err => {
      console.warn(`[Dashboard] Failed to play ${logLabel} audio`, err);
    });
  };

  const getMaxSeverityFromStats = () => {
    if (!alertStats?.bySeverity || alertStats.bySeverity.length === 0) return null;
    const order: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return alertStats.bySeverity
      .slice()
      .sort((a, b) => (order[b.severity] || 0) - (order[a.severity] || 0))[0]?.severity;
  };

  const toneForSeverity = (severity: string | null | undefined) => {
    if (!severity) return "Calm, executive status summary:";
    const s = severity.toLowerCase();
    if (s === "critical" || s === "high") {
      return "Urgent, high-priority operations alert:";
    }
    if (s === "medium") {
      return "Clear, time-sensitive operations update:";
    }
    return "Calm, informational status update:";
  };

  const handlePlayKpiBriefing = async () => {
    if (!deviceStats || !alertStats || !kpis) return;

    if (kpiBriefingAudioUrl) {
      playAudioUrl(kpiBriefingAudioUrl, "KPI briefing (cached)");
      return;
    }

    const onlinePct = deviceStats.total
      ? Math.round((deviceStats.online / deviceStats.total) * 100)
      : 0;
    const severity = getMaxSeverityFromStats();
    const tone = toneForSeverity(severity);

    const text = `Baltimore Smart City Command Center status update. There are ${deviceStats.total} devices, with ${deviceStats.online} online, ` +
      `${deviceStats.offline} offline, and ${alertStats.active} active alerts. ` +
      `Overall system health score is ${kpis.deviceHealthScore ?? 0} percent.`;

    try {
      const result = await speakText.mutateAsync({ text, tone });
      const url = `data:audio/mp3;base64,${result.audioBase64}`;
      setKpiBriefingAudioUrl(url);
      playAudioUrl(url, "KPI briefing");
    } catch (err) {
      console.warn("[Dashboard] speakText KPI briefing failed", err);
    }
  };

  const handlePlayAlertBriefing = async () => {
    if (!activeAlerts || activeAlerts.length === 0) return;

    if (alertBriefingAudioUrl) {
      playAudioUrl(alertBriefingAudioUrl, "alert briefing (cached)");
      return;
    }

    const order: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const mostSevere = activeAlerts
      .slice()
      .sort((a, b) => (order[b.severity] || 0) - (order[a.severity] || 0))[0];

    const tone = toneForSeverity(mostSevere?.severity);
    const text = mostSevere
      ? `Baltimore Smart City Command Center ${mostSevere.severity} alert. ${mostSevere.alertType} at device ${mostSevere.deviceId}, ` +
        `reported at ${new Date(mostSevere.timestamp).toLocaleString()}.`
      : "Baltimore Smart City Command Center update. There are no active alerts.";

    try {
      const result = await speakText.mutateAsync({ text, tone });
      const url = `data:audio/mp3;base64,${result.audioBase64}`;
      setAlertBriefingAudioUrl(url);
      playAudioUrl(url, "alert briefing");
    } catch (err) {
      console.warn("[Dashboard] speakText alert briefing failed", err);
    }
  };

  const handlePlayLastAssistantMessage = async () => {
    const lastAssistant = [...chatMessages]
      .reverse()
      .find(m => m.role === "assistant");
    if (!lastAssistant) return;

    if (chatSpeechCache.lastAssistantText === lastAssistant.content && chatSpeechCache.audioUrl) {
      playAudioUrl(chatSpeechCache.audioUrl, "AI assistant (cached)");
      return;
    }

    const tone = "Calm, helpful explanation for city operations staff:";

    try {
      const result = await speakText.mutateAsync({ text: lastAssistant.content, tone });
      const url = `data:audio/mp3;base64,${result.audioBase64}`;
      setChatSpeechCache({ lastAssistantText: lastAssistant.content, audioUrl: url });
      playAudioUrl(url, "AI assistant");
    } catch (err) {
      console.warn("[Dashboard] speakText last assistant message failed", err);
    }
  };

  // Derived analytics data for charts
  const incidentTimeline = useMemo(() => {
    if (!alertHistory) return [] as { date: string; count: number }[];

    const buckets = new Map<string, number>();

    for (const alert of alertHistory) {
      const ts = alert.timestamp ? new Date(alert.timestamp) : null;
      if (!ts) continue;
      const key = ts.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .map(([date, count]) => ({ date, count }))
      .slice(-14);
  }, [alertHistory]);

  const alertTypeDistribution = useMemo(() => {
    if (!alertStats?.byType) return [] as { type: string; count: number }[];
    return alertStats.byType.map(row => ({
      type: row.alertType || "Unknown",
      count: Number(row.count) || 0,
    }));
  }, [alertStats]);

  const severityDistribution = useMemo(() => {
    if (!alertStats?.bySeverity) return [] as { severity: string; count: number }[];
    return alertStats.bySeverity.map(row => ({
      severity: row.severity,
      count: Number(row.count) || 0,
    }));
  }, [alertStats]);

  const resolutionTrend = useMemo(() => {
    if (!kpiHistory) return [] as { label: string; hours: number }[];
    return kpiHistory
      .slice()
      .reverse()
      .map(entry => ({
        label: entry.timestamp
          ? new Date(entry.timestamp).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })
          : "",
        hours: entry.avgResolutionTime ?? 0,
      }));
  }, [kpiHistory]);

  // Additional derived datasets for advanced visual charts
  const severityRadialData = useMemo(
    () =>
      severityDistribution.map(row => ({
        severity: row.severity,
        count: row.count,
        fill: `var(--color-${row.severity.toLowerCase()})`,
      })),
    [severityDistribution],
  );

  const alertTreemapData = useMemo(
    () =>
      alertTypeDistribution.map(row => ({
        name: row.type,
        size: row.count,
      })),
    [alertTypeDistribution],
  );

  const radarSeverityData = useMemo(
    () =>
      severityDistribution.map(row => ({
        severity: row.severity,
        count: row.count,
      })),
    [severityDistribution],
  );

  const scatterTimelineData = useMemo(
    () =>
      incidentTimeline.map((row, index) => ({
        index,
        date: row.date,
        count: row.count,
      })),
    [incidentTimeline],
  );

  // Composed chart data: alerts vs resolution time
  const composedTimelineData = useMemo(() => {
    if (!incidentTimeline.length || !resolutionTrend.length) return [];
    // Match by index since they're both time-series
    const maxLen = Math.max(incidentTimeline.length, resolutionTrend.length);
    return Array.from({ length: maxLen }, (_, i) => ({
      date: incidentTimeline[i]?.date || resolutionTrend[i]?.label || "",
      alerts: incidentTimeline[i]?.count || 0,
      resolution: resolutionTrend[i]?.hours || 0,
    }));
  }, [incidentTimeline, resolutionTrend]);

  // Device status distribution for pie chart
  const deviceStatusDistribution = useMemo(() => {
    if (!devices) return [] as { status: string; count: number }[];
    const statusCounts = new Map<string, number>();
    devices.forEach(device => {
      const status = (device.nodeStatus ?? "Unknown").toString().toUpperCase();
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });
    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }, [devices]);

  // Network coverage & capacity data for nested radial bars
  const networkCoverageData = useMemo(() => {
    if (!devices) return [] as { network: string; total: number; online: number }[];
    const networkMap = new Map<string, { total: number; online: number }>();
    devices.forEach(device => {
      const network = (device.networkType ?? "Unknown").toString();
      const status = (device.nodeStatus ?? "").toString().toUpperCase();
      const existing = networkMap.get(network) || { total: 0, online: 0 };
      existing.total += 1;
      if (status === "ONLINE") existing.online += 1;
      networkMap.set(network, existing);
    });
    return Array.from(networkMap.entries()).map(([network, stats]) => ({
      network,
      total: stats.total,
      online: stats.online,
      offline: stats.total - stats.online,
    }));
  }, [devices]);

  // Alert resolution pipeline for funnel chart
  const alertFunnelData = useMemo(() => {
    if (!alertHistory) return [] as { stage: string; count: number }[];
    const stageCounts = new Map<string, number>();
    alertHistory.forEach(alert => {
      const status = (alert.status ?? "active").toString().toLowerCase();
      let stage = "Active";
      if (status === "acknowledged") stage = "Acknowledged";
      else if (status === "resolved") stage = "Resolved";
      else if (status === "closed") stage = "Closed";
      stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
    });
    // Order: Active -> Acknowledged -> Resolved -> Closed
    const order = ["Active", "Acknowledged", "Resolved", "Closed"];
    return order
      .map(stage => ({
        stage,
        count: stageCounts.get(stage) || 0,
      }))
      .filter(item => item.count > 0);
  }, [alertHistory]);

  const BALTIMORE_COLORS = {
    primary: "#FFC72C",
    accentBlue: "#3b82f6",
    accentGreen: "#10b981",
    accentOrange: "#f59e0b",
    accentRed: "#ef4444",
  } as const;

  const incidentChartConfig: ChartConfig = {
    incidents: {
      label: "Alerts",
      color: BALTIMORE_COLORS.primary,
    },
  };

  const typeChartConfig: ChartConfig = {
    power: {
      label: "Power Loss",
      color: BALTIMORE_COLORS.accentOrange,
    },
    tilt: {
      label: "Sudden Tilt",
      color: BALTIMORE_COLORS.accentBlue,
    },
    voltage: {
      label: "Low Voltage",
      color: BALTIMORE_COLORS.accentGreen,
    },
    other: {
      label: "Other",
      color: BALTIMORE_COLORS.accentRed,
    },
  };

  const severityChartConfig: ChartConfig = {
    low: {
      label: "Low",
      color: BALTIMORE_COLORS.accentGreen,
    },
    medium: {
      label: "Medium",
      color: BALTIMORE_COLORS.primary,
    },
    high: {
      label: "High",
      color: BALTIMORE_COLORS.accentOrange,
    },
    critical: {
      label: "Critical",
      color: BALTIMORE_COLORS.accentRed,
    },
  };

  const resolutionChartConfig: ChartConfig = {
    resolution: {
      label: "Avg Resolution Time (hrs)",
      color: BALTIMORE_COLORS.accentBlue,
    },
  };

  const composedChartConfig: ChartConfig = {
    alerts: {
      label: "Alert Volume",
      color: BALTIMORE_COLORS.accentOrange,
    },
    resolution: {
      label: "Avg Resolution (hrs)",
      color: BALTIMORE_COLORS.accentBlue,
    },
  };

  const deviceStatusChartConfig: ChartConfig = {
    ONLINE: {
      label: "Online",
      color: BALTIMORE_COLORS.accentGreen,
    },
    OFFLINE: {
      label: "Offline",
      color: BALTIMORE_COLORS.accentRed,
    },
    "POWER LOSS": {
      label: "Power Loss",
      color: BALTIMORE_COLORS.accentOrange,
    },
    Unknown: {
      label: "Unknown",
      color: "#6b7280",
    },
  };

  const networkChartConfig: ChartConfig = {
    LTE: {
      label: "LTE",
      color: BALTIMORE_COLORS.accentBlue,
    },
    "LTE-M": {
      label: "LTE-M",
      color: BALTIMORE_COLORS.accentGreen,
    },
    Unknown: {
      label: "Unknown",
      color: "#6b7280",
    },
  };

  const funnelChartConfig: ChartConfig = {
    Active: {
      label: "Active",
      color: BALTIMORE_COLORS.accentRed,
    },
    Acknowledged: {
      label: "Acknowledged",
      color: BALTIMORE_COLORS.accentOrange,
    },
    Resolved: {
      label: "Resolved",
      color: BALTIMORE_COLORS.accentGreen,
    },
    Closed: {
      label: "Closed",
      color: BALTIMORE_COLORS.accentBlue,
    },
  };

  // Seed data if needed (for demo purposes)
  const seedDataMutation = trpc.admin.seedData.useMutation({
    onSuccess: data => {
      console.log("[Dashboard] Seed data mutation succeeded:", data);
    },
    onError: error => {
      console.error("[Dashboard] Seed data mutation failed:", error);
    },
  });
  
  const handleSeedData = async () => {
    console.log("[Dashboard] Seed Database button clicked", {
      user,
      isPending: seedDataMutation.isPending,
    });

    try {
      const result = await seedDataMutation.mutateAsync();
      console.log("[Dashboard] seedDataMutation.mutateAsync() resolved:", result);
      // Intentionally not reloading the page so we can inspect logs and state after seeding.
      // window.location.reload();
    } catch (error) {
      console.error("[Dashboard] Error seeding data in handleSeedData:", error);
    }
  };

  // Map drill-down state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);

  // Analytics chart drill-down state
  const [analyticsDrilldown, setAnalyticsDrilldown] = useState<{
    title: string;
    type: "devices" | "alerts";
    rows: any[];
  } | null>(null);

  // Handler functions for chart drill-down
  const handleSeverityDrilldown = (severity: string) => {
    if (!alertHistory) return;
    const filtered = alertHistory.filter(
      a => a.severity?.toLowerCase() === severity.toLowerCase(),
    );
    setAnalyticsDrilldown({
      title: `${severity.toUpperCase()} Severity Alerts`,
      type: "alerts",
      rows: filtered,
    });
  };

  const handleTypeDrilldown = (alertType: string) => {
    if (!alertHistory) return;
    const filtered = alertHistory.filter(
      a => (a.alertType ?? "").toLowerCase() === alertType.toLowerCase(),
    );
    setAnalyticsDrilldown({
      title: `${alertType} Alerts`,
      type: "alerts",
      rows: filtered,
    });
  };

  const handleStatusDrilldown = (status: string) => {
    if (!devices) return;
    const filtered = devices.filter(
      d => (d.nodeStatus ?? "").toString().toUpperCase() === status.toUpperCase(),
    );
    setAnalyticsDrilldown({
      title: `${status} Devices`,
      type: "devices",
      rows: filtered,
    });
  };

  const handleNetworkDrilldown = (network: string) => {
    if (!devices) return;
    const filtered = devices.filter(
      d => (d.networkType ?? "").toString() === network,
    );
    setAnalyticsDrilldown({
      title: `${network} Network Devices`,
      type: "devices",
      rows: filtered,
    });
  };

  const handleFunnelDrilldown = (stage: string) => {
    if (!alertHistory) return;
    const statusMap: Record<string, string> = {
      Active: "active",
      Acknowledged: "acknowledged",
      Resolved: "resolved",
      Closed: "closed",
    };
    const status = statusMap[stage] || stage.toLowerCase();
    const filtered = alertHistory.filter(
      a => (a.status ?? "active").toString().toLowerCase() === status,
    );
    setAnalyticsDrilldown({
      title: `${stage} Alerts`,
      type: "alerts",
      rows: filtered,
    });
  };

  const selectedDevice = useMemo(
    () => devices?.find(d => d.deviceId === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );

  const deviceAlerts = trpc.alerts.getByDevice.useQuery(
    { deviceId: selectedDeviceId ?? "" },
    {
      enabled: Boolean(selectedDeviceId && deviceDialogOpen),
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
    },
  );

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isDataEmpty = !devices || devices.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Baltimore Smart City</h1>
                <p className="text-xs text-muted-foreground">Command Center</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name || "Admin User"}</p>
              <p className="text-xs text-muted-foreground">
                {user?.email || "admin@visium.com"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-4 space-y-4">
        <Breadcrumb className="mb-2 hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Command Center</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Data Seeding Alert */}
        {isDataEmpty && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">No Data Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The database appears to be empty. Click the button below to seed the
                    database with mock Baltimore Smart City data.
                  </p>
                  <Button onClick={handleSeedData} disabled={seedDataMutation.isPending}>
                    {seedDataMutation.isPending ? "Seeding Data..." : "Seed Database"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <div className="text-xs text-muted-foreground">
            System KPIs for Baltimore. Use the speaker icon for a narrated status update.
          </div>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full border-primary/60 text-primary"
                  disabled={speakText.isPending || !deviceStats || !alertStats || !kpis}
                  onClick={handlePlayKpiBriefing}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                <span className="text-xs">Play status briefing</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Devices */}
          <Card className="group glass-gold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,199,44,0.4)] hover:border-primary/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Network className="h-4 w-4 text-primary group-hover:scale-110 group-hover:text-primary/90 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold origin-bottom-left transition-transform duration-300 group-hover:scale-110">
                {devicesLoading ? (
                  <div className="h-9 w-20 shimmer rounded" />
                ) : (
                  <AnimatedNumber value={totalDevices} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Smart infrastructure nodes
              </p>
            </CardContent>
          </Card>

          {/* Online Devices */}
          <Card className="group glass transition-all duration-300 hover:-translate-y-1 hover:border-chart-1/80 hover:shadow-[0_0_24px_rgba(52,211,153,0.45)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <Activity className="h-4 w-4 text-chart-1 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-1 origin-bottom-left transition-transform duration-300 group-hover:scale-110">
                {devicesLoading ? (
                  <div className="h-9 w-20 shimmer rounded" />
                ) : (
                  <AnimatedNumber value={onlineDevices} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalDevices
                  ? `${Math.round((onlineDevices / totalDevices) * 100)}% operational`
                  : "0% operational"}
              </p>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className="group glass transition-all duration-300 hover:-translate-y-1 hover:border-chart-3/80 hover:shadow-[0_0_24px_rgba(248,113,113,0.45)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-chart-3 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3 origin-bottom-left transition-transform duration-300 group-hover:scale-110">
                {activeAlertsLoading ? (
                  <div className="h-9 w-20 shimmer rounded" />
                ) : (
                  <AnimatedNumber value={activeAlertCount} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
            </CardContent>
          </Card>

          {/* Device Health Score */}
          <Card className="glass transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {kpisLoading ? (
                  <div className="h-9 w-20 shimmer rounded" />
                ) : (
                  <AnimatedNumber
                    value={kpis?.deviceHealthScore || 0}
                    suffix="%"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Overall system health</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Overview */}
        <Card className="mt-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Baltimore Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {/* Incident Timeline */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Alert Volume (Last 2 Weeks)
                </p>
                {incidentTimeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Alert history will appear here as incidents are generated.
                  </p>
                ) : (
                  <ChartContainer
                    config={incidentChartConfig}
                    className="h-44 rounded-lg border border-primary/40 bg-[#111111] shadow-lg/40"
                  >
                    <LineChart
                      data={incidentTimeline}
                      margin={{ left: 4, right: 4, top: 12, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={12}
                      />
                      <YAxis tickLine={false} axisLine={false} width={36} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={BALTIMORE_COLORS.primary}
                        strokeWidth={3}
                        dot={false}
                        name="incidents"
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </div>

              {/* Severity Radial Mix */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Severity Radial Mix
                </p>
                {severityRadialData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Severity distribution will appear here once alerts exist.
                  </p>
                ) : (
                  <ChartContainer
                    config={severityChartConfig}
                    className="h-44 rounded-lg border border-primary/40 bg-[#111111] shadow-lg/40"
                  >
                    <RadialBarChart
                      data={severityRadialData}
                      innerRadius="30%"
                      outerRadius="90%"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="count"
                        background
                        cornerRadius={6}
                        onClick={(data) => handleSeverityDrilldown(data.severity)}
                        style={{ cursor: "pointer" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadialBarChart>
                  </ChartContainer>
                )}
              </div>

              {/* Alert Type Treemap */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Alert Type Treemap
                </p>
                {alertTreemapData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Alert type treemap will appear as alerts accumulate.
                  </p>
                ) : (
                  <ChartContainer
                    config={typeChartConfig}
                    className="h-44 rounded-lg border border-primary/40 bg-[#111111] shadow-lg/40"
                  >
                    <Treemap
                      data={alertTreemapData}
                      dataKey="size"
                      nameKey="name"
                      stroke="#020617"
                      content={({ x, y, width, height, payload }) => {
                        if (!payload) return null;
                        const name = payload.name || "Unknown";
                        // Map alert types to colors from typeChartConfig
                        const colorMap: Record<string, string> = {
                          "Power Loss": BALTIMORE_COLORS.accentOrange,
                          "Sudden Tilt": BALTIMORE_COLORS.accentBlue,
                          "Low Voltage": BALTIMORE_COLORS.accentGreen,
                        };
                        const fillColor = colorMap[name] || BALTIMORE_COLORS.accentRed;
                        return (
                          <g>
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill={fillColor}
                              stroke="#020617"
                              style={{ cursor: "pointer" }}
                              onClick={() => handleTypeDrilldown(name)}
                            />
                            {width > 50 && height > 30 && (
                              <text
                                x={x + width / 2}
                                y={y + height / 2}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize={12}
                                fontWeight="medium"
                              >
                                {name}
                              </text>
                            )}
                          </g>
                        );
                      }}
                    />
                  </ChartContainer>
                )}
              </div>

              {/* Severity Radar Profile */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Severity Radar Profile
                </p>
                {radarSeverityData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Radar profile will appear here once alerts exist.
                  </p>
                ) : (
                  <ChartContainer
                    config={severityChartConfig}
                    className="h-44 rounded-lg border border-primary/40 bg-[#111111] shadow-lg/40"
                  >
                    <RadarChart data={radarSeverityData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="severity" />
                      <PolarRadiusAxis />
                      <Radar
                        dataKey="count"
                        stroke={BALTIMORE_COLORS.primary}
                        fill={BALTIMORE_COLORS.primary}
                        fillOpacity={0.5}
                        onClick={(data) => handleSeverityDrilldown(data.severity)}
                        style={{ cursor: "pointer" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadarChart>
                  </ChartContainer>
                )}
              </div>

              {/* Alert Volume Scatter */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Alert Volume Scatter
                </p>
                {scatterTimelineData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Alert scatter will appear here as incidents are generated.
                  </p>
                ) : (
                  <ChartContainer
                    config={incidentChartConfig}
                    className="h-44 rounded-lg border border-primary/40 bg-[#111111] shadow-lg/40"
                  >
                    <ScatterChart margin={{ left: 4, right: 4, top: 12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis
                        dataKey="index"
                        name="Day"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        dataKey="count"
                        name="Alerts"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ZAxis range={[60, 160]} dataKey="count" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Scatter
                        name="Alerts"
                        data={scatterTimelineData}
                        fill={BALTIMORE_COLORS.accentBlue}
                      />
                    </ScatterChart>
                  </ChartContainer>
                )}
              </div>

              {/* Device Status Distribution (Pie) */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Device Status Distribution
                </p>
                {deviceStatusDistribution.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Device status distribution will appear here once devices are loaded.
                  </p>
                ) : (
                  <ChartContainer
                    config={deviceStatusChartConfig}
                    className="h-44 rounded-lg border border-primary/40 bg-[#111111] shadow-lg/40"
                  >
                    <PieChart>
                      <Pie
                        data={deviceStatusDistribution}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ status, count }) => `${status}: ${count}`}
                        onClick={(data) => handleStatusDrilldown(data.status)}
                        style={{ cursor: "pointer" }}
                      >
                        {deviceStatusDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`var(--color-${entry.status})`}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </div>

              {/* Network Coverage & Capacity (Nested RadialBar) */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Network Coverage & Capacity
                </p>
                {networkCoverageData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Network coverage data will appear here once devices are loaded.
                  </p>
                ) : (
                  <ChartContainer
                    config={networkChartConfig}
                    className="h-44 rounded-lg border border-primary/40 bg-[#111111] shadow-lg/40"
                  >
                    <RadialBarChart
                      data={networkCoverageData}
                      innerRadius="20%"
                      outerRadius="90%"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="total"
                        background
                        cornerRadius={6}
                        onClick={(data) => handleNetworkDrilldown(data.network)}
                        style={{ cursor: "pointer" }}
                      />
                      <RadialBar
                        dataKey="online"
                        cornerRadius={6}
                        onClick={(data) => handleNetworkDrilldown(data.network)}
                        style={{ cursor: "pointer" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadialBarChart>
                  </ChartContainer>
                )}
              </div>

              {/* Alerts vs Resolution (Composed) */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Alerts vs Resolution
                </p>
                {composedTimelineData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Combined alert and resolution trend will appear as data accumulates.
                  </p>
                ) : (
                  <ChartContainer
                    config={composedChartConfig}
                    className="h-44 rounded-lg border border-primary/40 bg-[#111111] shadow-lg/40"
                  >
                    <ComposedChart
                      data={composedTimelineData}
                      margin={{ left: 4, right: 4, top: 12, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={12}
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        yAxisId="left"
                        dataKey="alerts"
                        barSize={16}
                        radius={4}
                        fill={BALTIMORE_COLORS.accentOrange}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="resolution"
                        stroke={BALTIMORE_COLORS.accentBlue}
                        strokeWidth={3}
                        dot={false}
                      />
                    </ComposedChart>
                  </ChartContainer>
                )}
              </div>

              {/* Alert Resolution Pipeline (Funnel) */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Alert Resolution Pipeline
                </p>
                {alertFunnelData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Alert resolution pipeline will appear here as alerts are processed.
                  </p>
                ) : (
                  <ChartContainer
                    config={funnelChartConfig}
                    className="h-44 rounded-lg border border-primary/40 bg-[#111111] shadow-lg/40"
                  >
                    <BarChart
                      data={alertFunnelData}
                      layout="vertical"
                      margin={{ left: 60, right: 4, top: 12, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        tickLine={false}
                        axisLine={false}
                        width={55}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="count"
                        radius={[0, 8, 8, 0]}
                        onClick={(data) => handleFunnelDrilldown(data.stage)}
                        style={{ cursor: "pointer" }}
                      >
                        {alertFunnelData.map((entry, index) => (
                          <Cell
                            key={`funnel-${index}`}
                            fill={`var(--color-${entry.stage})`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {/* Map Section */}
          <Card className="lg:col-span-2 xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Baltimore Device Map
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <MapboxMap
                className="mt-0"
                devices={devices ?? []}
                onDeviceClick={id => {
                  setSelectedDeviceId(id);
                  setDeviceDialogOpen(true);
                }}
              />
              {(!devices || devices.length === 0) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Seed the database to see Ubicell devices plotted on the 3D Baltimore map.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card className="xl:row-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-chart-3" />
                  Recent Alerts
                </CardTitle>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full border-chart-3/60 text-chart-3"
                        disabled={speakText.isPending || !activeAlerts || activeAlerts.length === 0}
                        onClick={handlePlayAlertBriefing}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" align="center">
                      <span className="text-xs">Play most severe alert</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {activeAlerts && activeAlerts.length > 0 ? (
                  activeAlerts.slice(0, 5).map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          alert.severity === "critical"
                            ? "bg-chart-3"
                            : alert.severity === "high"
                              ? "bg-chart-2"
                              : alert.severity === "medium"
                                ? "bg-chart-4"
                                : "bg-chart-5"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.alertType}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Device: {alert.deviceId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Network Status */}
          <Card className="xl:col-start-3 xl:row-start-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Network className="h-4 w-4 text-primary" />
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">LTE Devices</span>
                    <span className="text-sm text-muted-foreground">
                      {devices?.filter(d => d.networkType === "LTE").length || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chart-1 transition-all"
                      style={{
                        width: `${
                          devices?.length
                            ? (devices.filter(d => d.networkType === "LTE").length /
                                devices.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">LTE-M Devices</span>
                    <span className="text-sm text-muted-foreground">
                      {devices?.filter(d => d.networkType === "LTE-M").length || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chart-2 transition-all"
                      style={{
                        width: `${
                          devices?.length
                            ? (devices.filter(d => d.networkType === "LTE-M").length /
                                devices.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Total Coverage</span>
                    <span className="text-primary font-bold">
                      {totalDevices
                        ? `${Math.round((onlineDevices / totalDevices) * 100)}%`
                        : "0%"}
                    </span>

                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant */}
          <Card className="xl:col-span-2 xl:row-start-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Command Assistant
                </CardTitle>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full border-primary/60 text-primary"
                        disabled={speakText.isPending || !chatMessages.some(m => m.role === "assistant")}
                        onClick={handlePlayLastAssistantMessage}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" align="center">
                      <span className="text-xs">Play last AI answer</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <AIChatBox
                messages={chatMessages}
                onSendMessage={handleChatSend}
                isLoading={chatMutation.isPending}
                height={320}
                placeholder="Ask about Baltimore devices, alerts, and KPIs..."
                emptyStateMessage="Ask a question about the Baltimore Smart City deployment."
                suggestedPrompts={[
                  "Summarize the current device health and alert status.",
                  "Where are the most critical alerts in Baltimore right now?",
                  "Explain what Ubicell devices are monitoring.",
                  "Describe opportunities to improve feeder efficiency.",
                ]}
              />
            </CardContent>
          </Card>

          {/* Baltimore Data Highlights */}
          <Card className="lg:col-span-2 xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-primary" />
                Baltimore Data Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {baltimoreLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-1/3 shimmer rounded" />
                  <div className="h-4 w-2/3 shimmer rounded" />
                  <div className="h-4 w-1/2 shimmer rounded" />
                </div>
              ) : !baltimoreData || baltimoreData.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No additional Baltimore dataset records found.
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {baltimoreData.slice(0, 10).map(row => (
                    <div
                      key={row.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border"
                    >
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {row.category || "Uncategorized"}
                          {row.subcategory ? ` · ${row.subcategory}` : ""}
                        </p>
                        {row.description && (
                          <p className="text-xs text-muted-foreground">{row.description}</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          {row.value && <span>Value: {row.value}</span>}
                          {row.latitude && row.longitude && (
                            <span>
                              Lat/Lon: {row.latitude}, {row.longitude}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground pt-2 pb-2">
          <p>Powered by Visium Technologies • World Wide Technology • Ubicquia</p>
        </div>
      </main>

      {/* Device Drill-down Dialog */}
      <Dialog
        open={deviceDialogOpen}
        onOpenChange={open => {
          setDeviceDialogOpen(open);
          if (!open) {
            setSelectedDeviceId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDevice?.nodeName || selectedDevice?.deviceId || "Device Details"}
            </DialogTitle>
            <DialogDescription>
              Real-time view of Ubicell device status, recent alerts, and location in Baltimore.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {selectedDevice ? (
              <div className="grid gap-3 md:grid-cols-3 text-xs">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Device ID</p>
                  <p className="font-mono text-foreground text-xs">{selectedDevice.deviceId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">{selectedDevice.nodeStatus || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Network</p>
                  <p>{selectedDevice.networkType || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Alert Type</p>
                  <p>{selectedDevice.alertType || "None"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Burn Hours</p>
                  <p>{selectedDevice.burnHours || "–"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Location</p>
                  <p>
                    {selectedDevice.latitude && selectedDevice.longitude
                      ? `${selectedDevice.latitude}, ${selectedDevice.longitude}`
                      : "Unknown"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select a device on the map to view details.
              </p>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Recent Alerts for this Device
              </p>
              <div className="border rounded-md bg-muted/30">
                {deviceAlerts.isLoading ? (
                  <div className="p-4 text-xs text-muted-foreground">Loading alerts…</div>
                ) : !deviceAlerts.data || deviceAlerts.data.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground">
                    No alerts found for this device.
                  </div>
                ) : (
                  <ScrollArea className="max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deviceAlerts.data.slice(0, 25).map(alert => (
                          <TableRow key={alert.id}>
                            <TableCell className="text-[11px] text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {alert.alertType}
                            </TableCell>
                            <TableCell className="text-xs capitalize">
                              {alert.severity}
                            </TableCell>
                            <TableCell className="text-xs capitalize">
                              {alert.status}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Drill-down Dialog */}
      <Dialog
        open={analyticsDrilldown !== null}
        onOpenChange={open => {
          if (!open) {
            setAnalyticsDrilldown(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{analyticsDrilldown?.title || "Analytics Details"}</DialogTitle>
            <DialogDescription>
              {analyticsDrilldown?.type === "devices"
                ? "Click 'View on Map' to see device location"
                : "Click 'View on Map' to see alert location"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {analyticsDrilldown?.rows && analyticsDrilldown.rows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {analyticsDrilldown.type === "devices" ? (
                      <>
                        <TableHead>Device ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Device ID</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsDrilldown.rows.map((row, index) => (
                    <TableRow key={index}>
                      {analyticsDrilldown.type === "devices" ? (
                        <>
                          <TableCell className="font-mono text-xs">
                            {row.deviceId || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs capitalize">
                            {row.nodeStatus || "Unknown"}
                          </TableCell>
                          <TableCell className="text-xs">{row.networkType || "N/A"}</TableCell>
                          <TableCell className="text-xs">
                            {row.latitude && row.longitude
                              ? `${row.latitude}, ${row.longitude}`
                              : "Unknown"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setLocation(`/map?deviceId=${row.deviceId}`);
                                setAnalyticsDrilldown(null);
                              }}
                            >
                              View on Map
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(row.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {row.alertType || "Unknown"}
                          </TableCell>
                          <TableCell className="text-xs capitalize">
                            {row.severity || "Unknown"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.deviceId || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setLocation(`/map?deviceId=${row.deviceId}`);
                                setAnalyticsDrilldown(null);
                              }}
                            >
                              View on Map
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No data available</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
