import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Cpu, Network, Radio, Activity, Cloud, Shield, Zap, MapPin } from "lucide-react";

/**
 * Ubicell UGU Showcase
 *
 * A dedicated page to explain how Ubicquia Ubicell UGU devices power
 * Baltimore's smart city deployment, including:
 * - Device diagrams and callouts
 * - Data points & telemetry
 * - Connectivity to UbiVu cloud and TruContext
 * - Operational analytics examples
 */
export default function Ubicell() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Ubicell UGU – Baltimore Smart Lighting Fabric
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Utility-grade smart lighting controllers transforming Baltimore's
            streetlight grid into a real-time sensor network for safety,
            energy, and operational awareness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Badge variant="outline" className="border-primary/60 text-primary">
            Utility Grade
          </Badge>
          <Badge variant="outline">LTE / LTE-M</Badge>
          <Badge variant="outline">Over 32 Telemetry Points</Badge>
          <Badge variant="outline">UbiVu Cloud Integrated</Badge>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Device Overview</TabsTrigger>
          <TabsTrigger value="data">Data & Telemetry</TabsTrigger>
          <TabsTrigger value="topology">Network Topology</TabsTrigger>
          <TabsTrigger value="operations">Operational Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[3fr,2fr]">
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Ubicell UGU Device Diagram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 items-start">
                  <AspectRatio ratio={4 / 3} className="rounded-lg bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-border/60 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#facc15_0,_transparent_55%),radial-gradient(circle_at_bottom,_#22c55e_0,_transparent_45%)]" />
                    <div className="relative h-full w-full flex items-center justify-center">
                      <div className="relative w-40 h-40 rounded-full border border-yellow-400/60 bg-black/60 shadow-[0_0_40px_rgba(250,204,21,0.35)] flex items-center justify-center">
                        <div className="w-24 h-24 rounded-lg border border-zinc-700 bg-zinc-900/80 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
                            UGU Controller
                          </span>
                          <span className="font-mono text-[11px] text-zinc-100">
                            UBICELL-UGU
                          </span>
                          <span className="text-[10px] text-emerald-400">
                            Online · LTE
                          </span>
                        </div>
                      </div>

                      {/* Callouts */}
                      <div className="absolute -left-4 top-6 flex items-center gap-2 text-[11px]">
                        <div className="h-px w-6 bg-yellow-400/70" />
                        <span className="bg-black/70 px-2 py-1 rounded border border-yellow-500/40">
                          NEMA Socket Mount
                        </span>
                      </div>
                      <div className="absolute -right-4 top-14 flex items-center gap-2 text-[11px]">
                        <span className="bg-black/70 px-2 py-1 rounded border border-emerald-500/40">
                          Line & Load Metering
                        </span>
                        <div className="h-px w-6 bg-emerald-400/70" />
                      </div>
                      <div className="absolute left-6 -bottom-3 flex items-center gap-2 text-[11px]">
                        <div className="h-px w-6 bg-sky-400/70" />
                        <span className="bg-black/70 px-2 py-1 rounded border border-sky-500/40">
                          LTE / LTE-M Modem
                        </span>
                      </div>
                      <div className="absolute right-6 -bottom-3 flex items-center gap-2 text-[11px]">
                        <span className="bg-black/70 px-2 py-1 rounded border border-fuchsia-500/40">
                          GPS & Tilt Sensor
                        </span>
                        <div className="h-px w-6 bg-fuchsia-400/70" />
                      </div>
                    </div>
                  </AspectRatio>

                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                      Ubicell UGU controllers retrofit directly onto existing
                      NEMA streetlight sockets, instantly upgrading the city
                      grid into a secure, IP-addressable platform.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <Activity className="h-3 w-3 text-emerald-400" />
                          Power & Health
                        </p>
                        <ul className="space-y-0.5 text-muted-foreground">
                          <li>• Voltage, current, power factor</li>
                          <li>• Last-gasp outage detection</li>
                          <li>• Burn hours & dimming status</li>
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <Radio className="h-3 w-3 text-sky-400" />
                          Communications
                        </p>
                        <ul className="space-y-0.5 text-muted-foreground">
                          <li>• LTE / LTE-M backhaul</li>
                          <li>• Secure UbiVu cloud tunnel</li>
                          <li>• TruContext data feed ready</li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Typical Pole Height</p>
                        <p className="font-semibold">30–40 ft</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Reporting Interval</p>
                        <p className="font-semibold">15–60 min</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Telemetry Channels</p>
                        <p className="font-semibold">32+ signals</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  From Pole to Cloud to TruContext
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  Ubicell devices stream diagnostics into the UbiVu cloud. From
                  there, TruContext securely ingests metrics over HTTP-based
                  data sources to power the Baltimore Smart City command
                  center.
                </p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border bg-background/60 p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-semibold">Field Edge</span>
                    </div>
                    <ul className="text-muted-foreground space-y-0.5">
                      <li>• Ubicell UGU on NEMA socket</li>
                      <li>• Line/load metering</li>
                      <li>• GPS & tilt monitoring</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border bg-background/60 p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-3.5 w-3.5 text-sky-400" />
                      <span className="font-semibold">UbiVu Cloud</span>
                    </div>
                    <ul className="text-muted-foreground space-y-0.5">
                      <li>• Device inventory</li>
                      <li>• Event & alarm history</li>
                      <li>• REST / file export</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border bg-background/60 p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-semibold">TruContext</span>
                    </div>
                    <ul className="text-muted-foreground space-y-0.5">
                      <li>• Context graphs</li>
                      <li>• KPIs & incident timelines</li>
                      <li>• AI-assisted triage</li>
                    </ul>
                  </div>
                </div>

                <Alert variant="default" className="border-amber-400/60 bg-amber-950/40">
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  <AlertTitle className="text-xs font-semibold">
                    Demo Mode
                  </AlertTitle>
                  <AlertDescription className="text-xs text-amber-100/90">
                    This environment uses synthetic Ubicell-like data seeded
                    into PostgreSQL. In production, these diagrams map 1:1 to
                    live devices streaming through UbiVu.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data & Telemetry Tab */}
        <TabsContent value="data" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Telemetry Channels & Use Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[360px] pr-2">
                <div className="grid gap-4 md:grid-cols-3 text-xs">
                  <div className="space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      Power & Energy
                    </p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>• Line & load voltage</li>
                      <li>• Current & power factor</li>
                      <li>• Energy consumption (kWh)</li>
                      <li>• Dimming level & schedules</li>
                      <li>• Copper theft detection</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5 text-emerald-400" />
                      Asset Health
                    </p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>• Burn hours & lamp life</li>
                      <li>• Tilt / vibration events</li>
                      <li>• Fixture failure signatures</li>
                      <li>• Last-gasp outage events</li>
                      <li>• Environmental temperature</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      <Network className="h-3.5 w-3.5 text-sky-400" />
                      Network & Location
                    </p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>• GPS coordinates</li>
                      <li>• LTE / LTE-M signal quality</li>
                      <li>• Firmware & hardware version</li>
                      <li>• Utility / circuit identifiers</li>
                      <li>• Time zone & NTP sync status</li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 md:grid-cols-2 text-xs">
                  <div className="space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      Security & Safety Signals
                    </p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>• Turbulent power patterns indicating tampering</li>
                      <li>• Cabinet door / access events (where wired)</li>
                      <li>• Geographic correlation with crime hot spots</li>
                      <li>• Support for camera / sensor payloads at the pole</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      <Cloud className="h-3.5 w-3.5 text-sky-400" />
                      TruContext Analytics Examples
                    </p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>• Average resolution time for power-loss alerts</li>
                      <li>• Feeder efficiency by circuit and geography</li>
                      <li>• Correlation between weather and failures</li>
                      <li>• Impact of dimming strategies on outage rate</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Topology Tab */}
        <TabsContent value="topology" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Logical Network Topology (Conceptual)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                In the full implementation, this section becomes an interactive
                force-directed graph of all Ubicell nodes and their upstream
                relationships. For the demo, it explains how TruContext thinks
                about the network:
              </p>

              <div className="grid gap-4 md:grid-cols-[2fr,3fr] text-xs">
                <div className="space-y-2">
                  <p className="font-semibold">Node Types</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <span className="font-semibold text-foreground">Control Station</span> – utility or city ops center</li>
                    <li>• <span className="font-semibold text-foreground">Feeder / Circuit</span> – logical electrical segments</li>
                    <li>• <span className="font-semibold text-foreground">Ubicell Controller</span> – per-pole intelligence</li>
                    <li>• <span className="font-semibold text-foreground">Sensor Payload</span> – cameras, microphones, IoT sensors</li>
                  </ul>

                  <Separator />

                  <p className="font-semibold">Edge Types</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Primary link (power & control)</li>
                    <li>• Backup / redundant connection</li>
                    <li>• Data flow from pole to cloud</li>
                    <li>• Cross-domain relationships (crime, traffic, weather)</li>
                  </ul>
                </div>

                <div className="rounded-lg border bg-background/40 p-4">
                  <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                    Coming Next
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    This demo stops just short of visualizing the full graph.
                    The next iteration will use a 3D or force-directed layout
                    to animate how incidents ripple through the network in
                    real time.
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>• Click any node to drill into recent alerts & KPIs</li>
                    <li>• Filter by network type, utility feeder, or vendor</li>
                    <li>• Highlight latent risk concentrations by combining
                      Ubicell signals with crime, traffic, or weather data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                How Baltimore Uses Ubicell + TruContext
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 md:grid-cols-3 text-xs">
                <div className="rounded-lg border bg-background/60 p-3 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Outage & Power Quality
                  </p>
                  <p className="text-muted-foreground">
                    Detect power loss, brownouts, and abnormal load patterns
                    in near-real time and route field crews where they matter
                    most.
                  </p>
                </div>
                <div className="rounded-lg border bg-background/60 p-3 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    Safety & Visibility
                  </p>
                  <p className="text-muted-foreground">
                    Combine lighting status, crime data, and pedestrian
                    traffic to identify where brighter lighting can improve
                    safety outcomes.
                  </p>
                </div>
                <div className="rounded-lg border bg-background/60 p-3 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Cloud className="h-3.5 w-3.5 text-sky-400" />
                    Planning & Equity
                  </p>
                  <p className="text-muted-foreground">
                    Use long-term analytics to prioritize upgrades and
                    maintenance in neighborhoods that have historically been
                    underserved.
                  </p>
                </div>
              </div>

              <Separator />

              <p className="text-xs text-muted-foreground">
                The current Baltimore Smart City demo shows how this data
                flows into KPIs, maps, and AI-assisted investigations. As
                Ubicell devices go live in the field, this page becomes the
                place city leaders can explain exactly how the hardware,
                network, and analytics stack come together.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
