import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', issues: err.issues });
  }
  // Express default error object shape fallback
  const message = (typeof err === 'object' && err && 'message' in err)
    ? String((err as any).message)
    : 'Internal Server Error';
  return res.status(500).json({ message });
}
