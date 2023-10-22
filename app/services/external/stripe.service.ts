import { ParsedStripePlan } from '@interfaces/subscription.interface';
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

  getPriceList = async (): IPromiseReturnedData<ParsedStripePlan[] | null> => {
    try {
      const prices = await this.stripe.prices.list({
        limit: 10,
        expand: ['data.product'],
      });

      const parsePlans = (plans: Stripe.Price[]): ParsedStripePlan[] => {
        return plans.map((plan) => this.parsePriceDataObject(plan));
      };

      return { success: true, data: parsePlans(prices.data) };
    } catch (error) {
      this.log.error(error, 'stripe price list');
      return { success: false, data: null };
    }
  };

  subscribeToPlan = async (
    customerid: string,
    planid: string
  ): IPromiseReturnedData<{
    subscriptionId: string;
    type: string;
    clientSecret: string | null;
    currentInvoiceId: string | null;
  } | null> => {
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

      if (subscription.pending_setup_intent !== null) {
        // note: At this point the stripe Subscription is inactive and awaiting payment
        return {
          success: true,
          data: {
            subscriptionId: subscription.id,
            type: 'setup',
            clientSecret:
              (subscription.pending_setup_intent as Stripe.SetupIntent)
                .client_secret || '',
            currentInvoiceId: (subscription.latest_invoice as Stripe.Invoice)
              .id,
          },
        };
      } else {
        let clientSecret: string | null = '';
        if (
          subscription.latest_invoice &&
          typeof subscription.latest_invoice !== 'string'
        ) {
          clientSecret = (
            subscription.latest_invoice.payment_intent as Stripe.PaymentIntent
          )?.client_secret;
        }
        return {
          success: true,
          data: {
            subscriptionId: subscription.id,
            type: 'payment',
            clientSecret,
            currentInvoiceId: (subscription.latest_invoice as Stripe.Invoice)
              .id,
          },
        };
      }
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

  getPriceInfo = async (
    priceid: string
  ): IPromiseReturnedData<ParsedStripePlan | null> => {
    try {
      if (!priceid) {
        this.log.error('stripe price id missing.');
        return { success: false, data: null };
      }

      const price = await this.stripe.prices.retrieve(priceid, {
        expand: ['data.product'],
      });
      const parsePlans = this.parsePriceDataObject(price);

      return { success: true, data: parsePlans };
    } catch (error) {
      this.log.error(error, 'stripe price list');
      return { success: false, data: null };
    }
  };

  private parsePriceDataObject = (plan: Stripe.Price): ParsedStripePlan => {
    return {
      id: plan.id,
      currency: plan.currency,
      recurring: plan.recurring ? plan.recurring.interval : undefined,
      amount: plan.unit_amount_decimal,
      name: (plan.product as Stripe.Product).name || '',
      features: [],
    };
  };
}

export default StripeService;
