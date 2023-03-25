import { IAccountType, IClientDocument } from '@interfaces/user.interface';
import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const ClientSchema = new Schema<IClientDocument>(
  {
    accountType: {
      type: String,
      required: true,
      default: IAccountType.individual,
      enum: Object.values(IAccountType),
    },
    admin: { type: Schema.Types.ObjectId, ref: 'User' },
    cid: { type: String, required: true, index: true },
    enterpriseProfile: {
      type: {
        legaEntityName: {
          type: String,
          required: true,
          lowercase: true,
          maxlength: 50,
          minlength: 2,
          unique: true,
          trim: true,
        },
        companyName: {
          type: String,
          required: true,
          lowercase: true,
          maxlength: 25,
          minlength: 2,
          unique: true,
          trim: true,
        },
        contactInfo: {
          email: {
            type: String,
            index: true,
            required: [true, 'Please provide an email address.'],
            match: [
              /^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/,
              'Please add a valid email',
            ],
            contactPerson: { type: String, default: '' },
          },
          address: { type: String, default: '' },
          phoneNumber: { type: String, default: '' },
        },
        businessRegistrationNumber: {
          type: String,
          trim: true,
          required: true,
        },
      },
      default: null,
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
