import {
  IUserDocument,
  IUserRelationshipsEnum,
} from '@interfaces/user.interface';
import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema<IUserDocument>(
  {
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
    location: {
      type: String,
      lowercase: true,
      maxlength: 35,
      trim: true,
    },
    phoneNumber: { type: String, default: '' },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: 6,
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
    emergencyContact: {
      type: {
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
      default: null,
    },
    activationToken: { type: String, default: '' },
    isActive: { type: Boolean, default: false },
    passwordResetToken: { type: String, default: '' },
    cids: [
      {
        cid: { type: String, required: true, index: true },
        role: { type: String, required: true, default: 'tenant' },
        isConnected: { type: Boolean, required: true, default: false },
        _id: false,
      },
    ],
    uid: { type: String, required: true, index: true },
    deletedAt: { type: Date, default: null, select: false },
    activationTokenExpiresAt: { type: Date, default: null },
    passwordResetTokenExpiresAt: { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.pre('save', async function (this: IUserDocument, next) {
  if (!this.isModified('password')) {
    next();
  }

  // Hashing Password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.validatePassword = async function (
  pwd: string
): Promise<boolean> {
  return await bcrypt.compare(pwd, this.password);
};

UserSchema.virtual('fullname').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.plugin(uniqueValidator);

const UserModel = model<IUserDocument>('User', UserSchema);

UserModel.syncIndexes();

export default UserModel;
