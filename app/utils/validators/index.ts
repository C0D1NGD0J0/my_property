import { NextFunction } from 'express';
import { validationResult } from 'express-validator';

import AuthValidations from '@utils/validators/auth.validation';
import { AppRequest, AppResponse } from '@interfaces/utils.interface';

const validationRequestHandler = (
  req: AppRequest,
  res: AppResponse,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors: any = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    success: false,
    error: { data: extractedErrors },
    type: 'validationError',
  });
};

export { validationRequestHandler, AuthValidations };
