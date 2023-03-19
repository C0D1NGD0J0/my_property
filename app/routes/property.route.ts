import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { PropertyController } from '@controllers/index';
import { isAuthenticated } from '@utils/middlewares/auth';
import {
  PropertyValidations,
  validationRequestHandler,
} from '@utils/validators';
import S3FileUpload from '@services/external/s3.service';
const fileUpload: S3FileUpload = new S3FileUpload();

router.use(isAuthenticated);

router.post(
  '/',
  fileUpload.upload,
  PropertyValidations.createProperty,
  validationRequestHandler,
  asyncHandler(PropertyController.createProperty)
);

export default router;
