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
} from "lucide-react";
import { useEffect, useState } from "react";
import { MapboxMap } from "@/components/Map";

/**
 * Main Dashboard for Baltimore Smart City
 * Features KPI cards, maps, charts, and real-time monitoring
 */
export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect to landing if not authenticated.
  // In demo mode (no OAuth config), allow access to the dashboard
  // even when there is no authenticated backend user.
  useEffect(() => {
    const hasOAuthConfig = Boolean(
      import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID,
    );

    if (hasOAuthConfig && !user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Fetch dashboard data
  const { data: kpis, isLoading: kpisLoading } = trpc.kpis.getLatest.useQuery();
  const { data: deviceStats, isLoading: devicesLoading } = trpc.devices.getStatistics.useQuery();
  const { data: alertStats, isLoading: alertsLoading } = trpc.alerts.getStatistics.useQuery();
  const { data: devices } = trpc.devices.getAll.useQuery();
  const { data: activeAlerts } = trpc.alerts.getActive.useQuery();
  const { data: baltimoreData, isLoading: baltimoreLoading } = trpc.baltimore.getRecent.useQuery({
    limit: 10,
  });

  // Seed data if needed (for demo purposes)
  const seedDataMutation = trpc.admin.seedData.useMutation();

  const handleSeedData = async () => {
    try {
      await seedDataMutation.mutateAsync();
      window.location.reload();
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  };

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
              <p className="text-xs text-muted-foreground">{user?.email || "admin@visium.com"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Data Seeding Alert */}
        {isDataEmpty && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">No Data Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The database appears to be empty. Click the button below to seed the database with mock Baltimore Smart City data.
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Devices */}
          <Card className="glass-gold">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Network className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {devicesLoading ? (
                  <div className="h-9 w-20 shimmer rounded" />
                ) : (
                  deviceStats?.total || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Smart infrastructure nodes
              </p>
            </CardContent>
          </Card>

          {/* Online Devices */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <Activity className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-1">
                {devicesLoading ? (
                  <div className="h-9 w-20 shimmer rounded" />
                ) : (
                  deviceStats?.online || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {deviceStats?.total ?
                  `${Math.round((deviceStats.online / deviceStats.total) * 100)}% operational`
                  : "0% operational"}
              </p>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">
                {alertsLoading ? (
                  <div className="h-9 w-20 shimmer rounded" />
                ) : (
                  alertStats?.active || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          {/* Device Health Score */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {kpisLoading ? (
                  <div className="h-9 w-20 shimmer rounded" />
                ) : (
                  `${kpis?.deviceHealthScore || 0}%`
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall system health
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Map Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Baltimore Device Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              {devices && devices.length > 0 ? (
                <MapboxMap className="mt-2" devices={devices} />
              ) : (
                <div className="h-[500px] bg-muted/20 rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center space-y-2">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Waiting for device data…</p>
                    <p className="text-sm text-muted-foreground">
                      {devicesLoading ? "Loading devices from Baltimore…" : "No devices found"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-chart-3" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts && activeAlerts.length > 0 ? (
                  activeAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.severity === 'critical' ? 'bg-chart-3' :
                        alert.severity === 'high' ? 'bg-chart-2' :
                        alert.severity === 'medium' ? 'bg-chart-4' :
                        'bg-chart-5'
                      }`} />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">LTE Devices</span>
                    <span className="text-sm text-muted-foreground">
                      {devices?.filter(d => d.networkType === 'LTE').length || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chart-1 transition-all"
                      style={{
                        width: `${devices?.length ?
                          (devices.filter(d => d.networkType === 'LTE').length / devices.length) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">LTE-M Devices</span>
                    <span className="text-sm text-muted-foreground">
                      {devices?.filter(d => d.networkType === 'LTE-M').length || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chart-2 transition-all"
                      style={{
                        width: `${devices?.length ?
                          (devices.filter(d => d.networkType === 'LTE-M').length / devices.length) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Total Coverage</span>
                    <span className="text-primary font-bold">
                      {deviceStats?.total ?
                        `${Math.round((deviceStats.online / deviceStats.total) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Baltimore Data Highlights */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Baltimore Data Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                          {row.subcategory ? `  b7 ${row.subcategory}` : ""}
                        </p>
                        {row.description && (
                          <p className="text-xs text-muted-foreground">
                            {row.description}
                          </p>
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
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Powered by Visium Technologies • World Wide Technology • Ubicquia</p>
        </div>
      </main>
    </div>
  );
}
