import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    if (!settings) {
      return {
        pin: "1234",
        displayName: "Kullanıcı",
        currencyCardPreferences: ["GOLD_QUARTER", "GOLD_GRAM", "USD", "EUR"],
      };
    }
    return settings;
  },
});

export const updatePin = mutation({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();
    if (settings) {
      await ctx.db.patch(settings._id, { pin: args.pin });
    } else {
      await ctx.db.insert("settings", {
        pin: args.pin,
        displayName: "Kullanıcı",
        currencyCardPreferences: ["GOLD_QUARTER", "GOLD_GRAM", "USD", "EUR"],
      });
    }
  },
});

export const updateDisplayName = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();
    if (settings) {
      await ctx.db.patch(settings._id, { displayName: args.displayName });
    } else {
      await ctx.db.insert("settings", {
        pin: "1234",
        displayName: args.displayName,
        currencyCardPreferences: ["GOLD_QUARTER", "GOLD_GRAM", "USD", "EUR"],
      });
    }
  },
});

export const updateCurrencyCardPreferences = mutation({
  args: {
    currencyCardPreferences: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();
    if (settings) {
      await ctx.db.patch(settings._id, { currencyCardPreferences: args.currencyCardPreferences });
    } else {
      await ctx.db.insert("settings", {
        pin: "1234",
        displayName: "Kullanıcı",
        currencyCardPreferences: args.currencyCardPreferences,
      });
    }
  },
});

// Notifications
export const getNotificationSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("notificationSettings").first();
    if (!settings) {
      return {
        reminderDaysBefore: 1,
        overdueRepeatIntervalDays: 1,
      };
    }
    return settings;
  },
});

export const updateNotificationSettings = mutation({
  args: {
    reminderDaysBefore: v.number(),
    overdueRepeatIntervalDays: v.number(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("notificationSettings").first();
    if (settings) {
      await ctx.db.patch(settings._id, {
        reminderDaysBefore: args.reminderDaysBefore,
        overdueRepeatIntervalDays: args.overdueRepeatIntervalDays,
      });
    } else {
      await ctx.db.insert("notificationSettings", {
        reminderDaysBefore: args.reminderDaysBefore,
        overdueRepeatIntervalDays: args.overdueRepeatIntervalDays,
      });
    }
  },
});
