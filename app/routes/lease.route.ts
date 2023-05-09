import express, { Router } from 'express';
const router: Router = express.Router();

import { asyncHandler } from '@utils/middlewares';
import { LeaseController } from '@controllers/index';
import AuthMiddleware from '@utils/middlewares/auth';
import { LeaseValidations, validationRequestHandler } from '@utils/validators';
import S3FileUpload from '@services/external/s3.service';
const fileUpload: S3FileUpload = new S3FileUpload();

router.use(AuthMiddleware.isAuthenticated);

router.get(
  '/:cid/:id',
  LeaseValidations.validateParams,
  validationRequestHandler,
  asyncHandler(LeaseController.getLease)
);

router.get(
  '/:cid/client_leases',
  LeaseValidations.validateParams,
  validationRequestHandler,
  asyncHandler(LeaseController.getAllLeases)
);

router.get(
  '/:cid/my_leases',
  LeaseValidations.validateParams,
  validationRequestHandler,
  asyncHandler(LeaseController.getMyLeases)
);

router.post(
  '/:cid/',
  fileUpload.upload,
  LeaseValidations.createLease,
  validationRequestHandler,
  asyncHandler(LeaseController.createLease)
);

router.put(
  '/:cid/:id/update_lease',
  fileUpload.upload,
  LeaseValidations.updateLease,
  validationRequestHandler,
  asyncHandler(LeaseController.updateLease)
);

router.put(
  '/:cid/:id/terminate_lease',
  LeaseValidations.validateParams,
  validationRequestHandler,
  asyncHandler(LeaseController.terminateLease)
);

export default router;
