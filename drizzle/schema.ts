import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Postgres enums
 */
export const userRoleEnum = pgEnum("role", ["user", "admin"]);
export const alertSeverityEnum = pgEnum("severity", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const alertStatusEnum = pgEnum("status", [
  "active",
  "resolved",
  "acknowledged",
]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Smart city devices table - stores all Ubicquia device information
 */
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
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
  lastUpdate: timestamp("lastUpdate", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Alerts table - stores historical and active alerts
 */
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  alertType: varchar("alertType", { length: 100 }).notNull(),
  alertValue: varchar("alertValue", { length: 50 }),
  severity: alertSeverityEnum("severity").default("medium").notNull(),
  status: alertStatusEnum("status").default("active").notNull(),
  resolutionTime: integer("resolutionTime"), // in hours
  description: text("description"),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp("resolvedAt", { withTimezone: true }),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * KPIs table - stores key performance indicators over time
 */
export const kpis = pgTable("kpis", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
  avgResolutionTime: integer("avgResolutionTime"), // in hours
  feederEfficiency: integer("feederEfficiency"), // percentage
  networkStatusOnline: integer("networkStatusOnline"),
  networkStatusOffline: integer("networkStatusOffline"),
  activeAlertsCount: integer("activeAlertsCount"),
  deviceHealthScore: integer("deviceHealthScore"), // percentage
  totalDevices: integer("totalDevices"),
  onlineDevices: integer("onlineDevices"),
  offlineDevices: integer("offlineDevices"),
  powerLossCount: integer("powerLossCount"),
  tiltAlertCount: integer("tiltAlertCount"),
  lowVoltageCount: integer("lowVoltageCount"),
});

export type Kpi = typeof kpis.$inferSelect;
export type InsertKpi = typeof kpis.$inferInsert;

/**
 * Baltimore dataset table - stores general Baltimore smart city data
 */
export const baltimoreData = pgTable("baltimoreData", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  description: text("description"),
  value: text("value"),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  timestamp: timestamp("timestamp", { withTimezone: true }),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type BaltimoreData = typeof baltimoreData.$inferSelect;
export type InsertBaltimoreData = typeof baltimoreData.$inferInsert;
