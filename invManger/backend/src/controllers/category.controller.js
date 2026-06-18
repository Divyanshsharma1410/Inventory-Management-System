import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
});

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  res.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      productCount: c._count.products,
      createdAt: c.createdAt,
    }))
  );
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { products: true },
  });
  if (!category) throw new HttpError(404, 'Category not found');
  res.json(category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = categorySchema.parse(req.body);
  const category = await prisma.category.create({ data });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data,
  });
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  // Products keep existing but get categoryId set to null (onDelete: SetNull).
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
