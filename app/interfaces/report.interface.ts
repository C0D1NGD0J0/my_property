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
  priority: 'Urgent' | 'Normal' | 'Low';
  description: string;
  attachments: Array<{
    url: string;
    filename?: string;
    key?: string;
    mediaType?: string;
  }>;
  status: 'Open' | 'In-Progress' | 'Resolved' | 'Closed';
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
