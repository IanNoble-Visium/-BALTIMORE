import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../../server/routers";
import { createContext } from "../../../server/_core/context";

// Vercel catch-all API route for tRPC.
// This handles requests like /api/trpc/auth.me and batched variants.

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  "/",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app as any;
