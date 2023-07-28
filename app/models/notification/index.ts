import {
  INotification,
  INotificationDocument,
  INotificationTypeEnum,
} from '@interfaces/notification.interface';
import { ObjectId, Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const NotificationSchema = new Schema<INotificationDocument>(
  {
    cid: { type: String, default: null, index: true },
    puid: { type: String, required: true, index: true },
    readAt: { type: Date, default: null },
    isRead: { type: Boolean, default: false },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resourceId: { type: String, default: '' },
    notificationType: {
      type: String,
      enum: Object.values(INotificationTypeEnum),
      default: INotificationTypeEnum.app,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

NotificationSchema.plugin(uniqueValidator, {
  message: '{Path} must be unique',
});

const NotificationModel = model<INotificationDocument>(
  'Notification',
  NotificationSchema
);

NotificationModel.syncIndexes();

export default NotificationModel;
