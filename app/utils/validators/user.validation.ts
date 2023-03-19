import User from '../../models/user.model';
import ErrorResponse from '../../utils/errorResponse';
import { body } from 'express-validator';
import { ISignupAccountType } from '@interfaces/user.interface';
import { errorTypes, httpStatusCodes } from '@utils/constants';

const updateAccount = () => {
  const businessAcct = [
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
  ];
  const individualAcct = [
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
        // if (user) {
        //   throw new ErrorResponse(
        //     `The email(${email}) is already associated with an account.`,
        //     'validationError',
        //     httpStatusCodes.UNPROCESSABLE
        //   );
        // }
      }),
    body('phoneNumber')
      .if((_value: any, { req }: any) => req.body.acctType === 'individual')
      .exists()
      .withMessage("Phone number can't be blank"),
    body('password')
      .isLength({ min: 6, max: 15 })
      .exists({ checkFalsy: true })
      .withMessage("Password field can't be blank"),
    body('accountType', 'Account type must be provided.')
      .exists()
      .bail()
      .custom(async (utype) => {
        if (!Object.values(ISignupAccountType).includes(utype)) {
          throw new ErrorResponse(
            `Invalid account type provided.`,
            errorTypes.VALIDATION_ERROR,
            httpStatusCodes.UNPROCESSABLE
          );
        }
      }),
  ];

  return [...individualAcct, ...businessAcct];
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
};
