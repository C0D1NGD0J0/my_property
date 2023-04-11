import { Invite, Property } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { IUserDocument } from '@interfaces/user.interface';
import {
  httpStatusCodes,
  errorTypes,
  USER_INVITE_EMAIL,
} from '@utils/constants';
import { createLogger, hashGenerator } from '@utils/helperFN';
import {
  IEmailOptions,
  IPromiseReturnedData,
} from '@interfaces/utils.interface';
import { IInvite, IInviteDocument } from '@interfaces/invite.interface';
import dayjs from 'dayjs';
import { Types } from 'mongoose';

interface IValidateInviteReturnData {
  pid: string;
  cid: string;
  userInfo: IInvite['userInfo'];
  address?: string;
  managedBy: {
    fullname: string;
    email: string;
  };
}

class InviteService {
  private log;

  constructor() {
    this.log = createLogger('InviteService', true);
  }

  create = async (
    inviteData: IInvite
  ): IPromiseReturnedData<{
    emailOptions: IEmailOptions | null;
    invite: IInviteDocument;
  }> => {
    let emailOptions = null;
    const invite = new Invite(inviteData);
    invite.inviteToken = hashGenerator();
    invite.inviteTokenExpiresAt = dayjs().add(1, 'day').toDate();
    await invite.save();

    const property = await Property.findOne({ pid: invite.pid });
    let msg = 'Invite successfully created.';
    if (inviteData.sendNow) {
      msg = `Invite was created and sent to ${invite.userInfo.email}`;
      emailOptions = {
        to: invite.userInfo.email,
        data: {
          appName: process.env.APP_NAME,
          name: invite.userInfo.firstName,
          propertyAddress: property?.address,
          inviteUrl: `${process.env.FRONTEND_URL}/validate-invite/${invite._id}?t=${invite.inviteToken}`,
        },
        emailType: USER_INVITE_EMAIL,
        subject: 'Account setup',
      };
    }

    return {
      msg,
      data: {
        emailOptions,
        invite,
      },
      success: true,
    };
  };

  validateInvite = async (
    inviteId: string,
    data: { token: string }
  ): IPromiseReturnedData<IValidateInviteReturnData> => {
    const invite = await Invite.findOne({
      id: new Types.ObjectId(inviteId),
      inviteToken: data.token,
      inviteTokenExpiresAt: { $gt: dayjs() },
    });

    if (!invite) {
      throw new ErrorResponse(
        `Invalid/expired invite-token provided, please contact property manager.`,
        errorTypes.NO_RESOURCE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const property = await Property.findOne({
      pid: new Types.ObjectId(invite.pid),
    })
      .populate({
        path: 'managedBy',
        model: 'User',
        select: 'firstName lastName email', // Only return the fullName virtual property
      })
      .select('address')
      .exec();

    invite.acceptedInvite = true;
    invite.inviteTokenExpiresAt = null;
    await invite.save();

    const returnData: IValidateInviteReturnData = {
      pid: invite.pid,
      cid: invite.cid,
      userInfo: invite.userInfo,
      address: property?.address,
      managedBy: {
        fullname: (property?.managedBy as IUserDocument).fullname as string,
        email: (property?.managedBy as IUserDocument).email as string,
      },
    };

    return {
      data: returnData,
      success: true,
    };
  };

  resendInvite = async (
    data: { id: string; cid: string },
    currentuserId: string
  ): IPromiseReturnedData<{
    emailOptions: IEmailOptions | null;
    invite: IInviteDocument;
  }> => {
    const invite = await Invite.findOne({
      acceptedInvite: false,
      id: new Types.ObjectId(data.id),
      createdBy: new Types.ObjectId(currentuserId),
      $or: [{ sentAt: { $eq: null } }, { sentAt: { $type: 'date' } }],
    });

    if (!invite) {
      throw new ErrorResponse(
        `Invalid/expired invite-token provided, please contact property manager.`,
        errorTypes.NO_RESOURCE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const property = await Property.findOne({ pid: invite.pid });

    invite.sendNow = true;
    invite.inviteToken = hashGenerator();
    invite.inviteTokenExpiresAt = dayjs().add(1, 'day').toDate();
    await invite.save();
    const emailOptions = {
      to: invite.userInfo.email,
      data: {
        appName: process.env.APP_NAME,
        name: invite.userInfo.firstName,
        propertyAddress: property?.address,
        inviteUrl: `${process.env.FRONTEND_URL}/validate-invite/${invite._id}?t=${invite.inviteToken}`,
      },
      emailType: USER_INVITE_EMAIL,
      subject: 'Account setup',
    };

    return {
      data: {
        invite,
        emailOptions,
      },
      success: true,
      msg: 'Invite has been sent successfully.',
    };
  };

  allInvites = async (data: {
    userId: string;
    cid: string;
  }): IPromiseReturnedData<IInviteDocument[]> => {
    const invites = await Invite.find({
      cid: data.cid,
      createdBy: new Types.ObjectId(data.userId),
    })
      .limit(25)
      .populate({
        path: 'pid',
        model: 'Property',
        select: 'address',
      });

    return {
      data: invites,
      success: true,
    };
  };
}

export default InviteService;
