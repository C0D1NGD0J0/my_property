import { Document, Types } from 'mongoose';

interface PaymentInfo {
  paymentType: string;
  cardExpYear: string;
  last4digits: string;
}

export interface ISubscription {
  client: Types.ObjectId;
  cid: string;
  stripeCustomerId: string;
  paymentInfo?: PaymentInfo;
  status: 'active' | 'inactive';
  startDate: Date | null;
  endDate: Date | null;
  canceledAt: Date | null;
  stripeInfo: {
    subscriptionId: string | undefined;
    invoiceId: string | undefined;
    planName: string | undefined;
    planId: string | undefined;
  };
}

export interface ISubscriptionDocument extends ISubscription, Document {
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}

export interface ParsedStripePlan {
  id: string;
  currency: string;
  features: string[];
  recurring?: string;
  amount: string | null;
  name: string | undefined;
}
