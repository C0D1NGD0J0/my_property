import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IMaintenanceReportDocument } from '@interfaces/report.interface';

const maintenanceReportSchema = new Schema<IMaintenanceReportDocument>(
  {
    lease: {
      type: Schema.Types.ObjectId,
      ref: 'Lease',
      required: true,
    },
    puid: {
      type: String,
      required: true,
    },
    title: {
      index: true,
      type: String,
      minlength: 3,
      maxlength: 40,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Plumbing',
        'Electrical',
        'HVAC',
        'Appliances',
        'Structural',
        'Pest Control',
        'Landscaping',
        'Security',
        'General Maintenance',
      ],
      required: true,
    },
    cid: { type: String, required: true, index: true },
    priority: {
      type: String,
      enum: ['Urgent', 'Normal', 'Low'],
      required: true,
    },
    description: {
      trim: true,
      type: String,
      minlenght: 5,
      require: true,
      maxlength: 1500,
    },
    attachments: [
      {
        url: {
          type: String,
          default: 'http://lorempixel.com/450/450/?random=456',
        },
        filename: String,
        key: String,
        mediaType: String,
      },
    ],
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

maintenanceReportSchema.plugin(uniqueValidator, {
  message: '{Path} must be unique',
});

const MaintenanceReportModel = model<IMaintenanceReportDocument>(
  'MaintenanceReport',
  maintenanceReportSchema
);

MaintenanceReportModel.syncIndexes();

export default MaintenanceReportModel;
