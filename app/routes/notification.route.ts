import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { NotificationController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import {
  NotificationValidations,
  UtilsValidations,
  validationRequestHandler,
} from '@utils/validators';

router.use(AuthMiddleware.isAuthenticated);

// Report routes
router.post(
  '/:cid/',
  NotificationValidations.createNotification,
  validationRequestHandler,
  asyncHandler(NotificationController.createNotification)
);

export default router;
