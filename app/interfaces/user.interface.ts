import { Document, Types } from 'mongoose';

// USER
export enum IAccountType {
  individual = 'individual',
  enterprise = 'enterprise',
}

export enum IUserRelationshipsEnum {
  parents = 'parents',
  sibling = 'sibling',
  spouse = 'spouse',
  child = 'child',
  other = 'other',
}

export type ISignupData = Pick<
  IClientDocument,
  'accountType' | 'enterpriseProfile'
> &
  Omit<
    IUser,
    | 'activationToken'
    | 'passwordResetToken'
    | 'activationTokenExpiresAt'
    | 'passwordResetTokenExpiresAt'
  >;

// USER INTERFACE
export interface IUser {
  uid: string;
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  location?: string;
  phoneNumber?: string;
  emergencyContact?: {
    name: string;
    email?: string;
    phoneNumber: string;
    relationship: IUserRelationshipsEnum;
  };
  activationToken?: string;
  passwordResetToken?: string;
  enterpriseProfile?: IEnterpriseInfo;
  activationTokenExpiresAt: Date | number | null;
  passwordResetTokenExpiresAt: Date | number | null;
}

interface IClientUserConnections {
  cid: string;
  role: string;
  isConnected: boolean;
}
export interface IUserDocument extends IUser, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  fullname?: string;
  _id: Types.ObjectId;
  deletedAt: Date | null;
  cids: IClientUserConnections[];
  validatePassword: (pwd1: string) => Promise<boolean>;
}

// CLIENT
export interface IClientDocument extends Document {
  id: string;
  cid: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
  admin: Types.ObjectId;
  accountType: IAccountType.enterprise | IAccountType.individual;
  enterpriseProfile?: IEnterpriseInfo;
}

export enum IUserRole {
  ADMIN = 'admin',
  TENANT = 'tenant',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

interface IEnterpriseInfo {
  contactInfo: {
    email: string;
    address: string;
    phoneNumber: string;
    contactPerson: string;
  };
  companyName: string;
  legaEntityName: string;
  businessRegistrationNumber: string;
}

// TENANT INTERFACE
export interface ITenant extends IUser {
  cid: string;
  activatedAt: Date;
  landlord: Types.ObjectId;
  rentalHistory?: string[];
  paymentRecords?: string[];
  clientUser: Types.ObjectId;
  leaseAgreements?: string[];
  activeLeaseAgreement?: string;
  maintenanceRequests?: string[]; // refactor once models have been added
  activationCode: string | undefined;
}

export interface ITenantDocument extends ITenant, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// REFRESH-TOKEN
interface IRefreshTokenDocument extends Document {
  token: string;
  user: Types.ObjectId;
}

export type IRefreshToken = IRefreshTokenDocument;

export interface ICurrentUser {
  id: string;
  uid: string;
  cid: string;
  role: string;
  email: string;
  isActive: boolean;
  _id: Types.ObjectId;
  fullname: string | null;
}
