import color from 'colors';
import { Types } from 'mongoose';
import { Notification } from '@models/index';

import { IPromiseReturnedData } from '@interfaces/utils.interface';
import ErrorResponse from '@utils/errorResponse';
import { httpStatusCodes, errorTypes } from '@utils/constants';
import { createLogger, paginateResult } from '@utils/helperFN';
import {
  INotification,
  INotificationDocument,
} from '@interfaces/notification.interface';
import { IUserDocument } from '@interfaces/user.interface';

class NotificationService {
  private log;

  constructor() {
    this.log = createLogger('LeaseService', true);
  }

  getNotifications = async (
    cid: string,
    userId: string
  ): IPromiseReturnedData<INotificationDocument[]> => {
    if (!cid) {
      const err = 'Client Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    if (!userId) {
      const err = 'User Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const _receiverId = new Types.ObjectId(userId);
    const notifications = await Notification.aggregate([
      { $match: { receiver: _receiverId } },
      {
        $lookup: {
          from: 'properties', // Collection name of the Property model
          let: { prop_cid: '$cid', receiverId: '$receiver' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$cid', '$$prop_cid'] },
                    { $eq: ['$managedBy', '$$receiverId'] },
                  ],
                },
              },
            },
          ],
          as: 'propertyInfo',
        },
      },
      {
        $unwind: '$propertyInfo',
      },
      {
        $project: {
          _id: 1,
          cid: 1,
          puid: 1,
          readAt: 1,
          isRead: 1,
          sender: 1,
          content: 1,
          receiver: 1,
          resourceId: 1,
          notificationType: 1,
          propertyId: '$propertyInfo._id', // Property ID
          propertyTitle: '$propertyInfo.title', // Property Title
          propertyAddress: '$propertyInfo.address', // Property Address
        },
      },
    ]);

    return { success: true, data: notifications };
  };

  createNotification = async (
    cid: string,
    data: Partial<INotification>
  ): IPromiseReturnedData<INotificationDocument> => {
    if (!cid) {
      const err = 'Client Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    const notification = new Notification({
      cid,
      puid: data.puid,
      sender: data.sender,
      content: data.content,
      receiver: data.receiver,
      notificationType: data.notificationType,
      resourceId: data.resourceId ? data.resourceId : '',
    });

    await notification.save();
    return { success: true, data: notification };
  };

  updateNotification = async (
    nid: string
  ): IPromiseReturnedData<INotificationDocument> => {
    if (!nid) {
      const err = 'Notification Id is missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    let notification = await Notification.findById(nid);

    if (!notification) {
      const err = 'Invalid notification id provided.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.BAD_REQUEST
      );
    }

    notification = (await Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(nid) },
      { $set: { isRead: true } },
      { new: true }
    )) as INotificationDocument;

    return { success: true, data: notification };
  };
}

export default NotificationService;
