import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IUserRole } from '@interfaces/user.interface';
import { IInviteDocument } from '@interfaces/invite.interface';

const InviteSchema = new Schema<IInviteDocument>(
  {
    userInfo: {
      type: {
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
        firstName: {
          type: String,
          required: true,
          lowercase: true,
          maxlength: 25,
          minlength: 2,
          trim: true,
        },
        lastName: {
          type: String,
          required: true,
          lowercase: true,
          maxlength: 25,
          minlength: 2,
          trim: true,
        },
        userType: {
          type: String,
          required: true,
          default: IUserRole.TENANT,
          enum: Object.values(IUserRole),
        },
      },
      required: true,
      default: null,
    },
    sentAt: { type: Date, default: null },
    sendNow: { type: Boolean, default: false },
    acceptedInvite: { type: Boolean, default: false },
    cid: { type: String, default: '', required: true },
    pid: { type: String, default: '', required: true },
    inviteTokenExpiresAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    inviteToken: { type: String, default: '', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

InviteSchema.virtual('fullname').get(function (this: IInviteDocument) {
  return `${this.userInfo.firstName} ${this.userInfo.lastName}`;
});

InviteSchema.plugin(uniqueValidator);

const InviteModel = model<IInviteDocument>('Invite', InviteSchema);

InviteModel.syncIndexes();

export default InviteModel;
