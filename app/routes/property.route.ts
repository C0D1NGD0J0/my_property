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

// router.put("/:propertyId",
//   fileUpload.upload,
//   PropertyValidation.update,
//   validationRequestHandler,
//   asyncHandler(PropertyController.updateProperty)
// );

// router.post("/:propertyId/add_apartment_unit",
//   PropertyValidation.addApartmentUnit,
//   validationRequestHandler,
//   asyncHandler(PropertyController.addApartmentUnit)
// );

// router.delete("/:propertyId",
//   PropertyValidation.validateResourceId,
//   validationRequestHandler,
//   asyncHandler(PropertyController.deleteProperty)
// );

// router.delete("/:propertyId/apartment_units/:unitId",
//   PropertyValidation.deleteApartmentUnit,
//   validationRequestHandler,
//   asyncHandler(PropertyController.deleteApartmentUnit)
// );

export default router;
