import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
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

    speakAlert: publicProcedure
      .input(
        z.object({
          title: z.string(),
          deviceName: z.string().optional(),
          severity: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        if (!ENV.openAiApiKey) {
          throw new Error("OpenAI API key is not configured");
        }

        const voices = ["alloy", "shimmer", "verse"] as const;
        const voice = voices[Math.floor(Math.random() * voices.length)];

        const { title, deviceName, severity } = input;
        const parts = [
          "Urgent alert.",
          title,
          deviceName ? `at device ${deviceName}.` : undefined,
          severity ? `Severity ${severity}.` : undefined,
        ].filter(Boolean);

        const text = parts.join(" ");

        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "tts-1",
            voice,
            input: text,
            format: "mp3",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error("[AI] speakAlert OpenAI error", response.status, errorText);
          throw new Error("Failed to generate alert audio");
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

        return { audioBase64, voice } as const;
      }),

    speakText: publicProcedure
      .input(
        z.object({
          text: z.string(),
          tone: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        if (!ENV.openAiApiKey) {
          throw new Error("OpenAI API key is not configured");
        }

        const voices = ["alloy", "shimmer", "verse"] as const;
        const voice = voices[Math.floor(Math.random() * voices.length)];

        const promptText = input.tone
          ? `${input.tone.trim()} ${input.text}`
          : input.text;

        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "tts-1",
            voice,
            input: promptText,
            format: "mp3",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error("[AI] speakText OpenAI error", response.status, errorText);
          throw new Error("Failed to generate speech audio");
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

        return { audioBase64, voice } as const;
      }),

    detectAlertPatterns: publicProcedure
      .input(
        z.object({
          timeRange: z.enum(["24h", "7d", "30d"]).optional().default("7d"),
        })
      )
      .query(async ({ input }) => {
        const alerts = await getAllAlerts();
        const devices = await getAllDevices();
        
        // Filter alerts by time range
        const now = new Date();
        const timeRangeMs = {
          "24h": 24 * 60 * 60 * 1000,
          "7d": 7 * 24 * 60 * 60 * 1000,
          "30d": 30 * 24 * 60 * 60 * 1000,
        }[input.timeRange];
        
        const recentAlerts = alerts.filter(alert => {
          const alertTime = new Date(alert.timestamp);
          return now.getTime() - alertTime.getTime() <= timeRangeMs;
        });

        if (recentAlerts.length === 0) {
          return {
            patterns: [],
            summary: "No alerts found in the selected time range.",
          };
        }

        // Prepare data for AI analysis
        const alertData = recentAlerts.map(alert => ({
          type: alert.alertType,
          severity: alert.severity,
          deviceId: alert.deviceId,
          timestamp: alert.timestamp,
          description: alert.description,
        }));

        const deviceMap = new Map(devices.map(d => [d.deviceId, d]));
        const enrichedAlerts = alertData.map(alert => {
          const device = deviceMap.get(alert.deviceId);
          return {
            ...alert,
            nodeName: device?.nodeName,
            networkType: device?.networkType,
            location: device?.latitude && device?.longitude 
              ? `${device.latitude},${device.longitude}` 
              : null,
          };
        });

        // Use AI to detect patterns
        const systemPrompt = `You are an AI assistant analyzing smart city alert patterns. Analyze the provided alert data and identify:
1. Recurring patterns (e.g., same alert types occurring frequently)
2. Geographic clusters (alerts in similar locations)
3. Temporal patterns (alerts occurring at specific times)
4. Device-specific issues (devices with multiple alerts)
5. Network-related patterns (alerts correlated with network types)

Return a JSON object with:
- patterns: array of pattern objects, each with { type: string, description: string, severity: string, affectedDevices: number, examples: string[] }
- summary: a brief text summary of the key findings

Be concise and actionable.`;

        try {
          const result = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Analyze these ${enrichedAlerts.length} alerts:\n${JSON.stringify(enrichedAlerts.slice(0, 100), null, 2)}`,
              },
            ],
            responseFormat: { type: "json_object" },
          });

          const content = result.choices[0]?.message?.content;
          if (typeof content === "string") {
            try {
              const parsed = JSON.parse(content);
              return {
                patterns: parsed.patterns || [],
                summary: parsed.summary || "Pattern analysis completed.",
              };
            } catch {
              // Fallback if JSON parsing fails
              return {
                patterns: [],
                summary: content,
              };
            }
          }

          return {
            patterns: [],
            summary: "Pattern detection completed, but no structured patterns were found.",
          };
        } catch (error) {
          console.error("[AI] detectAlertPatterns error:", error);
          // Fallback: basic pattern detection without AI
          const typeCounts = new Map<string, number>();
          const deviceCounts = new Map<string, number>();
          
          recentAlerts.forEach(alert => {
            typeCounts.set(alert.alertType || "Unknown", (typeCounts.get(alert.alertType || "Unknown") || 0) + 1);
            deviceCounts.set(alert.deviceId, (deviceCounts.get(alert.deviceId) || 0) + 1);
          });

          const topTypes = Array.from(typeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({
              type: "recurring_alert_type",
              description: `${type} alerts occurred ${count} times`,
              severity: "medium",
              affectedDevices: count,
              examples: [type],
            }));

          return {
            patterns: topTypes,
            summary: `Found ${recentAlerts.length} alerts. Most common types: ${Array.from(typeCounts.keys()).slice(0, 3).join(", ")}.`,
          };
        }
      }),

    summarizeAlerts: publicProcedure
      .input(
        z.object({
          timeRange: z.enum(["24h", "7d", "30d"]).optional().default("24h"),
          maxAlerts: z.number().min(1).max(500).optional().default(100),
        })
      )
      .query(async ({ input }) => {
        const alerts = await getAllAlerts();
        const devices = await getAllDevices();
        
        // Filter alerts by time range
        const now = new Date();
        const timeRangeMs = {
          "24h": 24 * 60 * 60 * 1000,
          "7d": 7 * 24 * 60 * 60 * 1000,
          "30d": 30 * 24 * 60 * 60 * 1000,
        }[input.timeRange];
        
        const recentAlerts = alerts
          .filter(alert => {
            const alertTime = new Date(alert.timestamp);
            return now.getTime() - alertTime.getTime() <= timeRangeMs;
          })
          .slice(0, input.maxAlerts)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (recentAlerts.length === 0) {
          return {
            summary: "No alerts found in the selected time range.",
            keyPoints: [],
            recommendations: [],
          };
        }

        const deviceMap = new Map(devices.map(d => [d.deviceId, d]));
        const alertSummary = recentAlerts.map(alert => {
          const device = deviceMap.get(alert.deviceId);
          return {
            type: alert.alertType,
            severity: alert.severity,
            device: device?.nodeName || alert.deviceId,
            timestamp: alert.timestamp,
            status: alert.status,
          };
        });

        const systemPrompt = `You are an AI assistant summarizing smart city alerts. Create a concise summary that includes:
1. Overall summary: Brief overview of the alert situation
2. Key points: 3-5 bullet points highlighting the most important issues
3. Recommendations: 2-3 actionable recommendations for addressing the issues

Be clear, concise, and focused on actionable insights.`;

        try {
          const result = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Summarize these ${recentAlerts.length} alerts:\n${JSON.stringify(alertSummary, null, 2)}`,
              },
            ],
            responseFormat: { type: "json_object" },
          });

          const content = result.choices[0]?.message?.content;
          if (typeof content === "string") {
            try {
              const parsed = JSON.parse(content);
              return {
                summary: parsed.summary || parsed.overall_summary || "Alert summary generated.",
                keyPoints: parsed.keyPoints || parsed.key_points || [],
                recommendations: parsed.recommendations || [],
              };
            } catch {
              return {
                summary: content,
                keyPoints: [],
                recommendations: [],
              };
            }
          }

          return {
            summary: "Summary generated.",
            keyPoints: [],
            recommendations: [],
          };
        } catch (error) {
          console.error("[AI] summarizeAlerts error:", error);
          // Fallback summary
          const criticalCount = recentAlerts.filter(a => a.severity === "critical").length;
          const highCount = recentAlerts.filter(a => a.severity === "high").length;
          const activeCount = recentAlerts.filter(a => a.status === "active").length;

          return {
            summary: `Found ${recentAlerts.length} alerts in the last ${input.timeRange}. ${criticalCount} critical, ${highCount} high severity. ${activeCount} still active.`,
            keyPoints: [
              criticalCount > 0 ? `${criticalCount} critical alerts require immediate attention` : null,
              highCount > 0 ? `${highCount} high severity alerts detected` : null,
              activeCount > 0 ? `${activeCount} alerts still unresolved` : null,
            ].filter(Boolean) as string[],
            recommendations: [
              "Review critical alerts immediately",
              "Investigate devices with multiple alerts",
              "Consider preventive maintenance for frequently alerting devices",
            ],
          };
        }
      }),

    getPredictiveMaintenanceScores: publicProcedure
      .query(async () => {
        const devices = await getAllDevices();
        const alerts = await getAllAlerts();
        
        // Get recent alerts (last 30 days) for each device
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentAlerts = alerts.filter(alert => {
          const alertTime = new Date(alert.timestamp);
          return alertTime >= thirtyDaysAgo;
        });

        const deviceAlertCounts = new Map<string, number>();
        recentAlerts.forEach(alert => {
          deviceAlertCounts.set(alert.deviceId, (deviceAlertCounts.get(alert.deviceId) || 0) + 1);
        });

        // Calculate maintenance scores for each device
        const scores = devices.map(device => {
          const alertCount = deviceAlertCounts.get(device.deviceId) || 0;
          
          // Parse burn hours (assuming format like "12345" or "12345.5")
          let burnHours = 0;
          if (device.burnHours) {
            const parsed = parseFloat(device.burnHours);
            if (!isNaN(parsed)) {
              burnHours = parsed;
            }
          }

          // Calculate risk factors
          const factors: { name: string; score: number; weight: number }[] = [];
          
          // Burn hours factor (higher burn hours = higher risk)
          // Typical LED lifespan is 50,000-100,000 hours
          const burnHoursRisk = Math.min(100, (burnHours / 50000) * 100);
          factors.push({ name: "Burn Hours", score: burnHoursRisk, weight: 0.3 });

          // Alert frequency factor
          const alertRisk = Math.min(100, alertCount * 10);
          factors.push({ name: "Alert Frequency", score: alertRisk, weight: 0.4 });

          // Device status factor
          let statusRisk = 0;
          if (device.nodeStatus === "Offline" || device.nodeStatus === "offline") {
            statusRisk = 80;
          } else if (device.nodeStatus === "Warning" || device.nodeStatus === "warning") {
            statusRisk = 50;
          } else if (device.nodeStatus === "Online" || device.nodeStatus === "online") {
            statusRisk = 10;
          }
          factors.push({ name: "Device Status", score: statusRisk, weight: 0.2 });

          // Network type factor (some network types may be more reliable)
          let networkRisk = 20; // default
          if (device.networkType) {
            const networkType = device.networkType.toLowerCase();
            if (networkType.includes("cellular") || networkType.includes("4g") || networkType.includes("5g")) {
              networkRisk = 15;
            } else if (networkType.includes("wifi") || networkType.includes("mesh")) {
              networkRisk = 25;
            }
          }
          factors.push({ name: "Network Reliability", score: networkRisk, weight: 0.1 });

          // Calculate weighted score
          const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
          const maintenanceScore = factors.reduce((sum, f) => sum + (f.score * f.weight), 0) / totalWeight;

          // Determine priority level
          let priority: "low" | "medium" | "high" | "critical" = "low";
          if (maintenanceScore >= 75) {
            priority = "critical";
          } else if (maintenanceScore >= 50) {
            priority = "high";
          } else if (maintenanceScore >= 25) {
            priority = "medium";
          }

          // Generate recommendations
          const recommendations: string[] = [];
          if (burnHours > 40000) {
            recommendations.push("Consider lamp replacement soon (high burn hours)");
          }
          if (alertCount > 5) {
            recommendations.push("Device experiencing frequent alerts - investigate root cause");
          }
          if (device.nodeStatus === "Offline" || device.nodeStatus === "offline") {
            recommendations.push("Device is offline - requires immediate attention");
          }
          if (recommendations.length === 0) {
            recommendations.push("Device operating normally - continue monitoring");
          }

          return {
            deviceId: device.deviceId,
            nodeName: device.nodeName || device.deviceId,
            score: Math.round(maintenanceScore),
            priority,
            burnHours,
            alertCount,
            nodeStatus: device.nodeStatus,
            networkType: device.networkType,
            factors,
            recommendations,
            latitude: device.latitude,
            longitude: device.longitude,
          };
        });

        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);

        // Use AI to provide insights on top devices
        const topDevices = scores.slice(0, 20);
        let aiInsights = "";

        try {
          const systemPrompt = `You are an AI assistant providing insights on predictive maintenance scores for smart city devices. Analyze the top devices requiring maintenance and provide:
1. Overall assessment of maintenance needs
2. Key trends or patterns
3. Priority recommendations

Be concise and actionable.`;

          const result = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Analyze these top ${topDevices.length} devices requiring maintenance:\n${JSON.stringify(topDevices.map(d => ({ name: d.nodeName, score: d.score, priority: d.priority, burnHours: d.burnHours, alerts: d.alertCount })), null, 2)}`,
              },
            ],
          });

          const content = result.choices[0]?.message?.content;
          if (typeof content === "string") {
            aiInsights = content;
          }
        } catch (error) {
          console.error("[AI] getPredictiveMaintenanceScores AI insights error:", error);
          aiInsights = `Found ${scores.filter(s => s.priority === "critical").length} devices requiring critical maintenance attention.`;
        }

        return {
          devices: scores,
          summary: {
            total: scores.length,
            critical: scores.filter(s => s.priority === "critical").length,
            high: scores.filter(s => s.priority === "high").length,
            medium: scores.filter(s => s.priority === "medium").length,
            low: scores.filter(s => s.priority === "low").length,
          },
          aiInsights,
        };
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
            rows: z.array(z.any()),
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

            // Validate and normalize rows - ensure all values are strings
            const normalizedRows: Record<string, string>[] = [];
            for (const row of rowsToProcess) {
              if (!row || typeof row !== 'object' || Array.isArray(row)) {
                continue; // Skip invalid rows
              }
              const normalized: Record<string, string> = {};
              for (const [key, value] of Object.entries(row)) {
                if (typeof key === 'string') {
                  normalized[key] = value === null || value === undefined ? '' : String(value);
                }
              }
              normalizedRows.push(normalized);
            }

            if (normalizedRows.length === 0) {
              throw new Error("No valid rows found after normalization");
            }

            const result = await importCsvData(normalizedRows, input.useAI);
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
