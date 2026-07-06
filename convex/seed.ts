import { mutation } from "./_generated/server";

export const seed = mutation({
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();
    if (contacts.length > 0) {
      return "Already seeded";
    }

    const ahmetId = await ctx.db.insert("contacts", {
      fullName: "Ahmet Yılmaz",
      phone: "05551234567",
      note: "Güvenilir müşteri",
      createdAt: Date.now(),
    });

    const mehmetId = await ctx.db.insert("contacts", {
      fullName: "Mehmet Demir",
      phone: "05449876543",
      createdAt: Date.now(),
    });

    await ctx.db.insert("transactions", {
      contactId: ahmetId,
      type: "verecek", // Ahmet owes us
      amount: 15000,
      unit: "TRY",
      dueDate: Date.now() + 86400000 * 7, // 7 days from now
      status: "bekliyor",
      createdAt: Date.now(),
      note: "Düğün takısı",
    });

    await ctx.db.insert("transactions", {
      contactId: mehmetId,
      type: "alacak", // We owe Mehmet
      amount: 2,
      unit: "GOLD_QUARTER",
      dueDate: Date.now() + 86400000 * 2, // 2 days
      status: "bekliyor",
      createdAt: Date.now(),
    });

    return "Seeded successfully";
  },
});
