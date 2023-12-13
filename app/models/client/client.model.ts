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
      contactInfo: {
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        phoneNumber: { type: String, default: '' },
        contactPerson: { type: String, default: '' },
      },
      identification: {
        idType: {
          default: '',
          type: String,
          enum: [
            'passport',
            'drivers-license',
            'national-id',
            'corporation-license',
          ],
        },
        issueDate: { type: Date, default: '' },
        expiryDate: { type: Date, default: '' },
        idNumber: { type: String, default: '' },
        authority: { type: String, default: '' },
        issuingState: { type: String, default: '' },
      },
      companyName: { type: String },
      legalEntityName: { type: String },
      businessRegistrationNumber: { type: String },
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

ClientSchema.path('enterpriseProfile.identification.expiryDate').validate(
  function (expiryDate) {
    if (this.enterpriseProfile?.identification?.issueDate && expiryDate) {
      return expiryDate > this.enterpriseProfile.identification.issueDate;
    }
    return true; // If either date is not set, skip this validation
  },
  'Expiry date must be after issue date'
);

const ClientModel = model<IClientDocument>('Client', ClientSchema);

ClientModel.syncIndexes();

export default ClientModel;
