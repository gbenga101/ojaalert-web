import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";

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

  // Market Discovery
  markets: router({
    list: publicProcedure
      .input(z.object({
        city: z.string().optional(),
        state: z.string().optional(),
        marketType: z.enum(["rotational", "daily"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        try {
          const markets = await db.getMarkets();
          if (!input) return markets;
          
          return markets.filter(m => {
            if (input.city && m.city !== input.city) return false;
            if (input.state && m.state !== input.state) return false;
            if (input.marketType && m.marketType !== input.marketType) return false;
            return true;
          });
        } catch (error) {
          console.error("[Markets] Failed to fetch markets:", error);
          return [];
        }
      }),
    
    getById: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        try {
          const markets = await db.getMarkets();
          return markets.find(m => m.id === input) || null;
        } catch (error) {
          console.error("[Markets] Failed to fetch market:", error);
          return null;
        }
      }),
  }),

  // Commodities
  commodities: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        try {
          const commodities = await db.getCommodities();
          if (!input?.category) return commodities;
          return commodities.filter(c => c.category === input.category);
        } catch (error) {
          console.error("[Commodities] Failed to fetch commodities:", error);
          return [];
        }
      }),
    
    getById: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        try {
          const commodities = await db.getCommodities();
          return commodities.find(c => c.id === input) || null;
        } catch (error) {
          console.error("[Commodities] Failed to fetch commodity:", error);
          return null;
        }
      }),
  }),

  // Vendor Management (Protected)
  vendors: router({
    me: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          if (!ctx.user) return null;
          return await db.getVendorByProfileId(ctx.user.id);
        } catch (error) {
          console.error("[Vendors] Failed to fetch vendor:", error);
          return null;
        }
      }),
    
    create: protectedProcedure
      .input(z.object({
        ownerName: z.string().min(1),
        phoneNumber: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user) throw new Error("Not authenticated");
          return await db.createVendor({
            profileId: ctx.user.id,
            ownerName: input.ownerName,
            phoneNumber: input.phoneNumber,
          });
        } catch (error) {
          console.error("[Vendors] Failed to create vendor:", error);
          throw error;
        }
      }),
  }),

  // Vendor Stores (Protected)
  vendorStores: router({
    listByVendor: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          if (!ctx.user) return [];
          const vendor = await db.getVendorByProfileId(ctx.user.id);
          if (!vendor) return [];
          return await db.getVendorStores(vendor.id);
        } catch (error) {
          console.error("[VendorStores] Failed to fetch stores:", error);
          return [];
        }
      }),
    
    create: protectedProcedure
      .input(z.object({
        marketId: z.string(),
        storeName: z.string().min(1),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user) throw new Error("Not authenticated");
          const vendor = await db.getVendorByProfileId(ctx.user.id);
          if (!vendor) throw new Error("Vendor profile not found");
          
          return await db.createVendorStore({
            vendorId: vendor.id,
            marketId: input.marketId,
            storeName: input.storeName,
            description: input.description,
            imageUrl: input.imageUrl,
          });
        } catch (error) {
          console.error("[VendorStores] Failed to create store:", error);
          throw error;
        }
      }),
  }),

  // Vendor Products (Protected)
  vendorProducts: router({
    listByStore: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        try {
          return await db.getVendorProducts(input);
        } catch (error) {
          console.error("[VendorProducts] Failed to fetch products:", error);
          return [];
        }
      }),
    
    listByCommodity: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        try {
          return await db.getVendorProductsByCommodity(input);
        } catch (error) {
          console.error("[VendorProducts] Failed to fetch products:", error);
          return [];
        }
      }),
    
    create: protectedProcedure
      .input(z.object({
        vendorStoreId: z.string(),
        commodityId: z.string(),
        unitId: z.string(),
        currentPrice: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user) throw new Error("Not authenticated");
          return await db.createVendorProduct({
            vendorStoreId: input.vendorStoreId,
            commodityId: input.commodityId,
            unitId: input.unitId,
            currentPrice: input.currentPrice,
            updatedBy: "vendor",
          });
        } catch (error) {
          console.error("[VendorProducts] Failed to create product:", error);
          throw error;
        }
      }),
    
    updatePrice: protectedProcedure
      .input(z.object({
        vendorProductId: z.string(),
        currentPrice: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (!ctx.user) throw new Error("Not authenticated");
          return await db.updateVendorProductPrice(input.vendorProductId, input.currentPrice);
        } catch (error) {
          console.error("[VendorProducts] Failed to update price:", error);
          throw error;
        }
      }),
  }),

  // Price History
  priceHistory: router({
    getByProduct: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        try {
          return await db.getPriceHistory(input);
        } catch (error) {
          console.error("[PriceHistory] Failed to fetch history:", error);
          return [];
        }
      }),
  }),

  // Price Reports (Public)
  priceReports: router({
    create: publicProcedure
      .input(z.object({
        vendorProductId: z.string(),
        reportMessage: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        try {
          return await db.createPriceReport({
            vendorProductId: input.vendorProductId,
            reportMessage: input.reportMessage,
          });
        } catch (error) {
          console.error("[PriceReports] Failed to create report:", error);
          throw error;
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
