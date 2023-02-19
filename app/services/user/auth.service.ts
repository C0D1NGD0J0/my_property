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
import { USER_REGISTRATION } from '@utils/constants';
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
        throw new ErrorResponse(msg, 422, 'authServiceError');
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
      jwtToken: string;
      refreshJWT: string;
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
        throw new ErrorResponse(err, 401, 'authServiceError');
      }

      const jwt = jwtGenerator(user.id, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIREIN,
      });
      const refreshJWT = jwtGenerator(user.id, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRESIN,
      });

      return {
        success: true,
        msg: 'Login was successful.',
        data: {
          refreshJWT,
          jwtToken: jwt,
          userid: user.id,
        },
      };
    } catch (error) {
      throw error;
    }
  };
}

export default AuthService;
