import { Document, Types } from 'mongoose';
import { IBaseUser } from '@interfaces/user.interface';

// COMPANY INTERFACE
export interface ICompany extends IBaseUser {
  contactInfo: {
    email: string;
    address: string;
    phoneNumber: string;
    contactPerson: string;
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
