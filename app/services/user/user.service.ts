import mongoose, { Types } from 'mongoose';

import { Client, Subscription, User } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import {
  IClientDocument,
  IClientUpdateData,
  ICurrentUser,
  IPopulatedClientDocument,
  ISignupData,
  IUserDocument,
} from '@interfaces/user.interface';
import {
  httpStatusCodes,
  ACCOUNT_UPDATE_NOTIFICATION,
  errorTypes,
} from '@utils/constants';
import {
  ICurrentUserDataType,
  mapCurrentUserObject,
} from '@services/user/utils';
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
    const user: IUserDocument | null = await User.findOne({
      _id: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!user) {
      const err = 'Something went wrong, please try again.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.UNPROCESSABLE
      );
    }

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

    const subscription = await Subscription.findOne({ cid });
    const matchingCid = user.cids.find((connection) => connection.cid === cid);
    const _user = {
      ...user.toObject(),
      ...(matchingCid?.role !== 'tenant'
        ? { hasAccess: subscription?.status === 'active' || false }
        : null),
      linkedAccounts: clients,
    } as any;

    const currentuser = mapCurrentUserObject(_user, cid);
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
    const { accountType, password, ...dataToSave } = data;

    let user = (await User.findOne({
      id: new Types.ObjectId(data.userId),
    })) as IUserDocument;
    const isMatch = await user.validatePassword(password as string);

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

    const subscription = await Subscription.findOne({ cid });
    // Extract the cids from the user's cids array
    const cids = user.cids.map((connection) => connection.cid);
    const matchingCid = user.cids.find((connection) => connection.cid === cid);
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
    const _user = {
      ...user.toObject(),
      ...(matchingCid?.role !== 'tenant'
        ? { hasAccess: subscription?.status === 'active' || false }
        : null),
      linkedAccounts: clients,
    } as any;
    const currentuser = mapCurrentUserObject(_user, cid);

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

  getUserEditInfo = async (
    userId: string
  ): Promise<ISuccessReturnData<IUserDocument>> => {
    const excludeFields = {
      activationToken: 0,
      passwordResetToken: 0,
      deletedAt: 0,
      password: 0,
      id: 0,
      updatedAt: 0,
      createdAt: 0,
      cids: 0,
      isActive: 0,
      _id: 0,
      activationTokenExpiresAt: 0,
      passwordResetTokenExpiresAt: 0,
    };

    const user = (await User.findOne(
      { id: userId },
      excludeFields
    ).exec()) as IUserDocument;

    if (!user) {
      const err = 'Something went wrong, please try again.';
      this.log.error('getUserEditInfo: ', err);
      throw new ErrorResponse(
        err,
        'serviceError',
        httpStatusCodes.UNPROCESSABLE
      );
    }

    return { success: true, data: user };
  };

  /* ClientUser */
  getClientInfo = async (cid: string) => {
    if (!cid) {
      const err = 'Client id is missing.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const clientInfo = await Client.findOne({ cid }).select(
      'accountType.isEnterpriseAccount enterpriseProfile'
    );
    return { success: true, data: { clientInfo } };
  };

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

  updateClientAccount = async (
    cid: string,
    data: IClientUpdateData
  ): Promise<
    ISuccessReturnData<{
      emailOptions: IEmailOptions;
      clientInfo: IClientUpdateData | undefined;
    }>
  > => {
    if (!cid) {
      const err = 'Invalid Client cid provided.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const client = (await Client.findOne({ cid }).populate(
      'admin',
      'email fullname'
    )) as IPopulatedClientDocument;

    if (!client) {
      const err = 'Client not found.';
      this.log.error(err);
      throw new ErrorResponse(
        err,
        errorTypes.NO_RESOURCE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    if (data.admin) {
      client.admin = new Types.ObjectId(data.admin);
    }

    if (data.subscription) {
      client.subscription = data.subscription
        ? new Types.ObjectId(data.subscription)
        : null;
    }

    const updatedClient = await Client.findOneAndUpdate(
      { _id: client._id },
      { $set: { enterpriseProfile: data } },
      { new: true }
    );

    const emailOptions: IEmailOptions = {
      to: (client.admin as IUserDocument).email,
      data: {
        fullname: (client.admin as IUserDocument).fullname,
        updatedAt: new Date(),
      },
      emailType: ACCOUNT_UPDATE_NOTIFICATION,
      subject: 'Account has been updated.',
    };
    return {
      success: true,
      data: { clientInfo: updatedClient?.enterpriseProfile, emailOptions },
    };
  };
  /* end region */
}

export default UserService;
