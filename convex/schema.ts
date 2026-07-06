import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  contacts: defineTable({
    fullName: v.string(),
    phone: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(), // timestamp
  }),

  transactions: defineTable({
    contactId: v.id("contacts"),
    type: v.union(v.literal("verecek"), v.literal("alacak")),
    amount: v.number(),
    unit: v.string(), // e.g. "TRY", "GOLD_GRAM"
    dueDate: v.number(),
    note: v.optional(v.string()),
    status: v.union(
      v.literal("bekliyor"),
      v.literal("kismi_odendi"),
      v.literal("odendi"),
      v.literal("gecikti"),
      v.literal("iptal_edildi")
    ),
    createdAt: v.number(),
  }),

  payments: defineTable({
    transactionId: v.id("transactions"),
    amount: v.number(),
    paidAt: v.number(),
    note: v.optional(v.string()),
  }),

  notificationSettings: defineTable({
    reminderDaysBefore: v.number(),
    overdueRepeatIntervalDays: v.number(),
  }),

  units: defineTable({
    code: v.string(),
    label: v.string(),
    icon: v.string(),
  }),

  settings: defineTable({
    pin: v.string(),
    displayName: v.string(),
    currencyCardPreferences: v.array(v.string()),
  }),
});
