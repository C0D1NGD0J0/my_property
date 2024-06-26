import { Document, Types } from 'mongoose';

// USER
export enum IAccountType {
  individual = 'individual',
  enterprise = 'enterprise',
}
// export type IAccountTypes = 'individual' | 'enterprise';

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

export interface IInviteUserSignup {
  cid: string;
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  location?: string;
  userType: IUserRoleType;
  phoneNumber?: string;
  emergencyContact?: {
    name: string;
    email?: string;
    phoneNumber: string;
    relationship: IUserRelationshipsEnum;
  };
  userId?: Types.ObjectId;
}

interface IClientUserConnections {
  cid: string;
  role: 'admin' | 'tenant' | 'landlord';
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
  accountType: {
    planId: string;
    name: string;
    isEnterpriseAccount: boolean;
  };
  subscription: Types.ObjectId | null;
  enterpriseProfile?: IEnterpriseInfo;
}

export type IPopulatedClientDocument = Omit<IClientDocument, 'admin'> & {
  admin: IUserDocument | Types.ObjectId;
};

type IdentificationType = {
  idType:
    | 'passport'
    | 'national-id'
    | 'drivers-license'
    | 'corporation-license';
  idNumber: string;
  authority: string;
  issueDate: Date | string; // or Date if you prefer Date objects
  expiryDate: Date | string; // or Date if you prefer Date objects
  issuingState: string;
};
type ContactInfoType = {
  email: string;
  address: string;
  phoneNumber: string;
  contactPerson: string;
};

interface IEnterpriseInfo {
  companyName: string;
  legalEntityName: string;
  contactInfo?: ContactInfoType;
  businessRegistrationNumber: string;
  identification?: IdentificationType;
}

export interface IClientUpdateData {
  companyName: string;
  legalEntityName: string;
  contactInfo?: ContactInfoType;
  businessRegistrationNumber: string;
  identification?: IdentificationType;
  userId?: string;
  admin?: string;
  subscription?: string;
}

export enum IUserRole {
  ADMIN = 'admin',
  TENANT = 'tenant',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}
export type IUserRoleType = 'admin' | 'tenant' | 'manager' | 'employee';

// TENANT INTERFACE
export interface ITenant extends IUser {
  cid: string;
  activatedAt: Date;
  managedBy: Types.ObjectId;
  rentalHistory?: string[];
  paymentRecords?: string[];
  user: Types.ObjectId;
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
  role: IClientUserConnections['role'];
  email: string;
  isActive: boolean;
  fullname: string | null;
  linkedAccounts: any[];
  isSubscriptionActive?: boolean;
}
