import colors from 'colors';
import { NextFunction } from 'express';
import { validationResult } from 'express-validator';

import { errorTypes, httpStatusCodes } from '@utils/constants';
import AuthValidations from '@utils/validators/auth.validation';
import UserValidations from '@utils/validators/user.validation';
import { AppRequest, AppResponse } from '@interfaces/utils.interface';
import PropertyValidations from '@utils/validators/property.validation';

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
  return res.status(httpStatusCodes.UNPROCESSABLE).json({
    success: false,
    error: { data: extractedErrors },
    type: errorTypes.VALIDATION_ERROR,
  });
};

export {
  validationRequestHandler,
  AuthValidations,
  UserValidations,
  PropertyValidations,
};
