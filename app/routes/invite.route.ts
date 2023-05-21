import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { InviteController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import {
  InvitationValidations,
  validationRequestHandler,
} from '@utils/validators';

router.use(AuthMiddleware.isAuthenticated);

router.get(
  '/validate_invite_token/:id',
  InvitationValidations.validateInviteToken,
  validationRequestHandler,
  asyncHandler(InviteController.validateInvite)
);

router.post(
  '/accept_invite/:id',
  InvitationValidations.acceptInvite,
  validationRequestHandler,
  asyncHandler(InviteController.acceptInvite)
);

router.get('/', asyncHandler(InviteController.allInvites));

router.put(
  '/resend-invite',
  InvitationValidations.resendInvite,
  validationRequestHandler,
  asyncHandler(InviteController.resendInvite)
);

router.post(
  '/',
  InvitationValidations.createInvite,
  validationRequestHandler,
  asyncHandler(InviteController.createInvite)
);

export default router;
