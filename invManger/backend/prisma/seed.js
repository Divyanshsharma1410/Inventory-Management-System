import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Admin user (idempotent) ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@inventory.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Administrator',
      password: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`   ✓ Admin user ready: ${adminEmail} / ${adminPassword}`);

  // Only seed sample catalog when DB is empty, so re-runs stay idempotent.
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log('   ✓ Catalog already seeded, skipping sample data.');
    return;
  }

  const categories = await Promise.all(
    [
      { name: 'Electronics', description: 'Phones, laptops and accessories' },
      { name: 'Office Supplies', description: 'Stationery and office gear' },
      { name: 'Groceries', description: 'Food and beverages' },
      { name: 'Apparel', description: 'Clothing and footwear' },
    ].map((c) => prisma.category.create({ data: c }))
  );

  const byName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  const products = [
    { name: 'Wireless Mouse', sku: 'ELE-001', price: 24.99, cost: 12.0, quantity: 120, lowStockAt: 20, category: 'Electronics' },
    { name: 'USB-C Cable 1m', sku: 'ELE-002', price: 9.99, cost: 3.5, quantity: 8, lowStockAt: 25, category: 'Electronics' },
    { name: 'Mechanical Keyboard', sku: 'ELE-003', price: 79.99, cost: 45.0, quantity: 35, lowStockAt: 10, category: 'Electronics' },
    { name: 'A4 Printer Paper (500)', sku: 'OFF-001', price: 6.49, cost: 2.8, quantity: 4, lowStockAt: 15, category: 'Office Supplies' },
    { name: 'Ballpoint Pens (12pk)', sku: 'OFF-002', price: 4.25, cost: 1.5, quantity: 200, lowStockAt: 30, category: 'Office Supplies' },
    { name: 'Sticky Notes', sku: 'OFF-003', price: 3.1, cost: 1.0, quantity: 60, lowStockAt: 20, category: 'Office Supplies' },
    { name: 'Instant Coffee 200g', sku: 'GRO-001', price: 7.99, cost: 4.0, quantity: 14, lowStockAt: 15, category: 'Groceries' },
    { name: 'Bottled Water (24pk)', sku: 'GRO-002', price: 5.5, cost: 2.2, quantity: 90, lowStockAt: 25, category: 'Groceries' },
    { name: 'Cotton T-Shirt (M)', sku: 'APP-001', price: 14.99, cost: 6.0, quantity: 45, lowStockAt: 10, category: 'Apparel' },
    { name: 'Running Socks (3pk)', sku: 'APP-002', price: 11.99, cost: 4.5, quantity: 6, lowStockAt: 12, category: 'Apparel' },
  ];

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        price: p.price,
        cost: p.cost,
        quantity: p.quantity,
        lowStockAt: p.lowStockAt,
        categoryId: byName[p.category],
      },
    });
    // Record an initial "IN" movement so reports/history have data.
    await prisma.stockMovement.create({
      data: { productId: product.id, type: 'IN', quantity: p.quantity, note: 'Initial stock' },
    });
  }

  console.log(`   ✓ Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Seed complete.');
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
