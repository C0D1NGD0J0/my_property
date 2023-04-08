import { InviteService } from '@services/invite';
import { ICurrentUser } from '@interfaces/user.interface';
import {
  AppRequest,
  AppResponse,
  IEmailOptions,
} from '@interfaces/utils.interface';
import { httpStatusCodes, USER_INVITE_QUEUE } from '@utils/constants';
import { IInvite } from '@interfaces/invite.interface';
import { EmailQueue } from '@queues/index';

class InviteController {
  private emailQueue: EmailQueue;
  private inviteService: InviteService;

  constructor() {
    this.emailQueue = new EmailQueue();
    this.inviteService = new InviteService();
  }

  createInvite = async (req: AppRequest, res: AppResponse) => {
    const { _id, cid } = req.currentuser as ICurrentUser;
    const { data, ...rest } = await this.inviteService.create({
      ...req.body,
      cid,
      createdBy: _id,
    });

    if (req.body.sendNow) {
      data &&
        this.emailQueue.addEmailToQueue(
          USER_INVITE_QUEUE,
          data.emailOptions as IEmailOptions
        );
    }
    res.status(200).json({ ...rest, invite: data?.invite });
  };
}

export default new InviteController();
