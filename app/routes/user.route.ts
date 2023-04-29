import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { UserController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import {
  UserValidations,
  UtilsValidations,
  validationRequestHandler,
} from '@utils/validators';

router.use(AuthMiddleware.isAuthenticated);

router.get(
  '/:cid/currentuser',
  UtilsValidations.validateClientParams,
  validationRequestHandler,
  asyncHandler(UserController.getCurrentUser)
);

router.get(
  '/:cid/client_users',
  UtilsValidations.validateClientParams,
  validationRequestHandler,
  asyncHandler(UserController.getClientUsers)
);

router.get(
  '/:cid/account_info',
  UtilsValidations.validateClientParams,
  validationRequestHandler,
  asyncHandler(UserController.getAccountInfo)
);

router.put(
  '/:cid/update_account',
  UserValidations.updateAccount,
  validationRequestHandler,
  asyncHandler(UserController.updateAccount)
);

router.post(
  '/delete_account',
  UserValidations.deleteAccount,
  validationRequestHandler,
  asyncHandler(UserController.deleteAccount)
);

export default router;
