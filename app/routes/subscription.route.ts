import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { SubscriptionController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import {
  SubscriptionValidations,
  UtilsValidations,
  validationRequestHandler,
} from '@utils/validators';

router.get('/plans', asyncHandler(SubscriptionController.getPlans));

router.post(
  '/subscribe',
  SubscriptionValidations.subscribe,
  validationRequestHandler,
  AuthMiddleware.isAuthenticated,
  asyncHandler(SubscriptionController.subscribeToPlan)
);

export default router;
