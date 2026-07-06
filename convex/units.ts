import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUnits = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("units").collect();
  },
});

export const addUnit = mutation({
  args: {
    code: v.string(),
    label: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("units", {
      code: args.code,
      label: args.label,
      icon: args.icon,
    });
  },
});

export const removeUnit = mutation({
  args: {
    id: v.id("units"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
