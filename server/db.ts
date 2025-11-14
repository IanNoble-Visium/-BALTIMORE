import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  InsertUser,
  users,
  devices,
  alerts,
  kpis,
  baltimoreData,
  Device,
  Alert,
  Kpi,
  BaltimoreData,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _pool: any | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Device queries
export async function getAllDevices(): Promise<Device[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(devices).orderBy(desc(devices.lastUpdate));
  return result;
}

export async function getDeviceById(deviceId: string): Promise<Device | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(devices).where(eq(devices.deviceId, deviceId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDevicesByStatus(status: string): Promise<Device[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(devices).where(eq(devices.nodeStatus, status));
  return result;
}

export async function getDevicesWithAlerts(): Promise<Device[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(devices).where(sql`${devices.alertType} IS NOT NULL AND ${devices.alertType} != ''`);
  return result;
}

// Alert queries
export async function getAllAlerts(): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(alerts).orderBy(desc(alerts.timestamp));
  return result;
}

export async function getActiveAlerts(): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(alerts).where(eq(alerts.status, 'active')).orderBy(desc(alerts.timestamp));
  return result;
}

export async function getAlertsByDevice(deviceId: string): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(alerts).where(eq(alerts.deviceId, deviceId)).orderBy(desc(alerts.timestamp));
  return result;
}

export async function getAlertsByType(alertType: string): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(alerts).where(eq(alerts.alertType, alertType)).orderBy(desc(alerts.timestamp));
  return result;
}

export async function getAlertsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(alerts).where(eq(alerts.severity, severity)).orderBy(desc(alerts.timestamp));
  return result;
}

// KPI queries
export async function getLatestKPIs(): Promise<Kpi | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(kpis).orderBy(desc(kpis.timestamp)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getKPIHistory(limit: number = 24): Promise<Kpi[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(kpis).orderBy(desc(kpis.timestamp)).limit(limit);
  return result;
}

// Baltimore dataset queries
export async function getBaltimoreDataRecent(
  limit: number = 50,
): Promise<BaltimoreData[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(baltimoreData)
    .orderBy(desc(baltimoreData.createdAt))
    .limit(limit);

  return result;
}

export async function getBaltimoreDataByCategory(
  category: string,
  limit: number = 50,
): Promise<BaltimoreData[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(baltimoreData)
    .where(eq(baltimoreData.category, category))
    .orderBy(desc(baltimoreData.createdAt))
    .limit(limit);

  return result;
}

// Statistics and aggregations
export async function getDeviceStatistics() {
  const db = await getDb();
  if (!db) return null;
  
  const [totalDevices] = await db.select({ count: sql<number>`count(*)` }).from(devices);
  const [onlineDevices] = await db.select({ count: sql<number>`count(*)` }).from(devices).where(eq(devices.nodeStatus, 'ONLINE'));
  const [offlineDevices] = await db.select({ count: sql<number>`count(*)` }).from(devices).where(sql`${devices.nodeStatus} IN ('OFFLINE', 'POWER LOSS')`);
  
  return {
    total: totalDevices.count,
    online: onlineDevices.count,
    offline: offlineDevices.count,
  };
}

export async function getAlertStatistics() {
  const db = await getDb();
  if (!db) return null;
  
  const [totalAlerts] = await db.select({ count: sql<number>`count(*)` }).from(alerts);
  const [activeAlerts] = await db.select({ count: sql<number>`count(*)` }).from(alerts).where(eq(alerts.status, 'active'));
  const [resolvedAlerts] = await db.select({ count: sql<number>`count(*)` }).from(alerts).where(eq(alerts.status, 'resolved'));
  
  const alertsByType = await db.select({
    alertType: alerts.alertType,
    count: sql<number>`count(*)`,
  }).from(alerts).groupBy(alerts.alertType);
  
  const alertsBySeverity = await db.select({
    severity: alerts.severity,
    count: sql<number>`count(*)`,
  }).from(alerts).groupBy(alerts.severity);
  
  return {
    total: totalAlerts.count,
    active: activeAlerts.count,
    resolved: resolvedAlerts.count,
    byType: alertsByType,
    bySeverity: alertsBySeverity,
  };
}

// Mock data generation for demo
export async function seedMockData() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot seed data: database not available");
    return;
  }

  try {
    // Check if data already exists
    const existingDevices = await db.select({ count: sql<number>`count(*)` }).from(devices);
    if (existingDevices[0].count > 0) {
      console.log("[Database] Data already seeded, skipping...");
      return;
    }

    console.log("[Database] Seeding mock data...");

    // Baltimore coordinates range
    const latMin = 39.25;
    const latMax = 39.35;
    const lonMin = -76.68;
    const lonMax = -76.54;

    const alertTypes = ['Power Loss', 'Sudden Tilt', 'Low Voltage', null];
    const nodeStatuses = ['ONLINE', 'OFFLINE', 'POWER LOSS'];
    const networkTypes = ['LTE', 'LTE-M'];

    // Generate 100 mock devices
    for (let i = 0; i < 100; i++) {
      const lat = (latMin + Math.random() * (latMax - latMin)).toFixed(6);
      const lon = (lonMin + Math.random() * (lonMax - lonMin)).toFixed(6);
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const nodeStatus = alertType ? nodeStatuses[Math.floor(Math.random() * 2) + 1] : 'ONLINE';

      await db.insert(devices).values({
        deviceId: `BAL${String(i + 1).padStart(6, '0')}`,
        nodeName: `Baltimore Node ${i + 1}`,
        latitude: lat,
        longitude: lon,
        alertType,
        alertValue: alertType ? String(Math.floor(Math.random() * 100)) : null,
        burnHours: `${Math.floor(Math.random() * 10000)} hrs`,
        lightStatus: nodeStatus === 'ONLINE' ? 'ON' : 'OFF',
        nodeStatus,
        networkType: networkTypes[Math.floor(Math.random() * networkTypes.length)],
        firmwareVersion: '58.02.30',
        installDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        utility: 'Baltimore Gas and Electric (BGE)',
        timezone: 'America/New_York',
        tags: 'Baltimore_Smart_City',
      });

      // Create alert if device has an alert type
      if (alertType) {
        const severity = alertType === 'Sudden Tilt' ? 'critical' : alertType === 'Power Loss' ? 'high' : 'medium';
        await db.insert(alerts).values({
          deviceId: `BAL${String(i + 1).padStart(6, '0')}`,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          alertType,
          alertValue: String(Math.floor(Math.random() * 100)),
          severity,
          status: Math.random() > 0.3 ? 'active' : 'resolved',
          latitude: lat,
          longitude: lon,
          description: `${alertType} detected on Baltimore Node ${i + 1}`,
        });
      }
    }

    // Insert initial KPI data
    const stats = await getDeviceStatistics();
    const alertStats = await getAlertStatistics();

    await db.insert(kpis).values({
      avgResolutionTime: 24,
      feederEfficiency: 87,
      networkStatusOnline: stats?.online || 0,
      networkStatusOffline: stats?.offline || 0,
      activeAlertsCount: alertStats?.active || 0,
      deviceHealthScore: Math.floor(((stats?.online || 0) / (stats?.total || 1)) * 100),
      totalDevices: stats?.total || 0,
      onlineDevices: stats?.online || 0,
      offlineDevices: stats?.offline || 0,
      powerLossCount: 0,
      tiltAlertCount: 0,
      lowVoltageCount: 0,
    });

    console.log("[Database] Mock data seeded successfully!");
  } catch (error) {
    console.error("[Database] Failed to seed mock data:", error);
  }
}

// CSV Import functionality
function cleanValue(value: string | null | undefined): string | null {
  if (!value || value === '-' || value === '' || value === 'N/A' || value === 'null') {
    return null;
  }
  return value.trim();
}

function parseDatetime(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === '-') return null;
  
  try {
    // Try parsing MM/DD/YYYY HH:MMAM/PM format
    const match = dateStr.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+)(AM|PM)/i);
    if (match) {
      let [, month, day, year, hour, minute, ampm] = match;
      let h = parseInt(hour);
      if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
      
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, parseInt(minute));
    }
    
    // Try ISO format
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

function determineSeverity(alertType: string | null): 'low' | 'medium' | 'high' | 'critical' {
  if (!alertType) return 'medium';
  
  const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'Power Loss': 'high',
    'Sudden Tilt': 'critical',
    'Low Voltage': 'medium',
    'Without GPS Location': 'low',
    'High Voltage': 'high',
    'Overheating': 'high',
    'Communication Loss': 'medium',
  };
  
  const lower = alertType.toLowerCase();
  if (lower.includes('critical') || lower.includes('sudden') || lower.includes('emergency')) {
    return 'critical';
  }
  if (lower.includes('high') || lower.includes('power loss') || lower.includes('failure')) {
    return 'high';
  }
  if (lower.includes('low') || lower.includes('warning')) {
    return 'medium';
  }
  
  return severityMap[alertType] || 'medium';
}

// Map CSV column names to device fields
function mapCsvToDevice(row: Record<string, string>): Partial<InsertDevice> {
  const device: Partial<InsertDevice> = {};
  
  // Common column name mappings
  const mappings: Record<string, keyof InsertDevice> = {
    'deviceid': 'deviceId',
    'device_id': 'deviceId',
    'deveui': 'deviceId',
    'dev_eui': 'deviceId',
    'nodename': 'nodeName',
    'node_name': 'nodeName',
    'latitude': 'latitude',
    'lat': 'latitude',
    'longitude': 'longitude',
    'lng': 'longitude',
    'lon': 'longitude',
    'nodestatus': 'nodeStatus',
    'node_status': 'nodeStatus',
    'status': 'nodeStatus',
    'networktype': 'networkType',
    'network_type': 'networkType',
    'firmwareversion': 'firmwareVersion',
    'firmware_version': 'firmwareVersion',
    'firmware': 'firmwareVersion',
    'hardwareversion': 'hardwareVersion',
    'hardware_version': 'hardwareVersion',
    'hardware': 'hardwareVersion',
    'burnhours': 'burnHours',
    'burn_hours': 'burnHours',
    'lightstatus': 'lightStatus',
    'light_status': 'lightStatus',
    'alerttype': 'alertType',
    'alert_type': 'alertType',
    'alertvalue': 'alertValue',
    'alert_value': 'alertValue',
    'installdate': 'installDate',
    'install_date': 'installDate',
    'timezone': 'timezone',
    'tags': 'tags',
    'utility': 'utility',
  };
  
  // Map columns (case-insensitive)
  for (const [csvKey, value] of Object.entries(row)) {
    const lowerKey = csvKey.toLowerCase().trim();
    const deviceField = mappings[lowerKey];
    
    if (deviceField && value) {
      const cleaned = cleanValue(value);
      if (cleaned) {
        (device as any)[deviceField] = cleaned;
      }
    }
  }
  
  // Ensure deviceId exists (required field)
  if (!device.deviceId) {
    // Try to generate from other fields
    const devEui = cleanValue(row['DevEUI'] || row['dev_eui'] || row['device_id'] || '');
    if (devEui) {
      device.deviceId = devEui;
    } else {
      // Generate a unique ID
      device.deviceId = `CSV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  return device;
}

export async function importCsvData(
  rows: Record<string, string>[],
  useAI: boolean = false
): Promise<{ devicesInserted: number; alertsInserted: number; errors: string[] }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  let devicesInserted = 0;
  let alertsInserted = 0;
  const errors: string[] = [];

  try {
    for (const row of rows) {
      try {
        // Map CSV row to device
        const deviceData = mapCsvToDevice(row);
        
        if (!deviceData.deviceId) {
          errors.push(`Skipping row: No device ID found`);
          continue;
        }

        // Insert or update device
        await db
          .insert(devices)
          .values({
            ...deviceData,
            lastUpdate: new Date(),
          } as InsertDevice)
          .onConflictDoUpdate({
            target: devices.deviceId,
            set: {
              ...deviceData,
              lastUpdate: new Date(),
            } as Partial<InsertDevice>,
          });

        devicesInserted++;

        // Create alert if alert type exists or can be inferred
        let alertType = deviceData.alertType;
        let alertValue = deviceData.alertValue || null;
        let alertTimestamp = new Date();

        // Try to infer alert from status or other fields
        if (!alertType && deviceData.nodeStatus) {
          const status = (deviceData.nodeStatus || '').toUpperCase();
          if (status.includes('POWER LOSS') || status.includes('OFFLINE')) {
            alertType = 'Power Loss';
          } else if (status.includes('TILT')) {
            alertType = 'Sudden Tilt';
          } else if (status.includes('VOLTAGE')) {
            alertType = 'Low Voltage';
          }
        }

        // Use AI to infer alerts if enabled and no alert type found
        if (useAI && !alertType && ENV.openAiApiKey) {
          try {
            const { invokeLLM } = await import('./_core/llm');
            const deviceSummary = JSON.stringify({
              status: deviceData.nodeStatus,
              burnHours: deviceData.burnHours,
              lightStatus: deviceData.lightStatus,
              networkType: deviceData.networkType,
            });

            const result = await invokeLLM({
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert at analyzing smart city device data and identifying potential alerts. Return only a JSON object with "alertType" (string or null) and "severity" (low/medium/high/critical).',
                },
                {
                  role: 'user',
                  content: `Analyze this device data and determine if there should be an alert: ${deviceSummary}`,
                },
              ],
              responseFormat: { type: 'json_object' },
            });

            const content = result.choices[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              if (parsed.alertType) {
                alertType = parsed.alertType;
              }
            }
          } catch (aiError) {
            console.warn('[Import] AI inference failed, continuing without AI:', aiError);
          }
        }

        // Create alert if we have an alert type
        if (alertType) {
          const severity = determineSeverity(alertType);
          const status = (deviceData.nodeStatus || '').toUpperCase().includes('POWER LOSS') ||
                         (deviceData.nodeStatus || '').toUpperCase().includes('OFFLINE')
            ? 'active'
            : 'resolved';

          // Try to parse timestamp from CSV
          const timestampStr = row['Alert Date/Time'] || row['alert_date_time'] || row['timestamp'] || row['Timestamp'];
          if (timestampStr) {
            const parsed = parseDatetime(timestampStr);
            if (parsed) {
              alertTimestamp = parsed;
            }
          }

          await db.insert(alerts).values({
            deviceId: deviceData.deviceId,
            timestamp: alertTimestamp,
            alertType,
            alertValue,
            severity,
            status,
            latitude: deviceData.latitude || null,
            longitude: deviceData.longitude || null,
            description: `${alertType} detected on ${deviceData.nodeName || deviceData.deviceId}`,
          });

          alertsInserted++;
        }
      } catch (rowError: any) {
        errors.push(`Error processing row: ${rowError?.message || String(rowError)}`);
        console.error('[Import] Row error:', rowError);
      }
    }

    return { devicesInserted, alertsInserted, errors };
  } catch (error) {
    console.error('[Import] Failed to import CSV data:', error);
    throw error;
  }
}
