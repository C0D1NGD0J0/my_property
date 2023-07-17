import { ICommentDocument, IComment } from '@interfaces/comment.interface';
import { Schema, model } from 'mongoose';
const { ObjectId } = Schema.Types;

const CommentSchema = new Schema<ICommentDocument>(
  {
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    text: {
      trim: true,
      default: '',
      type: String,
      minlength: 2,
      required: true,
      maxlength: 700,
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
    readAt: {
      type: Date,
      default: undefined,
    },
    author: { type: ObjectId, ref: 'User', required: true },
    report: { type: ObjectId, ref: 'MaintenanceReport', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const CommentModel = model<ICommentDocument>('Comment', CommentSchema);

CommentModel.syncIndexes();

export default CommentModel;
