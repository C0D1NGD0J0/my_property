import chalk from 'chalk';
import { NextFunction } from 'express';
import ErrorResponse from '../errorResponse';
import { AppRequest, AppResponse } from '@interfaces/utils.interface';

export const dbErrorHandler = (
  err: any,
  req: AppRequest,
  res: AppResponse,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message || 'Server Error...';
  error.type = err.type || 'apiError';

  console.log(chalk.red.bold(err.message), err);

  // Mongoose bad ObjectID
  if (err.name === 'CastError') {
    const message = `Resource with ID ${err.value} not found!`;
    error = new ErrorResponse(message, 404, 'dbError');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message: string;
    if (err.message.includes('computedLocation.latAndlon_1')) {
      message = 'Unable to process address provided. <duplicate coordinates>';
    } else {
      message = `Duplicate fields value were provided!`;
    }
    error = new ErrorResponse(message, 400, 'dbError');
  }

  // Mongoose Validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) =>
      `${val.message}`.replace('Error, ', '')
    );
    error = new ErrorResponse(JSON.stringify(messages), 400, 'validationError');
  }

  res.status(error.statusCode || 500).json({
    success: false,
    type: error.type,
    error: { data: error.message },
  });
};

export const asyncHandler =
  (fn: any) => (req: AppRequest, res: AppResponse, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
