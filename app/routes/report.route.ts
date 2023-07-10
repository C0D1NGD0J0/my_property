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

// router.get(
//   '/:id',
//   UtilsValidations.reportParams,
//   validationRequestHandler,
//   asyncHandler(ReportController.getReport)
// );

// router.put(
//   '/:id/update_status',
//   ReportValidations.updateStatus,
//   validationRequestHandler,
//   asyncHandler(ReportController.updateStatus)
// );

// router.delete(
//   '/:id',
//   UtilsValidations.reportParams,
//   validationRequestHandler,
//   asyncHandler(ReportController.archiveReport)
// );

export default router;
