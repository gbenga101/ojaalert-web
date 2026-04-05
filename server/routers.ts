import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  markets: router({
    list: publicProcedure
      .input(
        z.object({
          city: z.string().optional(),
          state: z.string().optional(),
          marketType: z.enum(["rotational", "daily"]).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const markets = await db.getMarkets();

        const today = new Date();
        const enriched = markets.map((market) => {
          if (market.marketType !== "rotational" || !market.referenceDate) {
            return { ...market, isActiveToday: true };
          }

          const referenceDate = new Date(`${market.referenceDate}T00:00:00Z`);
          const diffTime = today.getTime() - referenceDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          const currentPosition = (diffDays % market.cycleLength!) + 1;
          const isActiveToday = currentPosition === market.cyclePosition;

          return { ...market, currentPosition, isActiveToday };
        });

        if (!input) return enriched;

        return enriched.filter((m) => {
          if (input.city && m.city !== input.city) return false;
          if (input.state && m.state !== input.state) return false;
          if (input.marketType && m.marketType !== input.marketType) return false;
          return true;
        });
      }),

    getById: publicProcedure
      .input(z.string().min(1))
      .query(async ({ input }) => {
        const markets = await db.getMarkets();
        return markets.find((m) => m.id === input) || null;
      }),
  }),

  commodities: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const commodities = await db.getCommodities();
        if (!input?.category) return commodities;
        return commodities.filter((c) => c.category === input.category);
      }),

    getById: publicProcedure
      .input(z.string().min(1))
      .query(async ({ input }) => {
        return await db.getCommodityById(input);
      }),

    // Full commodity detail with all vendor prices
    getByIdWithPrices: publicProcedure
      .input(z.string().min(1))
      .query(async ({ input }) => {
        return await db.getCommodityWithVendorPrices(input);
      }),
  }),

  units: router({
    list: publicProcedure.query(async () => {
      return await db.getUnits();
    }),
  }),

  vendors: router({
    // Public vendor directory — no login required
    directory: publicProcedure.query(async () => {
      return await db.getVendorDirectory();
    }),

    me: protectedProcedure.query(async ({ ctx }) => {
      return await db.getVendorByProfileId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          ownerName: z.string().min(1).trim(),
          phoneNumber: z.string().min(1).trim(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createVendor({
          profileId: ctx.user.id,
          ownerName: input.ownerName,
          phoneNumber: input.phoneNumber,
        });
      }),
  }),

  vendorStores: router({
    listByVendor: protectedProcedure.query(async ({ ctx }) => {
      const vendor = await db.getVendorByProfileId(ctx.user.id);
      if (!vendor) return [];
      return await db.getVendorStores(vendor.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          marketId: z.string().min(1),
          storeName: z.string().min(1).trim(),
          description: z.string().optional().default(""),
          imageUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const vendor = await db.getVendorByProfileId(ctx.user.id);
        if (!vendor) throw new Error("Vendor profile not found");

        return await db.createVendorStore({
          vendorId: vendor.id,
          marketId: input.marketId,
          storeName: input.storeName,
          description: input.description,
          imageUrl: input.imageUrl,
        });
      }),
  }),

  vendorProducts: router({
    listByStore: publicProcedure  // ← kept public for compatibility
      .input(z.string().min(1))
      .query(async ({ input }) => await db.getVendorProducts(input)),

    listByCommodity: publicProcedure
      .input(z.string().min(1))
      .query(async ({ input }) => await db.getVendorProductsByCommodity(input)),

    create: protectedProcedure
      .input(
        z.object({
          vendorStoreId: z.string().min(1),
          commodityId: z.string().min(1),
          unitId: z.string().min(1),
          currentPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createVendorProduct({
          vendorStoreId: input.vendorStoreId,
          commodityId: input.commodityId,
          unitId: input.unitId,
          currentPrice: input.currentPrice,
          updatedBy: "vendor",
        });
      }),

    updatePrice: protectedProcedure
      .input(
        z.object({
          vendorProductId: z.string().min(1),
          currentPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
        })
      )
      .mutation(async ({ input }) => {
        return await db.updateVendorProductPrice(input.vendorProductId, input.currentPrice);
      }),
  }),

  priceHistory: router({
    // Original — by single vendor product
    getByProduct: publicProcedure
      .input(z.string().min(1))
      .query(async ({ input }) => await db.getPriceHistory(input)),

    // All vendor price history for a commodity, used by the chart
    getByCommodity: publicProcedure
      .input(z.string().min(1))
      .query(async ({ input }) => await db.getPriceHistoryForCommodity(input)),
  }),

  priceReports: router({
    // Only logged-in users can submit price reports
    create: protectedProcedure
      .input(
        z.object({
          vendorProductId: z.string().min(1),
          reportMessage: z.string().min(1).trim(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createPriceReport({
          vendorProductId: input.vendorProductId,
          reportMessage: input.reportMessage,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;