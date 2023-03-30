import { Document, Types } from 'mongoose';

export enum PaymentTypeEnum {
  yearly = 'yearly',
  monthly = 'monthly',
  weekly = 'weekly',
  daily = 'daily',
}
export type IPaymentTypes = 'yearly' | 'monthly' | 'weekly' | 'daily';

export enum PropertyTypeEnum {
  singleFamily = 'single-family',
  townHouse = 'town-house',
  condoUnit = 'condo-unit',
  apartments = 'apartment-units',
  officeUnits = 'office-units',
  others = 'others',
}

export type IPropertyType =
  | 'singleFamily'
  | 'townHouse'
  | 'apartmentUnits'
  | 'officeUnits'
  | 'others';

export enum PropertyCategoryEnum {
  commercial = 'commercial',
  residential = 'residential',
  mixed = 'commercial-residential',
}

export enum PropertyStatusEnum {
  vacant = 'vacant',
  occupied = 'occupied',
}

export interface IProperty {
  description?: string;
  propertyType: PropertyTypeEnum;
  status: 'vacant' | 'occupied';
  managedBy: Types.ObjectId;
  features: {
    floors: number;
    bedroom: number;
    bathroom: number;
    maxCapacity: number;
    availableParking?: number;
  };
  extras: {
    has_tv: boolean;
    has_kitchen: boolean;
    has_ac: boolean;
    has_heating: boolean;
    has_internet: boolean;
    has_gym: boolean;
    has_parking: boolean;
    has_swimmingpool: boolean;
    has_laundry: boolean;
    petsAllowed: boolean;
  };
  category: PropertyCategoryEnum;
  computedLocation?: {
    type: string;
    coordinates: [number, number];
    address?: {
      street: string | undefined;
      city: string | undefined;
      state: string | undefined;
      country: string | undefined;
      postCode: string | undefined;
      streetNumber: string | undefined;
    };
    latAndlon?: string;
  };
  address: string;
  baseRentalPrice: {
    amount: number | string;
    currency: string;
  };
  deletedAt: Date | null;
  photos: PropertyImages[];
}

interface PropertyImages {
  url: string;
  filename: string;
  key: string;
}

export interface IPropertyDocument extends IProperty, Document {
  cid: string;
  pid: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}

export interface IApartment extends IProperty {
  totalUnits: number;
  floors: number;
  hasParking: boolean;
  managementFees?: number;
  apartmentUnits: Types.DocumentArray<IApartmentUnit>;
}

export interface IApartmentDocument extends IApartment, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApartmentUnit {
  unitNumber: string;
  features?: {
    bedroom: number;
    bathroom: number;
    maxCapacity: number;
    hasParking: boolean;
  };
  status: string;
  unitPrice: {
    amount: number | null;
    currency: string;
  };
}

export interface IApartmentUnitDocument extends IApartmentUnit, Document {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
