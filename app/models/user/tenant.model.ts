import { ITenantDocument } from '@interfaces/user.interface';
import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const TenantSchema = new Schema<ITenantDocument>(
  {
    activatedAt: { type: Date, default: null },
    activationCode: { type: String, default: '' },
    cid: { type: String, required: true, index: true },
    managedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
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

TenantSchema.plugin(uniqueValidator);

const TenantModel = model<ITenantDocument>('Tenant', TenantSchema);

TenantModel.syncIndexes();

export default TenantModel;
