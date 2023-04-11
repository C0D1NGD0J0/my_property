import { Types } from 'mongoose';

import { User, Client } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import {
  IAccountType,
  ICurrentUser,
  ISignupData,
  IUserDocument,
} from '@interfaces/user.interface';
import {
  httpStatusCodes,
  ACCOUNT_UPDATE_NOTIFICATION,
  errorTypes,
} from '@utils/constants';
import { mapCurrentUserObject } from '@services/user/utils';
import { IEmailOptions, ISuccessReturnData } from '@interfaces/utils.interface';
import { createLogger } from '@utils/helperFN';

class UserService {
  private log;

  constructor() {
    this.log = createLogger('UserService', true);
  }

  getCurrentUser = async (
    cid: string,
    userId: string
  ): Promise<ISuccessReturnData<ICurrentUser>> => {
    const user = (await User.findOne({
      _id: new Types.ObjectId(userId),
      isActive: true,
    })) as IUserDocument;

    if (!user) {
      const err = 'Something went wrong, please try again.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.UNPROCESSABLE
      );
    }

    const currentuser = mapCurrentUserObject(user, cid);
    return { success: true, data: currentuser };
  };

  getAccountInfo = async (
    cid: string,
    userId: string
  ): Promise<ISuccessReturnData<IUserDocument>> => {
    const excludeFields = {
      activationToken: 0,
      passwordResetToken: 0,
      deletedAt: 0,
      activationTokenExpiresAt: 0,
      passwordResetTokenExpiresAt: 0,
    };

    const user = (await User.findOne({ id: userId }).select(
      excludeFields
    )) as IUserDocument;

    if (!user) {
      const err = 'Something went wrong, please try again.';
      this.log.error(err);
      throw new ErrorResponse(err, 'authError', httpStatusCodes.UNPROCESSABLE);
    }

    return { success: true, data: user };
  };

  updateAccount = async (
    cid: string,
    data: ISignupData & { userId: Types.ObjectId }
  ): Promise<
    ISuccessReturnData<{ emailOptions: IEmailOptions; user: ICurrentUser }>
  > => {
    const { accountType, ...dataToSave } = data;

    let user = (await User.findOne({ id: data.userId })) as IUserDocument;
    const isMatch = await user.validatePassword(data.password as string);

    if (!isMatch) {
      const err = 'Valid account password must be provided to update account.';
      this.log.error(err);
      throw new ErrorResponse(err, 'authError', httpStatusCodes.UNPROCESSABLE);
    }

    user = (await User.findOneAndUpdate(
      { _id: new Types.ObjectId(data.userId) },
      { $set: dataToSave },
      { new: true }
    )) as IUserDocument;

    const emailOptions: IEmailOptions = {
      to: user.email,
      data: {
        fullname: user.fullname,
        updatedAt: new Date(),
      },
      emailType: ACCOUNT_UPDATE_NOTIFICATION,
      subject: 'Account has been updated.',
    };

    const currentuser = mapCurrentUserObject(user, cid);
    return {
      success: true,
      data: { emailOptions, user: currentuser },
      msg: `Account was successfully updated.`,
    };
  };

  deleteAccount = async (userdata: { password: string; userId: string }) => {
    const user = (await User.findOne({
      id: userdata.userId,
    })) as IUserDocument;

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
