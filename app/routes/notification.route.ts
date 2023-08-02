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
router.get(
  '/:cid',
  UtilsValidations.notificationParams,
  validationRequestHandler,
  asyncHandler(NotificationController.getNotifications)
);

router.put(
  '/:cid/:id',
  UtilsValidations.notificationParams,
  validationRequestHandler,
  asyncHandler(NotificationController.updateNotification)
);

export default router;
