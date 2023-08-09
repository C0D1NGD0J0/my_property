import { ISubscriptionDocument } from '@interfaces/subscription.interface';
import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const SubscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    stripePlanId: String,
    stripeCustomerId: {
      type: String,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      index: true,
    },
    stripeInvoiceId: String,
    paymentInfo: {
      cardType: String,
      cardExpYear: String,
      last4digits: String,
    },
    status: {
      type: String,
      default: 'inactive',
      enum: ['active', 'inactive'],
    },
    planName: { type: String },
    endDate: { type: Date, default: undefined },
    startDate: { type: Date, default: undefined },
    canceledAt: { type: Date, default: undefined },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

SubscriptionSchema.plugin(uniqueValidator, {
  message: '{Path} must be unique',
});

const SubscriptiontModel = model<ISubscriptionDocument>(
  'Subscription',
  SubscriptionSchema
);

SubscriptiontModel.syncIndexes();

export default SubscriptiontModel;
