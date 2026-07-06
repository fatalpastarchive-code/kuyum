import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTransactionsByContact = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("contactId"), args.contactId))
      .order("desc")
      .collect();
  },
});

export const getActiveTransactions = query({
  handler: async (ctx) => {
    // Only return pending or partially paid transactions
    return await ctx.db
      .query("transactions")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "bekliyor"),
          q.eq(q.field("status"), "kismi_odendi"),
          q.eq(q.field("status"), "gecikti")
        )
      )
      .order("desc")
      .collect();
  },
});

export const addTransaction = mutation({
  args: {
    contactId: v.id("contacts"),
    type: v.union(v.literal("verecek"), v.literal("alacak")),
    amount: v.number(),
    unit: v.string(),
    dueDate: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const status = args.dueDate < Date.now() ? "gecikti" : "bekliyor";
    return await ctx.db.insert("transactions", {
      ...args,
      status,
      createdAt: Date.now(),
    });
  },
});

export const getDueToday = query({
  handler: async (ctx) => {
    const now = new Date();
    // Start of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    // End of today
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return await ctx.db
      .query("transactions")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("status"), "bekliyor"),
            q.eq(q.field("status"), "kismi_odendi")
          ),
          q.gte(q.field("dueDate"), startOfDay),
          q.lte(q.field("dueDate"), endOfDay)
        )
      )
      .order("desc")
      .collect();
  },
});

export const getPaymentsByTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("transactionId"), args.transactionId))
      .order("desc")
      .collect();
  },
});

export const addPayment = mutation({
  args: {
    transactionId: v.id("transactions"),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Kayıt bulunamadı");
    if (args.amount <= 0) throw new Error("Tutar 0'dan büyük olmalı");

    await ctx.db.insert("payments", {
      transactionId: args.transactionId,
      amount: args.amount,
      paidAt: Date.now(),
      note: args.note,
    });

    const newAmount = Math.max(0, transaction.amount - args.amount);
    const status = newAmount === 0 ? "odendi" : "kismi_odendi";

    await ctx.db.patch(args.transactionId, {
      amount: newAmount,
      status,
    });
  },
});

export const getPaymentsByContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const txs = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("contactId"), args.contactId))
      .collect();
    
    const paymentsList = [];
    for (const tx of txs) {
      const pmts = await ctx.db
        .query("payments")
        .filter((q) => q.eq(q.field("transactionId"), tx._id))
        .collect();
      paymentsList.push(...pmts);
    }
    return paymentsList;
  },
});

export const cancelTransaction = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Kayıt bulunamadı");
    
    await ctx.db.patch(args.transactionId, {
      status: "iptal_edildi"
    });
  },
});

