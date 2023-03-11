import { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

import { User } from '@models/index';
import { IPropertyManagerDocument } from '@interfaces/user.interface';

const propertyManagerSchema = new Schema<IPropertyManagerDocument>(
  {
    firstName: {
      type: String,
      required: true,
      lowercase: true,
      maxlength: 25,
      minlength: 2,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      lowercase: true,
      maxlength: 25,
      minlength: 2,
      trim: true,
    },
    location: {
      type: String,
      lowercase: true,
      maxlength: 35,
      trim: true,
    },
    phoneNumber: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    discriminatorKey: '_type',
  }
);

propertyManagerSchema
  .virtual('fullname')
  .get(function (this: IPropertyManagerDocument) {
    return `${this.firstName} ${this.lastName}`;
  });

propertyManagerSchema.plugin(uniqueValidator);

export default User.discriminator<IPropertyManagerDocument>(
  'PropertyManager',
  propertyManagerSchema
);
