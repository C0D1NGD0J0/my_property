import { Document, Types } from 'mongoose';

// COMPANY INTERFACE
export interface ICompany {
  cid: string;
  contactInfo: {
    email: string;
    address: string;
    phoneNumber: string;
  };
  isActive: boolean;
  companyName: string;
  legaEntityName: string;
  businessRegistrationNumber: string;
}

export interface ICompanyDocument extends ICompany, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}
