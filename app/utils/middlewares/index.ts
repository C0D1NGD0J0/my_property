import { AppRequest, AppResponse } from '@interfaces/utils.interface';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import colors from 'colors/safe';
import { NextFunction } from 'express';
import ErrorResponse from '../errorResponse';

export const dbErrorHandler = (
  err: any,
  _req: AppRequest,
  res: AppResponse,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message || 'Server Error...';
  error.type = err.type || 'apiError';
  error.statusCode = err.statusCode;
  console.log(colors.red(err).bold);
  // Mongoose bad ObjectID
  if (err.name === 'CastError') {
    const message = `Resource with ID ${err.value} not found!`;
    error = new ErrorResponse(
      message,
      errorTypes.NO_RESOURCE_ERROR,
      httpStatusCodes.NOT_FOUND
    );
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = `Duplicate fields value were provided!`;
    error = new ErrorResponse(
      message,
      errorTypes.DB_ERROR,
      httpStatusCodes.BAD_REQUEST
    );
  }

  // Mongoose Validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) =>
      `${val.message}`.replace('Error, ', '')
    );
    error = new ErrorResponse(
      JSON.stringify(messages),
      errorTypes.VALIDATION_ERROR,
      httpStatusCodes.UNPROCESSABLE
    );

    if (err.errors.description.kind === 'unique') {
      const message = `${err.errors.description.path} field value must be unique`;
      error = new ErrorResponse(
        message,
        errorTypes.VALIDATION_ERROR,
        httpStatusCodes.UNPROCESSABLE
      );
    }
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    type: error.type,
    error: { data: error.message },
  });
};

export const asyncHandler =
  (fn: any) => (req: AppRequest, res: AppResponse, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
