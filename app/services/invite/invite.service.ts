import { Types } from 'mongoose';

import { User, Client, Invite, Property } from '@models/index';
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
  USER_INVITE_EMAIL,
} from '@utils/constants';
import { createLogger, hashGenerator } from '@utils/helperFN';
import { mapCurrentUserObject } from '@services/user/utils';
import {
  IEmailOptions,
  IPromiseReturnedData,
  ISuccessReturnData,
} from '@interfaces/utils.interface';
import { IInvite, IInviteDocument } from '@interfaces/invite.interface';
import dayjs from 'dayjs';

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
}

export default InviteService;
