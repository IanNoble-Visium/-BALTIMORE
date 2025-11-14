import { useMemo, useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { trpc } from "@/lib/trpc";
import { MapboxMap } from "@/components/Map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { AlertTriangle, MapPin, Layers, Radar, RefreshCw, Search, SlidersHorizontal, ZoomIn } from "lucide-react";

/**
 * Dedicated Interactive Map dashboard page.
 *
 * Uses the shared MapboxMap component to provide a full-screen Baltimore map
 * with clustered device markers, heatmap overlay, and click-to-drill-down
 * into a device details modal.
 */
export default function InteractiveMap() {
  const { data: devices = [], isLoading: devicesLoading } =
    trpc.devices.getAll.useQuery(undefined, {
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
    });

  const alertsQuery = trpc.alerts.getAll.useQuery(undefined, {
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);

  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [networkFilter, setNetworkFilter] = useState<Set<string>>(new Set());

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: [-76.6122, 39.2904],
      zoom: 12,
      pitch: 45,
      bearing: -17.6,
      duration: 900,
    });
  };

  const toggleSetValue = (
    current: Set<string>,
    value: string,
  ): Set<string> => {
    const next = new Set(current);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    return next;
  };

  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set());
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [spokenDeviceId, setSpokenDeviceId] = useState<string | null>(null);

  const selectedDevice = useMemo(
    () => devices.find(d => d.deviceId === selectedDeviceId) ?? null,
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

  const speakAlert = trpc.ai.speakAlert.useMutation();

  const alertsByDevice = useMemo(() => {
    const map = new Map<string, typeof alertsQuery.data>();
    if (!alertsQuery.data) return map;
    for (const alert of alertsQuery.data) {
      const key = alert.deviceId;
      const existing = map.get(key) ?? [];
      existing.push(alert);
      map.set(key, existing);
    }
    return map;
  }, [alertsQuery.data]);


  const deviceStats = useMemo(() => {
    const total = devices.length;
    let online = 0;
    let offline = 0;

    const statusCounts = new Map<string, number>();
    const networkCounts = new Map<string, number>();

    for (const d of devices) {
      const statusRaw = (d.nodeStatus ?? "Unknown").toUpperCase();
      const networkRaw = (d.networkType ?? "Unknown").toUpperCase();

      statusCounts.set(statusRaw, (statusCounts.get(statusRaw) ?? 0) + 1);
      networkCounts.set(networkRaw, (networkCounts.get(networkRaw) ?? 0) + 1);

      if (statusRaw === "ONLINE") {
        online += 1;
      } else if (statusRaw === "OFFLINE" || statusRaw === "POWER LOSS") {
        offline += 1;
      }
    }

    const activeAlerts = (alertsQuery.data ?? []).filter(a => a.status === "active");
    const alertsBySeverity = new Map<string, number>();
    const devicesWithActiveAlerts = new Set<string>();

    for (const alert of activeAlerts) {
      alertsBySeverity.set(alert.severity, (alertsBySeverity.get(alert.severity) ?? 0) + 1);
      devicesWithActiveAlerts.add(alert.deviceId);
    }

    const devicesWithIssues = new Set<string>();
    for (const d of devices) {
      const statusRaw = (d.nodeStatus ?? "Unknown").toUpperCase();
      if (statusRaw !== "ONLINE") {
        devicesWithIssues.add(d.deviceId);
      }
      if (devicesWithActiveAlerts.has(d.deviceId)) {
        devicesWithIssues.add(d.deviceId);
      }
    }

    return {
      total,
      online,
      offline,
      statusCounts,
      networkCounts,
      alertsBySeverity,
      activeAlertsCount: activeAlerts.length,
      devicesWithIssuesCount: devicesWithIssues.size,
    };
  }, [alertsQuery.data, devices]);

  const allStatuses = useMemo(() => Array.from(deviceStats.statusCounts.keys()).sort(), [
    deviceStats.statusCounts,
  ]);

  const allNetworks = useMemo(() => Array.from(deviceStats.networkCounts.keys()).sort(), [
    deviceStats.networkCounts,
  ]);

  const allSeverities = ["critical", "high", "medium", "low"] as const;

  const primaryAlertForDevice = useMemo(() => {
    if (!deviceAlerts.data || deviceAlerts.data.length === 0) return null;
    // Use the most recent alert (assuming data is sorted latest-first; fallback to last element).
    return deviceAlerts.data[0] ?? deviceAlerts.data[deviceAlerts.data.length - 1] ?? null;
  }, [deviceAlerts.data]);

  const filteredDevices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return devices.filter(device => {
      const statusRaw = (device.nodeStatus ?? "Unknown").toUpperCase();
      const networkRaw = (device.networkType ?? "Unknown").toUpperCase();

      if (statusFilter.size > 0 && !statusFilter.has(statusRaw)) {
        return false;
      }

      if (networkFilter.size > 0 && !networkFilter.has(networkRaw)) {
        return false;
      }

      if (severityFilter.size > 0) {
        const alerts = alertsByDevice.get(device.deviceId) ?? [];
        const matchesSeverity = alerts.some(a => severityFilter.has(a.severity));
        if (!matchesSeverity) return false;
      }

      if (query) {
        const haystack = `${device.deviceId} ${device.nodeName ?? ""} ${device.alertType ?? ""}`
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [alertsByDevice, devices, networkFilter, searchQuery, severityFilter, statusFilter]);

  const handleFitToBounds = () => {
    const map = mapRef.current;
    if (!map || filteredDevices.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    for (const device of filteredDevices) {
      const lat = parseFloat(device.latitude ?? "");
      const lng = parseFloat(device.longitude ?? "");
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        bounds.extend([lng, lat]);
      }
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        duration: 900,
      });
    }
  };

  const isDataEmpty = !devices || devices.length === 0;

  // When the device dialog opens, play an urgent spoken announcement for the primary alert.
  useEffect(() => {
    if (!deviceDialogOpen) {
      setSpokenDeviceId(null);
      return;
    }

    if (!selectedDevice || !primaryAlertForDevice) return;
    if (spokenDeviceId === selectedDevice.deviceId) return;
    if (speakAlert.isPending) return;

    const title = primaryAlertForDevice.alertType || "Alert";
    const severity = primaryAlertForDevice.severity;
    const deviceName = selectedDevice.nodeName || selectedDevice.deviceId;

    speakAlert
      .mutateAsync({ title, deviceName, severity })
      .then(result => {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`);
          audio.play().catch(err => {
            console.warn("[InteractiveMap] Failed to play alert audio", err);
          });
          setSpokenDeviceId(selectedDevice.deviceId);
        } catch (err) {
          console.warn("[InteractiveMap] Error handling alert audio", err);
        }
      })
      .catch(err => {
        console.warn("[InteractiveMap] speakAlert failed", err);
      });
  }, [
    deviceDialogOpen,
    selectedDevice,
    primaryAlertForDevice,
    spokenDeviceId,
    speakAlert,
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#FFC72C]" />
            Baltimore Interactive Map
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A real-time, cinematic view of Ubicell devices across Baltimore. Filter by
            status, network, and alerts while flying around a 3D city map.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge className="bg-[#111827] text-[#F9FAFB] border border-[#FFC72C]/40">
            <span className="mr-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {deviceStats.online.toLocaleString()} online
          </Badge>
          <Badge className="bg-[#111827] text-[#F9FAFB] border border-red-500/40">
            <span className="mr-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            {deviceStats.offline.toLocaleString()} offline
          </Badge>
          <Badge className="bg-[#111827] text-[#F9FAFB] border border-amber-400/40">
            <span className="mr-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
            {deviceStats.devicesWithIssuesCount.toLocaleString()} devices with issues
          </Badge>
          {deviceStats.activeAlertsCount > 0 && (
            <Badge className="bg-[#111827] text-[#F9FAFB] border border-sky-400/40">
              <span className="mr-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
              {deviceStats.activeAlertsCount.toLocaleString()} active alerts
            </Badge>
          )}
        </div>
      </header>

      {/* High-level metrics */}
      <Card className="border-[#FFC72C]/40 bg-gradient-to-br from-black via-slate-950 to-slate-900">
        <CardContent className="pt-4 pb-4">
          <div className="grid gap-4 md:grid-cols-4 text-xs text-slate-100">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Total Devices</p>
              <p className="mt-1 text-2xl font-semibold text-[#FFC72C]">
                {deviceStats.total.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {filteredDevices.length === deviceStats.total
                  ? "All devices visible"
                  : `${filteredDevices.length.toLocaleString()} match current filters`}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Network Types</p>
              <p className="mt-1 text-sm font-medium">
                {allNetworks.slice(0, 3).join(", ") || "Unknown"}
                {allNetworks.length > 3 && ` +${allNetworks.length - 3} more`}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Click a network chip below to focus on a specific network.
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Alert Severity</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {allSeverities.map(severity => {
                  const count = deviceStats.alertsBySeverity.get(severity) ?? 0;
                  if (count === 0) return null;
                  const colorClasses: Record<string, string> = {
                    critical: "bg-red-500/20 text-red-300 border-red-500/40",
                    high: "bg-amber-500/20 text-amber-200 border-amber-500/40",
                    medium: "bg-sky-500/20 text-sky-200 border-sky-500/40",
                    low: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
                  };
                  return (
                    <Badge
                      key={severity}
                      className={`border ${colorClasses[severity]} capitalize`}
                    >
                      {severity}
                      <span className="ml-1 text-[10px] opacity-80">
                        {count.toLocaleString()}
                      </span>
                    </Badge>
                  );
                })}
                {deviceStats.activeAlertsCount === 0 && (
                  <p className="text-[11px] text-slate-400">No active alerts.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Quick Actions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  className="border-[#FFC72C]/60 bg-black/40 text-[11px] hover:bg-[#FFC72C]/10"
                  onClick={handleFitToBounds}
                >
                  <ZoomIn className="mr-1 h-3 w-3" /> Fit to devices
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  className="border-slate-500/80 bg-black/40 text-[11px] hover:bg-slate-800/80"
                  onClick={handleResetView}
                >
                  <RefreshCw className="mr-1 h-3 w-3" /> Reset view
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Use these controls during the demo to smoothly fly around Baltimore.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      {isDataEmpty && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h2 className="font-semibold text-sm mb-1">No Devices Loaded</h2>
                <p className="text-xs text-muted-foreground">
                  The map will populate once Ubicell device data is seeded or loaded.
                  Use the main dashboard to run the demo data seeding flow if needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FFC72C]" />
              <span>Baltimore Device Map</span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, name, or alert type"
                  className="h-9 w-56 pl-7 text-xs"
                />
              </div>
              <Separator orientation="vertical" className="hidden h-6 lg:block" />
              <TooltipProvider>
                <div className="flex flex-wrap gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="xs"
                        variant={showHeatmap ? "default" : "outline"}
                        className={`text-[11px] flex items-center gap-1 border border-[#FFC72C]/60 ${
                          showHeatmap
                            ? "bg-[#FFC72C] text-black hover:bg-[#FBBF24]"
                            : "bg-black/40 text-slate-100 hover:bg-[#111827]"
                        }`}
                        onClick={() => setShowHeatmap(val => !val)}
                      >
                        <Radar className="h-3 w-3" /> Heatmap
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Toggle the density heatmap layer for a high-level view of activity.
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="xs"
                        variant={showClusters ? "default" : "outline"}
                        className={`text-[11px] flex items-center gap-1 border border-sky-500/60 ${
                          showClusters
                            ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
                            : "bg-black/40 text-slate-100 hover:bg-[#111827]"
                        }`}
                        onClick={() => setShowClusters(val => !val)}
                      >
                        <Layers className="h-3 w-3" /> Clusters
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Highlight or hide clustered device bubbles and counts.
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-[11px] flex items-center gap-1 border border-slate-500/80 bg-black/40 hover:bg-slate-900/80"
                        onClick={handleFitToBounds}
                      >
                        <ZoomIn className="h-3 w-3" /> Fit to devices
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Smoothly zoom to include every device that matches the current filters.
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-[11px] flex items-center gap-1 border border-slate-500/80 bg-black/40 hover:bg-slate-900/80"
                        onClick={handleResetView}
                      >
                        <RefreshCw className="h-3 w-3" /> Reset view
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Return to the default Baltimore camera angle and zoom.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between text-xs">
            <div className="flex-1 rounded-md border border-slate-800/80 bg-black/40 p-3">
              <div className="mb-2 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                <SlidersHorizontal className="h-3 w-3" />
                Filters
              </div>
              <div className="space-y-2">
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allStatuses.map(status => {
                      const isActive = statusFilter.has(status);
                      const count = deviceStats.statusCounts.get(status) ?? 0;
                      const colorClasses =
                        status === "ONLINE"
                          ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/60"
                          : status === "OFFLINE" || status === "POWER LOSS"
                            ? "bg-red-500/20 text-red-200 border-red-500/60"
                            : "bg-amber-500/20 text-amber-200 border-amber-500/60";
                      return (
                        <Button
                          key={status}
                          size="xs"
                          variant="outline"
                          className={`h-7 rounded-full border px-2 text-[11px] capitalize transition-colors ${
                            isActive
                              ? colorClasses
                              : "border-slate-700/80 bg-slate-900/60 text-slate-200 hover:bg-slate-800/80"
                          }`}
                          onClick={() => setStatusFilter(curr => toggleSetValue(curr, status))}
                        >
                          <span className="mr-1">
                            {status === "ONLINE"
                              ? "Online"
                              : status === "OFFLINE"
                                ? "Offline"
                                : status === "POWER LOSS"
                                  ? "Power loss"
                                  : status}
                          </span>
                          <span className="ml-1 rounded-full bg-black/40 px-1.5 text-[10px] text-slate-300">
                            {count}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <Separator className="my-2 bg-slate-800/80" />
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">Network</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allNetworks.map(network => {
                      const isActive = networkFilter.has(network);
                      const count = deviceStats.networkCounts.get(network) ?? 0;
                      return (
                        <Button
                          key={network}
                          size="xs"
                          variant="outline"
                          className={`h-7 rounded-full border px-2 text-[11px] uppercase tracking-wide transition-colors ${
                            isActive
                              ? "border-sky-500/80 bg-sky-500/20 text-sky-100"
                              : "border-slate-700/80 bg-slate-900/60 text-slate-200 hover:bg-slate-800/80"
                          }`}
                          onClick={() => setNetworkFilter(curr => toggleSetValue(curr, network))}
                        >
                          <span>{network}</span>
                          <span className="ml-1 rounded-full bg-black/40 px-1.5 text-[10px] text-slate-300">
                            {count}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <Separator className="my-2 bg-slate-800/80" />
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">Alert severity</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allSeverities.map(severity => {
                      const isActive = severityFilter.has(severity);
                      const count = deviceStats.alertsBySeverity.get(severity) ?? 0;
                      const colorClasses: Record<string, string> = {
                        critical: "border-red-500/80 bg-red-500/20 text-red-100",
                        high: "border-amber-500/80 bg-amber-500/20 text-amber-100",
                        medium: "border-sky-500/80 bg-sky-500/20 text-sky-100",
                        low: "border-emerald-500/80 bg-emerald-500/20 text-emerald-100",
                      };
                      return (
                        <Button
                          key={severity}
                          size="xs"
                          variant="outline"
                          disabled={count === 0}
                          className={`h-7 rounded-full border px-2 text-[11px] capitalize transition-colors ${
                            count === 0
                              ? "cursor-not-allowed border-slate-800/60 bg-slate-900/60 text-slate-500"
                              : isActive
                                ? colorClasses[severity]
                                : "border-slate-700/80 bg-slate-900/60 text-slate-200 hover:bg-slate-800/80"
                          }`}
                          onClick={() =>
                            setSeverityFilter(curr => toggleSetValue(curr, severity))
                          }
                        >
                          <span>{severity}</span>
                          <span className="ml-1 rounded-full bg-black/40 px-1.5 text-[10px] text-slate-300">
                            {count}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 flex w-full max-w-xs flex-col gap-2 rounded-md border border-slate-800/80 bg-black/40 p-3 lg:mt-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Legend</p>
              <div className="space-y-1.5 text-[11px] text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span>
                    Online devices
                    <span className="ml-1 text-[10px] text-slate-400">
                      ({deviceStats.online.toLocaleString()})
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span>
                    Power loss / offline
                    <span className="ml-1 text-[10px] text-slate-400">
                      ({deviceStats.offline.toLocaleString()})
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span>Other / transitional statuses</span>
                </div>
                <Separator className="my-1 bg-slate-800/80" />
                <p className="text-[11px] text-slate-400">
                  Heatmap gradients show density (green → gold → orange → red). Clusters
                  show counts of nearby devices.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <MapboxMap
              className="mt-1 h-[640px]"
              devices={filteredDevices}
              showHeatmap={showHeatmap}
              showClusters={showClusters}
              onMapReady={map => {
                mapRef.current = map;
                setMapReady(true);
              }}
              onDeviceClick={id => {
                setSelectedDeviceId(id);
                setDeviceDialogOpen(true);
              }}
            />
            {!mapReady && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 via-slate-950/90 to-slate-900/80">
                <div className="animate-pulse rounded-md border border-[#FFC72C]/40 bg-black/60 px-4 py-2 text-xs text-[#F9FAFB] shadow-lg">
                  Initializing cinematic 3D map of Baltimore…
                </div>
              </div>
            )}
          </div>

          {devicesLoading && (
            <p className="mt-2 text-xs text-muted-foreground">
              Streaming real-time device positions onto the map…
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={deviceDialogOpen}
        onOpenChange={open => {
          setDeviceDialogOpen(open);
          if (!open) {
            setSelectedDeviceId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <div className="relative">
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-40"
              autoPlay
              muted
              loop
              playsInline
              src="/videos/_21_emergency_202511140242_7u9pc.mp4"
            />
            <div className="relative z-10 space-y-4 bg-black/80 p-6 backdrop-blur-md text-sm">
              <DialogHeader>
                <DialogTitle>
                  {selectedDevice?.nodeName || selectedDevice?.deviceId || "Device Details"}
                </DialogTitle>
                <DialogDescription>
                  Real-time view of Ubicell device status, recent alerts, and location in
                  Baltimore.
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

