import { Request, Response, NextFunction } from 'express';
import { UserService } from '@services/user';
import { EmailQueue } from '@services/queues';
import { httpStatusCodes } from '@utils/helperFN';
import { USER_EMAIL_QUEUE } from '@utils/constants';
import { AuthCache } from '@services/redis';
import ErrorResponse from '@utils/errorResponse';
import { AppRequest, AppResponse } from '@interfaces/utils.interface';

class UserController {
  private userService: UserService;
  private emailQueue: EmailQueue;
  private cache: AuthCache;

  constructor() {
    this.cache = new AuthCache();
    this.userService = new UserService();
    this.emailQueue = new EmailQueue();
  }

  updateAccount = async (req: AppRequest, res: AppResponse) => {
    const { data, ...rest } = await this.userService.updateAccount({
      ...req.body,
      userId: req.currentuser.id,
    });

    this.emailQueue.addEmailToQueue(USER_EMAIL_QUEUE, data!.emailOptions);
    res.status(httpStatusCodes.OK).json(rest);
  };

  deleteAccount = async (req: AppRequest, res: AppResponse) => {
    const { password } = req.body;
    const data = await this.userService.deleteAccount({
      userId: req.currentuser.id,
      password,
    });

    // this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data!.emailOptions);
    await this.cache.delAuthTokens(req.currentuser.id);
    res.clearCookie('refreshToken');

    res.status(httpStatusCodes.OK).json(data);
  };
}

export default new UserController();
