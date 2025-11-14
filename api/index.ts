import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../dist/server/oauth.js";
import { appRouter } from "../dist/server/routers.js";
import { createContext } from "../dist/server/context.js";

// This file is the Vercel Serverless Function entrypoint.
// It exposes the same tRPC + OAuth routes as the local Express server,
// but without starting an HTTP listener (Vercel provides req/res).

const app = express();

// Support JSON and URL-encoded bodies (needed for some endpoints)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback (will be mostly unused in demo mode, but kept for parity)
registerOAuthRoutes(app);

// tRPC router mounted at /api/trpc (this matches the frontend configuration)
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path, type }) => {
      console.error(`[tRPC Error] ${type} ${path}:`, error);
      if (error.cause) {
        console.error('[tRPC Error] Cause:', error.cause);
      }
      if (error.stack) {
        console.error('[tRPC Error] Stack:', error.stack);
      }
    },
  })
);

// Export the Express app as the default Vercel handler.
// Vercel will call this function with (req, res) for any /api/* requests.
export default app as any;
