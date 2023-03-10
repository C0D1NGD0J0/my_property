import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { Types } from 'mongoose';

import { User } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import {
  IAccountType,
  IBaseUser,
  IBaseUserDocument,
  IPropertyManagerDocument,
} from '@interfaces/user.interface';
import { ICompany, ICompanyDocument } from '@interfaces/company.interface';
import { ACCOUNT_UPDATE_NOTIFICATION } from '@utils/constants';
import { IPropertyManager } from '@interfaces/user.interface';
import { IEmailOptions, ISuccessReturnData } from '@interfaces/utils.interface';
import { httpStatusCodes } from '@utils/helperFN';

export type ISignupData = Partial<IPropertyManager & IBaseUser & ICompany>;

class UserService {
  updateAccount = async (
    data: ISignupData & { userId: Types.ObjectId }
  ): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
    let userEmail = '';
    let fullname = '';
    const { accountType, ...dataToSave } = data;

    let user = (await User.findOne({ id: data.userId })) as IBaseUserDocument;
    const isMatch = await user.validatePassword(data.password as string);

    if (!isMatch) {
      const err = 'Valid account password must be provided to update account.';
      throw new ErrorResponse(
        err,
        'validationError',
        httpStatusCodes.UNPROCESSABLE
      );
    }

    user = (await User.findOneAndUpdate(
      { _id: data.userId },
      { $set: dataToSave },
      { new: true }
    )) as IBaseUserDocument;

    if (user.accountType === IAccountType.business) {
      fullname = (user as unknown as ICompanyDocument)?.companyName;
      userEmail = (user as unknown as ICompanyDocument)?.contactInfo.email;
    } else {
      fullname = (user as unknown as IPropertyManagerDocument)
        .fullname as string;
      userEmail = user.email;
    }

    const emailOptions: IEmailOptions = {
      to: userEmail,
      data: {
        fullname,
        updatedAt: new Date(),
      },
      emailType: ACCOUNT_UPDATE_NOTIFICATION,
      subject: 'Account has been updated.',
    };

    return {
      success: true,
      data: { emailOptions },
      msg: `Account was successfully updated.`,
    };
  };

  deleteAccount = async (userdata: { password: string; userId: string }) => {
    const user = (await User.findOne({
      id: userdata.userId,
    })) as IBaseUserDocument;

    const isMatch = await user.validatePassword(userdata.password);
    if (!isMatch) {
      const err = 'Valid account password must be provided to delete account.';
      throw new ErrorResponse(
        err,
        'validationError',
        httpStatusCodes.UNPROCESSABLE
      );
    }

    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();

    return { success: true, msg: 'Account has been successfully deleted.' };
  };
}

export default UserService;
