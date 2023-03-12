import { NextFunction } from 'express';
import { validationResult } from 'express-validator';

import AuthValidations from '@utils/validators/auth.validation';
import UserValidations from '@utils/validators/user.validation';
import { AppRequest, AppResponse } from '@interfaces/utils.interface';
import colors from 'colors';

const validationRequestHandler = (
  req: AppRequest,
  res: AppResponse,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  console.log(
    colors.bold.red(JSON.stringify(errors)),
    '-----Validation errors----'
  );

  const extractedErrors: any = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
  return res.status(422).json({
    success: false,
    error: { data: extractedErrors },
    type: 'validationError',
  });
};

export { validationRequestHandler, AuthValidations, UserValidations };
