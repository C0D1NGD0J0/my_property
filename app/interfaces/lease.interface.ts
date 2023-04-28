import { Document, Types } from 'mongoose';
import { IUserDocument } from '@interfaces/user.interface';
import { IPropertyDocument } from '@interfaces/property.interface';

interface ILeaseAgreement {
  url: string;
  filename?: string;
  key?: string;
}

interface ILeaseHistory {
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  previousRentAmount?: string;
}

interface IPaymentInfo {
  rentAmount: number;
  paymentDueDate: Date;
  managementFees?: number;
  securityDeposit?: number;
  paymentFrequency: IPaymentFrequencyType;
}

export type IPaymentFrequencyType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'onetime';
export enum IPaymentFrequencyEnum {
  daily = 'daily',
  weekly = 'weekly',
  monthly = 'monthly',
  yearly = 'yearly',
  onetime = 'onetime',
}

export interface ILease extends Document {
  endDate: Date;
  startDate: Date;
  cid: string | null;
  isRenewal: boolean;
  apartmentId: string;
  paymentInfo: IPaymentInfo;
  leaseHistory: ILeaseHistory[];
  paymentHistory: Types.ObjectId[];
  leaseAgreements: ILeaseAgreement[];
  managedBy: Types.ObjectId | IUserDocument;
  property: string | Types.ObjectId | IPropertyDocument;
  status: 'draft' | 'pending' | 'active' | 'cancelled' | 'expired';
}

export interface ILeaseDocument extends ILease, Document {
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
  dateTenantAccepted: Date;
  hasTenantAccepted: boolean;
  tenant?: Types.ObjectId | IUserDocument;
}
// export type ILeasePaymentHistory = IPaymentDocument['_id'];
