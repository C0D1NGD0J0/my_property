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
  pid: string;
  sendNow: boolean;
  inviteToken: string;
  sentAt: Date | null;
  inviteTokenExpiresAt: Date | null;
  createdBy: Types.ObjectId | string;
}

export interface IInviteDocument extends IInvite, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
