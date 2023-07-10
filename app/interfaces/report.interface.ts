import { Document, Types } from 'mongoose';

export interface IMaintenanceReport {
  lease: Types.ObjectId;
  puid: string;
  category:
    | 'Plumbing'
    | 'Electrical'
    | 'HVAC'
    | 'Appliances'
    | 'Structural'
    | 'Pest Control'
    | 'Landscaping'
    | 'Security'
    | 'General Maintenance';
  cid: string;
  priority: 'urgent' | 'normal' | 'low';
  description: string;
  attachments: Array<{
    url: string;
    filename?: string;
    key?: string;
    mediaType?: string;
  }>;
  deletedAt?: Date;
  title?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: Types.ObjectId;
  creator: Types.ObjectId;
}

export interface IMaintenanceReportDocument
  extends IMaintenanceReport,
    Document {
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}
