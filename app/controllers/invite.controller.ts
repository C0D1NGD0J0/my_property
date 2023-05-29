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
    const { id, cid } = req.currentuser as ICurrentUser;
    const { data, ...rest } = await this.inviteService.create({
      ...req.body,
      cid,
      createdBy: id,
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

  validateInvite = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.params;
    const result = await this.inviteService.validateInvite(id, req.body);
    res.status(200).json(result);
  };

  acceptInvite = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.params;
    const { t } = req.query;

    const result = await this.inviteService.acceptInvite(id, {
      ...req.body,
      token: t,
    });
    res.status(200).json(result);
  };

  resendInvite = async (req: AppRequest, res: AppResponse) => {
    const { id, cid } = req.currentuser!;
    const { data, ...rest } = await this.inviteService.resendInvite(
      req.body,
      id
    );
    if (data?.emailOptions) {
      data &&
        this.emailQueue.addEmailToQueue(
          USER_INVITE_QUEUE,
          data.emailOptions as IEmailOptions
        );
    }
    res.status(200).json(rest);
  };

  allInvites = async (req: AppRequest, res: AppResponse) => {
    const { id, cid } = req.currentuser!;
    const result = await this.inviteService.allInvites({ userId: id, cid });
    res.status(200).json(result);
  };
}

export default new InviteController();
