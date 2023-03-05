import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { AuthController } from '@controllers/index';
import { AuthValidations, validationRequestHandler } from '@utils/validators';

router.post(
  '/signup',
  AuthValidations.signup,
  validationRequestHandler,
  asyncHandler(AuthController.signup)
);

router.get(
  '/account_activation/:token',
  AuthValidations.tokenValidation,
  validationRequestHandler,
  asyncHandler(AuthController.accountActivation)
);

router.post(
  '/resend_activation_link',
  AuthValidations.accountActivation,
  validationRequestHandler,
  asyncHandler(AuthController.resendActivationLink)
);

router.post(
  '/login',
  AuthValidations.login,
  validationRequestHandler,
  asyncHandler(AuthController.login)
);

router.get('/refresh_token', asyncHandler(AuthController.refreshToken));

router.post(
  '/forgot_password',
  AuthValidations.forgotPassword,
  validationRequestHandler,
  asyncHandler(AuthController.forgotPassword)
);

router.put(
  '/reset_password',
  AuthValidations.resetPassword,
  validationRequestHandler,
  asyncHandler(AuthController.resetPassword)
);

export default router;
