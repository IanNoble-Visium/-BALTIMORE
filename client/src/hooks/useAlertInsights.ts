import { useMemo } from "react";
import { subDays } from "date-fns";
import type { Alert } from "@shared/types";

export type SeveritySummary = {
  total: number;
  counts: Record<Alert["severity"], number>;
};

export type TrendSummary = {
  current: number;
  baseline: number;
  diff: number;
  percent: number;
};

type UseAlertInsightsParams = {
  alerts: Alert[];
  filteredAlerts: Alert[];
  /**
   * Baseline filter that applies the same non-time filters used for the current view
   * (severity, status/type, search, etc.). Time window (last 7 days) is applied
   * inside this hook.
   */
  baselineFilter: (alert: Alert) => boolean;
};

export function useAlertInsights({
  alerts,
  filteredAlerts,
  baselineFilter,
}: UseAlertInsightsParams) {
  const severitySummary: SeveritySummary = useMemo(() => {
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

  const trendSummary: TrendSummary = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    const baselineCount = alerts.filter(alert => {
      if (!alert.timestamp) return false;
      const alertDate = new Date(alert.timestamp);
      if (alertDate < sevenDaysAgo || alertDate > now) return false;

      if (!baselineFilter(alert)) return false;

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
  }, [alerts, filteredAlerts, baselineFilter]);

  const showTrend = trendSummary.baseline > 0 || trendSummary.current > 0;
  const isNeutral =
    Math.abs(trendSummary.percent) <= 2 || trendSummary.diff === 0;
  const isPositive = trendSummary.diff < 0 && !isNeutral;
  const isNegative = trendSummary.diff > 0 && !isNeutral;

  const trendText = useMemo(() => {
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
  }, [showTrend, isNeutral, trendSummary.diff, trendSummary.percent]);

  return {
    severitySummary,
    trendSummary,
    showTrend,
    isNeutral,
    isPositive,
    isNegative,
    trendText,
  };
}

