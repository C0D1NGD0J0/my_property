import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { InviteController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import {
  InvitationValidations,
  validationRequestHandler,
} from '@utils/validators';

router.get(
  '/validate_invite_token/:id',
  InvitationValidations.validateInviteToken,
  validationRequestHandler,
  AuthMiddleware.isAuthenticated,
  asyncHandler(InviteController.validateInvite)
);

router.post(
  '/accept_invite/:id',
  InvitationValidations.acceptInvite,
  validationRequestHandler,
  asyncHandler(InviteController.acceptInvite)
);

router.get(
  '/',
  AuthMiddleware.isAuthenticated,
  asyncHandler(InviteController.allInvites)
);

router.put(
  '/resend-invite',
  InvitationValidations.resendInvite,
  validationRequestHandler,
  AuthMiddleware.isAuthenticated,
  asyncHandler(InviteController.resendInvite)
);

router.post(
  '/',
  InvitationValidations.createInvite,
  validationRequestHandler,
  AuthMiddleware.isAuthenticated,
  asyncHandler(InviteController.createInvite)
);

export default router;
