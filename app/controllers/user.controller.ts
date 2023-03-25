import { UserService } from '@services/user';
import { EmailQueue } from '@queues/index';
import { httpStatusCodes, USER_EMAIL_QUEUE } from '@utils/constants';
import { AuthCache } from '@root/app/caching/index';
import { AppRequest, AppResponse } from '@interfaces/utils.interface';
import { ICurrentUser } from '@interfaces/user.interface';

class UserController {
  private userService: UserService;
  private emailQueue: EmailQueue;
  private cache: AuthCache;

  constructor() {
    this.cache = new AuthCache();
    this.userService = new UserService();
    this.emailQueue = new EmailQueue();
  }

  getCurrentUser = async (req: AppRequest, res: AppResponse) => {
    const { cid } = req.params;
    const resp = await this.userService.getCurrentUser(
      cid,
      (req.currentuser as ICurrentUser).id
    );
    resp.data && (await this.cache.saveCurrentUser(resp.data));
    res.status(httpStatusCodes.OK).json(resp);
  };

  getAccountInfo = async (req: AppRequest, res: AppResponse) => {
    const { cid } = req.params;
    const resp = await this.userService.getAccountInfo(
      cid,
      (req.currentuser as ICurrentUser).id
    );
    res.status(httpStatusCodes.OK).json(resp);
  };

  updateAccount = async (req: AppRequest, res: AppResponse) => {
    const { cid } = req.params;
    const { data, ...rest } = await this.userService.updateAccount(cid, {
      ...req.body,
      userId: (req.currentuser as ICurrentUser).id,
    });

    if (data) {
      await this.cache.saveCurrentUser(data.user);
      this.emailQueue.addEmailToQueue(USER_EMAIL_QUEUE, data.emailOptions);
    }

    res.status(httpStatusCodes.OK).json(rest);
  };

  deleteAccount = async (req: AppRequest, res: AppResponse) => {
    const { password } = req.body;
    const data = await this.userService.deleteAccount({
      userId: (req.currentuser as ICurrentUser).id,
      password,
    });

    // this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data!.emailOptions);
    await this.cache.delAuthTokens((req.currentuser as ICurrentUser).id);
    res.clearCookie('refreshToken');

    res.status(httpStatusCodes.OK).json(data);
  };
}

export default new UserController();
