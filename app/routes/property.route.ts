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
const fileUpload: S3FileUpload = new S3FileUpload();

router.use(AuthMiddleware.isAuthenticated);

router.post(
  '/',
  fileUpload.upload,
  PropertyValidations.createProperty,
  validationRequestHandler,
  asyncHandler(PropertyController.createProperty)
);

router.post(
  '/:puid/add_apartment',
  PropertyValidations.createApartment,
  validationRequestHandler,
  asyncHandler(PropertyController.createApartment)
);

router.get('/', asyncHandler(PropertyController.getUserProperties));

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
  fileUpload.upload,
  PropertyValidations.updateDetails,
  validationRequestHandler,
  asyncHandler(PropertyController.updateDetails)
);

router.delete(
  '/:propertyId/apartment_units/:unitId',
  UtilsValidations.validatePropertyParams,
  validationRequestHandler,
  asyncHandler(PropertyController.archiveApartment)
);

export default router;
