import { ICurrentUser, IUserDocument } from '@interfaces/user.interface';

export type ICurrentUserDataType = IUserDocument & { hasAccess?: boolean };

export const mapCurrentUserObject = (
  userObject: ICurrentUserDataType,
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
    id: userObject._id.toString(),
    uid: userObject.uid,
    email: userObject.email,
    cid: data!.cid as string,
    role: data!.role,
    isActive: userObject.isActive, // this relates to user account activation
    fullname: userObject.fullname || null,
    ...(data?.role !== 'tenant'
      ? { isSubscriptionActive: userObject.hasAccess }
      : null), // hasAccess checks to see if subscription status is active
  };

  return currentuser;
};
