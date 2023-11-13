import { IAccountType, IClientDocument } from '@interfaces/user.interface';
import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const ClientSchema = new Schema<IClientDocument>(
  {
    accountType: {
      planId: { type: String },
      isEnterpriseAccount: { type: Boolean, default: false },
      name: { type: String, default: IAccountType.individual },
    },
    admin: { type: Schema.Types.ObjectId, ref: 'User' },
    cid: { type: String, required: true, index: true },
    enterpriseProfile: {
      type: Schema.Types.Mixed,
      default: null,
    },
    subscription: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ClientSchema.plugin(uniqueValidator);

const ClientModel = model<IClientDocument>('Client', ClientSchema);

ClientModel.syncIndexes();

export default ClientModel;
