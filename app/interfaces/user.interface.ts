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
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
  validatePassword: (pwd1: string) => Promise<boolean>;
}

interface IRefreshTokenDocument extends Document {
  token: string;
  user: Types.ObjectId;
}

export type IRefreshToken = IRefreshTokenDocument;
