import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Profile } from "../../drizzle/schema";
import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: Profile | null;
};

function extractBearerToken(req: CreateExpressContextOptions["req"]): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: Profile | null = null;

  const token = extractBearerToken(opts.req);

  if (token && ENV.supabaseUrl && ENV.supabaseServiceRoleKey) {
    try {
      // Use service role client to verify the JWT and get the user
      const supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey);
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

      if (!error && supabaseUser) {
        // Look up their profile in our DB
        let profile = await db.getUserByOpenId(supabaseUser.id);

        // Safety net: if trigger hasn't run yet, create the profile now
        if (!profile) {
          await db.upsertUser({
            openId: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? null,
            email: supabaseUser.email ?? null,
          });
          profile = await db.getUserByOpenId(supabaseUser.id);
        }

        user = profile ?? null;
      }
    } catch (error) {
      // Auth failure is not fatal — public procedures still work
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}