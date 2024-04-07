import dayjs from 'dayjs';
import { body, param } from 'express-validator';
import User from '../../models/user/user.model';
import ErrorResponse from '../errorResponse';
import {
  errorTypes,
  httpStatusCodes,
  stripeSupportedCountries,
} from '@utils/constants';
import { isValidPhoneNumber, validateResourceID } from '@utils/helperFN';
import { Client } from '@models/index';

const updateAccount = () => {
  // const businessAcct = [
  //   body('contactInfo.email', 'Business email address is required')
  //     .if((_value: any, { req }: any) => req.body.acctType === 'enterprise')
  //     .exists()
  //     .bail()
  //     .isEmail()
  //     .withMessage('Invalid email address format'),
  //   body('contactInfo.address', 'Business address is required')
  //     .if((_value: any, { req }: any) => req.body.acctType === 'enterprise')
  //     .exists(),
  //   body('contactInfo.phoneNumber', 'Business phone number is required')
  //     .if((_value: any, { req }: any) => req.body.acctType === 'enterprise')
  //     .exists()
  //     .isMobilePhone('any', { strictMode: true })
  //     .withMessage('Phone number is invalid'),
  //   body('companyName', 'Company name is required')
  //     .if((_value: any, { req }: any) => req.body.acctType === 'enterprise')
  //     .exists()
  //     .isLength({ min: 2, max: 25 }),
  // ];
  const individualAcct = [
    body('firstName', "First Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('lastName', "Last Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('location', 'Please provide your country of residence.')
      .exists()
      .bail()
      .custom((location: string) => {
        const found = stripeSupportedCountries.find((item) => {
          return item.name.toLowerCase() === location.toLowerCase();
        });
        if (!found) {
          throw new ErrorResponse(
            `Invalid location provided.`,
            'validationError',
            httpStatusCodes.UNPROCESSABLE
          );
        }

        return location;
      }),
    body('email', "Email field can't be blank.")
      .exists()
      .isEmail()
      .bail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        // if (user) {
        //   throw new ErrorResponse(
        //     `The email(${email}) is already associated with an account.`,
        //     'validationError',
        //     httpStatusCodes.UNPROCESSABLE
        //   );
        // }
        return email;
      }),
    body('phoneNumber').exists().withMessage("Phone number can't be blank"),
    body('password')
      .isLength({ min: 6, max: 15 })
      .exists({ checkFalsy: true })
      .withMessage("Password field can't be blank"),
  ];

  return [...individualAcct];
};

const updateClientAccount = () => {
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

        return cid;
      }),
    body('contactInfo.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('contactInfo.address')
      .optional()
      .notEmpty()
      .withMessage('Address cannot be empty'),
    body('contactInfo.phoneNumber')
      .optional()
      // .isMobilePhone('any')
      .custom((phone: string) => {
        if (!phone) return true;
        const res = isValidPhoneNumber(phone);
        return res;
      })
      .withMessage('Invalid phone number'),
    body('contactInfo.contactPerson')
      .optional()
      .notEmpty()
      .withMessage('Contact person cannot be empty'),
    body('companyName')
      .optional()
      .notEmpty()
      .withMessage('Company name cannot be empty'),
    body('legalEntityName')
      .optional()
      .notEmpty()
      .withMessage('Legal entity name cannot be empty'),
    body('identification.idType').notEmpty().withMessage('ID type is required'),
    body('identification.idNumber')
      .notEmpty()
      .withMessage('ID number is required'),
    body('identification.authority')
      .notEmpty()
      .withMessage('Authority is required'),
    body('identification.issueDate')
      // .isDate()
      .notEmpty()
      .withMessage('Issue date is required')
      .custom((value) => {
        return dayjs(value, 'YYYY-MM-DDTHH:mm:ssZ', true).isValid();
      }),
    body('identification.expiryDate')
      .notEmpty()
      .withMessage('Expiry date is required.')
      .custom((value) => {
        return dayjs(value, 'YYYY-MM-DDTHH:mm:ssZ', true).isValid();
      }),
    body('identification.issuingState')
      .notEmpty()
      .withMessage('Issuing state is required'),
    body('businessRegistrationNumber')
      .optional()
      .notEmpty()
      .withMessage('Business registration number cannot be empty'),
  ];
};

const deleteAccount = () => {
  return [
    body('password')
      .exists({ checkFalsy: true })
      .isLength({ min: 6, max: 15 })
      .withMessage("Password field can't be blank"),
  ];
};

export default {
  deleteAccount: deleteAccount(),
  updateAccount: updateAccount(),
  updateClientAccount: updateClientAccount(),
};
