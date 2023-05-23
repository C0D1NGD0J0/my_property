import { body, param } from 'express-validator';
// import { isValidObjectId } from 'mongoose';
import ErrorResponse from '@utils/errorResponse';
import { validateResourceID } from '@utils/helperFN';
import { Property, Lease, User, Client } from '@models/index';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import { ILeaseStatusEnum } from '@interfaces/lease.interface';
import { AppRequest } from '@interfaces/utils.interface';

const validateParams = () => {
  return [
    param('cid', 'Client identifier missing.')
      .if(param('cid').exists())
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
    param('id', 'Lease identifier missing.')
      .if(param('id').exists())
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

        const lease = await Lease.findById(id);
        if (!lease) {
          throw new ErrorResponse(
            `Invalid Lease resource identifier provided <${id}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};

const create = () => {
  return [
    body('startDate')
      .exists()
      .withMessage('Start date is required.')
      .isISO8601()
      .toDate()
      .withMessage('Start date should be a valid date in ISO 8601 format.'),

    body('endDate')
      .exists()
      .withMessage('End date is required.')
      .isISO8601()
      .toDate()
      .withMessage('End date should be a valid date in ISO 8601 format.'),

    body('property')
      .exists()
      .withMessage('Property ID is required.')
      .bail()
      .custom(async (id) => {
        const property = await Property.findById(id);
        if (!property) {
          throw new ErrorResponse(
            `No Property resource available with the identifier provided.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),

    body('managedBy')
      .exists()
      .withMessage('ManagedBy value is required.')
      .bail()
      .custom(async (id) => {
        const user = await User.findById(id);
        if (!user) {
          throw new ErrorResponse(
            `No User resource available with the identifier provided.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),

    body('apartmentId')
      .optional()
      .exists()
      .withMessage('Apartment ID is required.'),

    body('cid').exists().withMessage('CID is required.'),

    body('paymentInfo.rentAmount')
      .exists()
      .withMessage('Rent amount is required.')
      .isNumeric()
      .withMessage('Rent amount should be a number.')
      .custom((value: number) => value > 0)
      .withMessage('Rent amount should be greater than 0.'),

    body('paymentInfo.paymentFrequency')
      .exists()
      .withMessage('Payment frequency is required.')
      .isIn(['monthly', 'quarterly', 'biannually', 'annually'])
      .withMessage('Invalid payment frequency value provided.'),

    body('paymentInfo.paymentDueDate')
      .exists()
      .withMessage('Payment due date is required.')
      .isISO8601()
      .toDate()
      .withMessage(
        'Payment due date should be a valid date in ISO 8601 format.'
      ),

    body('paymentInfo.securityDeposit')
      .exists()
      .withMessage('Security deposit is required.')
      .isNumeric()
      .withMessage('Security deposit should be a number.')
      .custom((value: number) => value >= 0)
      .withMessage('Security deposit should be greater than or equal to 0.'),

    body('status.value', 'Please provide a status of this lease.')
      .exists()
      .isIn(Object.values(ILeaseStatusEnum)),
  ];
};

const update = () => {
  return [
    ...validateParams(),
    body('startDate')
      .exists()
      .withMessage('Start date is required.')
      .isISO8601()
      .toDate()
      .withMessage('Start date should be a valid date in ISO 8601 format.'),

    body('endDate')
      .exists()
      .withMessage('End date is required.')
      .isISO8601()
      .toDate()
      .withMessage('End date should be a valid date in ISO 8601 format.'),

    body('property')
      .exists()
      .withMessage('Property ID is required.')
      .bail()
      .custom(async (id) => {
        const property = await Property.findById(id);
        if (!property) {
          throw new ErrorResponse(
            `No Property resource available with the identifier provided.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),

    body('managedBy')
      .exists()
      .withMessage('ManagedBy value is required.')
      .bail()
      .custom(async (id) => {
        const user = await User.findById(id);
        if (!user) {
          throw new ErrorResponse(
            `No User resource available with the identifier provided.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),

    body('apartmentId')
      .optional()
      .exists()
      .withMessage('Apartment ID is required.'),

    body('cid').exists().withMessage('CID is required.'),

    body('paymentInfo.rentAmount')
      .exists()
      .withMessage('Rent amount is required.')
      .isNumeric()
      .withMessage('Rent amount should be a number.')
      .custom((value: number) => value > 0)
      .withMessage('Rent amount should be greater than 0.'),

    body('paymentInfo.paymentFrequency')
      .exists()
      .withMessage('Payment frequency is required.')
      .isIn(['monthly', 'quarterly', 'biannually', 'annually'])
      .withMessage('Invalid payment frequency value provided.'),

    body('paymentInfo.paymentDueDate')
      .exists()
      .withMessage('Payment due date is required.')
      .isISO8601()
      .toDate()
      .withMessage(
        'Payment due date should be a valid date in ISO 8601 format.'
      ),

    body('paymentInfo.securityDeposit')
      .exists()
      .withMessage('Security deposit is required.')
      .isNumeric()
      .withMessage('Security deposit should be a number.')
      .custom((value: number) => value >= 0)
      .withMessage('Security deposit should be greater than or equal to 0.'),

    body('status.value', 'Please provide a status of this lease.')
      .exists()
      .isIn(Object.values(ILeaseStatusEnum)),
    body('status.reason')
      .if(
        (value: any, { req }: any) =>
          req.body.status.value === ILeaseStatusEnum.cancelled
      )
      .notEmpty()
      .withMessage('Termination reason is required.'),
  ];
};

export default {
  createLease: create(),
  updateLease: update(),
  validateParams: validateParams(),
};
