import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Device } from "@shared/types";
import { cn } from "@/lib/utils";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

export interface MapboxMapProps {
  className?: string;
  devices: Device[];
}

/**
 * Mapbox GL map focused on Baltimore that plots smart city devices.
 *
 * - Centers on Baltimore
 * - Colors markers by device/node status
 * - Clusters visually when zoomed out (via natural proximity)
 */
export function MapboxMap({ className, devices }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

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

    mapRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Plot device markers whenever data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    devices.forEach(device => {
      const lat = parseFloat(device.latitude ?? "");
      const lng = parseFloat(device.longitude ?? "");
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      let color = "#eab308"; // default amber
      const status = (device.nodeStatus || "").toUpperCase();

      if (status === "ONLINE") color = "#22c55e"; // green
      else if (status === "OFFLINE" || status === "POWER LOSS") color = "#ef4444"; // red

      const marker = new mapboxgl.Marker({ color })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 16 }).setHTML(
            `<div style="font-size:12px;line-height:1.4;">
              <strong>${device.nodeName || device.deviceId}</strong><br/>
              Status: ${device.nodeStatus || "Unknown"}<br/>
              Alert: ${device.alertType || "None"}<br/>
              Network: ${device.networkType || "N/A"}
            </div>`
          )
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [devices]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-[500px] rounded-lg overflow-hidden", className)}
    />
  );
}
