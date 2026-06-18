import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { signToken } from '../middleware/auth.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);

  // First registered user becomes ADMIN, the rest are STAFF.
  const userCount = await prisma.user.count();
  const hashed = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashed,
      role: userCount === 0 ? 'ADMIN' : 'STAFF',
    },
  });

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user) throw new HttpError(401, 'Invalid email or password');

  const ok = await bcrypt.compare(data.password, user.password);
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user: publicUser(user) });
});
