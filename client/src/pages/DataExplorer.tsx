import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { Upload, Download, Filter, Search, Database, AlertTriangle } from "lucide-react";

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

  const csv = [headers.join(","), ...rows.map(row => headers.map(h => escape((row as any)[h])).join(","))].join("\n");

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

export default function DataExplorer() {
  // Devices
  const devicesQuery = trpc.devices.getAll.useQuery(undefined, {
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const alertsQuery = trpc.alerts.getAll.useQuery(undefined, {
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceStatus, setDeviceStatus] = useState("ALL");
  const [deviceNetwork, setDeviceNetwork] = useState("ALL");
  const [devicePage, setDevicePage] = useState(1);

  const [alertSearch, setAlertSearch] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("ALL");
  const [alertStatus, setAlertStatus] = useState("ALL");
  const [alertPage, setAlertPage] = useState(1);

  const DEVICE_PAGE_SIZE = 25;
  const ALERT_PAGE_SIZE = 25;

  const filteredDevices = useMemo(() => {
    const devices = devicesQuery.data ?? [];
    return devices
      .filter(d => {
        if (deviceStatus !== "ALL") {
          if ((d.nodeStatus ?? "").toUpperCase() !== deviceStatus) return false;
        }
        if (deviceNetwork !== "ALL") {
          if ((d.networkType ?? "").toUpperCase() !== deviceNetwork) return false;
        }
        if (deviceSearch.trim()) {
          const term = deviceSearch.toLowerCase();
          return (
            d.deviceId.toLowerCase().includes(term) ||
            (d.nodeName ?? "").toLowerCase().includes(term) ||
            (d.alertType ?? "").toLowerCase().includes(term)
          );
        }
        return true;
      })
      .sort((a, b) => (a.deviceId || "").localeCompare(b.deviceId || ""));
  }, [devicesQuery.data, deviceStatus, deviceNetwork, deviceSearch]);

  const filteredAlerts = useMemo(() => {
    const alerts = alertsQuery.data ?? [];
    return alerts
      .filter(a => {
        if (alertSeverity !== "ALL" && a.severity !== alertSeverity) return false;
        if (alertStatus !== "ALL" && a.status !== alertStatus) return false;
        if (alertSearch.trim()) {
          const term = alertSearch.toLowerCase();
          return (
            a.deviceId.toLowerCase().includes(term) ||
            a.alertType.toLowerCase().includes(term) ||
            (a.description ?? "").toLowerCase().includes(term)
          );
        }
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [alertsQuery.data, alertSeverity, alertStatus, alertSearch]);

  const devicePageCount = Math.max(1, Math.ceil(filteredDevices.length / DEVICE_PAGE_SIZE));
  const alertPageCount = Math.max(1, Math.ceil(filteredAlerts.length / ALERT_PAGE_SIZE));

  const devicePageItems = filteredDevices.slice(
    (devicePage - 1) * DEVICE_PAGE_SIZE,
    devicePage * DEVICE_PAGE_SIZE,
  );
  const alertPageItems = filteredAlerts.slice(
    (alertPage - 1) * ALERT_PAGE_SIZE,
    alertPage * ALERT_PAGE_SIZE,
  );

  // File upload preview state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
  const [uploadRows, setUploadRows] = useState<Record<string, string>[]>([]);
  const [uploadSchema, setUploadSchema] = useState<{ field: string; type: string }[]>([]);

  const handleFile = (file: File) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = String(e.target?.result ?? "");
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setUploadError("File does not contain enough rows.");
          return;
        }
        const headerLine = lines[0];
        const headers = headerLine.split(",").map(h => h.trim());
        const bodyLines = lines.slice(1);
        const rows: Record<string, string>[] = bodyLines.map(line => {
          const cells = line.split(",");
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = (cells[idx] ?? "").trim();
          });
          return row;
        });

        // Simple type inference
        const schema = headers.map(field => {
          const values = rows.map(r => r[field]).filter(v => v !== "");
          let type = "string";
          if (values.length) {
            const allNumbers = values.every(v => !Number.isNaN(Number(v)));
            const allDates = values.every(v => !Number.isNaN(Date.parse(v)));
            const allBools = values.every(v => ["true", "false"].includes(v.toLowerCase()));
            if (allBools) type = "boolean";
            else if (allNumbers) type = "number";
            else if (allDates) type = "datetime";
          }
          return { field, type };
        });

        setUploadHeaders(headers);
        setUploadRows(rows.slice(0, 100));
        setUploadSchema(schema);
      } catch (err: any) {
        console.error("[Upload] Parse error", err);
        setUploadError(err?.message ?? "Failed to parse file.");
      }
    };
    reader.onerror = () => {
      setUploadError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = e => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileInput: React.ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Baltimore Data Explorer
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Explore Ubicell devices and alerts in a TruContext-style table view. Filter,
            sort, export, and experiment with your own CSV datasets.
          </p>
        </div>
      </header>

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="upload">Load File (Beta)</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle>Ubicell Devices</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {devicesQuery.isLoading
                    ? "Loading devices from Baltimore…"
                    : `${filteredDevices.length.toLocaleString()} devices (page ${devicePage} of ${devicePageCount})`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={deviceSearch}
                    onChange={e => {
                      setDevicePage(1);
                      setDeviceSearch(e.target.value);
                    }}
                    placeholder="Search by ID, name, or alert type"
                    className="pl-7 h-9 w-56"
                  />
                </div>
                <Select
                  value={deviceStatus}
                  onValueChange={val => {
                    setDevicePage(1);
                    setDeviceStatus(val);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <Filter className="mr-1 h-3 w-3" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="POWER LOSS">Power Loss</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={deviceNetwork}
                  onValueChange={val => {
                    setDevicePage(1);
                    setDeviceNetwork(val);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <Filter className="mr-1 h-3 w-3" />
                    <SelectValue placeholder="Network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Networks</SelectItem>
                    <SelectItem value="LTE">LTE</SelectItem>
                    <SelectItem value="LTE-M">LTE-M</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() =>
                    downloadCsv("baltimore_devices.csv", filteredDevices.map(d => ({
                      deviceId: d.deviceId,
                      name: d.nodeName ?? "",
                      status: d.nodeStatus ?? "",
                      networkType: d.networkType ?? "",
                      alertType: d.alertType ?? "",
                      burnHours: d.burnHours ?? "",
                      latitude: d.latitude ?? "",
                      longitude: d.longitude ?? "",
                    })))
                  }
                  disabled={!filteredDevices.length}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="max-h-[480px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">Device ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Alert</TableHead>
                      <TableHead>Burn Hours</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devicesQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-xs text-muted-foreground">
                          Loading…
                        </TableCell>
                      </TableRow>
                    ) : !devicePageItems.length ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-xs text-muted-foreground">
                          No devices match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      devicePageItems.map(device => (
                        <TableRow key={device.deviceId}>
                          <TableCell className="font-mono text-xs">
                            {device.deviceId}
                          </TableCell>
                          <TableCell className="text-xs">
                            {device.nodeName || "–"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {device.nodeStatus || "Unknown"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {device.networkType || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {device.alertType || "None"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {device.burnHours || "–"}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {device.latitude && device.longitude
                              ? `${device.latitude}, ${device.longitude}`
                              : "Unknown"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>
                  Page {devicePage} of {devicePageCount}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={devicePage <= 1}
                    onClick={() => setDevicePage(p => Math.max(1, p - 1))}
                    className="h-7 px-2"
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={devicePage >= devicePageCount}
                    onClick={() => setDevicePage(p => Math.min(devicePageCount, p + 1))}
                    className="h-7 px-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle>Smart City Alerts</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {alertsQuery.isLoading
                    ? "Loading alerts…"
                    : `${filteredAlerts.length.toLocaleString()} alerts (page ${alertPage} of ${alertPageCount})`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={alertSearch}
                    onChange={e => {
                      setAlertPage(1);
                      setAlertSearch(e.target.value);
                    }}
                    placeholder="Search by device, type, or description"
                    className="pl-7 h-9 w-64"
                  />
                </div>
                <Select
                  value={alertSeverity}
                  onValueChange={val => {
                    setAlertPage(1);
                    setAlertSeverity(val);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <Filter className="mr-1 h-3 w-3" />
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={alertStatus}
                  onValueChange={val => {
                    setAlertPage(1);
                    setAlertStatus(val);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <Filter className="mr-1 h-3 w-3" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() =>
                    downloadCsv("baltimore_alerts.csv", filteredAlerts.map(a => ({
                      timestamp: a.timestamp.toISOString(),
                      deviceId: a.deviceId,
                      alertType: a.alertType,
                      severity: a.severity,
                      status: a.status,
                      description: a.description ?? "",
                    })))
                  }
                  disabled={!filteredAlerts.length}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="max-h-[480px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Time</TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertsQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-xs text-muted-foreground">
                          Loading…
                        </TableCell>
                      </TableRow>
                    ) : !alertPageItems.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-xs text-muted-foreground">
                          No alerts match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      alertPageItems.map(alert => (
                        <TableRow key={alert.id}>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {alert.deviceId}
                          </TableCell>
                          <TableCell className="text-xs">
                            {alert.alertType}
                          </TableCell>
                          <TableCell className="text-xs capitalize">
                            {alert.severity}
                          </TableCell>
                          <TableCell className="text-xs capitalize">
                            {alert.status}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {alert.description || "–"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>
                  Page {alertPage} of {alertPageCount}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={alertPage <= 1}
                    onClick={() => setAlertPage(p => Math.max(1, p - 1))}
                    className="h-7 px-2"
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={alertPage >= alertPageCount}
                    onClick={() => setAlertPage(p => Math.min(alertPageCount, p + 1))}
                    className="h-7 px-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Load CSV / JSON (Demo)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-xs text-muted-foreground">
                Drag a CSV file exported from Ubicquia, Baltimore Open Data, or another
                source. The Data Explorer will infer columns and types, then show a
                quick preview. (In a full deployment this would be wired to PostgreSQL
                for persistent analytics.)
              </p>
              <div
                onDragOver={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleDrop}
                className="border border-dashed rounded-md px-4 py-8 flex flex-col items-center justify-center gap-3 bg-muted/30"
              >
                <Upload className="h-6 w-6 text-primary" />
                <p className="text-xs text-muted-foreground text-center max-w-md">
                  Drop a CSV file here, or click to browse.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 h-8"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".csv,text/csv";
                    input.onchange = e => handleFileInput(e as any);
                    input.click();
                  }}
                >
                  Browse Files
                </Button>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadHeaders.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Detected {uploadRows.length.toLocaleString()} rows with
                      {" "}
                      {uploadHeaders.length} columns. Showing first 100.
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {uploadSchema.map(col => (
                        <span
                          key={col.field}
                          className="rounded-full border px-2 py-0.5 bg-background/80"
                        >
                          <span className="font-mono text-[10px] mr-1">{col.field}</span>
                          <span className="uppercase text-muted-foreground">{col.type}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <ScrollArea className="max-h-[360px] rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {uploadHeaders.map(h => (
                            <TableHead key={h} className="text-xs">
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadRows.map((row, idx) => (
                          <TableRow key={idx}>
                            {uploadHeaders.map(h => (
                              <TableCell key={h} className="text-[11px] text-muted-foreground">
                                {row[h]}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />
    </div>
  );
}
