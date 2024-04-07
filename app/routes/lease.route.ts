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
  fileUpload.s3Upload,
  LeaseValidations.createLease,
  validationRequestHandler,
  asyncHandler(LeaseController.createLease)
);

router.put(
  '/:cid/update_lease/:id',
  fileUpload.s3Upload,
  LeaseValidations.updateLease,
  validationRequestHandler,
  asyncHandler(LeaseController.updateLease)
);

router.put(
  '/:cid/terminate_lease/:id',
  LeaseValidations.validateParams,
  validationRequestHandler,
  asyncHandler(LeaseController.terminateLease)
);

router.put(
  '/:cid/renew_lease/:id',
  LeaseValidations.leaseRenewal,
  validationRequestHandler,
  asyncHandler(LeaseController.leaseRenewal)
);

export default router;
