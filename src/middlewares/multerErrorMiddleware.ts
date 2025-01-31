import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const handleErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      details: err.message,
    });
  }
  next(err);
};