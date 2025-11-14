import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
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
import { TrendingUp, AlertTriangle, Activity, Zap, Network, Volume2 } from "lucide-react";

// Baltimore color scheme
const BALTIMORE_COLORS = {
  primary: "#FFC72C", // Gold
  secondary: "#000000", // Black
  accent: "#1a1a1a",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

// Color palette for charts
const CHART_COLORS = [
  BALTIMORE_COLORS.primary,
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

/**
 * Analytics Visualizations Page
 * Features multiple chart types with animations and drill-down functionality
 */
export default function Analytics() {
  // Fetch all required data
  const { data: alerts, isLoading: alertsLoading } = trpc.alerts.getAll.useQuery(
    undefined,
    {
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
    }
  );
  const { data: devices, isLoading: devicesLoading } = trpc.devices.getAll.useQuery(
    undefined,
    {
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
    }
  );
  const { data: alertStats, isLoading: alertStatsLoading } =
    trpc.alerts.getStatistics.useQuery(undefined, {
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
    });
  const { data: deviceStats, isLoading: deviceStatsLoading } =
    trpc.devices.getStatistics.useQuery(undefined, {
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
    });

  const speakText = trpc.ai.speakText.useMutation();
  const [analyticsAudioUrl, setAnalyticsAudioUrl] = useState<string | null>(null);

  // Drill-down state
  const [drillDownData, setDrillDownData] = useState<{
    type: string;
    title: string;
    data: any[];
  } | null>(null);

  // 1. Alert Timeline (line chart)
  const alertTimeline = useMemo(() => {
    if (!alerts) return [];
    const buckets = new Map<string, number>();
    alerts.forEach((alert) => {
      if (!alert.timestamp) return;
      const date = new Date(alert.timestamp);
      const key = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return Array.from(buckets.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [alerts]);

  const alertTimelineConfig: ChartConfig = {
    count: {
      label: "Alerts",
      color: BALTIMORE_COLORS.primary,
    },
  };

  // 2. Alert Type Distribution (donut chart)
  const alertTypeDistribution = useMemo(() => {
    if (!alertStats?.byType) return [];
    return alertStats.byType.map((row) => ({
      type: row.alertType || "Unknown",
      count: Number(row.count) || 0,
    }));
  }, [alertStats]);

  const alertTypeConfig: ChartConfig = alertTypeDistribution.reduce(
    (acc, item, index) => {
      acc[item.type] = {
        label: item.type,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
      return acc;
    },
    {} as ChartConfig
  );

  // 3. Device Status chart (bar chart)
  const deviceStatusData = useMemo(() => {
    if (!devices) return [];
    const statusCounts = new Map<string, number>();
    devices.forEach((device) => {
      const status = device.nodeStatus || "Unknown";
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });
    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }, [devices]);

  const deviceStatusConfig: ChartConfig = deviceStatusData.reduce(
    (acc, item, index) => {
      let color = CHART_COLORS[index % CHART_COLORS.length];
      if (item.status === "ONLINE") color = BALTIMORE_COLORS.success;
      if (item.status === "OFFLINE") color = BALTIMORE_COLORS.danger;
      if (item.status === "POWER LOSS") color = BALTIMORE_COLORS.warning;
      acc[item.status] = {
        label: item.status,
        color,
      };
      return acc;
    },
    {} as ChartConfig
  );

  // 4. Burn Hours Distribution (histogram)
  const burnHoursData = useMemo(() => {
    if (!devices) return [];
    const burnHours = devices
      .map((d) => {
        const hours = d.burnHours ? parseFloat(d.burnHours) : null;
        return hours;
      })
      .filter((h): h is number => h !== null && !isNaN(h));

    if (burnHours.length === 0) return [];

    const min = Math.min(...burnHours);
    const max = Math.max(...burnHours);
    const bucketSize = (max - min) / 10;
    const buckets = new Map<string, number>();

    burnHours.forEach((hours) => {
      const bucket = Math.floor((hours - min) / bucketSize);
      const bucketLabel = `${Math.round(min + bucket * bucketSize)}-${Math.round(
        min + (bucket + 1) * bucketSize
      )}`;
      buckets.set(bucketLabel, (buckets.get(bucketLabel) || 0) + 1);
    });

    return Array.from(buckets.entries())
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const aStart = parseFloat(a.range.split("-")[0]);
        const bStart = parseFloat(b.range.split("-")[0]);
        return aStart - bStart;
      });
  }, [devices]);

  const burnHoursConfig: ChartConfig = {
    count: {
      label: "Devices",
      color: BALTIMORE_COLORS.primary,
    },
  };

  // 5. Network Type Performance chart (grouped bar)
  const networkTypeData = useMemo(() => {
    if (!devices) return [];
    const networkTypes = new Set<string>();
    devices.forEach((d) => {
      if (d.networkType) networkTypes.add(d.networkType);
    });

    const statuses = ["ONLINE", "OFFLINE", "POWER LOSS"];
    return Array.from(networkTypes).map((networkType) => {
      const typeDevices = devices.filter((d) => d.networkType === networkType);
      const data: Record<string, any> = { networkType };
      statuses.forEach((status) => {
        data[status] = typeDevices.filter((d) => d.nodeStatus === status).length;
      });
      return data;
    });
  }, [devices]);

  const networkTypeConfig: ChartConfig = {
    ONLINE: {
      label: "Online",
      color: BALTIMORE_COLORS.success,
    },
    OFFLINE: {
      label: "Offline",
      color: BALTIMORE_COLORS.danger,
    },
    "POWER LOSS": {
      label: "Power Loss",
      color: BALTIMORE_COLORS.warning,
    },
  };

  // Handle drill-down
  const handleChartClick = (
    type: string,
    title: string,
    data?: any,
    payload?: any
  ) => {
    let drillDownItems: any[] = [];

    switch (type) {
      case "alertTimeline":
        if (data && alerts) {
          const clickedDate = data.date;
          drillDownItems = alerts.filter((alert) => {
            if (!alert.timestamp) return false;
            const date = new Date(alert.timestamp);
            const dateStr = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return dateStr === clickedDate;
          });
        }
        break;
      case "alertType":
        if (data && alerts) {
          const clickedType = data.type;
          drillDownItems = alerts.filter(
            (alert) => alert.alertType === clickedType
          );
        }
        break;
      case "deviceStatus":
        if (data && devices) {
          const clickedStatus = data.status;
          drillDownItems = devices.filter(
            (device) => device.nodeStatus === clickedStatus
          );
        }
        break;
      case "burnHours":
        if (data && devices) {
          const clickedRange = data.range;
          const [min, max] = clickedRange.split("-").map(parseFloat);
          drillDownItems = devices.filter((device) => {
            const hours = device.burnHours ? parseFloat(device.burnHours) : null;
            return hours !== null && hours >= min && hours < max;
          });
        }
        break;
      case "networkType":
        if (data && devices) {
          const clickedNetwork = data.networkType;
          drillDownItems = devices.filter(
            (device) => device.networkType === clickedNetwork
          );
        }
        break;
    }

    if (drillDownItems.length > 0) {
      setDrillDownData({ type, title, data: drillDownItems });
    } else if (!data) {
      // If no specific data clicked, show all items for that chart type
      switch (type) {
        case "alertTimeline":
          if (alerts) setDrillDownData({ type, title, data: alerts });
          break;
        case "alertType":
          if (alerts) setDrillDownData({ type, title, data: alerts });
          break;
        case "deviceStatus":
          if (devices) setDrillDownData({ type, title, data: devices });
          break;
        case "burnHours":
          if (devices) setDrillDownData({ type, title, data: devices });
          break;
        case "networkType":
          if (devices) setDrillDownData({ type, title, data: devices });
          break;
      }
    }
  };

  const isLoading =
    alertsLoading || devicesLoading || alertStatsLoading || deviceStatsLoading;

  const playAudioUrl = (url: string | null) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(err => {
      console.warn("[Analytics] Failed to play analytics summary audio", err);
    });
  };

  const handlePlayAnalyticsSummary = async () => {
    if (!alerts || !devices || !alertStats || !deviceStats) return;

    if (analyticsAudioUrl) {
      playAudioUrl(analyticsAudioUrl);
      return;
    }

    const totalAlerts = alerts.length;
    const totalDevices = devices.length;
    const mostCommonStatus = deviceStatusData[0]?.status ?? "Unknown";
    const mostCommonSeverity = alertStats.bySeverity?.[0]?.severity ?? null;

    const tone = "Calm, executive analytics summary:";
    const text = `Baltimore Smart City Command Center analytics summary. There are ${totalDevices} devices with most in ${mostCommonStatus} status, ` +
      `and ${totalAlerts} historical alerts in the current view. ` +
      (mostCommonSeverity
        ? `Most alerts are ${mostCommonSeverity} severity.`
        : "Severity distribution is balanced across levels.");

    try {
      const result = await speakText.mutateAsync({ text, tone });
      const url = `data:audio/mp3;base64,${result.audioBase64}`;
      setAnalyticsAudioUrl(url);
      playAudioUrl(url);
    } catch (err) {
      console.warn("[Analytics] speakText analytics summary failed", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-primary">Analytics Visualizations</h1>
          <p className="text-muted-foreground mt-1">
            Interactive charts with drill-down capabilities
          </p>
        </div>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={speakText.isPending || !alerts || !devices || !alertStats || !deviceStats}
                onClick={handlePlayAnalyticsSummary}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/60 text-primary bg-background hover:bg-primary/10 disabled:opacity-50"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">
              <span className="text-xs">Play analytics summary</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Alert Timeline (line chart) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Alert Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={alertTimelineConfig}>
                <LineChart
                  data={alertTimeline}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      handleChartClick("alertTimeline", "Alert Timeline", data.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={BALTIMORE_COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: BALTIMORE_COLORS.primary, r: 4, cursor: "pointer" }}
                    activeDot={{ 
                      r: 6, 
                      cursor: "pointer",
                      onClick: (e: any, payload: any) => {
                        if (payload && payload.payload) {
                          handleChartClick("alertTimeline", "Alert Timeline", payload.payload);
                        }
                      }
                    }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. Alert Type Distribution (donut chart) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Alert Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={alertTypeConfig}>
                <PieChart>
                  <Pie
                    data={alertTypeDistribution}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    label={({ type, percent }) =>
                      `${type}: ${(percent * 100).toFixed(0)}%`
                    }
                    onClick={(data: any, index: number) => {
                      if (data && alertTypeDistribution[index]) {
                        handleChartClick("alertType", "Alert Type Distribution", alertTypeDistribution[index]);
                      }
                    }}
                    animationDuration={1000}
                  >
                    {alertTypeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          CHART_COLORS[index % CHART_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Device Status chart (bar chart) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Device Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={deviceStatusConfig}>
                <BarChart
                  data={deviceStatusData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill={BALTIMORE_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any, index: number) => {
                      if (data && deviceStatusData[index]) {
                        handleChartClick("deviceStatus", "Device Status", deviceStatusData[index]);
                      }
                    }}
                    animationDuration={1000}
                  >
                    {deviceStatusData.map((entry, index) => {
                      let color = CHART_COLORS[index % CHART_COLORS.length];
                      if (entry.status === "ONLINE") color = BALTIMORE_COLORS.success;
                      if (entry.status === "OFFLINE") color = BALTIMORE_COLORS.danger;
                      if (entry.status === "POWER LOSS") color = BALTIMORE_COLORS.warning;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. Burn Hours Distribution (histogram) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Burn Hours Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={burnHoursConfig}>
                <BarChart
                  data={burnHoursData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill={BALTIMORE_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any, index: number) => {
                      if (data && burnHoursData[index]) {
                        handleChartClick("burnHours", "Burn Hours Distribution", burnHoursData[index]);
                      }
                    }}
                    animationDuration={1000}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* 5. Network Type Performance chart (grouped bar) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-2"
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Network Type Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={networkTypeConfig}>
                <BarChart
                  data={networkTypeData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="networkType" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="ONLINE"
                    fill={BALTIMORE_COLORS.success}
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any, index: number) => {
                      if (data && networkTypeData[index]) {
                        handleChartClick("networkType", "Network Type Performance", networkTypeData[index]);
                      }
                    }}
                    animationDuration={1000}
                  />
                  <Bar
                    dataKey="OFFLINE"
                    fill={BALTIMORE_COLORS.danger}
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any, index: number) => {
                      if (data && networkTypeData[index]) {
                        handleChartClick("networkType", "Network Type Performance", networkTypeData[index]);
                      }
                    }}
                    animationDuration={1000}
                  />
                  <Bar
                    dataKey="POWER LOSS"
                    fill={BALTIMORE_COLORS.warning}
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any, index: number) => {
                      if (data && networkTypeData[index]) {
                        handleChartClick("networkType", "Network Type Performance", networkTypeData[index]);
                      }
                    }}
                    animationDuration={1000}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Drill-down Dialog */}
      <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{drillDownData?.title}</DialogTitle>
            <DialogDescription>
              {drillDownData?.data.length || 0} items found
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  {drillDownData?.type === "alertTimeline" ||
                  drillDownData?.type === "alertType" ? (
                    <>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Alert Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </>
                  ) : drillDownData?.type === "deviceStatus" ||
                    drillDownData?.type === "burnHours" ||
                    drillDownData?.type === "networkType" ? (
                    <>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Node Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Network Type</TableHead>
                      <TableHead>Burn Hours</TableHead>
                    </>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {drillDownData?.data.map((item, index) => (
                  <TableRow key={index}>
                    {drillDownData?.type === "alertTimeline" ||
                    drillDownData?.type === "alertType" ? (
                      <>
                        <TableCell>{item.deviceId}</TableCell>
                        <TableCell>{item.alertType}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.severity === "critical"
                                ? "bg-red-500/20 text-red-500"
                                : item.severity === "high"
                                ? "bg-orange-500/20 text-orange-500"
                                : item.severity === "medium"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-blue-500/20 text-blue-500"
                            }`}
                          >
                            {item.severity}
                          </span>
                        </TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleString()
                            : "-"}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{item.deviceId}</TableCell>
                        <TableCell>{item.nodeName || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.nodeStatus === "ONLINE"
                                ? "bg-green-500/20 text-green-500"
                                : item.nodeStatus === "OFFLINE"
                                ? "bg-red-500/20 text-red-500"
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {item.nodeStatus || "-"}
                          </span>
                        </TableCell>
                        <TableCell>{item.networkType || "-"}</TableCell>
                        <TableCell>{item.burnHours || "-"}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

