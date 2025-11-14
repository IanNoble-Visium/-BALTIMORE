import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllDevices,
  getDeviceById,
  getDevicesByStatus,
  getDevicesWithAlerts,
  getAllAlerts,
  getActiveAlerts,
  getAlertsByDevice,
  getAlertsByType,
  getAlertsBySeverity,
  getLatestKPIs,
  getKPIHistory,
  getDeviceStatistics,
  getAlertStatistics,
  seedMockData,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Device management
  devices: router({
    getAll: publicProcedure.query(async () => {
      return await getAllDevices();
    }),
    
    getById: publicProcedure
      .input(z.object({ deviceId: z.string() }))
      .query(async ({ input }) => {
        return await getDeviceById(input.deviceId);
      }),
    
    getByStatus: publicProcedure
      .input(z.object({ status: z.string() }))
      .query(async ({ input }) => {
        return await getDevicesByStatus(input.status);
      }),
    
    getWithAlerts: publicProcedure.query(async () => {
      return await getDevicesWithAlerts();
    }),
    
    getStatistics: publicProcedure.query(async () => {
      return await getDeviceStatistics();
    }),
  }),

  // Alert management
  alerts: router({
    getAll: publicProcedure.query(async () => {
      return await getAllAlerts();
    }),
    
    getActive: publicProcedure.query(async () => {
      return await getActiveAlerts();
    }),
    
    getByDevice: publicProcedure
      .input(z.object({ deviceId: z.string() }))
      .query(async ({ input }) => {
        return await getAlertsByDevice(input.deviceId);
      }),
    
    getByType: publicProcedure
      .input(z.object({ alertType: z.string() }))
      .query(async ({ input }) => {
        return await getAlertsByType(input.alertType);
      }),
    
    getBySeverity: publicProcedure
      .input(z.object({ 
        severity: z.enum(['low', 'medium', 'high', 'critical']) 
      }))
      .query(async ({ input }) => {
        return await getAlertsBySeverity(input.severity);
      }),
    
    getStatistics: publicProcedure.query(async () => {
      return await getAlertStatistics();
    }),
  }),

  // KPI management
  kpis: router({
    getLatest: publicProcedure.query(async () => {
      return await getLatestKPIs();
    }),
    
    getHistory: publicProcedure
      .input(z.object({ limit: z.number().optional().default(24) }))
      .query(async ({ input }) => {
        return await getKPIHistory(input.limit);
      }),
  }),

  // Admin functions
  admin: router({
    seedData: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      await seedMockData();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
