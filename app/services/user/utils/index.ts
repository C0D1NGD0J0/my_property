import { IUserType } from '@interfaces/user.interface';

export interface ICurrentUser {
  id: string;
  uuid: string;
  email: string;
  fullname?: string;
  isActive: boolean;
  accountype: string;
  companyName?: string;
}

export const mapCurrentUserObject = (userObject: IUserType) => {
  let currentuser: ICurrentUser = {
    id: userObject.id,
    uuid: userObject.uuid,
    email: userObject.email,
    isActive: userObject.isActive,
    accountype: userObject.accountType,
  };

  if (userObject.accountType == 'individual') {
    currentuser = {
      ...currentuser,
      fullname: userObject?.fullname,
    };
  } else {
    currentuser = {
      ...currentuser,
      companyName: userObject.companyName,
    };
  }

  return currentuser;
};
