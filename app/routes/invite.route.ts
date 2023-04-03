import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { InviteController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import { InviteValidations, validationRequestHandler } from '@utils/validators';

router.use(AuthMiddleware.isAuthenticated);

router.post(
  '/',
  InviteValidations.create,
  validationRequestHandler,
  asyncHandler(InviteController.createInvitation)
);

export default router;
