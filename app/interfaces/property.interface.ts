import { Document, Types } from 'mongoose';
import { IUserDocument } from './user.interface';

export enum IPaymentTypeEnum {
  yearly = 'yearly',
  monthly = 'monthly',
  weekly = 'weekly',
  daily = 'daily',
}
export type IPaymentTypes = 'yearly' | 'monthly' | 'weekly' | 'daily';

export enum ICurrenciesEnum {
  USD = 'USD',
  GBP = 'GBP',
  EUR = 'EUR',
}

export enum IPropertyTypeEnum {
  others = 'others',
  multiUnits = 'multiUnits',
  apartments = 'apartments',
  officeUnits = 'officeUnits',
  singleFamily = 'singleFamily',
}
export type IPropertyType =
  | 'singleFamily'
  | 'multiUnits'
  | 'apartments'
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
  partiallyOccupied = 'partially-occupied',
}
export type IPropertyStatus = 'vacant' | 'occupied' | 'partially-occupied';

export interface IProperty {
  title: string;
  description?: {
    text: string;
    html: string;
  };
  propertyType: IPropertyType | string;
  status: IPropertyStatus | string;
  managedBy: Types.ObjectId | string | Partial<IUserDocument>;
  propertySize: number;
  features: {
    floors: number;
    bedroom: number;
    bathroom: number;
    maxCapacity: number;
    availableParking: number;
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
  category: IPropertyCategories | string;
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
  fees: {
    taxAmount: number;
    includeTax: boolean;
    rentalAmount: number | string;
    currency: ICurrenciesEnum;
    managementFees: number | string;
  };
  photos: IPropertyImages[] | [];
  totalUnits: number;
  deletedAt: Date | null;
}

interface IPropertyImages {
  url: string;
  filename: string;
  key: string;
}

export interface IPropertyDocument extends IProperty, Document {
  property: never[];
  findApartment(
    apartmentId?: string,
    unitNumber?: string
  ): IApartmentUnitDocument | null;
  hasActiveLease(): Promise<boolean>;
  canAddApartmentUnit(): boolean;
  cid: string;
  puid: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
  previousLeases: Types.ObjectId[];
  activeLease: Types.ObjectId | undefined;
  apartmentUnits: Types.DocumentArray<IApartmentUnitDocument>;
}

export interface IApartmentUnit {
  unitNumber: string;
  features: {
    bedroom: number;
    bathroom: number;
    maxCapacity: number;
    hasParking: boolean;
  };
  status: 'vacant' | 'occupied';
  rentalPrice: {
    amount: number | null;
    currency: string;
  };
  previousLeases: Types.ObjectId[];
  activeLease: Types.ObjectId | undefined;
}

export interface IApartmentUnitDocument extends IApartmentUnit {
  auid: string;
  createdAt?: Date;
  updatedAt?: Date;
  _id: Types.ObjectId;
  deletedAt: Date | null;
}
