import { Types } from 'mongoose';

import { User } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import {
  IAccountType,
  IBaseUser,
  IBaseUserDocument,
  IUserType,
} from '@interfaces/user.interface';
import { httpStatusCodes } from '@utils/helperFN';
import { IPropertyManager } from '@interfaces/user.interface';
import { ACCOUNT_UPDATE_NOTIFICATION } from '@utils/constants';
import { ICurrentUser, mapCurrentUserObject } from '@services/user/utils';
import { ICompany } from '@interfaces/company.interface';
import { IEmailOptions, ISuccessReturnData } from '@interfaces/utils.interface';

export type ISignupData = Partial<IPropertyManager & IBaseUser & ICompany>;

class UserService {
  getCurrentUser = async (
    userId: string
  ): Promise<ISuccessReturnData<ICurrentUser>> => {
    const user = (await User.findOne({ id: userId })) as IUserType;

    if (!user) {
      const err = 'Something went wrong, please try again.';
      throw new ErrorResponse(err, 'authError', httpStatusCodes.UNPROCESSABLE);
    }

    const currentuser = mapCurrentUserObject(user);

    return { success: true, data: currentuser };
  };

  getAccountInfo = async (
    userId: string
  ): Promise<ISuccessReturnData<IUserType>> => {
    const excludeFields = {
      activationToken: 0,
      passwordResetToken: 0,
      deletedAt: 0,
      activationTokenExpiresAt: 0,
      passwordResetTokenExpiresAt: 0,
    };

    const user = (await User.findOne({ id: userId }).select(
      excludeFields
    )) as IUserType;

    if (!user) {
      const err = 'Something went wrong, please try again.';
      throw new ErrorResponse(err, 'authError', httpStatusCodes.UNPROCESSABLE);
    }

    return { success: true, data: user };
  };

  updateAccount = async (
    data: ISignupData & { userId: Types.ObjectId }
  ): Promise<
    ISuccessReturnData<{ emailOptions: IEmailOptions; user: ICurrentUser }>
  > => {
    let userEmail = '';
    let fullname = '';
    const { accountType, ...dataToSave } = data;

    let user = (await User.findOne({ id: data.userId })) as IUserType;
    const isMatch = await user.validatePassword(data.password as string);

    if (!isMatch) {
      const err = 'Valid account password must be provided to update account.';
      throw new ErrorResponse(err, 'authError', httpStatusCodes.UNPROCESSABLE);
    }

    user = (await User.findOneAndUpdate(
      { _id: data.userId },
      { $set: dataToSave },
      { new: true }
    )) as IUserType;

    if (accountType === IAccountType.business) {
      fullname = user?.companyName;
      userEmail = user?.contactInfo.email;
    } else {
      fullname = user.fullname as string;
      userEmail = user.email;
    }

    const emailOptions: IEmailOptions = {
      to: userEmail,
      data: {
        fullname,
        updatedAt: new Date(),
      },
      emailType: ACCOUNT_UPDATE_NOTIFICATION,
      subject: 'Account has been updated.',
    };

    return {
      success: true,
      data: { emailOptions, user: mapCurrentUserObject(user) },
      msg: `Account was successfully updated.`,
    };
  };

  deleteAccount = async (userdata: { password: string; userId: string }) => {
    const user = (await User.findOne({
      id: userdata.userId,
    })) as IBaseUserDocument;

    const isMatch = await user.validatePassword(userdata.password);
    if (!isMatch) {
      const err = 'Valid account password must be provided to delete account.';
      throw new ErrorResponse(
        err,
        'validationError',
        httpStatusCodes.UNPROCESSABLE
      );
    }

    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();

    return { success: true, msg: 'Account has been successfully deleted.' };
  };
}

export default UserService;
