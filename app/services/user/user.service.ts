import mongoose, { Types } from 'mongoose';

import { Client, User } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import {
  IClientDocument,
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
import {
  IEmailOptions,
  IPaginateResult,
  IPaginationQuery,
  IPromiseReturnedData,
  ISuccessReturnData,
} from '@interfaces/utils.interface';
import { createLogger, paginateResult } from '@utils/helperFN';

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

    let user = (await User.findOne({
      id: new Types.ObjectId(data.userId),
    })) as IUserDocument;
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
      id: new Types.ObjectId(userdata.userId),
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

  /* ClientUser */
  getClientUsers = async (
    cid: string,
    userType: string,
    data: IPaginationQuery
  ): IPromiseReturnedData<{
    users: IUserDocument[];
    paginate: IPaginateResult;
  }> => {
    if (!cid) {
      const err = 'Client id is missing.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const selectedFields = {
      firstName: 1,
      lastName: 1,
      phoneNumber: 1,
      email: 1,
      _id: 1,
    };

    const { limit, skip, sortBy } = data;
    const query = {
      isActive: true,
      'cids.$.cid': cid,
      'cids.role': userType,
    };

    const users = await User.find(query, selectedFields)
      .skip(skip!)
      .limit(limit!)
      .sort(sortBy);

    const count = await User.countDocuments(query);

    const paginationInfo = paginateResult(count, skip!, limit!);
    return { success: true, data: { users, paginate: paginationInfo } };
  };

  updateClient = async (
    cid: string,
    data: Partial<IClientDocument>
  ): IPromiseReturnedData<IClientDocument> => {
    if (!cid || !mongoose.isValidObjectId(cid)) {
      const err = 'Client id is missing.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const client = await Client.findOne({ _id: new Types.ObjectId(cid) });
    if (!client) {
      const err = 'Client not found.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.NO_RESOURCE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    client.admin = new Types.ObjectId(data.admin);
    client.enterpriseProfile = data.enterpriseProfile;
    client.subscription = data.subscription
      ? new Types.ObjectId(data.subscription)
      : null;

    await client.save();
    return { success: true, data: client };
  };
  /* end region */
}

export default UserService;
