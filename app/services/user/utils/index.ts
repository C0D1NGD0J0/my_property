import { ICurrentUser, IUserDocument } from '@interfaces/user.interface';

export const mapCurrentUserObject = (
  userObject: IUserDocument,
  _cid?: string
) => {
  const getCidAndRole = (cid?: string) => {
    if (!cid) {
      return userObject.cids[0]!;
    }

    return userObject.cids.find((item) => item.cid === cid);
  };

  const data = getCidAndRole(_cid);
  const currentuser: ICurrentUser = {
    id: userObject.id,
    uid: userObject.uid,
    email: userObject.email,
    cid: data?.cid as string,
    role: data?.role as string,
    isActive: userObject.isActive,
    fullname: userObject.fullname || null,
  };

  return currentuser;
};
