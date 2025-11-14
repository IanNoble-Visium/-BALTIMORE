import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Wrench,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

/**
 * AI Features Page
 * 
 * Comprehensive AI-powered features for the Baltimore Smart City Dashboard:
 * - Alert Pattern Detection & Summarization
 * - Predictive Maintenance Scoring
 * - AI-powered insights and recommendations
 */
export default function AI() {
  const [patternTimeRange, setPatternTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [summaryTimeRange, setSummaryTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  // Fetch AI data
  const { data: patterns, isLoading: patternsLoading, refetch: refetchPatterns } = 
    trpc.ai.detectAlertPatterns.useQuery(
      { timeRange: patternTimeRange },
      { refetchInterval: 60000 }
    );

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = 
    trpc.ai.summarizeAlerts.useQuery(
      { timeRange: summaryTimeRange, maxAlerts: 100 },
      { refetchInterval: 60000 }
    );

  const { data: maintenance, isLoading: maintenanceLoading, refetch: refetchMaintenance } = 
    trpc.ai.getPredictiveMaintenanceScores.useQuery(
      undefined,
      { refetchInterval: 120000 }
    );

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-red-400";
    if (score >= 50) return "text-orange-400";
    if (score >= 25) return "text-yellow-400";
    return "text-green-400";
  };

  const maintenanceChartData = maintenance?.summary
    ? [
        { name: "Critical", value: maintenance.summary.critical, color: "#ef4444" },
        { name: "High", value: maintenance.summary.high, color: "#f59e0b" },
        { name: "Medium", value: maintenance.summary.medium, color: "#eab308" },
        { name: "Low", value: maintenance.summary.low, color: "#10b981" },
      ]
    : [];

  const chartConfig: ChartConfig = {
    value: {
      label: "Devices",
      color: "#FFC72C",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Intelligent analysis and predictive maintenance for Baltimore Smart City
          </p>
        </div>
      </div>

      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Alert Patterns
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alert Summary
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Predictive Maintenance
          </TabsTrigger>
        </TabsList>

        {/* Alert Pattern Detection Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Alert Pattern Detection
                  </CardTitle>
                  <CardDescription className="mt-1">
                    AI-powered analysis of alert patterns to identify recurring issues and trends
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={patternTimeRange}
                    onValueChange={(value: "24h" | "7d" | "30d") => setPatternTimeRange(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchPatterns()}
                    disabled={patternsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${patternsLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {patternsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : patterns?.patterns && patterns.patterns.length > 0 ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertTitle>Pattern Analysis Summary</AlertTitle>
                    <AlertDescription>{patterns.summary}</AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Detected Patterns</h3>
                    {patterns.patterns.map((pattern: any, index: number) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={getSeverityColor(pattern.severity || "medium")}
                                >
                                  {pattern.severity || "medium"}
                                </Badge>
                                <span className="font-semibold">{pattern.type}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {pattern.description}
                              </p>
                              {pattern.examples && pattern.examples.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {pattern.examples.slice(0, 5).map((example: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {example}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {pattern.affectedDevices || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Devices</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No Patterns Detected</AlertTitle>
                  <AlertDescription>
                    {patterns?.summary || "No alert patterns found in the selected time range."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    AI Alert Summarization
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Intelligent summary of recent alerts with key insights and recommendations
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={summaryTimeRange}
                    onValueChange={(value: "24h" | "7d" | "30d") => setSummaryTimeRange(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchSummary()}
                    disabled={summaryLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${summaryLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : summary ? (
                <div className="space-y-6">
                  <Alert>
                    <AlertTitle>Executive Summary</AlertTitle>
                    <AlertDescription className="text-base mt-2">
                      {summary.summary}
                    </AlertDescription>
                  </Alert>

                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Key Points
                      </h3>
                      <ul className="space-y-2">
                        {summary.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.recommendations && summary.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Recommendations
                      </h3>
                      <div className="space-y-2">
                        {summary.recommendations.map((rec: string, index: number) => (
                          <Card key={index} className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-2">
                                <Wrench className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <span className="text-sm">{rec}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No Summary Available</AlertTitle>
                  <AlertDescription>
                    Unable to generate alert summary. Please try again later.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Predictive Maintenance Scoring
                  </CardTitle>
                  <CardDescription className="mt-1">
                    AI-powered maintenance scores based on Ubicell telemetry data
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetchMaintenance()}
                  disabled={maintenanceLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${maintenanceLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {maintenanceLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : maintenance ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-red-500/10 border-red-500/20">
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-red-400">
                          {maintenance.summary.critical}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Critical</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-500/10 border-orange-500/20">
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-orange-400">
                          {maintenance.summary.high}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">High</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/10 border-yellow-500/20">
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-yellow-400">
                          {maintenance.summary.medium}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Medium</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-500/10 border-green-500/20">
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-400">
                          {maintenance.summary.low}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Low</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart */}
                  {maintenanceChartData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Maintenance Priority Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-[200px]">
                          <BarChart data={maintenanceChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {maintenanceChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Insights */}
                  {maintenance.aiInsights && (
                    <Alert className="bg-primary/5 border-primary/20">
                      <Brain className="h-5 w-5 text-primary" />
                      <AlertTitle>AI Insights</AlertTitle>
                      <AlertDescription className="mt-2 whitespace-pre-wrap">
                        {maintenance.aiInsights}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Device Table */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Top Devices Requiring Maintenance</h3>
                    <ScrollArea className="h-[500px] border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Device</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Burn Hours</TableHead>
                            <TableHead>Alerts</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Recommendations</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maintenance.devices.slice(0, 50).map((device: any) => (
                            <TableRow key={device.deviceId}>
                              <TableCell className="font-medium">
                                {device.nodeName || device.deviceId}
                              </TableCell>
                              <TableCell>
                                <span className={`font-bold ${getScoreColor(device.score)}`}>
                                  {device.score}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getPriorityColor(device.priority)}
                                >
                                  {device.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {device.burnHours > 0
                                  ? device.burnHours.toLocaleString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{device.alertCount}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    device.nodeStatus === "Online" || device.nodeStatus === "online"
                                      ? "bg-green-500/20 text-green-400 border-green-500/50"
                                      : device.nodeStatus === "Offline" || device.nodeStatus === "offline"
                                      ? "bg-red-500/20 text-red-400 border-red-500/50"
                                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                  }
                                >
                                  {device.nodeStatus || "Unknown"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <ScrollArea className="h-16">
                                  <ul className="text-xs space-y-1">
                                    {device.recommendations?.slice(0, 2).map((rec: string, i: number) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <Clock className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </ScrollArea>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No Maintenance Data</AlertTitle>
                  <AlertDescription>
                    Unable to load predictive maintenance scores. Please try again later.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

