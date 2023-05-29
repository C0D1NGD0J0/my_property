import dayjs from 'dayjs';
import color from 'colors';
import {
  httpStatusCodes,
  errorTypes,
  USER_INVITE_EMAIL,
} from '@utils/constants';
import ErrorResponse from '@utils/errorResponse';
import { Invite, Lease, Property } from '@models/index';
import { IInviteUserSignup, IUserDocument } from '@interfaces/user.interface';
import { createLogger, hashGenerator } from '@utils/helperFN';
import {
  IEmailOptions,
  IPromiseReturnedData,
} from '@interfaces/utils.interface';
import { IInvite, IInviteDocument } from '@interfaces/invite.interface';
import { Types } from 'mongoose';
import { AuthService } from '@services/auth';
import { LeaseService } from '@services/lease';
import { ILeaseDocument } from '@interfaces/lease.interface';

interface IValidateInviteReturnData {
  puid?: string;
  cid?: string;
  lease?: ILeaseDocument;
  userInfo: IInvite['userInfo'];
  address?: string;
  managedBy: {
    fullname: string;
    email: string;
  };
}

class InviteService {
  private log;
  protected readonly authService: AuthService;
  protected readonly leaseService: LeaseService;

  constructor() {
    this.authService = new AuthService();
    this.leaseService = new LeaseService();
    this.log = createLogger('InviteService', true);
  }

  create = async (
    inviteData: IInvite
  ): IPromiseReturnedData<{
    emailOptions: IEmailOptions | null;
    invite: IInviteDocument;
  }> => {
    const lease = await Lease.findById(inviteData.leaseId);

    // only require lease when create invite for tenant
    if (!lease && inviteData.userInfo.userType === 'tenant') {
      const err =
        'Unable to create invite for tenant, as no valid lease info was provided.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    let emailOptions = null;
    const invite = new Invite(inviteData);
    invite.inviteToken = hashGenerator();
    invite.inviteTokenExpiresAt = dayjs().add(1, 'day').toDate();
    invite.leaseId =
      inviteData.userInfo.userType === 'tenant'
        ? new Types.ObjectId(inviteData.leaseId)
        : undefined;

    let msg = 'Invite successfully created.';
    if (inviteData.sendNow) {
      const property = await Property.findOne({ puid: invite.puid });
      msg = `Invite was created and sent to ${invite.userInfo.email}`;
      emailOptions = {
        to: invite.userInfo.email,
        data: {
          appName: process.env.APP_NAME,
          name: invite.userInfo.firstName,
          propertyAddress: property?.address,
          inviteUrl: `${process.env.FRONTEND_URL}/validate_invite_token/${invite._id}?t=${invite.inviteToken}`,
        },
        emailType: USER_INVITE_EMAIL,
        subject: 'Account setup',
      };

      if (lease) {
        lease.status = {
          value: 'pending',
          reason: `invite sent to ${invite.userInfo.userType}`,
        };
      }
    }

    await invite.save();
    await lease?.save();
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
  ): IPromiseReturnedData<IValidateInviteReturnData | { msg?: string }> => {
    const invite = await Invite.findOne({
      id: new Types.ObjectId(inviteId),
      inviteToken: data.token,
      inviteTokenExpiresAt: { $gt: dayjs() },
    });

    if (!invite) {
      return {
        data: {
          msg: `Invalid/expired invite-token provided, please contact property manager.`,
        },
        success: false,
      };
    }

    const property = await Property.findOne({
      puid: new Types.ObjectId(invite.puid),
    })
      .populate({
        path: 'managedBy',
        model: 'User',
        select: 'firstName lastName email', // Only return the fullName virtual property
      })
      .select('address')
      .exec();

    const returnData: IValidateInviteReturnData = {
      puid: invite.puid,
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

  acceptInvite = async (
    inviteId: string,
    data: IInviteUserSignup & { token: string }
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
      cid: invite.cid,
      puid: invite.puid,
    })
      .populate({
        path: 'managedBy',
        model: 'User',
        select: 'firstName lastName email', // Only return the fullName virtual property
      })
      .select('address puid cid');

    if (!property) {
      throw new ErrorResponse(
        `Invalid invite <Property not found>, please contact property manager.`,
        errorTypes.NO_RESOURCE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    invite.inviteToken = '';
    invite.acceptedInvite = true;
    invite.inviteTokenExpiresAt = null;

    const { token, ...userData } = data;
    const userDataWithUserId = {
      ...userData,
      userId: new Types.ObjectId(),
    };

    // update lease data
    const resp = await this.leaseService.updateLease(
      invite.cid,
      invite.leaseId,
      {
        tenant: userDataWithUserId.userId,
        status: {
          value: 'active',
          reason: 'tenant has accepted lease',
        },
        puid: property.puid,
        dateTenantAccepted: new Date(),
        hasTenantAccepted: true,
      }
    );

    if (resp.success) {
      // create invited user account
      await this.authService.createInvitedUser(invite.cid, userDataWithUserId);
    }

    const returnData: Omit<IValidateInviteReturnData, 'puid' | 'cid'> = {
      lease: resp.data?.lease,
      userInfo: invite.userInfo,
      address: property?.address,
      managedBy: {
        fullname: (property?.managedBy as IUserDocument).fullname as string,
        email: (property?.managedBy as IUserDocument).email as string,
      },
    };

    invite.acceptedInviteAt = new Date();
    await invite.save();

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

    const property = await Property.findOne({ puid: invite.puid });

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
        inviteUrl: `${process.env.FRONTEND_URL}/validate_invite_token/${invite._id}?t=${invite.inviteToken}`,
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
        path: 'puid',
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
