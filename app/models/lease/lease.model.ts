import {
  IPaymentFrequencyEnum,
  ILeaseDocument,
  ILeaseStatusEnum,
} from '@interfaces/lease.interface';
import { ObjectId, Schema, Types, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const LeaseSchema = new Schema<ILeaseDocument>(
  {
    endDate: { type: Date, required: true },
    startDate: { type: Date, required: true },
    apartmentId: { type: String, default: '' },
    dateTenantAccepted: { type: Date, default: null },
    leaseAgreements: [
      {
        url: {
          type: String,
          default: 'http://lorempixel.com/450/450/?random=456',
        },
        filename: String,
        key: String,
      },
    ],
    paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
    paymentInfo: {
      rentAmount: {
        default: 0,
        type: Number,
        required: true,
        get: (val: number) => {
          return (val / 100).toFixed(2);
        },
        set: (val: number) => val * 100,
      },
      securityDeposit: { type: Number, min: 0.01 },
      managementFees: { type: Number, min: 0.01 },
      paymentDueDate: { type: Date, required: true },
      paymentFrequency: {
        type: String,
        required: true,
        default: IPaymentFrequencyEnum.monthly,
        enum: Object.values(IPaymentFrequencyEnum),
      },
    },
    leaseHistory: {
      type: [
        {
          startDate: { type: Date },
          endDate: { type: Date },
          renewalDate: { type: Date },
          previousRentAmount: { type: String },
        },
      ],
      default: [],
    },
    status: {
      type: {
        value: {
          type: String,
          enum: Object.values(ILeaseStatusEnum),
          default: ILeaseStatusEnum.active,
        },
        reason: {
          type: String,
          default: '',
        },
      },
      default: {
        value: ILeaseStatusEnum.draft,
        reason: '',
      },
    },
    isRenewal: { type: Boolean, default: false },
    cid: { type: String, default: null, index: true },
    hasTenantAccepted: { type: Boolean, default: false },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: function (this: ILeaseDocument, value: ObjectId) {
          return this.isNew ? true : value != undefined;
        },
      },
      default: undefined,
      sparse: true,
    },
    managedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

LeaseSchema.plugin(uniqueValidator, {
  message: '{Path} must be unique',
});

const LeaseModel = model<ILeaseDocument>('Lease', LeaseSchema);

LeaseModel.syncIndexes();

export default LeaseModel;
