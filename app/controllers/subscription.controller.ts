import dayjs from 'dayjs';
import { Types } from 'mongoose';
import { ICurrentUser } from '@interfaces/user.interface';
import {
  AppRequest,
  AppResponse,
  IPaginationQuery,
} from '@interfaces/utils.interface';
import { httpStatusCodes } from '@utils/constants';
import { SubscriptionService } from '@services/subscription';
import { createLogger } from '@utils/helperFN';

class SubscriptionController {
  private log;
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.log = createLogger('SubscriptionController', true);
  }

  getPlans = async (req: AppRequest, res: AppResponse) => {
    const { id } = req.params;
    const data = await this.subscriptionService.getSubscriptionPlans();
    res.status(httpStatusCodes.OK).json(data);
  };

  subscribeToPlan = async (req: AppRequest, res: AppResponse) => {
    const resp = await this.subscriptionService.getClientSubscriptionInfo(
      req.currentuser?.cid
    );

    if (!resp.success) {
      res
        .status(httpStatusCodes.UNPROCESSABLE)
        .json({ success: false, data: null });
    }
    const customerid = resp.data?.stripeCustomerId as string;
    const data = await this.subscriptionService.subscribeToPlan(
      customerid,
      req.body.priceId,
      req.body.planName
    );
    res.status(httpStatusCodes.OK).json(data);
  };
}

export default new SubscriptionController();
