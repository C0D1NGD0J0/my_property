import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { UserController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import { UserValidations, validationRequestHandler } from '@utils/validators';

router.use(AuthMiddleware.isAuthenticated);

router.get('/currentuser', asyncHandler(UserController.getCurrentUser));

router.get('/account_info', asyncHandler(UserController.getAccountInfo));

router.put(
  '/update_account',
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
