import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { PropertyController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import {
  PropertyValidations,
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

router.get(
  '/',
  validationRequestHandler,
  asyncHandler(PropertyController.getUserProperties)
);

router.get(
  '/:pid',
  PropertyValidations.validateParams,
  validationRequestHandler,
  asyncHandler(PropertyController.getProperty)
);

router.put(
  '/:pid/archive',
  PropertyValidations.validateParams,
  validationRequestHandler,
  asyncHandler(PropertyController.archiveProperty)
);

router.put(
  '/:pid',
  fileUpload.upload,
  PropertyValidations.updateDetails,
  validationRequestHandler,
  asyncHandler(PropertyController.updateDetails)
);

// router.post("/:propertyId/add_apartment_unit",
//   PropertyValidation.addApartmentUnit,
//   validationRequestHandler,
//   asyncHandler(PropertyController.addApartmentUnit)
// );

// router.delete("/:propertyId/apartment_units/:unitId",
//   PropertyValidation.deleteApartmentUnit,
//   validationRequestHandler,
//   asyncHandler(PropertyController.deleteApartmentUnit)
// );

export default router;
