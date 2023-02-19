import User from '../../models/user.model';
import ErrorResponse from '../../utils/errorResponse';
import { body, param } from 'express-validator';
import { ISignupAccountType } from '@interfaces/user.interface';

const signup = () => {
  return [
    body('firstName', "First Name field can't be blank")
      .if((_value: any, { req }: any) => req.body.acctType === 'individual')
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('lastName', "Last Name field can't be blank")
      .if((_value: any, { req }: any) => req.body.acctType === 'individual')
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('location', 'Please provide your country of residence.')
      .if((_value: any, { req }: any) => req.body.acctType === 'individual')
      .exists(),
    body('email', "Email field can't be blank.")
      .exists()
      .isEmail()
      .bail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (user) {
          throw new ErrorResponse(
            `The email(${email}) is already associated with an account.`,
            'authServiceError',
            422
          );
        }
      }),
    body('phoneNumber')
      .if((_value: any, { req }: any) => req.body.acctType === 'individual')
      .exists()
      .withMessage("Phone number can't be blank"),
    // .isMobilePhone('any', { strictMode: true })
    // .withMessage('Phone number is invalid')
    body('accountType', 'Account type must be provided.')
      .exists()
      .bail()
      .custom(async (utype) => {
        if (!Object.values(ISignupAccountType).includes(utype)) {
          throw new ErrorResponse(
            `Invalid account type provided.`,
            'authServiceError',
            422
          );
        }
      }),
    body('password')
      .isLength({ min: 6, max: 15 })
      .exists({ checkFalsy: true })
      .withMessage("Password field can't be blank"),
  ];
};

const business_signup = () => {
  return [
    body('contactInfo.email', 'Business email address is required')
      .if((_value: any, { req }: any) => req.body.acctType === 'business')
      .exists()
      .bail()
      .isEmail()
      .withMessage('Invalid email address format'),
    body('contactInfo.address', 'Business address is required')
      .if((_value: any, { req }: any) => req.body.acctType === 'business')
      .exists(),
    body('contactInfo.phoneNumber', 'Business phone number is required')
      .if((_value: any, { req }: any) => req.body.acctType === 'business')
      .exists()
      .isMobilePhone('any', { strictMode: true })
      .withMessage('Phone number is invalid'),
    body('companyName', 'Company name is required')
      .if((_value: any, { req }: any) => req.body.acctType === 'business')
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('legaEntityName', 'Legal entity name is required')
      .if((_value: any, { req }: any) => req.body.acctType === 'business')
      .exists()
      .isLength({ min: 2, max: 25 }),
    body(
      'businessRegistrationNumber',
      'Business registration number is required'
    )
      .if((_value: any, { req }: any) => req.body.acctType === 'business')
      .exists()
      .isLength({ min: 2, max: 25 }),
  ];
};

const validateAllUserTypeSignup = () => {
  return [...signup(), ...business_signup()];
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
            'authServiceError',
            401
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
            'authServiceError',
            422
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
            'authServiceError',
            422
          );
        }
      }),
    body('password')
      .isLength({ min: 6, max: 15 })
      .exists({ checkFalsy: true })
      .withMessage("Password field can't be blank"),
  ];
};

const accountActivation = () => {
  return [
    param('token')
      .exists({ checkFalsy: true })
      .withMessage('Account activation is required.')
      .isHash('sha256')
      .withMessage('Invalid account activation token provided'),
  ];
};

export default {
  login: login(),
  resetPassword: resetPassword(),
  forgotPassword: forgotPassword(),
  signup: validateAllUserTypeSignup(),
  accountActivation: accountActivation(),
};
