import { ZodError } from 'zod';

// Wrap async route handlers so thrown errors reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Helper to throw HTTP errors with a status code.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Validation errors from zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // Known Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join?.(', ') || 'field';
    return res.status(409).json({ error: `A record with this ${field} already exists.` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
