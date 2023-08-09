import { Document, Types } from 'mongoose';

interface PaymentInfo {
  cardType: string;
  cardExpYear: string;
  last4digits: string;
}

export interface ISubscription {
  client: Types.ObjectId;
  stripePlanId?: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripeInvoiceId?: string;
  paymentInfo?: PaymentInfo;
  status: 'active' | 'inactive';
  planName?: string;
  startDate: Date | null;
  endDate: Date | null;
  canceledAt: Date | null;
}

export interface ISubscriptionDocument extends ISubscription, Document {
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}

export interface ParsedStripePlan {
  id: string;
  currency: string;
  recurring?: string;
  amount: string | null;
  name: string | undefined;
}
