import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getContacts = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let contacts = await ctx.db.query("contacts").order("desc").collect();
    
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      contacts = contacts.filter((c) =>
        c.fullName.toLowerCase().includes(searchLower) ||
        c.phone.includes(args.search!)
      );
    }
    return contacts;
  },
});

export const getContactById = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const checkDuplicateContact = query({
  args: { fullName: v.string(), phone: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("contacts")
      .filter((q) => q.and(
        q.eq(q.field("fullName"), args.fullName),
        q.eq(q.field("phone"), args.phone)
      ))
      .first();
    return existing ? existing._id : null;
  },
});

export const createContact = mutation({
  args: {
    fullName: v.string(),
    phone: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contacts", {
      fullName: args.fullName,
      phone: args.phone,
      note: args.note,
      createdAt: Date.now(),
    });
  },
});

export const deleteContact = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("contactId"), args.id))
      .collect();

    for (const tx of transactions) {
      const payments = await ctx.db
        .query("payments")
        .filter((q) => q.eq(q.field("transactionId"), tx._id))
        .collect();
      for (const p of payments) {
        await ctx.db.delete(p._id);
      }
      await ctx.db.delete(tx._id);
    }

    await ctx.db.delete(args.id);
  },
});

