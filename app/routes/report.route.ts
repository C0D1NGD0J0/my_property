import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { ReportController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import {
  ReportValidations,
  UtilsValidations,
  validationRequestHandler,
} from '@utils/validators';
import S3FileUpload from '@services/external/s3.service';
const fileUpload: S3FileUpload = new S3FileUpload();

router.use(AuthMiddleware.isAuthenticated);

// Report routes
router.post(
  '/:puid/',
  fileUpload.upload,
  ReportValidations.createReport,
  validationRequestHandler,
  asyncHandler(ReportController.createReport)
);

router.put(
  '/:id',
  fileUpload.upload,
  ReportValidations.createReport,
  validationRequestHandler,
  asyncHandler(ReportController.updateReport)
);

router.get(
  '/:puid',
  UtilsValidations.reportParams,
  validationRequestHandler,
  asyncHandler(ReportController.getReports)
);

router.put(
  '/:id/update_status',
  ReportValidations.updateStatus,
  validationRequestHandler,
  asyncHandler(ReportController.updateStatus)
);

router.delete(
  '/:id',
  UtilsValidations.reportParams,
  validationRequestHandler,
  asyncHandler(ReportController.archiveReport)
);

// Comments routes
router.get(
  '/:id/comments',
  UtilsValidations.reportParams,
  validationRequestHandler,
  asyncHandler(ReportController.getComments)
);

router.post(
  '/:id/comments',
  ReportValidations.addComment,
  validationRequestHandler,
  asyncHandler(ReportController.addComment)
);

router.put(
  '/:id/comments/:commentId',
  ReportValidations.addComment,
  validationRequestHandler,
  asyncHandler(ReportController.editComment)
);

router.post(
  '/:id/comments/:commentId',
  ReportValidations.addComment,
  validationRequestHandler,
  asyncHandler(ReportController.addComment)
);

export default router;
