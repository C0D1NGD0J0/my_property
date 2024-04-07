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
  console.log(err, '-----dd');

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
  // if (err.name === 'ValidationError') {

  //   console.log(err.kind, '-----MSDG----', err.name);
  //   error = new ErrorResponse(
  //     JSON.stringify(messages),
  //     errorTypes.VALIDATION_ERROR,
  //     httpStatusCodes.UNPROCESSABLE
  //   );

  //   const key = Object.keys(err.errors)[0];
  //   if (err.errors[key].kind === 'unique') {
  //     const message = `${err.errors[key].path} value must be unique`;
  //     error = new ErrorResponse(
  //       message,
  //       errorTypes.VALIDATION_ERROR,
  //       httpStatusCodes.UNPROCESSABLE
  //     );
  //   }
  // }

  if (err.name === 'ValidationError') {
    const messages: string[] = [];
    const errors = Object.values(err.errors).map((error: any) => {
      // Handling CastError
      if (error.name === 'CastError') {
        messages.push(`${error.message}`.replace('Error, ', ''));
      }

      // Handling ValidatorError
      if (error.name === 'ValidatorError') {
        messages.push(`${error.message}`.replace('Path', '').trim());
      }
      // Other errors (generic message)
      else {
        return error.message || 'Unknown validation error';
      }
    });

    error = new ErrorResponse(
      JSON.stringify(messages),
      errorTypes.VALIDATION_ERROR,
      httpStatusCodes.UNPROCESSABLE
    );
  }

  // MongoNetworkError: Issues related to network problems
  // MongooseServerSelectionError: Couldn't connect to any servers in your MongoDB Atlas cluster.
  if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongooseServerSelectionError'
  ) {
    const message = 'Network error, please try again later';
    error = new ErrorResponse(
      message,
      errorTypes.DB_ERROR,
      httpStatusCodes.INTERNAL_SERVER
    );
  }

  // DocumentNotFoundError: When a query results in no document matching.
  if (err.name === 'DocumentNotFoundError') {
    const message = 'Document not found';
    error = new ErrorResponse(
      message,
      errorTypes.DB_ERROR,
      httpStatusCodes.NOT_FOUND
    );
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
