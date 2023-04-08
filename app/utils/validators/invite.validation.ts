import { body, param } from 'express-validator';

import { Client, Property } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { validateResourceID } from '@utils/helperFN';
import { errorTypes, httpStatusCodes } from '@utils/constants';

const createInvite = () => {
  return [
    body('userInfo.userType').exists().isIn(['tenant', 'employee', 'vendor']),
    body('userInfo.firstName', "First Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('userInfo.lastName', "Last Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('userInfo.email', "Email field can't be blank.").exists().isEmail(),
    body('pid', 'Property identifier missing.')
      .exists()
      .bail()
      .custom(async (pid) => {
        const { isValid } = validateResourceID(pid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid identifier provided <${pid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.BAD_REQUEST
          );
        }

        const property = await Property.findOne({
          pid,
          deletedAt: { $eq: null },
        });
        if (!property) {
          throw new ErrorResponse(
            `Invalid Property resource identifier provided <${pid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
    body('cid', 'Client identifier missing.')
      .exists()
      .bail()
      .custom(async (cid) => {
        const { isValid } = validateResourceID(cid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.BAD_REQUEST
          );
        }

        const client = await Client.findOne({ cid });
        if (!client) {
          throw new ErrorResponse(
            `Invalid Client resource identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
    body('sendNow', 'Send invitation now value missing.')
      .exists()
      .isBoolean()
      .toBoolean(),
  ];
};

export default {
  createInvite: createInvite(),
};
