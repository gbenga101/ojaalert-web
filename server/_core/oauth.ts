// Auth is now handled entirely by Supabase on the client side.
// The Supabase JWT is verified in server/_core/context.ts.
// This file is kept as an empty stub to avoid breaking any future imports.

import type { Express } from "express";

// No-op — no OAuth callback routes needed any more
export function registerOAuthRoutes(_app: Express): void {}