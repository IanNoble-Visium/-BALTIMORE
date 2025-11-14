import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Device } from "@shared/types";
import { cn } from "@/lib/utils";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

export interface MapboxMapProps {
  className?: string;
  devices: Device[];
  /**
   * Optional callback when a single device point is clicked.
   * Used by the dashboard to open drill-down modals.
   */
  onDeviceClick?: (deviceId: string) => void;
}

/**
 * Mapbox GL map focused on Baltimore that plots smart city devices.
 *
 * Features:
 * - Centers on Baltimore
 * - Heatmap layer for incident density
 * - Clustering for overlapping nodes
 * - Circle layer styled by node status
 * - Click clusters to zoom in, click single nodes to drill down
 */
export function MapboxMap({ className, devices, onDeviceClick }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapboxgl.accessToken) {
      console.error("VITE_MAPBOX_ACCESS_TOKEN is not set – map will not render.");
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-76.6122, 39.2904], // Baltimore
      zoom: 12,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Base source for devices with clustering enabled
      map.addSource("devices", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 14,
      });

      // Heatmap layer for zoomed-out density view
      map.addLayer({
        id: "devices-heat",
        type: "heatmap",
        source: "devices",
        maxzoom: 14,
        paint: {
          // Increase the heatmap weight based on point count
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            0,
            0,
            50,
            1,
          ],
          // Increase the heatmap color weight by zoom level
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.5,
            14,
            2,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.2,
            "#22c55e",
            0.4,
            "#eab308",
            0.7,
            "#f97316",
            1,
            "#ef4444",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            15,
            14,
            40,
          ],
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.9,
            14,
            0,
          ],
        },
      });

      // Clustered circles
      map.addLayer({
        id: "devices-clusters",
        type: "circle",
        source: "devices",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#22c55e",
            20,
            "#eab308",
            50,
            "#f97316",
            100,
            "#ef4444",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            14,
            20,
            18,
            50,
            22,
            100,
            28,
          ],
          "circle-opacity": 0.85,
        },
      });

      // Cluster count labels
      map.addLayer({
        id: "devices-cluster-count",
        type: "symbol",
        source: "devices",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#020617",
        },
      });

      // Single device circles (unclustered points)
      map.addLayer({
        id: "devices-unclustered",
        type: "circle",
        source: "devices",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "match",
            ["get", "nodeStatus"],
            "ONLINE",
            "#22c55e",
            "POWER LOSS",
            "#ef4444",
            "OFFLINE",
            "#ef4444",
            /* other */ "#eab308",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#020617",
        },
      });

      // 3D buildings layer for extra depth when zoomed in
      const style = map.getStyle();
      const labelLayerId = style.layers?.find(
        layer => layer.type === "symbol" && (layer.layout as any)?.["text-field"],
      )?.id;

      if (!map.getLayer("3d-buildings")) {
        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#4b5563",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                16,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                16,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.6,
            },
          },
          labelLayerId,
        );
      }

      // Click cluster to zoom in
      map.on("click", "devices-clusters", e => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["devices-clusters"],
        });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("devices") as mapboxgl.GeoJSONSource | undefined;
        if (!source || clusterId === undefined) return;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          map.easeTo({
            center: (features[0].geometry as any).coordinates as [number, number],
            zoom,
          });
        });
      });

      // Click single device to show popup + trigger drill-down
      map.on("click", "devices-unclustered", e => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;

        const coordinates = (feature.geometry as any).coordinates.slice() as [number, number];
        const props = feature.properties as any;
        const deviceId = props?.deviceId as string | undefined;
        const nodeName = props?.nodeName as string | undefined;
        const nodeStatus = props?.nodeStatus as string | undefined;
        const alertType = props?.alertType as string | undefined;
        const networkType = props?.networkType as string | undefined;

        new mapboxgl.Popup({ offset: 16 })
          .setLngLat(coordinates)
          .setHTML(
            `<div style="font-size:12px;line-height:1.4;min-width:180px;">
              <strong>${nodeName || deviceId || "Device"}</strong><br/>
              Status: ${nodeStatus || "Unknown"}<br/>
              Alert: ${alertType || "None"}<br/>
              Network: ${networkType || "N/A"}
            </div>`
          )
          .addTo(map);

        if (deviceId && onDeviceClick) {
          onDeviceClick(deviceId);
        }
      });

      // Change the cursor to a pointer when the mouse is over the clusters or points
      const hoverLayers = ["devices-clusters", "devices-unclustered"];
      hoverLayers.forEach(layerId => {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      });

      // Subtle 3D flyover path across key Baltimore viewpoints
      const flyoverKeyframes: {
        center: [number, number];
        zoom: number;
        pitch: number;
        bearing: number;
        duration: number;
      }[] = [
        {
          center: [-76.6122, 39.2904], // Downtown
          zoom: 13.2,
          pitch: 60,
          bearing: -20,
          duration: 4000,
        },
        {
          center: [-76.609, 39.285], // Inner Harbor
          zoom: 14,
          pitch: 70,
          bearing: 10,
          duration: 4500,
        },
        {
          center: [-76.621, 39.283], // Camden Yards
          zoom: 14,
          pitch: 60,
          bearing: 120,
          duration: 4500,
        },
        {
          center: [-76.6005, 39.3005], // Johns Hopkins / East Baltimore corridor
          zoom: 13.5,
          pitch: 65,
          bearing: -90,
          duration: 4500,
        },
      ];

      let currentKeyframe = 0;

      const runFlyover = () => {
        if (currentKeyframe >= flyoverKeyframes.length) {
          // Return to original viewpoint at the end
          map.easeTo({
            center: [-76.6122, 39.2904],
            zoom: 12,
            pitch: 45,
            bearing: -17.6,
            duration: 3000,
            essential: true,
          });
          return;
        }

        const frame = flyoverKeyframes[currentKeyframe];
        currentKeyframe += 1;

        map.flyTo({
          center: frame.center,
          zoom: frame.zoom,
          pitch: frame.pitch,
          bearing: frame.bearing,
          duration: frame.duration,
          essential: true,
        });

        setTimeout(runFlyover, frame.duration + 800);
      };

      // Kick off a single cinematic flyover shortly after load
      setTimeout(runFlyover, 1200);

      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Update GeoJSON source whenever devices change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource("devices") as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    const features: GeoJSON.Feature<GeoJSON.Point, any>[] = devices
      .map(device => {
        const lat = parseFloat(device.latitude ?? "");
        const lng = parseFloat(device.longitude ?? "");
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          properties: {
            deviceId: device.deviceId,
            nodeName: device.nodeName ?? "",
            nodeStatus: (device.nodeStatus ?? "").toUpperCase(),
            alertType: device.alertType ?? "",
            networkType: device.networkType ?? "",
          },
        } as GeoJSON.Feature<GeoJSON.Point>;
      })
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => Boolean(f));

    const data: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features,
    };

    source.setData(data);
  }, [devices, mapLoaded]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-[500px] rounded-lg overflow-hidden", className)}
    />
  );
}
