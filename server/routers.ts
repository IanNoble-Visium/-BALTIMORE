import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
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
  getBaltimoreDataRecent,
  getBaltimoreDataByCategory,
  getDeviceStatistics,
  getAlertStatistics,
  seedMockData,
  importCsvData,
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

  // Baltimore dataset
  baltimore: router({
    getRecent: publicProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(500).optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const limit = input?.limit ?? 50;
        return await getBaltimoreDataRecent(limit);
      }),

    getByCategory: publicProcedure
      .input(
        z.object({
          category: z.string(),
          limit: z.number().min(1).max(500).optional(),
        }),
      )
      .query(async ({ input }) => {
        const limit = input.limit ?? 50;
        return await getBaltimoreDataByCategory(input.category, limit);
      }),
  }),

  // AI assistant
  ai: router({
    chat: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const result = await invokeLLM({
          messages: input.messages,
        });

        const choice = result.choices[0];
        let content = "";

        if (typeof choice.message.content === "string") {
          content = choice.message.content;
        } else if (Array.isArray(choice.message.content)) {
          content = choice.message.content
            .map(part => {
              if (typeof part === "string") return part;
              if ("type" in part && (part as any).type === "text") {
                return (part as any).text ?? "";
              }
              return "";
            })
            .join("\n");
        }

        return { content, raw: result } as const;
      }),
  }),

    // Admin functions
    admin: router({
      seedData: protectedProcedure.mutation(async ({ ctx }) => {
        console.log("[Admin] seedData called", {
          user: ctx.user
            ? {
                openId: ctx.user.openId,
                email: ctx.user.email,
                role: ctx.user.role,
              }
            : null,
        });
  
        try {
          if (!ctx.user || ctx.user.role !== "admin") {
            console.warn("[Admin] seedData unauthorized", {
              hasUser: Boolean(ctx.user),
              role: ctx.user?.role,
            });
            throw new Error("Unauthorized");
          }
  
          await seedMockData();
  
          console.log("[Admin] seedData completed successfully");
          return { success: true } as const;
        } catch (error) {
          console.error("[Admin] seedData failed", error);
          throw error;
        }
      }),
    }),

    // CSV Import
    import: router({
      csv: publicProcedure
        .input(
          z.object({
            rows: z.array(z.record(z.string())),
            useAI: z.boolean().optional().default(false),
          })
        )
        .mutation(async ({ input }) => {
          try {
            if (!input.rows || !Array.isArray(input.rows)) {
              throw new Error("Invalid input: rows must be an array");
            }

            if (input.rows.length === 0) {
              throw new Error("No rows provided for import");
            }

            // Limit the number of rows to prevent server overload
            const maxRows = 1000;
            const rowsToProcess = input.rows.slice(0, maxRows);
            
            if (input.rows.length > maxRows) {
              console.warn(`[Import] Limiting import to ${maxRows} rows (${input.rows.length} provided)`);
            }

            const result = await importCsvData(rowsToProcess, input.useAI);
            return {
              success: true,
              devicesInserted: result.devicesInserted,
              alertsInserted: result.alertsInserted,
              errors: result.errors,
              warning: input.rows.length > maxRows 
                ? `Only first ${maxRows} rows were processed (${input.rows.length} total provided)`
                : undefined,
            };
          } catch (error: any) {
            console.error("[Import] CSV import failed:", error);
            const errorMessage = error?.message || String(error) || "Failed to import CSV data";
            throw new Error(errorMessage);
          }
        }),
    }),
});

export type AppRouter = typeof appRouter;
