import { body, param } from 'express-validator';

import { Client, Invite, Lease, Property } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { validateResourceID } from '@utils/helperFN';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import dayjs from 'dayjs';
import { ObjectId, Types } from 'mongoose';

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
    body('puid', 'Property identifier missing.')
      .exists()
      .bail()
      .custom(async (puid) => {
        const { isValid } = validateResourceID(puid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid identifier provided <${puid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.BAD_REQUEST
          );
        }

        const property = await Property.findOne({
          puid,
          deletedAt: { $eq: null },
        });
        if (!property) {
          throw new ErrorResponse(
            `Invalid Property resource identifier provided <${puid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
    body('leaseId', 'Lease identifier missing.')
      .if(
        (req: { userInfo: { userType: string } }) =>
          req.userInfo.userType === 'tenant'
      )
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

        const lease = await Lease.findOne({
          _id: new Types.ObjectId(id),
          deletedAt: { $eq: null },
        });
        if (!lease) {
          throw new ErrorResponse(
            `Invalid Lease resource identifier provided <${id}>.`,
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

const acceptInvite = () => {
  return [
    body('emergencyContact.name', "Name field can't be blank")
      .optional()
      .isLength({ min: 2, max: 25 }),
    body('emergencyContact.email', "Email field can't be blank.")
      .optional()
      .isEmail(),
    body('emergencyContact.phoneNumber')
      .optional()
      .exists()
      .withMessage("Phone number can't be blank"),

    body('userType').exists().isIn(['tenant', 'employee']),
    body('firstName', "First Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('lastName', "Last Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('email', "Email field can't be blank.").exists().isEmail(),
    body('phoneNumber')
      .optional()
      .exists()
      .withMessage("Phone number can't be blank"),
    body('password')
      .isLength({ min: 6, max: 15 })
      .exists({ checkFalsy: true })
      .withMessage("Password field can't be blank"),
    body('location', 'Please provide your country of residence.').exists(),
    body('leaseId', 'Lease identifier missing.')
      .if(
        (req: { userInfo: { userType: string } }) =>
          req.userInfo.userType === 'tenant'
      )
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

        const lease = await Lease.findOne({
          _id: new Types.ObjectId(id),
          deletedAt: { $eq: null },
        });
        if (!lease) {
          throw new ErrorResponse(
            `Invalid Lease resource identifier provided <${id}>.`,
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
  acceptInvite: acceptInvite(),
  validateInviteToken: validateInviteToken(),
};
