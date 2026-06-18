import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';

export const getStats = asyncHandler(async (req, res) => {
  const [products, categoryCount, movements] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, sku: true, quantity: true, lowStockAt: true, price: true, cost: true, category: { select: { name: true } } },
    }),
    prisma.category.count(),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { product: { select: { name: true, sku: true } }, user: { select: { name: true } } },
    }),
  ]);

  const totalProducts = products.length;
  const totalUnits = products.reduce((s, p) => s + p.quantity, 0);
  const inventoryValue = products.reduce((s, p) => s + p.quantity * Number(p.price), 0);
  const inventoryCost = products.reduce((s, p) => s + p.quantity * Number(p.cost), 0);
  const lowStock = products.filter((p) => p.quantity <= p.lowStockAt && p.quantity > 0);
  const outOfStock = products.filter((p) => p.quantity === 0);

  // Stock value grouped by category for the chart.
  const byCategoryMap = {};
  for (const p of products) {
    const key = p.category?.name || 'Uncategorized';
    byCategoryMap[key] = (byCategoryMap[key] || 0) + p.quantity;
  }
  const stockByCategory = Object.entries(byCategoryMap).map(([name, units]) => ({ name, units }));

  res.json({
    totals: {
      totalProducts,
      totalCategories: categoryCount,
      totalUnits,
      inventoryValue: Number(inventoryValue.toFixed(2)),
      inventoryCost: Number(inventoryCost.toFixed(2)),
      potentialProfit: Number((inventoryValue - inventoryCost).toFixed(2)),
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
    },
    lowStockItems: [...lowStock, ...outOfStock]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10)
      .map((p) => ({ id: p.id, name: p.name, sku: p.sku, quantity: p.quantity, lowStockAt: p.lowStockAt })),
    stockByCategory,
    recentMovements: movements,
  });
});
