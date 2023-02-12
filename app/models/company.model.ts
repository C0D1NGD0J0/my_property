import { ICompanyDocument } from '@interfaces/company.interface';
import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const companySchema = new Schema<ICompanyDocument>(
  {
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
      },
      address: { type: String, default: '' },
      phoneNumber: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: false },
    cid: { type: String, required: true, index: true },
    businessRegistrationNumber: { type: String, trim: true, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    discriminatorKey: '_type',
  }
);

companySchema.plugin(uniqueValidator);

export default model<ICompanyDocument>('Company', companySchema);
