import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { LeaseController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import { LeaseValidations, validationRequestHandler } from '@utils/validators';
import S3FileUpload from '@services/external/s3.service';
const fileUpload: S3FileUpload = new S3FileUpload();

router.use(AuthMiddleware.isAuthenticated);

router.post(
  '/:cid/',
  fileUpload.upload,
  LeaseValidations.createLease,
  validationRequestHandler,
  asyncHandler(LeaseController.createLease)
);

export default router;
