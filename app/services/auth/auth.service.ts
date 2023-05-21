import dayjs from 'dayjs';
import { Types } from 'mongoose';
import { v4 as uuid } from 'uuid';

import {
  IUser,
  IUserRole,
  ISignupData,
  IAccountType,
  IUserDocument,
  IInviteUserSignup,
} from '@interfaces/user.interface';
import { hashGenerator, jwtGenerator } from '@utils/helperFN';
import {
  USER_REGISTRATION,
  PASSWORD_RESET_SUCCESS,
  FORGOT_PASSWORD,
  errorTypes,
  httpStatusCodes,
  ACCOUNT_SUCCESS_EMAIL,
} from '@utils/constants';
import { User, Client } from '@models/index';
import { IEmailOptions, ISuccessReturnData } from '@interfaces/utils.interface';
import ErrorResponse from '@utils/errorResponse';

class AuthService {
  signup = async (
    data: ISignupData
  ): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
    const _userId = new Types.ObjectId();
    // new client record
    const client = new Client({
      cid: uuid(),
      admin: _userId,
      accountType: data.accountType,
      ...(data.accountType === IAccountType.enterprise
        ? { enterpriseProfile: data.enterpriseProfile }
        : {}),
    });

    // create user record
    const { accountType, enterpriseProfile, ...userData } = data;
    const user = (await User.create({
      ...userData,
      uid: uuid(),
      _id: _userId,
      isActive: false,
      activationToken: hashGenerator(),
      cids: [{ cid: client?.cid, role: IUserRole.ADMIN, isConnected: false }],
      activationTokenExpiresAt: dayjs().add(1, 'hour').toDate(),
    })) as IUserDocument;

    await client.save(); //only save if user is created successfully
    const emailOptions: IEmailOptions = {
      to: user?.email,
      data: {
        fullname: user?.fullname,
        activationUrl: `${process.env.FRONTEND_URL}/account_activation/${client.cid}?t=${user.activationToken}`,
      },
      emailType: USER_REGISTRATION,
      subject: 'Activate your account',
    };

    return {
      success: true,
      data: { emailOptions },
      msg: `Account activation email has been sent to ${emailOptions.to}`,
    };
  };

  createInvitedUser = async (
    cid: string,
    data: IInviteUserSignup
  ): Promise<ISuccessReturnData<{ user: IUserDocument }>> => {
    const { ...userData } = data;
    const foundEmail = await User.findOne({
      'cids.cid': cid,
      email: data.email,
    });

    if (foundEmail) {
      const err = 'Account already exists with this email.';
      throw new ErrorResponse(
        err,
        'validationError',
        httpStatusCodes.UNPROCESSABLE
      );
    }

    // create user record
    const user = (await User.create({
      ...userData,
      uid: uuid(),
      isActive: true,
      activationToken: '',
      activationTokenExpiresAt: '',
      cids: [
        {
          cid,
          role: IUserRole[
            data.usertype.toUpperCase() as keyof typeof IUserRole
          ],
          isConnected: true,
        },
      ],
    })) as IUserDocument;

    const emailOptions: IEmailOptions = {
      to: user?.email,
      data: {
        fullname: user?.fullname,
      },
      emailType: ACCOUNT_SUCCESS_EMAIL,
      subject: 'Account is now active.',
    };

    return {
      success: true,
      data: { user },
    };
  };

  accountActivation = async (
    cid: string,
    token: string
  ): Promise<ISuccessReturnData> => {
    try {
      const user = (await User.findOne({
        isActive: false,
        activationToken: { $eq: token.trim() },
        activationTokenExpiresAt: { $gt: dayjs() },
      })) as IUserDocument;

      if (!user) {
        const msg = 'Activation code has exipred.';
        throw new ErrorResponse(
          msg,
          errorTypes.SERVICE_ERROR,
          httpStatusCodes.UNPROCESSABLE
        );
      }

      user.isActive = true;
      user.activationToken = '';
      user.cids = user.cids.map((item) => {
        if (item.cid === cid) {
          item.isConnected = true;
        }

        return item;
      });
      user.activationTokenExpiresAt = null;
      await user.save();

      return { success: true, msg: 'Account activated successfully.' };
    } catch (error) {
      throw error;
    }
  };

  resendActivationLink = async (
    email: string
  ): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
    try {
      const user = (await User.findOne({ email })) as IUserDocument;
      const emailOptions = {
        to: user?.email,
        data: {
          fullname: user?.fullname,
          activationUrl: `${process.env.FRONTEND_URL}/account_activation/${user.activationToken}`,
        },
        emailType: USER_REGISTRATION,
        subject: 'Activate your account',
      };

      user.activationToken = hashGenerator();
      user.activationTokenExpiresAt = dayjs().add(1, 'hour').toDate();

      await user.save();

      return {
        success: true,
        data: { emailOptions },
        msg: `Account activation link has been successfully to ${emailOptions.to}`,
      };
    } catch (error) {
      throw error;
    }
  };

  login = async (
    data: Pick<IUser, 'email' | 'password'>
  ): Promise<
    ISuccessReturnData<{
      refreshToken: string;
      accessToken: string;
      userid: string;
      clientId: string;
    }>
  > => {
    try {
      const user = (await User.findOne({
        email: data.email,
        isActive: true,
      })) as IUserDocument;
      const isMatch = await user.validatePassword(data.password);

      if (!isMatch) {
        const err = 'Invalid email/password credentials.';
        throw new ErrorResponse(
          err,
          errorTypes.AUTH_ERROR,
          httpStatusCodes.UNAUTHORIZED
        );
      }

      if (!user.isActive) {
        throw new ErrorResponse(
          'Please validate your email by clicking the link emailed during regitration process.',
          errorTypes.AUTH_ERROR,
          httpStatusCodes.UNPROCESSABLE
        );
      }

      const { accessToken, refreshToken } = jwtGenerator(user.id);

      return {
        success: true,
        msg: 'Login was successful.',
        data: {
          accessToken,
          refreshToken,
          userid: user.id,
          clientId: user.cids[0].cid,
        },
      };
    } catch (error) {
      throw error;
    }
  };

  forgotPassword = async (email: Pick<IUser, 'email'>) => {
    try {
      const user = (await User.findOne({ email })) as IUserDocument;
      const oneHour = dayjs().add(1, 'hour').toDate();

      // SEND EMAIL
      const emailOptions = {
        subject: 'Account Password Reset',
        to: user.email,
        data: {
          fullname: user.fullname,
          resetPasswordUrl: `${process.env.FRONTEND_URL}/reset_password/${user.passwordResetToken}`,
        },
        emailType: FORGOT_PASSWORD,
      };

      user.passwordResetToken = hashGenerator();
      user.passwordResetTokenExpiresAt = oneHour;
      await user.save();

      return {
        success: true,
        data: { emailOptions },
        msg: `Password reset email has been sent to your email ${user.email}`,
      };
    } catch (error) {
      throw error;
    }
  };

  resetPassword = async (data: {
    passwordResetToken: string;
    password: string;
  }): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
    try {
      const user = (await User.findOne({
        passwordResetToken: data.passwordResetToken,
      })) as IUserDocument;

      // SEND EMAIL
      const emailOptions = {
        subject: 'Password Reset Successful',
        to: user.email,
        data: {
          fullname: user.fullname,
          resetAt: dayjs().format('DD/MM/YYYY H:m:s'),
        },
        emailType: PASSWORD_RESET_SUCCESS,
      };

      user.password = data.password;
      user.passwordResetToken = '';
      user.passwordResetTokenExpiresAt = null;
      await user.save();

      return {
        success: true,
        data: { emailOptions },
        msg: 'Your password was successfully updated.',
      };
    } catch (error) {
      throw error;
    }
  };
}

export default AuthService;
