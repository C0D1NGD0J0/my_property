import { IBaseUserDocument, IAccountType } from '@interfaces/user.interface';
import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import bcrypt from 'bcryptjs';

const baseUserSchema = new Schema<IBaseUserDocument>(
  {
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: 6,
      maxlength: 12,
      trim: true,
    },
    accountType: {
      type: String,
      required: true,
      default: IAccountType.individual,
      enum: Object.values(IAccountType),
    },
    isActive: { type: Boolean, default: false },
    activationToken: { type: String, default: '' },
    passwordResetToken: { type: String, default: '' },
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

baseUserSchema.pre('save', async function (this: IBaseUserDocument, next) {
  if (!this.isModified('password')) {
    next();
  }

  // Hashing Password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

baseUserSchema.methods.validatePassword = async function (
  pwd: string
): Promise<boolean> {
  return await bcrypt.compare(pwd, this.password);
};

baseUserSchema.plugin(uniqueValidator);

export default model<IBaseUserDocument>('User', baseUserSchema);
