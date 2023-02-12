import { Schema } from 'mongoose';
import User from '@models/user.model';
import { ILandLordDocument } from '@interfaces/user.interface';

const PropertyOwnerSchema = new Schema<ILandLordDocument>(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      maxlength: 35,
      minlength: 2,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default User.discriminator<ILandLordDocument>(
  'Landlord',
  PropertyOwnerSchema
);
