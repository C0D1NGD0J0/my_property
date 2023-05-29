import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { AuthController } from '@controllers/index';
import { AuthValidations, validationRequestHandler } from '@utils/validators';
import AuthMiddleware from '@utils/middlewares/auth';

router.post(
  '/signup',
  AuthValidations.signup,
  validationRequestHandler,
  asyncHandler(AuthController.signup)
);

router.get(
  '/account_activation/:cid',
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

router.delete(
  '/logout',
  AuthMiddleware.isAuthenticated,
  asyncHandler(AuthController.logout)
);

router.get(
  '/refresh_token',
  AuthMiddleware.isAuthenticated,
  asyncHandler(AuthController.refreshToken)
);

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
