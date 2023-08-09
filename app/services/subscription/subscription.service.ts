import { Types } from 'mongoose';
import color from 'colors';

import { Client, Subscription } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { createLogger } from '@utils/helperFN';
import { IPromiseReturnedData } from '@interfaces/utils.interface';
import {
  ISubscription,
  ISubscriptionDocument,
} from '@interfaces/subscription.interface';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import StripeService from '@services/external/stripe.service';

class SubscriptionService {
  private log;
  private stripe;

  constructor() {
    this.stripe = new StripeService();
    this.log = createLogger('SubscriptionService', true);
  }

  newSubscriptionEntry = async (
    data: Partial<ISubscription> & { email?: string; name?: string }
  ): IPromiseReturnedData<ISubscriptionDocument | null> => {
    if (!data.email) {
      this.log.error('newSubscriptionEntry: email not provided');
      return { success: false, data: null };
    }
    const customer = await this.stripe.createCustomer(data.email, data.name);
    if (!customer.success) {
      this.log.error(
        'SubscriptionService: Unable to create stripe customer account'
      );
      return { success: false, data: null };
    }

    const client = await Client.findById(data.client);
    if (!client) {
      this.log.error(
        'newSubscriptionEntry: client not found, invalid client-id'
      );
      return { success: false, data: null };
    }

    const subscription = new Subscription({
      ...data,
      cid: client.cid,
      client: client._id,
      stripeCustomerId: customer.data?.id,
    });

    client.subscription = subscription._id;
    await Promise.all([client.save(), subscription.save()]);
    return {
      success: true,
      data: subscription,
    };
  };

  getSubscriptionPlans = async () => {
    const plans = await this.stripe.getPriceList();
    return {
      success: true,
      plans: plans.data,
    };
  };

  subscribeToPlan = async (
    customerId: string,
    priceId: string,
    planName: string
  ) => {
    if (!customerId) {
      this.log.error('subscribeToPlan: customerId not provided');
      return { success: false, data: null };
    }

    if (!priceId) {
      this.log.error('subscribeToPlan: priceId not provided');
      return { success: false, data: null };
    }

    const stripe_resp = await this.stripe.subscribeToPlan(customerId, priceId);
    if (!stripe_resp.success) {
      const err = 'Subscription service error.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const subscription = await Subscription.findOne({
      stripeCustomerId: customerId,
    });
    if (!subscription) {
      const err = 'Subscription not found.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    subscription.stripeInfo = {
      subscriptionId: stripe_resp.data?.subscriptionId,
      invoiceId: stripe_resp.data?.currentInvoiceId || '',
      planId: priceId,
      planName,
    };
    await subscription.save();

    return {
      success: true,
      data: subscription,
    };
  };

  updateSubscription = async () => {
    return {
      success: true,
    };
  };

  cancelSubscription = async () => {
    return {
      success: true,
    };
  };

  getClientSubscriptionInfo = async (
    cid: string | undefined
  ): IPromiseReturnedData<ISubscriptionDocument | null> => {
    if (!cid) {
      return { success: false, data: null };
    }

    const client = await Client.findOne({ cid });

    if (!client) {
      this.log.error('getClientSubscriptionInfo: client not found.');
      return { success: false, data: null };
    }

    const subscription = await Subscription.findOne({ client: client._id });

    if (!subscription) {
      this.log.error('getClientSubscriptionInfo: subscription not found.');
      return { success: false, data: null };
    }

    return { success: true, data: subscription };
  };

  validatePriceId = async (
    priceid: string | undefined
  ): IPromiseReturnedData => {
    if (!priceid) {
      const err = 'Price identifier missing.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    const resp = await this.stripe.getPriceInfo(priceid);
    if (!resp.success) {
      const err = 'Unable to validate pricing info.';
      this.log.error(color.red(err));
      throw new ErrorResponse(
        err,
        errorTypes.SERVICE_ERROR,
        httpStatusCodes.NOT_FOUND
      );
    }

    return { success: true };
  };
}

export default SubscriptionService;
