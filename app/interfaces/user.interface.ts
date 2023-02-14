import { Document, Types } from 'mongoose';

// USER
export enum IAccountType {
  individual = 'individual',
  business = 'business',
  tenant = 'tenant',
  admin = 'admin',
}

export enum ISignupAccountType {
  individual = 'individual',
  business = 'business',
}

export enum IBaseUserRelationshipsEnum {
  parents = 'parents',
  sibling = 'sibling',
  spouse = 'spouse',
  child = 'child',
  other = 'other',
}

// BASE-USER INTERFACE
export interface IBaseUser {
  password: string;
  accountType: IAccountType;
  activationToken?: string;
  passwordResetToken?: string;
  passwordResetTokenExpiresAt?: Date;
  activationTokenExpiresAt?: Date | number;
}

export interface IBaseUserDocument extends IBaseUser, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  _id: Types.ObjectId;
  validatePassword: (pwd1: string) => Promise<boolean>;
}

// PROPERTYMANAGER
export interface IPropertyManager extends IBaseUser {
  uuid: string;
  email: string;
  lastName: string;
  firstName: string;
  fullname?: string;
  location?: string;
  phoneNumber?: string;
}

export interface IPropertyManagerDocument extends IPropertyManager, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// TENANT INTERFACE
export interface ITenant extends IBaseUser {
  emergencyContact?: {
    name: string;
    email?: string;
    phoneNumber: string;
    relationship: IBaseUserRelationshipsEnum;
  };
  landlords?: Types.ObjectId[];
  occupation?: string;
  activationCode?: string | undefined;
  activatedAt: Date;
  rentalHistory?: string[];
  paymentRecords?: string[];
  leaseAgreements?: string[];
  activeLeaseAgreement?: string;
  maintenanceRequests?: string[]; // refactor once models have been added
}

export interface ITenantDocument extends ITenant, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IRefreshTokenDocument extends Document {
  token: string;
  user: Types.ObjectId;
}

export type IRefreshToken = IRefreshTokenDocument;
