import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, datetime, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Smart city devices table - stores all Ubicquia device information
 */
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull().unique(),
  nodeName: varchar("nodeName", { length: 255 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  alertType: varchar("alertType", { length: 100 }),
  alertValue: varchar("alertValue", { length: 50 }),
  alertDuration: varchar("alertDuration", { length: 50 }),
  burnHours: varchar("burnHours", { length: 50 }),
  lightStatus: varchar("lightStatus", { length: 50 }),
  nodeStatus: varchar("nodeStatus", { length: 50 }),
  networkType: varchar("networkType", { length: 50 }),
  firmwareVersion: varchar("firmwareVersion", { length: 50 }),
  hardwareVersion: varchar("hardwareVersion", { length: 50 }),
  installDate: varchar("installDate", { length: 100 }),
  utility: varchar("utility", { length: 255 }),
  timezone: varchar("timezone", { length: 100 }),
  tags: text("tags"),
  lastUpdate: timestamp("lastUpdate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Alerts table - stores historical and active alerts
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  alertType: varchar("alertType", { length: 100 }).notNull(),
  alertValue: varchar("alertValue", { length: 50 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["active", "resolved", "acknowledged"]).default("active").notNull(),
  resolutionTime: int("resolutionTime"), // in hours
  description: text("description"),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * KPIs table - stores key performance indicators over time
 */
export const kpis = mysqlTable("kpis", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  avgResolutionTime: int("avgResolutionTime"), // in hours
  feederEfficiency: int("feederEfficiency"), // percentage
  networkStatusOnline: int("networkStatusOnline"),
  networkStatusOffline: int("networkStatusOffline"),
  activeAlertsCount: int("activeAlertsCount"),
  deviceHealthScore: int("deviceHealthScore"), // percentage
  totalDevices: int("totalDevices"),
  onlineDevices: int("onlineDevices"),
  offlineDevices: int("offlineDevices"),
  powerLossCount: int("powerLossCount"),
  tiltAlertCount: int("tiltAlertCount"),
  lowVoltageCount: int("lowVoltageCount"),
});

export type Kpi = typeof kpis.$inferSelect;
export type InsertKpi = typeof kpis.$inferInsert;

/**
 * Baltimore dataset table - stores general Baltimore smart city data
 */
export const baltimoreData = mysqlTable("baltimoreData", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  description: text("description"),
  value: text("value"),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  timestamp: timestamp("timestamp"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BaltimoreData = typeof baltimoreData.$inferSelect;
export type InsertBaltimoreData = typeof baltimoreData.$inferInsert;
