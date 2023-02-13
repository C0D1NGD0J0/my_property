import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';

import { User } from '@models/index';
import { hashGenerator } from '@utils/helperFN';
import { IUser, IUserDocument, IUserType } from '@interfaces/user.interface';
import { IEmailOptions } from '@interfaces/utils.interface';
import { USER_REGISTRATION } from '@utils/constants';

class AuthService {
  signup = async (data: Partial<IUser>) => {
    const user = new User({
      ...data,
      uuid: uuid(),
      isActive: false,
      activationToken: hashGenerator(),
      userType: IUserType.propertyManager,
      activationTokenExpiresAt: dayjs().add(1, 'hour').toDate(),
    }) as IUserDocument;

    // SEND EMAIL WITH ACTIVATION LINK
    const emailOptions: IEmailOptions = {
      subject: 'Activate your account',
      to: user.email,
      data: {
        fullname: user.fullname,
        activationUrl: `${process.env.FRONTEND_URL}/account_activation/${user.activationToken}`,
      },
      emailType: USER_REGISTRATION,
    };

    await user.save();
    return { success: true, user };
  };
}

export default AuthService;
