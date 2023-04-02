import { Document, Types } from 'mongoose';

export enum IPaymentTypeEnum {
  yearly = 'yearly',
  monthly = 'monthly',
  weekly = 'weekly',
  daily = 'daily',
}
export type IPaymentTypes = 'yearly' | 'monthly' | 'weekly' | 'daily';

export enum IPropertyTypeEnum {
  others = 'others',
  townHouse = 'townHouse',
  singleRoom = 'singleRoom',
  officeUnits = 'officeUnits',
  singleFamily = 'singleFamily',
  apartments = 'apartmentUnits',
}
export type IPropertyType =
  | 'singleFamily'
  | 'townHouse'
  | 'singleRoom'
  | 'apartmentUnits'
  | 'officeUnits'
  | 'others';

export enum IPropertyCategoryEnum {
  commercial = 'commercial',
  residential = 'residential',
  others = 'other',
}
export type IPropertyCategories = 'commercial' | 'residential' | 'others';

export enum IPropertyStatusEnum {
  vacant = 'vacant',
  occupied = 'occupied',
}
export type IPropertyStatus = 'vacant' | 'occupied';

export interface IProperty {
  description?: string;
  propertyType: IPropertyType;
  status: IPropertyStatus;
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
  category: IPropertyCategoryEnum;
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
  managementFees: {
    amount: number | string;
    currency: string;
  };
  deletedAt: Date | null;
  photos: PropertyImages[];
  totalUnits?: number;
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
  apartmentUnits?: IApartmentUnitDocument[];
}

export interface IApartmentUnit {
  unitNumber: string;
  features: {
    bedroom: number;
    bathroom: number;
    maxCapacity: number;
    hasParking: boolean;
  };
  status: string;
  rentalPrice: {
    amount: number | null;
    currency: string;
  };
}

export interface IApartmentUnitDocument extends IApartmentUnit, Document {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
