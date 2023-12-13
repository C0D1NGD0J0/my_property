import { EmailQueue } from '@queues/index';
import { UserService } from '@services/user';
import { AuthCache } from '@root/app/caching/index';
import { ICurrentUser } from '@interfaces/user.interface';
import { httpStatusCodes, USER_EMAIL_QUEUE } from '@utils/constants';
import {
  AppRequest,
  AppResponse,
  IPaginationQuery,
} from '@interfaces/utils.interface';

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
      req.currentuser!.id
    );
    resp.data && (await this.cache.saveCurrentUser(resp.data));
    res.status(httpStatusCodes.OK).json(resp);
  };

  getClientUsers = async (req: AppRequest, res: AppResponse) => {
    const { cid } = req.params;
    const { page, limit, sortBy, userType } = req.query;
    // pagination
    const paginationQuery: IPaginationQuery = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      sortBy: sortBy as string,
      skip: null,
    };
    paginationQuery.skip =
      paginationQuery && (paginationQuery.page! - 1) * paginationQuery.limit!;
    const resp = await this.userService.getClientUsers(
      cid,
      userType as string,
      paginationQuery
    );
    res.status(httpStatusCodes.OK).json(resp);
  };

  getAccountInfo = async (req: AppRequest, res: AppResponse) => {
    const { cid } = req.params;
    const resp = await this.userService.getUserEditInfo(req.currentuser!.id);
    res.status(httpStatusCodes.OK).json(resp);
  };

  getClientInfo = async (req: AppRequest, res: AppResponse) => {
    const { cid } = req.params;
    const resp = await this.userService.getClientInfo(cid);
    res.status(httpStatusCodes.OK).json(resp);
  };

  updateAccount = async (req: AppRequest, res: AppResponse) => {
    const { cid } = req.params;
    const { data, ...rest } = await this.userService.updateAccount(cid, {
      ...req.body,
      userId: req.currentuser!.id,
    });

    if (data) {
      await this.cache.saveCurrentUser(data.user);
      this.emailQueue.addEmailToQueue(USER_EMAIL_QUEUE, data.emailOptions);
    }

    res.status(httpStatusCodes.OK).json(rest);
  };

  updateClientAccount = async (req: AppRequest, res: AppResponse) => {
    const { cid } = req.params;
    const { data, ...rest } = await this.userService.updateClientAccount(cid, {
      ...req.body,
      userId: req.currentuser!.id,
    });

    if (data?.emailOptions) {
      this.emailQueue.addEmailToQueue(USER_EMAIL_QUEUE, data.emailOptions);
    }

    res
      .status(httpStatusCodes.OK)
      .json({ success: true, data: { clientInfo: data?.clientInfo } });
  };

  deleteAccount = async (req: AppRequest, res: AppResponse) => {
    const { password } = req.body;
    const data = await this.userService.deleteAccount({
      userId: req.currentuser!.id,
      password,
    });

    // this.emailQueue.addEmailToQueue(AUTH_EMAIL_QUEUE, data!.emailOptions);
    await this.cache.delAuthTokens((req.currentuser! as ICurrentUser).id);
    res.clearCookie('refreshToken');

    res.status(httpStatusCodes.OK).json(data);
  };
}

export default new UserController();
