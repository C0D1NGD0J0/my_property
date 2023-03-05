import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';

import {
  IBaseUser,
  IAccountType,
  IBaseUserDocument,
  IPropertyManagerDocument,
  IUserType,
} from '@interfaces/user.interface';
import { hashGenerator, jwtGenerator } from '@utils/helperFN';
import {
  USER_REGISTRATION,
  PASSWORD_RESET_SUCCESS,
  PASSWORD_RESET_EMAIL,
} from '@utils/constants';
import { PropertyManager, Company, User } from '@models/index';
import { IPropertyManager } from '@interfaces/user.interface';
import { ICompany, ICompanyDocument } from '@interfaces/company.interface';
import { IEmailOptions, ISuccessReturnData } from '@interfaces/utils.interface';
import ErrorResponse from '@utils/errorResponse';

export type ISignupData = Partial<IPropertyManager & IBaseUser> | ICompany;

class AuthService {
  signup = async (
    data: ISignupData
  ): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
    let user: ICompanyDocument | IPropertyManagerDocument;
    const dataToSave = {
      ...data,
      isActive: false,
      activationToken: hashGenerator(),
      activationTokenExpiresAt: dayjs().add(1, 'hour').toDate(),
    };
    let emailOptions: IEmailOptions = {
      to: '',
      data: null,
      emailType: USER_REGISTRATION,
      subject: 'Activate your account',
    };

    if (data.accountType === IAccountType.business) {
      user = new Company({
        cuid: uuid(),
        ...dataToSave,
      }) as ICompanyDocument;

      // EMAIL ACTIVATION LINK
      emailOptions = {
        ...emailOptions,
        to: user?.contactInfo.email,
        data: {
          fullname: user?.companyName,
          activationUrl: `${process.env.FRONTEND_URL}/account_activation/${user.activationToken}`,
        },
      };
    } else {
      user = new PropertyManager({
        uuid: uuid(),
        ...dataToSave,
      }) as IPropertyManagerDocument;

      // EMAIL ACTIVATION LINK
      emailOptions = {
        ...emailOptions,
        to: user?.email,
        data: {
          fullname: user?.fullname,
          activationUrl: `${process.env.FRONTEND_URL}/account_activation/${user.activationToken}`,
        },
      };
    }

    await user.save();
    return {
      success: true,
      data: { emailOptions },
      msg: `Account activation email has been sent to ${emailOptions.to}`,
    };
  };

  accountActivation = async (token: string): Promise<ISuccessReturnData> => {
    try {
      const user = (await User.findOne({
        isActive: false,
        activationToken: { $eq: token.trim() },
        activationTokenExpiresAt: { $gt: Date.now() },
      })) as IBaseUserDocument;

      if (!user) {
        const msg = 'Activation code has exipred.';
        throw new ErrorResponse(msg, 'authServiceError', 422);
      }

      user.isActive = true;
      user.activationToken = '';
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
      const user = (await User.findOne({ email })) as IUserType;
      const emailOptions = {
        to: user?.email,
        data: {
          fullname: '',
          activationUrl: `${process.env.FRONTEND_URL}/account_activation/${user.activationToken}`,
        },
        emailType: USER_REGISTRATION,
        subject: 'Activate your account',
      };

      if (user.accountType === IAccountType.business) {
        const _user = user as ICompanyDocument;
        emailOptions.data.fullname = _user.companyName;
      } else {
        const _user = user as IPropertyManagerDocument;
        emailOptions.data.fullname = _user.firstName;
      }

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
    data: Pick<IBaseUser, 'email' | 'password'>
  ): Promise<
    ISuccessReturnData<{
      refreshToken: string;
      accessToken: string;
      userid: string;
    }>
  > => {
    try {
      const user = (await User.findOne({ email: data.email }).select(
        'password'
      )) as IUserType;
      const isMatch = await user.validatePassword(data.password);

      if (!isMatch) {
        const err = 'Invalid email/password credentials.';
        throw new ErrorResponse(err, 'authServiceError', 401);
      }

      const { accessToken, refreshToken } = jwtGenerator(user.id);

      return {
        success: true,
        msg: 'Login was successful.',
        data: {
          accessToken,
          userid: user.id,
          refreshToken: refreshToken as string,
        },
      };
    } catch (error) {
      throw error;
    }
  };

  forgotPassword = async (email: Pick<IUserType, 'email'>) => {
    try {
      const user = (await User.findOne({ email })) as IUserType;
      const oneHour = dayjs().add(1, 'hour').toDate();

      // SEND EMAIL
      const emailOptions = {
        subject: 'Account Password Reset',
        to: user.email,
        data: {
          fullname: '',
          resetPasswordUrl: `${process.env.FRONTEND_URL}/reset_password/${user.passwordResetToken}`,
        },
        emailType: PASSWORD_RESET_EMAIL,
      };

      if (user.accountType === IAccountType.business) {
        const _user = user as ICompanyDocument;
        emailOptions.data.fullname = _user.companyName;
      } else {
        const _user = user as IPropertyManagerDocument;
        emailOptions.data.fullname = _user.firstName;
      }

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
      })) as IUserType;

      // SEND EMAIL
      const emailOptions = {
        subject: 'Password Reset Successful',
        to: user.email,
        data: {
          fullname: '',
          resetAt: dayjs().format('DD/MM/YYYY H:m:s'),
        },
        emailType: PASSWORD_RESET_SUCCESS,
      };

      if (user.accountType === IAccountType.business) {
        const _user = user as ICompanyDocument;
        emailOptions.data.fullname = _user.companyName;
      } else {
        const _user = user as IPropertyManagerDocument;
        emailOptions.data.fullname = _user.firstName;
      }

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
