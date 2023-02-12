import {
  ITenantDocument,
  IUserRelationshipsEnum,
} from '@interfaces/user.interface';
import { Schema } from 'mongoose';
import User from '@models/user.model';

const tenantSchema = new Schema<ITenantDocument>(
  {
    emergencyContact: {
      name: {
        type: String,
        required: true,
        lowercase: true,
        maxlength: 35,
        minlength: 2,
        trim: true,
      },
      email: {
        type: String,
        index: true,
        required: [true, 'Please provide an email address.'],
        unique: true,
        match: [
          /^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email',
        ],
      },
      phoneNumber: { type: String, default: '' },
      relationship: {
        type: String,
        required: true,
        default: IUserRelationshipsEnum.other,
        enum: Object.values(IUserRelationshipsEnum),
      },
    },
    occupation: { type: String, default: '' },
    activatedAt: { type: Date, default: null },
    activationCode: { type: String, default: '' },
    rentalHistory: [{ type: String, default: '' }], // change to reference model
    paymentRecords: [{ type: String, default: '' }], // change to reference model
    leaseAgreements: [{ type: String, default: '' }], // change to reference model
    activeLeaseAgreement: { type: String, default: '' }, // change to reference model
    maintenanceRequests: [{ type: String, default: '' }], // change to reference model
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default User.discriminator<ITenantDocument>('Tenant', tenantSchema);
