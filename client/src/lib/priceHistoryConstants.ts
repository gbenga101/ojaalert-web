// src/lib/priceHistoryConstants.ts

export const VENDOR_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#475569",
];

export type PriceHistoryEntry = {
  historyId: string;
  price: number | null;
  recordedAt: Date | null;
  source: string | null;
  vendorProductId: string;
  vendorId: string;
  vendorName: string;
  storeName: string;
  marketName: string;
  marketCity: string | null;
};