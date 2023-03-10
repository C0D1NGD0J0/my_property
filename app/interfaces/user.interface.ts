import { Document, Types } from 'mongoose';
import { ICompanyDocument } from '@interfaces/company.interface';

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
  email: string;
  password: string;
  activationToken?: string;
  accountType: IAccountType;
  passwordResetToken?: string;
  activationTokenExpiresAt: Date | number | null;
  passwordResetTokenExpiresAt: Date | number | null;
}

export interface IBaseUserDocument extends IBaseUser, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  _id: Types.ObjectId;
  deletedAt: Date | null;
  validatePassword: (pwd1: string) => Promise<boolean>;
}

// PROPERTYMANAGER
export interface IPropertyManager extends IBaseUser {
  uuid: string;
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
export interface IUserType
  extends IBaseUserDocument,
    IPropertyManagerDocument,
    ITenantDocument,
    ICompanyDocument {
  id: string;
}
