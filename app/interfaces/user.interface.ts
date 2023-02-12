import { Document, Types } from 'mongoose';

// USER
export enum IUserType {
  employee = 'employee',
  propertyManager = 'propertyManager',
  landlord = 'landlord',
  tenant = 'tenant',
  admin = 'admin',
}

export enum IUserRelationshipsEnum {
  parents = 'parents',
  sibling = 'sibling',
  spouse = 'spouse',
  child = 'child',
  other = 'other',
}

// BASE-USER INTERFACE
export interface IUser {
  uuid: string;
  email: string;
  lastName: string;
  firstName: string;
  password?: string;
  fullname?: string;
  isActive?: boolean;
  phoneNumber?: string;
  activationToken?: string;
  passwordResetToken?: string;
  passwordResetTokenExpiresAt?: Date;
  activationTokenExpiresAt?: Date | number;
}

export interface IUserDocument extends IUser, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
  validatePassword: (pwd1: string) => Promise<boolean>;
}

// TENANT INTERFACE
export interface ITenant extends IUser {
  emergencyContact?: {
    name: string;
    email?: string;
    phoneNumber: string;
    relationship: IUserRelationshipsEnum;
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

// LANDLORD INTERFACE
export interface ILandLord extends IUser {
  name: string;
  ownedPRoperties: [];
  contactInfo: {
    email: string;
    address: string;
    phoneNumber: string;
  };
}

export interface ILandLordDocument extends ILandLord, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IRefreshTokenDocument extends Document {
  token: string;
  user: Types.ObjectId;
}

export type IRefreshToken = IRefreshTokenDocument;
