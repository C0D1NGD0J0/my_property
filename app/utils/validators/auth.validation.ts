import User from '../../models/user.model';
import ErrorResponse from '../../utils/errorResponse';
import { body, param } from 'express-validator';

const signup = () => {
  return [
    body('firstName', "First Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('lastName', "Last Name field can't be blank")
      .exists()
      .isLength({ min: 2, max: 25 }),
    body('location', 'Please provide your country of residence.').exists(),
    body('email', 'Invalid email address format')
      .isEmail()
      .exists()
      .bail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (user) {
          throw new ErrorResponse(
            `The email(${email}) is already associated with an account.`,
            422,
            'authServiceError'
          );
        }
      }),
    body('phoneNumber')
      .exists()
      .withMessage("Phone number can't be blank")
      .isMobilePhone('any')
      .withMessage('Phone number is invalid'),
    body('userType', 'Please select a user type')
      .exists()
      .bail()
      .custom(async (utype) => {
        const utypes = ['business', 'individual'];

        if (!utypes.includes(utype)) {
          throw new ErrorResponse(
            `Invalid user type provided.`,
            422,
            'authServiceError'
          );
        }
      }),
    body('password')
      .isLength({ min: 6, max: 15 })
      .exists({ checkFalsy: true })
      .withMessage("Password field can't be blank"),
  ];
};

const login = () => {
  return [
    body('email', 'Invalid email address format')
      .isEmail()
      .exists()
      .bail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (!user) {
          throw new ErrorResponse(
            `Invalid email/password combination`,
            404,
            'authServiceError'
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
            422,
            'authServiceError'
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
            422,
            'authServiceError'
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
  signup: signup(),
  resetPassword: resetPassword(),
  forgotPassword: forgotPassword(),
  accountActivation: accountActivation(),
};
