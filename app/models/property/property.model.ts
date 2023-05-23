import {
  IPropertyDocument,
  IPropertyTypeEnum,
  IPropertyCategoryEnum,
  IPropertyStatusEnum,
  IApartmentUnit,
  IApartmentUnitDocument,
} from '@interfaces/property.interface';
import { Schema, Types, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const ApartmentSchema = new Schema<IApartmentUnitDocument>(
  {
    unitNumber: { type: String, required: true },
    features: {
      bedroom: { type: Number, default: 1, max: 5 },
      bathroom: { type: Number, default: 1, max: 5 },
      maxCapacity: { type: Number, default: 1, max: 15 },
      hasParking: { type: Boolean, default: true },
    },
    previousLeases: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Lease' }],
      default: [],
    },
    auid: { type: String, required: true, index: true },
    activeLease: {
      type: Schema.Types.ObjectId,
      ref: 'Lease',
      default: undefined,
      sparse: true,
    },
    status: { type: String, default: 'vacant' },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const PropertySchema = new Schema<IPropertyDocument>(
  {
    cid: { type: String, required: true, index: true },
    puid: { type: String, required: true, index: true },
    propertyType: {
      type: String,
      required: true,
      default: IPropertyTypeEnum.singleFamily,
      enum: Object.values(IPropertyTypeEnum),
    },
    status: {
      type: String,
      required: true,
      default: IPropertyStatusEnum.vacant,
      enum: Object.values(IPropertyStatusEnum),
    },
    managedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    features: {
      bedroom: { type: Number, default: 0 },
      bathroom: { type: Number, default: 0 },
      maxCapacity: { type: Number, default: 0 },
      floors: { type: Number, default: 0 },
      availableParking: { type: Number, default: 0 },
    },
    managementFees: {
      amount: {
        default: 0,
        type: Number,
        required: true,
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
      trim: true,
      type: String,
      minlenght: 5,
      maxlength: 250,
    },
    category: {
      type: String,
      required: true,
      default: IPropertyCategoryEnum.residential,
      enum: Object.values(IPropertyCategoryEnum),
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
    apartmentUnits: {
      type: [ApartmentSchema],
      default: [],
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
    totalUnits: {
      min: 1,
      max: 1000,
      default: 0,
      type: Number,
    },
    previousLeases: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Lease' }],
      default: [],
    },
    activeLease: {
      type: Schema.Types.ObjectId,
      ref: 'Lease',
      default: undefined,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PropertySchema.methods.hasApartmentVacancy = function () {
  if (this.apartmentUnits.length === 0) {
    return false;
  }
  for (const unit of this.apartmentUnits) {
    if (unit.status === 'vacant') {
      return true;
    }
  }
  return false;
};

PropertySchema.methods.findApartment = function (
  apartmentId: string,
  unitNumber?: string
): IApartmentUnitDocument | null {
  let apartment: IApartmentUnitDocument | null = null;
  if (apartmentId) {
    apartment = this.apartmentUnits.id(apartmentId);
  } else if (unitNumber) {
    apartment = this.apartmentUnits.find(
      (a: IApartmentUnitDocument) => a.unitNumber === unitNumber
    );
  }
  return apartment;
};

PropertySchema.methods.hasActiveLease = async function (): Promise<boolean> {
  if (this.activeLease || (this.activeLeases && this.activeLeases.length > 0)) {
    return true;
  }

  if (this.apartmentUnits.length > 0) {
    for (let i = 0; i < this.apartmentUnits.length; i++) {
      const apartment = this.apartmentUnits[i];
      if (apartment.activeLease) {
        return true;
      }
    }
  }

  return false;
};

PropertySchema.index(
  { address: 1, 'computedLocation.latAndlon': 1 },
  { unique: true }
);

PropertySchema.pre<IPropertyDocument>('validate', function (next) {
  // Validation 1: Check if the number of apartment units does not exceed the total units.
  if (this.apartmentUnits.length > this.get('totalUnits')) {
    this.invalidate(
      'apartmentUnits',
      'Number of apartment units must not exceed total units.'
    );
  }

  // Validation 2: Check if the unitNumber values are unique within the property.
  const unitNumbers = this.apartmentUnits?.map((unit) => unit.unitNumber);
  if (new Set(unitNumbers).size !== unitNumbers.length) {
    this.invalidate(
      'apartmentUnits',
      'Unit number must be unique within the property.'
    );
  }

  // Proceed to the next middleware or save the document if validations pass.
  next();
});

PropertySchema.plugin(uniqueValidator, { message: '{Path} must be unique' });

const PropertyModel = model<IPropertyDocument>('Property', PropertySchema);

PropertyModel.syncIndexes();

export default PropertyModel;
