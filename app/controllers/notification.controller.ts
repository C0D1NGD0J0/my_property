import { NotificationService } from '@services/notification';
import { ICurrentUser } from '@interfaces/user.interface';
import {
  AppRequest,
  AppResponse,
  IEmailOptions,
} from '@interfaces/utils.interface';
import { httpStatusCodes, USER_INVITE_QUEUE } from '@utils/constants';
import { IInvite } from '@interfaces/invite.interface';
import { EmailQueue } from '@queues/index';

class NotificationController {
  private emailQueue: EmailQueue;
  private notificationService: NotificationService;

  constructor() {
    this.emailQueue = new EmailQueue();
    this.notificationService = new NotificationService();
  }

  getNotifications = async (req: AppRequest, res: AppResponse) => {
    const { id, cid } = req.currentuser!;

    const data = await this.notificationService.getNotifications(cid, id);
    res.status(httpStatusCodes.OK).json(data);
  };

  updateNotification = async (req: AppRequest, res: AppResponse) => {
    const { id, cid } = req.currentuser!;
    const notfyId = req.params.id;

    const data = await this.notificationService.updateNotification(notfyId);
    res.status(httpStatusCodes.OK).json(data);
  };
}

export default new NotificationController();
