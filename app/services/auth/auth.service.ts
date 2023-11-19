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
import { createLogger, hashGenerator, jwtGenerator } from '@utils/helperFN';
import {
  USER_REGISTRATION,
  PASSWORD_RESET_SUCCESS,
  FORGOT_PASSWORD,
  errorTypes,
  httpStatusCodes,
  ACCOUNT_SUCCESS_EMAIL,
} from '@utils/constants';
import { User, Client, Subscription } from '@models/index';
import { IEmailOptions, ISuccessReturnData } from '@interfaces/utils.interface';
import ErrorResponse from '@utils/errorResponse';
import SubscriptionService from '@services/subscription/subscription.service';

class AuthService {
  private log;
  private subscriptionService: SubscriptionService;

  constructor() {
    this.log = createLogger('AuthService', true);
    this.subscriptionService = new SubscriptionService();
  }

  signup = async (
    data: ISignupData
  ): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
    const _userId = new Types.ObjectId();
    // new client record
    const client = new Client({
      cid: uuid(),
      admin: _userId,
      accountType: data.accountType,
      ...(data.accountType.name === IAccountType.enterprise
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

    if (!user) {
      const err = 'Signup error, user not created.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        'validationError',
        httpStatusCodes.UNPROCESSABLE
      );
    }
    await client.save(); //only save if user is created successfully

    // create a subscription object + stripe account for the user
    const resp = await this.subscriptionService.newSubscriptionEntry({
      clientId: client._id.toString(),
      email: user.email,
      name: user.fullname,
      planName: data.accountType.name,
      planId: data.accountType.planId,
    });

    if (resp.success) {
      client.subscription = resp.data ? resp.data._id : null;
    }

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
      _id: userData.userId,
      uid: uuid(),
      isActive: true,
      activationToken: '',
      activationTokenExpiresAt: '',
      cids: [
        {
          cid,
          role: IUserRole[
            data.userType.toUpperCase() as keyof typeof IUserRole
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
      })) as IUserDocument;

      if (!user) {
        const msg = 'Invalid activation token provided.';
        throw new ErrorResponse(
          msg,
          errorTypes.SERVICE_ERROR,
          httpStatusCodes.UNPROCESSABLE
        );
      }

      const tokenExpirationDate = dayjs(user.activationTokenExpiresAt);
      const currentDate = dayjs();

      if (!tokenExpirationDate.isAfter(currentDate)) {
        const msg = 'Activation token has expired.';
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
    cid: string,
    token: string
  ): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
    try {
      const user = await User.findOne({
        isActive: false,
        'cids.cid': cid,
        activationToken: token,
      });

      if (!user) {
        const msg = 'No record found with token provided.';
        throw new ErrorResponse(
          msg,
          errorTypes.SERVICE_ERROR,
          httpStatusCodes.UNPROCESSABLE
        );
      }

      user.activationToken = hashGenerator();
      user.activationTokenExpiresAt = dayjs().add(1, 'hour').toDate();
      await user.save();

      const emailOptions = {
        to: user?.email,
        data: {
          fullname: user?.fullname,
          activationUrl: `${process.env.FRONTEND_URL}/account_activation/${cid}?t=${user.activationToken}`,
        },
        emailType: USER_REGISTRATION,
        subject: 'Activate your account',
      };

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
      linkedAccounts: {
        _id: string;
        cid: string;
        name: string;
      }[];
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

      // Extract the cids from the user's cids array
      const cids = user.cids.map((connection) => connection.cid);
      // Use aggregation to fetch clients and admin names
      const clients = await Client.aggregate([
        { $match: { cid: { $in: cids } } },
        {
          $lookup: {
            from: 'users', // The collection to join
            localField: 'admin', // Field from the clients collection
            foreignField: '_id', // Field from the users collection
            as: 'adminDetails', // Alias for the joined data
          },
        },
        { $unwind: '$adminDetails' },
        {
          $project: {
            cid: 1,
            name: {
              $cond: {
                if: '$accountType.isEnterpriseAccount',
                then: '$enterpriseProfile.companyName',
                else: {
                  $concat: [
                    '$adminDetails.firstName',
                    ' ',
                    '$adminDetails.lastName',
                  ],
                },
              },
            },
          },
        },
      ]);

      return {
        success: true,
        msg: 'Login was successful.',
        data: {
          accessToken,
          refreshToken,
          userid: user.id,
          linkedAccounts: clients,
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

      user.passwordResetToken = hashGenerator();
      user.passwordResetTokenExpiresAt = oneHour;
      await user.save();

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
    resetToken: string;
    password: string;
  }): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
    try {
      const user = (await User.findOne({
        passwordResetToken: data.resetToken,
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

      user.passwordResetToken = '';
      user.password = data.password;
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
