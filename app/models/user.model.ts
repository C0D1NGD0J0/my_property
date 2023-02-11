import { IUserDocument } from '@interfaces/user.interface';
import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import bcrypt from 'bcryptjs';

const userSchema = new Schema<IUserDocument>(
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
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: 6,
      select: false,
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
    isActive: { type: Boolean, default: false },
    activationToken: { type: String, default: '' },
    passwordResetToken: { type: String, default: '' },
    uuid: { type: String, required: true, index: true },
    activationTokenExpiresAt: { type: Date, default: '' },
    passwordResetTokenExpiresAt: { type: Number, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    discriminatorKey: '_type',
  }
);

userSchema.virtual('fullname').get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function (this: IUserDocument, next) {
  if (!this.isModified('password')) {
    next();
  }

  // Hashing Password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.validatePassword = async function (
  pwd: string
): Promise<boolean> {
  return await bcrypt.compare(pwd, this.password);
};

userSchema.plugin(uniqueValidator);

export default model<IUserDocument>('User', userSchema);
