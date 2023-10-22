import User from '../../models/user/user.model';
import ErrorResponse from '../../utils/errorResponse';
import { body, param, query } from 'express-validator';
import { IAccountType } from '@interfaces/user.interface';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import { validateResourceID } from '@utils/helperFN';
import { Client } from '@models/index';

const validateCIDParams = () => {
  return [
    param('cid', 'Client resource identifier missing.')
      .exists()
      .bail()
      .custom(async (cid) => {
        const { isValid } = validateResourceID(cid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid resource identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }

        const client = await Client.findOne({ cid });
        if (!client) {
          throw new ErrorResponse(
            `No resource available with the identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};

const signup = () => {
  return [
    body('firstName', "First Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('lastName', "Last Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('location', 'Please provide your country of residence.').exists(),
    body('email', "Email field can't be blank.")
      .exists()
      .isEmail()
      .bail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (user) {
          throw new ErrorResponse(
            `The email(${email}) is already associated with an account.`,
            'validationError',
            httpStatusCodes.UNPROCESSABLE
          );
        }
      }),
    body('phoneNumber').exists().withMessage("Phone number can't be blank"),
    // .isMobilePhone('any', { strictMode: true })
    // .withMessage('Phone number is invalid')
    body('accountType', 'Account type must be provided.')
      .exists()
      .bail()
      .custom(async (utype) => {
        const parsedUtype = JSON.parse(utype);
        if (
          !Object.values(IAccountType).includes(
            parsedUtype.name.toLowerCase()
          ) ||
          !parsedUtype.id
        ) {
          throw new ErrorResponse(
            `Invalid account type provided.`,
            'validationError',
            httpStatusCodes.UNPROCESSABLE
          );
        }
      }),
    body('password')
      .isLength({ min: 6, max: 15 })
      .exists({ checkFalsy: true })
      .withMessage("Password field can't be blank"),
  ];
};

const enterprise_profile = () => {
  return [
    body('contactInfo.email', 'Business email address is required')
      .if(
        (_value: any, { req }: any) =>
          req.body.acctType === IAccountType.enterprise
      )
      .exists()
      .bail()
      .isEmail()
      .withMessage('Invalid email address format'),
    body('contactInfo.address', 'Business address is required')
      .if(
        (_value: any, { req }: any) =>
          req.body.acctType === IAccountType.enterprise
      )
      .exists(),
    body('contactInfo.phoneNumber', 'Business phone number is required')
      .if(
        (_value: any, { req }: any) =>
          req.body.acctType === IAccountType.enterprise
      )
      .exists()
      .isMobilePhone('any', { strictMode: true })
      .withMessage('Phone number is invalid'),
    body('companyName', 'Company name is required')
      .if(
        (_value: any, { req }: any) =>
          req.body.acctType === IAccountType.enterprise
      )
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('legaEntityName', 'Legal entity name is required')
      .if(
        (_value: any, { req }: any) =>
          req.body.acctType === IAccountType.enterprise
      )
      .exists()
      .isLength({ min: 2, max: 25 }),
    body(
      'businessRegistrationNumber',
      'Business registration number is required'
    )
      .if(
        (_value: any, { req }: any) =>
          req.body.acctType === IAccountType.enterprise
      )
      .exists()
      .isLength({ min: 2, max: 25 }),
  ];
};

const validateUserSignup = () => {
  return [...signup(), ...enterprise_profile()];
};

const login = () => {
  return [
    body('email', "Email field can't be blank.")
      .exists()
      .isEmail()
      .bail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (!user) {
          throw new ErrorResponse(
            `Invalid email/password combination`,
            'validationError',
            httpStatusCodes.UNAUTHORIZED
          );
        }
      }),
    body('password')
      .isLength({ min: 6, max: 15 })
      .exists({ checkFalsy: true })
      .withMessage("Password field can't be blank"),
  ];
};

const forgotPassword = () => {
  return [
    body('email')
      .exists({ checkFalsy: true })
      .withMessage("Email can't be blank")
      .isEmail()
      .withMessage('Invalid email format.')
      .bail()
      .custom(async (email) => {
        const user = await User.findOne({ email });

        if (!user) {
          throw new ErrorResponse(
            "Email doesn't exist",
            'validationError',
            httpStatusCodes.UNPROCESSABLE
          );
        }
      }),
  ];
};

const resetPassword = () => {
  return [
    body('resetToken')
      .exists({ checkFalsy: true })
      .withMessage('Password reset token is missing.')
      .bail()
      .custom(async (token) => {
        const user = await User.findOne({
          passwordResetToken: token,
          passwordResetExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
          throw new ErrorResponse(
            'Please generate a new token.',
            'validationError',
            httpStatusCodes.UNPROCESSABLE
          );
        }
      }),
    body('password')
      .isLength({ min: 6, max: 15 })
      .exists({ checkFalsy: true })
      .withMessage("Password field can't be blank"),
  ];
};

const resendActivationToken = () => {
  return [
    body('token')
      .exists({ checkFalsy: true })
      .withMessage('Email address must be provided.')
      .bail()
      .custom(async (token) => {
        const user = await User.findOne({
          activationToken: token,
        });

        if (!user) {
          throw new ErrorResponse(
            'No account found with provide token.',
            'validationError',
            httpStatusCodes.UNPROCESSABLE
          );
        }

        if (user.isActive) {
          throw new ErrorResponse(
            'Please login again.',
            'validationError',
            httpStatusCodes.UNPROCESSABLE
          );
        }
      }),
    body('cid', 'Client resource identifier missing.')
      .exists()
      .bail()
      .custom(async (cid) => {
        const { isValid } = validateResourceID(cid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid resource identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }

        const client = await Client.findOne({ cid });
        if (!client) {
          throw new ErrorResponse(
            `No resource available with the identifier provided <${cid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};

const tokenValidation = () => {
  return [
    ...validateCIDParams(),
    body('accountCode')
      .exists({ checkFalsy: true })
      .withMessage('Account activation token is required.')
      .isHash('sha256')
      .withMessage('Invalid account activation token provided'),
  ];
};

export default {
  login: login(),
  resetPassword: resetPassword(),
  forgotPassword: forgotPassword(),
  signup: validateUserSignup(),
  resendActivationToken: resendActivationToken(),
  tokenValidation: tokenValidation(),
};
