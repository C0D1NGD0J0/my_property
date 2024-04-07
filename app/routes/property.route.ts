import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { PropertyController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import {
  PropertyValidations,
  UtilsValidations,
  validationRequestHandler,
} from '@utils/validators';
import S3FileUpload from '@services/external/s3.service';
import FileUpload from '@services/fileUpload';
const s3UploadService: S3FileUpload = new S3FileUpload();
const fileUploadService: FileUpload = new FileUpload('uploads/csv/', 7);

router.use(AuthMiddleware.isAuthenticated);

router.post(
  '/:cid/add_property',
  s3UploadService.s3Upload,
  PropertyValidations.createProperty,
  validationRequestHandler,
  asyncHandler(PropertyController.createProperty)
);

router.post(
  '/:cid/validate_csv',
  fileUploadService.saveCsvToDisk,
  asyncHandler(PropertyController.processCsvUpload)
);

router.post(
  '/:cid/insert_csv',
  asyncHandler(PropertyController.saveProcessedCsvUpload)
);

router.post(
  '/:puid/add_apartment',
  PropertyValidations.createApartment,
  validationRequestHandler,
  asyncHandler(PropertyController.createApartment)
);

router.get(
  '/:cid/user_properties',
  asyncHandler(PropertyController.getUserProperties)
);

router.get(
  '/:cid/client_properties',
  UtilsValidations.validateClientParams,
  validationRequestHandler,
  asyncHandler(PropertyController.getClientProperties)
);

router.get(
  '/:puid',
  PropertyValidations.validateParams,
  validationRequestHandler,
  asyncHandler(PropertyController.getProperty)
);

router.put(
  '/:puid/archive',
  PropertyValidations.validateParams,
  validationRequestHandler,
  asyncHandler(PropertyController.archiveProperty)
);

router.put(
  '/:puid',
  s3UploadService.s3Upload,
  PropertyValidations.updateDetails,
  validationRequestHandler,
  asyncHandler(PropertyController.updateDetails)
);

router.delete(
  '/:puid/apartments/:unitId',
  UtilsValidations.validatePropertyParams,
  validationRequestHandler,
  asyncHandler(PropertyController.archiveApartment)
);

export default router;
