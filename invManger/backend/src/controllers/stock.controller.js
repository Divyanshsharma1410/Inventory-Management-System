import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

const movementSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  quantity: z.coerce.number().int(),
  note: z.string().optional().nullable(),
});

// Record a stock movement and update the product quantity atomically.
export const createMovement = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const { type, quantity, note } = movementSchema.parse(req.body);

  if (type !== 'ADJUST' && quantity <= 0) {
    throw new HttpError(400, 'Quantity must be greater than zero for IN/OUT movements');
  }

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new HttpError(404, 'Product not found');

    let newQuantity;
    if (type === 'IN') newQuantity = product.quantity + quantity;
    else if (type === 'OUT') newQuantity = product.quantity - quantity;
    else newQuantity = quantity; // ADJUST sets the absolute quantity

    if (newQuantity < 0) {
      throw new HttpError(400, `Insufficient stock. Only ${product.quantity} unit(s) available.`);
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId,
        userId: req.user.id,
        type,
        // For ADJUST, store the delta so history reads sensibly.
        quantity: type === 'ADJUST' ? newQuantity - product.quantity : quantity,
        note,
      },
    });

    return { product: updated, movement };
  });

  res.status(201).json({
    ...result,
    product: { ...result.product, price: Number(result.product.price), cost: Number(result.product.cost) },
  });
});

// Global movement history (most recent first), optionally filtered by product.
export const listMovements = asyncHandler(async (req, res) => {
  const { productId } = req.query;
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));

  const movements = await prisma.stockMovement.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      user: { select: { id: true, name: true } },
    },
  });
  res.json(movements);
});
