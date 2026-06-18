import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be >= 0').default(0),
  cost: z.coerce.number().min(0, 'Cost must be >= 0').default(0),
  quantity: z.coerce.number().int().min(0, 'Quantity must be >= 0').default(0),
  lowStockAt: z.coerce.number().int().min(0).default(10),
  categoryId: z.string().uuid().optional().nullable(),
});

// Serialize Decimal fields to numbers for the client.
function serialize(p) {
  return {
    ...p,
    price: p.price != null ? Number(p.price) : 0,
    cost: p.cost != null ? Number(p.cost) : 0,
    lowStock: p.quantity <= p.lowStockAt,
  };
}

export const listProducts = asyncHandler(async (req, res) => {
  const { search, categoryId, lowStock, sort } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const orderBy =
    sort === 'name' ? { name: 'asc' } :
    sort === 'quantity' ? { quantity: 'asc' } :
    sort === 'price' ? { price: 'desc' } :
    { createdAt: 'desc' };

  let [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  // lowStock filter compares two columns, which Prisma can't express in `where`.
  if (lowStock === 'true') {
    items = items.filter((p) => p.quantity <= p.lowStockAt);
  }

  res.json({
    data: items.map(serialize),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      movements: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { name: true } } } },
    },
  });
  if (!product) throw new HttpError(404, 'Product not found');
  res.json(serialize(product));
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({ data });
    if (created.quantity > 0) {
      await tx.stockMovement.create({
        data: {
          productId: created.id,
          userId: req.user.id,
          type: 'IN',
          quantity: created.quantity,
          note: 'Initial stock on creation',
        },
      });
    }
    return created;
  });

  res.status(201).json(serialize(product));
});

export const updateProduct = asyncHandler(async (req, res) => {
  // Quantity changes go through the stock endpoints; ignore it here.
  const data = productSchema.partial().omit({ quantity: true }).parse(req.body);
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
  });
  res.json(serialize(product));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
