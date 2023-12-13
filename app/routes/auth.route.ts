import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { AuthController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import S3FileUpload from '@services/external/s3.service';
import { AuthValidations, validationRequestHandler } from '@utils/validators';
const fileUpload: S3FileUpload = new S3FileUpload();

router.post(
  '/signup',
  fileUpload.textOnlyData,
  AuthValidations.signup,
  validationRequestHandler,
  asyncHandler(AuthController.signup)
);

router.post(
  '/account_activation/:cid',
  AuthValidations.tokenValidation,
  validationRequestHandler,
  asyncHandler(AuthController.accountActivation)
);

router.post(
  '/resend_activation_link',
  AuthValidations.resendActivationToken,
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
  '/:cid/logout',
  AuthMiddleware.isAuthenticated,
  asyncHandler(AuthController.logout)
);

router.get(
  '/refresh_token',
  AuthMiddleware.initiateTokenRefresh,
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
