import { IPromiseReturnedData } from '@interfaces/utils.interface';
import { createLogger } from '@utils/helperFN';
import Stripe from 'stripe';

class StripeService {
  private stripe;
  private log;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET as string, {
      apiVersion: '2022-11-15',
      typescript: true,
    });
    this.log = createLogger('StripeService', true);
  }

  createCustomer = async (
    email: string,
    name?: string
  ): IPromiseReturnedData<Stripe.Customer | null> => {
    try {
      const customer: Stripe.Customer = await this.stripe.customers.create({
        email,
        ...(name ? { name } : null),
      });
      return { success: true, data: customer };
    } catch (error) {
      this.log.error(error, 'stripe new customer');
      return { success: false, data: null };
    }
  };

  getCustomerInfo = async (
    customerId: string
  ): IPromiseReturnedData<Stripe.Customer | Stripe.DeletedCustomer | null> => {
    try {
      if (!customerId) {
        return { success: false, data: null };
      }

      const customer: Stripe.Customer | Stripe.DeletedCustomer =
        await this.stripe.customers.retrieve(customerId);
      return { success: true, data: customer };
    } catch (error) {
      this.log.error(error, 'stripe customer info');
      return { success: false, data: null };
    }
  };

  getPriceList = async (): IPromiseReturnedData<Stripe.Price[] | null> => {
    try {
      const prices = await this.stripe.prices.list({
        limit: 10,
      });
      return { success: true, data: prices.data };
    } catch (error) {
      this.log.error(error, 'stripe price list');
      return { success: false, data: null };
    }
  };

  subscribeToPlan = async (
    customerid: string,
    planid: string
  ): IPromiseReturnedData<Stripe.Subscription | null> => {
    try {
      if (!customerid) {
        return { success: false, data: null };
      }

      if (!planid) {
        return { success: false, data: null };
      }

      const subscription: Stripe.Subscription =
        await this.stripe.subscriptions.create({
          customer: customerid,
          items: [
            {
              price: planid,
            },
          ],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
        });
      // note: At this point the Subscription is inactive and awaiting payment
      return { success: true, data: subscription };
    } catch (error) {
      this.log.error(error, 'stripe subscription process');
      return { success: false, data: null };
    }
  };

  cancelSubscription = async (
    subscriptionId: string
  ): IPromiseReturnedData<Stripe.Subscription | null> => {
    try {
      if (!subscriptionId) {
        return { success: false, data: null };
      }

      const subscription: Stripe.Subscription =
        await this.stripe.subscriptions.del(subscriptionId);

      return { success: true, data: subscription };
    } catch (error) {
      this.log.error(error, 'stripe cancel subscription');
      return { success: false, data: null };
    }
  };
}

export default StripeService;
