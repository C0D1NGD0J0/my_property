import { Document, Types } from 'mongoose';
import { IUserDocument } from '@interfaces/user.interface';
import { IPropertyDocument } from '@interfaces/property.interface';

export enum INotificationTypeEnum {
  payment = 'payment',
  comment = 'comment',
  report = 'report',
  app = 'app',
}
export interface INotification {
  cid: string;
  puid: string;
  readAt: Date;
  isRead: boolean;
  content?: {
    [key: string]: any;
  };
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  resourceId: string;
  notificationType: INotificationTypeEnum;
}

export interface INotificationDocument extends INotification, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}
