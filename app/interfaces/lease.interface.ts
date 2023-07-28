import { Document, Types } from 'mongoose';
import { IUserDocument } from '@interfaces/user.interface';
import { IPropertyDocument } from '@interfaces/property.interface';

interface ILeaseAgreement {
  url: string;
  filename?: string;
  key?: string;
}

interface ILeaseRenewalHistory {
  managedBy: string;
  previousEndDate?: Date;
  previousStartDate?: Date;
  previousPaymentInfo?: IPaymentInfo;
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

export interface ILease {
  endDate: Date;
  startDate: Date;
  cid: string | null;
  isRenewal: boolean;
  apartmentId?: string;
  paymentInfo: IPaymentInfo;
  leaseHistory: ILeaseRenewalHistory[];
  paymentHistory: Types.ObjectId[];
  leaseAgreements: ILeaseAgreement[];
  tenant?: Types.ObjectId | IUserDocument;
  managedBy: Types.ObjectId | IUserDocument;
  puid: string;
  status: {
    value: 'draft' | 'pending' | 'active' | 'cancelled' | 'expired';
    reason: string;
  };
  dateTenantAccepted?: Date;
  hasTenantAccepted?: boolean;
}

export interface ILeaseDocument extends ILease, Document {
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}

export enum ILeaseStatusEnum {
  draft = 'draft',
  pending = 'pending',
  active = 'active',
  cancelled = 'cancelled',
  expired = 'expired',
}
// export type ILeasePaymentHistory = IPaymentDocument['_id'];
