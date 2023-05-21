import { Document, Types } from 'mongoose';
import { IUserRoleType } from './user.interface';

export interface IInvite {
  userInfo: {
    email: string;
    firstName: string;
    lastName: string;
    userType: IUserRoleType;
  };
  cid: string;
  puid: string;
  leaseId: Types.ObjectId | undefined;
  sendNow: boolean;
}

export interface IInviteDocument extends IInvite, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  inviteToken: string;
  sentAt: Date | null;
  acceptedInvite: boolean;
  inviteTokenExpiresAt: Date | null;
  createdBy: Types.ObjectId | string;
}
