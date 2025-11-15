import { useMemo, useState } from "react";
import type { Alert } from "@shared/types";
import type { DateRange } from "react-day-picker";
import { format, endOfDay, startOfDay, subDays } from "date-fns";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Filter } from "lucide-react";
import { SortableDataTable, type DataTableColumn } from "@/components/SortableDataTable";

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes("\"") || str.includes(",") || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [
    headers.join(","),
    ...rows.map(row => headers.map(h => escape((row as any)[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const severityColorClasses: Record<Alert["severity"], string> = {
  critical: "border-red-500/60 bg-red-500/15 text-red-200",
  high: "border-amber-500/60 bg-amber-500/15 text-amber-100",
  medium: "border-sky-500/60 bg-sky-500/15 text-sky-100",
  low: "border-emerald-500/60 bg-emerald-500/15 text-emerald-100",
};

const severityLevels: Alert["severity"][] = [
  "critical",
  "high",
  "medium",
  "low",
];


const severityRank: Record<Alert["severity"], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export default function DataTables() {
  const alertsQuery = trpc.alerts.getAll.useQuery(undefined, {
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const [severity, setSeverity] = useState<"ALL" | Alert["severity"]>("ALL");
  const [type, setType] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortedAlerts, setSortedAlerts] = useState<Alert[]>([]);

  const alerts = alertsQuery.data ?? [];

  const alertTypeOptions = useMemo(
    () => Array.from(new Set(alerts.map(a => a.alertType))).sort(),
    [alerts],
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (severity !== "ALL" && a.severity !== severity) return false;
      if (type !== "ALL" && a.alertType !== type) return false;

      if (dateRange?.from && a.timestamp) {
        const alertDate = new Date(a.timestamp);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        if (alertDate < from || alertDate > to) return false;
      }

      return true;
    });
  }, [alerts, severity, type, dateRange]);

  const severitySummary = useMemo(() => {
    const counts: Record<Alert["severity"], number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const alert of filteredAlerts) {
      counts[alert.severity] += 1;
    }

    return {
      total: filteredAlerts.length,
      counts,
    };
  }, [filteredAlerts]);

  const trendSummary = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    const baselineCount = alerts.filter(a => {
      if (!a.timestamp) return false;
      const alertDate = new Date(a.timestamp);
      if (alertDate < sevenDaysAgo || alertDate > now) return false;

      if (severity !== "ALL" && a.severity !== severity) return false;
      if (type !== "ALL" && a.alertType !== type) return false;

      return true;
    }).length;

    const currentCount = filteredAlerts.length;
    const diff = currentCount - baselineCount;

    let percent = 0;
    if (baselineCount === 0) {
      percent = currentCount > 0 ? 100 : 0;
    } else {
      percent = Math.round((diff / baselineCount) * 100);
    }

    return {
      current: currentCount,
      baseline: baselineCount,
      diff,
      percent,
    };
  }, [alerts, severity, type, filteredAlerts]);

  const showTrend = trendSummary.baseline > 0 || trendSummary.current > 0;
  const isNeutral =
    Math.abs(trendSummary.percent) <= 2 || trendSummary.diff === 0;
  const isPositive = trendSummary.diff < 0 && !isNeutral;
  const isNegative = trendSummary.diff > 0 && !isNeutral;

  const trendText = (() => {
    if (!showTrend) {
      return "No recent alerts to compare vs. last 7 days.";
    }

    if (isNeutral) {
      return "Stable vs. last 7 days";
    }

    const arrow = trendSummary.diff > 0 ? "↑" : "↓";
    const sign = trendSummary.diff > 0 ? "+" : "";
    const diffAbs = Math.abs(trendSummary.diff);
    const alertsWord = diffAbs === 1 ? "alert" : "alerts";

    return `${arrow} ${diffAbs.toLocaleString()} ${alertsWord} (${sign}${trendSummary.percent}%) vs. last 7 days`;
  })();

  const columns: DataTableColumn<Alert>[] = useMemo(
    () => [
      {
        id: "timestamp",
        header: "Time",
        accessor: a =>
          a.timestamp ? new Date(a.timestamp).toLocaleString() : "-",
        sortValue: a => (a.timestamp ? new Date(a.timestamp) : null),
      },
      {
        id: "deviceId",
        header: "Device ID",
        accessor: a => (
          <span className="font-mono text-xs">{a.deviceId}</span>
        ),
        sortValue: a => a.deviceId.toLowerCase(),
      },
      {
        id: "alertType",
        header: "Type",
        accessor: a => a.alertType,
        sortValue: a => a.alertType.toLowerCase(),
      },
      {
        id: "severity",
        header: "Severity",
        accessor: a => (
          <Badge
            variant="secondary"
            className={`capitalize border ${severityColorClasses[a.severity]}`}
          >
            {a.severity}
          </Badge>
        ),
        sortValue: a => severityRank[a.severity],
      },
      {
        id: "status",
        header: "Status",
        accessor: a => <span className="capitalize">{a.status}</span>,
        sortValue: a => a.status.toLowerCase(),
      },
      {
        id: "description",
        header: "Description",
        accessor: a => (
          <span className="text-[11px] text-muted-foreground">
            {a.description || "-"}
          </span>
        ),
      },
    ],
    [],
  );

  const emptyMessage = alertsQuery.isLoading
    ? "Loading alerts..."
    : "No alerts match the current filters.";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Alert Data Tables</CardTitle>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Sort, filter, and export Baltimore alert history.</p>
              <p className="font-medium">
                {alertsQuery.isLoading
                  ? "Fetching latest alerts…"
                  : `${filteredAlerts.length.toLocaleString()} alerts matching current filters`}
              </p>
              {!alertsQuery.isLoading && (
                <p
                  className={cn(
                    "text-[11px]",
                    isNeutral && "text-muted-foreground",
                    isPositive && "text-emerald-400",
                    isNegative && "text-red-400",
                  )}
                >
                  {trendText}
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!filteredAlerts.length}
            onClick={() => {
              const exportAlerts = sortedAlerts.length
                ? sortedAlerts
                : filteredAlerts;
              downloadCsv(
                "baltimore_alerts_table.csv",
                exportAlerts.map(a => ({
                  timestamp: a.timestamp
                    ? new Date(a.timestamp).toISOString()
                    : "",
                  deviceId: a.deviceId,
                  alertType: a.alertType,
                  severity: a.severity,
                  status: a.status,
                  description: a.description ?? "",
                })),
              );
            }}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Select
              value={severity}
              onValueChange={value =>
                setSeverity(value as "ALL" | Alert["severity"])
              }
            >
              <SelectTrigger className="h-8 w-[140px]">
                <Filter className="mr-1 h-3 w-3" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  All severities
                </SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-[180px]">
                <Filter className="mr-1 h-3 w-3" />
                <SelectValue placeholder="Alert type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                {alertTypeOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-[220px] justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d, yyyy")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Date range: All time</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-3">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                  <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
                    <span className="text-[11px] text-muted-foreground mr-1">
                      Quick ranges:
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        const now = new Date();
                        const from = subDays(now, 1);
                        setDateRange({ from, to: now });
                      }}
                    >
                      Last 24h
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        const now = new Date();
                        const from = subDays(now, 6);
                        setDateRange({ from, to: now });
                      }}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        const now = new Date();
                        const from = subDays(now, 29);
                        setDateRange({ from, to: now });
                      }}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setDateRange(undefined)}
                    >
                      All time
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {severitySummary.total > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="mr-1 font-semibold uppercase tracking-wide text-[10px]">
                Severity distribution
              </span>
              {severityLevels.map(level => {
                const count = severitySummary.counts[level];
                const pct =
                  severitySummary.total > 0
                    ? Math.round((count / severitySummary.total) * 100)
                    : 0;

                return (
                  <Badge
                    key={level}
                    variant="secondary"
                    className={cn(
                      "flex items-center gap-1 border px-2 py-0.5",
                      severityColorClasses[level],
                    )}
                  >
                    <span className="capitalize">{level}</span>
                    <span className="font-mono">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-[10px] opacity-80">
                      ({pct}%)
                    </span>
                  </Badge>
                );
              })}
            </div>
          )}


          <SortableDataTable
            data={filteredAlerts}
            columns={columns}
            getRowId={row => row.id}
            emptyMessage={emptyMessage}
            onSortedDataChange={rows => setSortedAlerts(rows)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

