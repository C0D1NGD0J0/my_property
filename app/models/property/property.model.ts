import {
  IPropertyDocument,
  PropertyTypeEnum,
  PropertyCategoryEnum,
  PropertyStatusEnum,
} from '../../interfaces/property.interface';
import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const PropertySchema = new Schema<IPropertyDocument>(
  {
    cid: { type: String, required: true, index: true },
    pid: { type: String, required: true, index: true },
    propertyType: {
      type: String,
      required: true,
      default: PropertyTypeEnum.singleFamily,
      enum: Object.values(PropertyTypeEnum),
    },
    status: {
      type: String,
      default: PropertyStatusEnum.vacant,
      enum: Object.values(PropertyStatusEnum),
    },
    managedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    features: {
      bedroom: { type: Number, default: 0 },
      bathroom: { type: Number, default: 0 },
      maxCapacity: { type: Number, default: 0 },
      floors: { type: Number, default: 0 },
      availableParking: { type: Number, default: 0 },
    },
    baseRentalPrice: {
      amount: {
        type: Number,
        required: true,
        default: 0,
        get: (val: number) => {
          return (val / 100).toFixed(2);
        },
        set: (val: number) => val * 100,
      },
      currency: { type: String, required: true, default: 'USD' },
    },
    extras: {
      has_tv: { type: Boolean, default: false },
      has_kitchen: { type: Boolean, default: false },
      has_ac: { type: Boolean, default: false },
      has_heating: { type: Boolean, default: false },
      has_internet: { type: Boolean, default: false },
      has_gym: { type: Boolean, default: false },
      has_swimmingpool: { type: Boolean, default: false },
      has_laundry: { type: Boolean, default: false },
      petsAllowed: { type: Boolean, default: false },
    },
    address: { type: String, required: true, index: true },
    computedLocation: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        postCode: { type: String },
        streetNumber: { type: String },
      },
      latAndlon: {
        type: String,
        select: false,
        index: true,
        unique: [
          true,
          'Unable to process address provided. <duplicate coordinates>',
        ],
      },
    },
    description: {
      type: String,
      unique: true,
      trim: true,
      maxlength: 250,
      minlenght: 5,
    },
    category: {
      type: String,
      required: true,
      default: PropertyCategoryEnum.residential,
      enum: Object.values(PropertyCategoryEnum),
    },
    photos: [
      {
        url: {
          type: String,
          default: 'http://lorempixel.com/450/450/?random=456',
        },
        filename: String,
        key: String,
      },
    ],
    deletedAt: {
      type: Date,
      defult: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PropertySchema.index(
  { address: 1, 'computedLocation.latAndlon': 1 },
  { unique: true }
);

PropertySchema.plugin(uniqueValidator, { message: '{Path} must be unique' });

const PropertyModel = model<IPropertyDocument>('Property', PropertySchema);

PropertyModel.syncIndexes();

export default PropertyModel;
