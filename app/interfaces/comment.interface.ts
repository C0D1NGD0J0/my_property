import { Document, Types } from 'mongoose';

export interface IComment {
  parentComment?: Types.ObjectId;
  text: string;
  report: Types.ObjectId;
  author: Types.ObjectId;
}

export interface ICommentDocument extends IComment, Document {
  deletedAt: Date;
  readAt?: Date;
  id: string;
  _id: Types.ObjectId;
}
