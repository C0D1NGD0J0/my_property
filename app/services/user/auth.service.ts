import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';

import { User } from '@models/index';
import { hashGenerator } from '@utils/helperFN';
import { USER_REGISTRATION } from '@utils/constants';
import { IUser, IUserDocument, IUserType } from '@interfaces/user.interface';
import { IEmailOptions, ISuccessReturnData } from '@interfaces/utils.interface';

class AuthService {
  signup = async (
    data: Partial<IUser>
  ): Promise<ISuccessReturnData<{ emailOptions: IEmailOptions }>> => {
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
    return {
      success: true,
      data: { emailOptions },
      msg: `Account activation email has been sent to ${user.email}`,
    };
  };
}

export default AuthService;
