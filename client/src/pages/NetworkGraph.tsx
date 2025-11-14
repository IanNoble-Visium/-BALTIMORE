import { useEffect, useRef, useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import * as d3 from "d3";
import { Network, Filter, ZoomIn, ZoomOut, RotateCcw, Info } from "lucide-react";

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

// Node type colors
const NODE_COLORS = {
  "Control Station": BALTIMORE_COLORS.primary,
  Device: BALTIMORE_COLORS.info,
  Sensor: BALTIMORE_COLORS.success,
};

// Edge type colors and styles
const EDGE_COLORS = {
  "Primary Link": BALTIMORE_COLORS.success,
  "Backup Link": BALTIMORE_COLORS.warning,
  "Data Flow": BALTIMORE_COLORS.info,
};

type NodeType = "Control Station" | "Device" | "Sensor";
type EdgeType = "Primary Link" | "Backup Link" | "Data Flow";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: NodeType;
  deviceId?: string;
  status?: string;
  networkType?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
  type: EdgeType;
  id: string;
}

/**
 * Network Relationship Graph Page
 * Features D3.js force-directed graph with interactive nodes and edges
 */
export default function NetworkGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeFilter, setNodeFilter] = useState<Set<NodeType>>(
    new Set<NodeType>(["Control Station", "Device", "Sensor"])
  );
  const [edgeFilter, setEdgeFilter] = useState<Set<EdgeType>>(
    new Set<EdgeType>(["Primary Link", "Backup Link", "Data Flow"])
  );
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch devices data
  const { data: devices, isLoading } = trpc.devices.getAll.useQuery(undefined, {
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Generate graph data from devices
  const graphData = useMemo(() => {
    if (!devices || devices.length === 0) return { nodes: [], links: [] };

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Create Control Stations (hubs)
    const controlStations = [
      { id: "cs-1", name: "Control Station North", lat: 39.3, lng: -76.6 },
      { id: "cs-2", name: "Control Station South", lat: 39.25, lng: -76.6 },
      { id: "cs-3", name: "Control Station East", lat: 39.28, lng: -76.55 },
    ];

    controlStations.forEach((cs) => {
      const node: GraphNode = {
        id: cs.id,
        name: cs.name,
        type: "Control Station",
      };
      nodes.push(node);
      nodeMap.set(cs.id, node);
    });

    // Create Devices from database
    devices.forEach((device, index) => {
      const node: GraphNode = {
        id: device.deviceId,
        name: device.nodeName || device.deviceId,
        type: "Device",
        deviceId: device.deviceId,
        status: device.nodeStatus || "UNKNOWN",
        networkType: device.networkType || "UNKNOWN",
      };
      nodes.push(node);
      nodeMap.set(device.deviceId, node);
    });

    // Create Sensors (subset of devices or virtual sensors)
    const sensorCount = Math.min(5, Math.floor(devices.length * 0.1));
    for (let i = 0; i < sensorCount; i++) {
      const device = devices[i];
      if (device) {
        const sensorId = `sensor-${device.deviceId}`;
        const node: GraphNode = {
          id: sensorId,
          name: `Sensor ${device.deviceId}`,
          type: "Sensor",
          deviceId: device.deviceId,
          status: device.nodeStatus || "UNKNOWN",
        };
        nodes.push(node);
        nodeMap.set(sensorId, node);

        // Link sensor to its device
        links.push({
          id: `link-${sensorId}-${device.deviceId}`,
          source: sensorId,
          target: device.deviceId,
          type: "Data Flow",
        });
      }
    }

    // Create links between nodes
    // Link devices to control stations
    const devicesPerStation = Math.ceil(devices.length / controlStations.length);
    devices.forEach((device, index) => {
      const stationIndex = Math.floor(index / devicesPerStation) % controlStations.length;
      const stationId = controlStations[stationIndex].id;

      // Primary link to control station
      links.push({
        id: `link-primary-${device.deviceId}-${stationId}`,
        source: device.deviceId,
        target: stationId,
        type: "Primary Link",
      });

      // Backup link to another station
      const backupStationIndex = (stationIndex + 1) % controlStations.length;
      const backupStationId = controlStations[backupStationIndex].id;
      links.push({
        id: `link-backup-${device.deviceId}-${backupStationId}`,
        source: device.deviceId,
        target: backupStationId,
        type: "Backup Link",
      });
    });

    // Link some devices to each other (data flow)
    const deviceLinks = Math.min(10, Math.floor(devices.length * 0.2));
    for (let i = 0; i < deviceLinks; i++) {
      const sourceIndex = Math.floor(Math.random() * devices.length);
      const targetIndex = Math.floor(Math.random() * devices.length);
      if (sourceIndex !== targetIndex) {
        links.push({
          id: `link-data-${devices[sourceIndex].deviceId}-${devices[targetIndex].deviceId}`,
          source: devices[sourceIndex].deviceId,
          target: devices[targetIndex].deviceId,
          type: "Data Flow",
        });
      }
    }

    return { nodes, links };
  }, [devices]);

  // Filter nodes and links
  const filteredData = useMemo(() => {
    const filteredNodes = graphData.nodes.filter((node) =>
      nodeFilter.has(node.type)
    );
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphData.links.filter(
      (link) =>
        edgeFilter.has(link.type) &&
        nodeIds.has(typeof link.source === "string" ? link.source : link.source.id) &&
        nodeIds.has(typeof link.target === "string" ? link.target : link.target.id)
    );
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, nodeFilter, edgeFilter]);

  // Initialize and update D3 graph
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredData.nodes.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous content
    svg.selectAll("*").remove();

    // Set up zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom as any);

    const g = svg.append("g");

    // Create force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(filteredData.nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(filteredData.links)
          .id((d) => d.id)
          .distance(100)
          .strength(0.5)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    simulationRef.current = simulation;

    // Draw links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(filteredData.links)
      .enter()
      .append("line")
      .attr("stroke", (d) => EDGE_COLORS[d.type])
      .attr("stroke-width", (d) => {
        if (d.type === "Primary Link") return 3;
        if (d.type === "Backup Link") return 2;
        return 1.5;
      })
      .attr("stroke-dasharray", (d) => {
        if (d.type === "Backup Link") return "5,5";
        return "0";
      })
      .attr("opacity", 0.6);

    // Draw nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(filteredData.nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => {
        if (d.type === "Control Station") return 12;
        if (d.type === "Device") return 8;
        return 6;
      })
      .attr("fill", (d) => NODE_COLORS[d.type])
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGCircleElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", (n: any) => {
          if (n.type === "Control Station") return 16;
          if (n.type === "Device") return 10;
          return 8;
        });
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", (n: any) => {
          if (n.type === "Control Station") return 12;
          if (n.type === "Device") return 8;
          return 6;
        });
      });

    // Add labels
    const labels = g
      .append("g")
      .attr("class", "labels")
      .selectAll<SVGTextElement, GraphNode>("text")
      .data(filteredData.nodes)
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .attr("dx", 15)
      .attr("dy", 4)
      .style("pointer-events", "none");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => {
          const source = typeof d.source === "string" ? null : d.source;
          return source?.x ?? 0;
        })
        .attr("y1", (d) => {
          const source = typeof d.source === "string" ? null : d.source;
          return source?.y ?? 0;
        })
        .attr("x2", (d) => {
          const target = typeof d.target === "string" ? null : d.target;
          return target?.x ?? 0;
        })
        .attr("y2", (d) => {
          const target = typeof d.target === "string" ? null : d.target;
          return target?.y ?? 0;
        });

      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

      labels.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    });

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      svg.attr("width", newWidth).attr("height", newHeight);
      simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
      simulation.alpha(1).restart();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      simulation.stop();
    };
  }, [filteredData]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const zoom = d3.zoom<SVGSVGElement, unknown>();
      svg.transition().call(zoom.scaleBy as any, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const zoom = d3.zoom<SVGSVGElement, unknown>();
      svg.transition().call(zoom.scaleBy as any, 1 / 1.5);
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const zoom = d3.zoom<SVGSVGElement, unknown>();
      svg.transition().call(zoom.transform as any, d3.zoomIdentity);
      setZoomLevel(1);
    }
  };

  const toggleNodeFilter = (type: NodeType) => {
    const newFilter = new Set(nodeFilter);
    if (newFilter.has(type)) {
      newFilter.delete(type);
    } else {
      newFilter.add(type);
    }
    setNodeFilter(newFilter);
  };

  const toggleEdgeFilter = (type: EdgeType) => {
    const newFilter = new Set(edgeFilter);
    if (newFilter.has(type)) {
      newFilter.delete(type);
    } else {
      newFilter.add(type);
    }
    setEdgeFilter(newFilter);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading network graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Network Relationship Graph</h1>
          <p className="text-muted-foreground mt-1">
            Interactive force-directed graph showing network topology
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Controls and Legend */}
        <div className="space-y-4">
          {/* Zoom Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Zoom Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomIn}
                  className="flex-1"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomOut}
                  className="flex-1"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Zoom: {(zoomLevel * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          {/* Node Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Node Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["Control Station", "Device", "Sensor"] as NodeType[]).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`node-${type}`}
                    checked={nodeFilter.has(type)}
                    onCheckedChange={() => toggleNodeFilter(type)}
                  />
                  <Label
                    htmlFor={`node-${type}`}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: NODE_COLORS[type] }}
                    />
                    <span className="text-sm">{type}</span>
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Edge Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Edge Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["Primary Link", "Backup Link", "Data Flow"] as EdgeType[]).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edge-${type}`}
                    checked={edgeFilter.has(type)}
                    onCheckedChange={() => toggleEdgeFilter(type)}
                  />
                  <Label
                    htmlFor={`edge-${type}`}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <div
                      className="w-4 h-0.5"
                      style={{
                        backgroundColor: EDGE_COLORS[type],
                        borderStyle: type === "Backup Link" ? "dashed" : "solid",
                      }}
                    />
                    <span className="text-sm">{type}</span>
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Node Types</p>
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs">{type}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground">Edge Types</p>
                {Object.entries(EDGE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-4 h-0.5"
                      style={{
                        backgroundColor: color,
                        borderStyle: type === "Backup Link" ? "dashed" : "solid",
                      }}
                    />
                    <span className="text-xs">{type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graph Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Network Topology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={containerRef}
                className="w-full h-[600px] bg-accent/50 rounded-lg overflow-hidden relative"
              >
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  className="cursor-move"
                />
                {filteredData.nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No nodes to display. Adjust filters to show nodes.
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click and drag nodes to reposition. Use zoom controls or mouse wheel to zoom.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Node Details Modal */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedNode?.name}</DialogTitle>
            <DialogDescription>
              {selectedNode?.type} Details
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedNode && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Type</p>
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: NODE_COLORS[selectedNode.type],
                        color: "#000",
                      }}
                    >
                      {selectedNode.type}
                    </Badge>
                  </div>
                  {selectedNode.deviceId && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Device ID
                      </p>
                      <p className="text-sm">{selectedNode.deviceId}</p>
                    </div>
                  )}
                  {selectedNode.status && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Status</p>
                      <Badge
                        variant="outline"
                        className={
                          selectedNode.status === "ONLINE"
                            ? "bg-green-500/20 text-green-500"
                            : selectedNode.status === "OFFLINE"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }
                      >
                        {selectedNode.status}
                      </Badge>
                    </div>
                  )}
                  {selectedNode.networkType && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Network Type
                      </p>
                      <p className="text-sm">{selectedNode.networkType}</p>
                    </div>
                  )}
                </div>
                {selectedNode.deviceId && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">
                      Connected Links
                    </p>
                    <div className="space-y-1">
                      {filteredData.links
                        .filter(
                          (link) =>
                            (typeof link.source === "string"
                              ? link.source
                              : link.source.id) === selectedNode.id ||
                            (typeof link.target === "string"
                              ? link.target
                              : link.target.id) === selectedNode.id
                        )
                        .map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center gap-2 text-sm p-2 bg-accent rounded"
                          >
                            <div
                              className="w-3 h-0.5"
                              style={{ backgroundColor: EDGE_COLORS[link.type] }}
                            />
                            <span>{link.type}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

