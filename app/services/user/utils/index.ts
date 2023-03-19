import { ICurrentUser, IUserType } from '@interfaces/user.interface';

export const mapCurrentUserObject = (userObject: IUserType) => {
  let currentuser: ICurrentUser = {
    id: userObject.id,
    _id: userObject._id,
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
