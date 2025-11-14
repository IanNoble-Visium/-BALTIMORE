import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../dist/server/routers.js";
import { createContext } from "../dist/server/context.js";

// Vercel Serverless Function for tRPC.
// Handles requests like `/api/trpc/auth.me?batch=1`.

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  "/",
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

export default app as any;
