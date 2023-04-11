import { body, param } from 'express-validator';

import { Client, Invite, Property } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { validateResourceID } from '@utils/helperFN';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import dayjs from 'dayjs';

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

const resendInvite = () => {
  return [
    body('id', 'Resource identifier missing.')
      .exists()
      .bail()
      .custom(async (id) => {
        const { isValid } = validateResourceID(id);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid identifier provided <${id}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.BAD_REQUEST
          );
        }

        const invite = await Invite.findById(id);
        if (!invite) {
          throw new ErrorResponse(
            `Resource not found.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};

const validateInviteToken = () => {
  return [
    param('id', 'Resource identifier missing.')
      .exists()
      .bail()
      .custom(async (id) => {
        const invite = await Invite.findById(id);
        if (!invite) {
          throw new ErrorResponse(
            `No resource available with the identifier provided <${id}>.`,
            errorTypes.VALIDATION_ERROR,
            httpStatusCodes.UNPROCESSABLE
          );
        }
      }),
    body('token')
      .exists({ checkFalsy: true })
      .withMessage('Invite token is required.')
      .isHash('sha256')
      .withMessage('Invalid invite activation token provided')
      .bail()
      .custom(async (token) => {
        const invite = await Invite.findOne({
          inviteToken: token,
          inviteTokenExpiresAt: { $gt: dayjs() },
        });
        if (!invite) {
          throw new ErrorResponse(
            `Invalid Client resource identifier provided <${token}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};

export default {
  createInvite: createInvite(),
  resendInvite: resendInvite(),
  validateInviteToken: validateInviteToken(),
};
