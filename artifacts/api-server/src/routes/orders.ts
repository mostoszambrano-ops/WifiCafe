import { Router, type IRouter } from "express";
import { eq, desc, inArray, gte } from "drizzle-orm";
import { db, ordersTable, orderItemsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const CreateOrderBody = z.object({
  customerName: z.string().min(1),
  phone: z.string().min(1),
  tableNumber: z.string().default(""),
  notes: z.string().default(""),
  items: z.array(z.object({
    itemName: z.string().min(1),
    itemPrice: z.string().min(1),
    itemPriceNum: z.number().int().nonnegative(),
    quantity: z.number().int().positive(),
    section: z.string().default(""),
    notes: z.string().default(""),
  })).min(1),
});

const UpdateOrderBody = z.object({
  status: z.enum(["pendiente", "preparando", "listo", "pagado"]),
});

router.get("/orders", async (req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));

  if (orders.length === 0) {
    res.json([]);
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orders.map(o => o.id)));

  const result = orders.map(order => ({
    ...order,
    items: items.filter(i => i.orderId === order.id),
  }));

  res.json(result);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerName, phone, tableNumber, notes, items } = parsed.data;
  const total = items.reduce((sum, item) => sum + item.itemPriceNum * item.quantity, 0);

  const [order] = await db
    .insert(ordersTable)
    .values({ customerName, phone, tableNumber, notes, total, status: "pendiente" })
    .returning();

  await db.insert(orderItemsTable).values(
    items.map(item => ({
      orderId: order.id,
      itemName: item.itemName,
      itemPrice: item.itemPrice,
      itemPriceNum: item.itemPriceNum,
      quantity: item.quantity,
      section: item.section,
      notes: item.notes,
    }))
  );

  req.log.info({ orderId: order.id }, "New order created");
  res.status(201).json({ ...order, items });
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(order);
});

router.delete("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  await db.delete(ordersTable).where(eq(ordersTable.id, id));
  res.sendStatus(204);
});

// ── Stats endpoint ──────────────────────────────────────────────────────────

router.get("/stats", async (req, res): Promise<void> => {
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // All orders in last 7 days
  const recentOrders = await db
    .select()
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, sevenDaysAgo))
    .orderBy(ordersTable.createdAt);

  // ── Sales by day (last 7 days) ─────────────────────────────────
  const byDayMap: Record<string, { total: number; count: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    byDayMap[key] = { total: 0, count: 0 };
  }
  for (const o of recentOrders) {
    const key = o.createdAt.toISOString().split("T")[0];
    if (byDayMap[key]) {
      byDayMap[key].total += o.total;
      byDayMap[key].count += 1;
    }
  }
  const salesByDay = Object.entries(byDayMap).map(([day, v]) => ({
    day: day.slice(5).replace("-", "/"), // MM/DD
    total: v.total,
    count: v.count,
  }));

  // ── Orders by hour (last 7 days, 8h–23h range) ─────────────────
  const hourCounts: Record<number, number> = {};
  for (const o of recentOrders) {
    const h = o.createdAt.getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
  }
  const byHour = Array.from({ length: 16 }, (_, i) => {
    const h = i + 8; // 8:00–23:00
    return { hour: `${h}:00`, count: hourCounts[h] ?? 0 };
  });

  // ── Top products (last 30 days) ────────────────────────────────
  const thirtyDayOrders = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, thirtyDaysAgo));

  let topProducts: { name: string; qty: number }[] = [];
  if (thirtyDayOrders.length > 0) {
    const allItems = await db
      .select({ itemName: orderItemsTable.itemName, quantity: orderItemsTable.quantity })
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, thirtyDayOrders.map(o => o.id)));

    const productMap: Record<string, number> = {};
    for (const item of allItems) {
      productMap[item.itemName] = (productMap[item.itemName] ?? 0) + item.quantity;
    }
    topProducts = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, qty]) => ({
        name: name.length > 28 ? name.slice(0, 28) + "…" : name,
        qty,
      }));
  }

  // ── Summary totals ─────────────────────────────────────────────
  const totalWeek   = recentOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = recentOrders.length;

  res.json({ salesByDay, topProducts, byHour, totalWeek, totalOrders });
});

export default router;
