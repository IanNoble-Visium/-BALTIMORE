import { describe, it, expect } from "vitest";
import { getDb, seedMockData, getAlertStatistics } from "./db";
import { alerts, devices } from "../drizzle/schema";

// NOTE: These tests exercise the real PostgreSQL database used by the app.
// They require process.env.DATABASE_URL to be set to a reachable database.
// If the database is not available, the tests will log a message and
// effectively skip, so they will not fail CI purely due to a missing DB.

describe("seedMockData and getAlertStatistics", () => {
  it("seedMockData creates alerts with expected non-null alert types", async () => {
    const db = await getDb();
    if (!db) {
      console.warn(
        "[Tests] Skipping seedMockData alert type test: database not available (DATABASE_URL not set?)",
      );
      return;
    }

    // Start from a clean slate so the seed logic always runs.
    await db.delete(alerts);
    await db.delete(devices);

    await seedMockData();

    const allAlerts = await db.select().from(alerts);
    expect(allAlerts.length).toBeGreaterThan(0);

    const allowedTypes = new Set(["Power Loss", "Sudden Tilt", "Low Voltage"]);

    for (const alert of allAlerts) {
      // Schema defines alertType as NOT NULL; seeded alerts should respect this.
      expect(alert.alertType).toBeTruthy();
      expect(allowedTypes.has(alert.alertType as string)).toBe(true);
    }
  });

  it("getAlertStatistics returns byType with the correct structure", async () => {
    const db = await getDb();
    if (!db) {
      console.warn(
        "[Tests] Skipping getAlertStatistics structure test: database not available (DATABASE_URL not set?)",
      );
      return;
    }

    // Ensure we have a known seeded dataset.
    await db.delete(alerts);
    await db.delete(devices);
    await seedMockData();

    const stats = await getAlertStatistics();
    expect(stats).not.toBeNull();

    const byType = stats!.byType;
    expect(Array.isArray(byType)).toBe(true);
    expect(byType.length).toBeGreaterThan(0);

    for (const row of byType as Array<{ alertType: string; count: number }>) {
      expect(typeof row.alertType).toBe("string");
      expect(row.alertType.length).toBeGreaterThan(0);
      expect(typeof row.count).toBe("number");
      expect(row.count).toBeGreaterThan(0);
    }
  });
});

