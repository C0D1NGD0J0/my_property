import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';

import {
  IBaseUser,
  IAccountType,
  IPropertyManagerDocument,
} from '@interfaces/user.interface';
import { hashGenerator } from '@utils/helperFN';
import { USER_REGISTRATION } from '@utils/constants';
import { PropertyManager, Company } from '@models/index';
import { IPropertyManager } from '@interfaces/user.interface';
import { ICompany, ICompanyDocument } from '@interfaces/company.interface';
import { IEmailOptions, ISuccessReturnData } from '@interfaces/utils.interface';

export type ISignupData = Partial<IPropertyManager & IBaseUser> | ICompany;

class AuthService {
  signup = async (
    data: ISignupData
  ): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
    let user: ICompanyDocument | IPropertyManagerDocument;
    const dataToSave = {
      ...data,
      isActive: false,
      activationToken: hashGenerator(),
      activationTokenExpiresAt: dayjs().add(1, 'hour').toDate(),
    };
    let emailOptions: IEmailOptions = {
      to: '',
      data: null,
      emailType: USER_REGISTRATION,
      subject: 'Activate your account',
    };

    if (data.accountType === IAccountType.business) {
      user = new Company({
        cuid: uuid(),
        ...dataToSave,
      }) as ICompanyDocument;
      // EMAIL ACTIVATION LINK
      emailOptions = {
        ...emailOptions,
        to: user?.contactInfo.email,
        data: {
          fullname: user?.companyName,
          activationUrl: `${process.env.FRONTEND_URL}/account_activation/${user.activationToken}`,
        },
      };
    } else {
      user = new PropertyManager({
        uuid: uuid(),
        ...dataToSave,
      }) as IPropertyManagerDocument;
      // EMAIL ACTIVATION LINK
      emailOptions = {
        ...emailOptions,
        to: user?.email,
        data: {
          fullname: user?.fullname,
          activationUrl: `${process.env.FRONTEND_URL}/account_activation/${user.activationToken}`,
        },
      };
    }

    await user.save();
    return {
      success: true,
      data: { emailOptions },
      msg: `Account activation email has been sent to ${emailOptions.to}`,
    };
  };
}

export default AuthService;
