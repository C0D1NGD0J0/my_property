import dayjs from 'dayjs';
import { Types } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { faker } from '@faker-js/faker';
import {
  IAccountType,
  ISignupData,
  IUserDocument,
} from '@interfaces/user.interface';
import { User, Client } from '@models/index';
import { hashGenerator } from '@utils/helperFN';

class UserFactory {
  create = async (data: Partial<ISignupData>) => {
    const _userId = new Types.ObjectId();

    const client = await Client.create({
      cid: uuid(),
      admin: _userId,
      accountType: data?.accountType || 'individual',
      ...(data?.accountType === IAccountType.enterprise
        ? { enterpriseProfile: data.enterpriseProfile }
        : {}),
    });

    // create user record
    return (await User.create({
      ...(await this.default()),
      ...data,
      uid: uuid(),
      _id: _userId,
      isActive: true,
      activationToken: hashGenerator(),
      cids: [{ cid: client?.cid, role: 'admin' }],
      activationTokenExpiresAt: dayjs().add(2, 'hour').toDate(),
    })) as IUserDocument;
  };

  build = async (data: Partial<ISignupData>) => {
    const _userId = new Types.ObjectId();
    const client = await Client.create({
      cid: uuid(),
      admin: _userId,
      accountType: data?.accountType || 'individual',
      ...(data?.accountType === IAccountType.enterprise
        ? { enterpriseProfile: data.enterpriseProfile }
        : {}),
    });

    // create user record
    return new User({
      ...(await this.default()),
      ...data,
      uid: uuid(),
      _id: _userId,
      isActive: false,
      activationToken: hashGenerator(),
      cids: [{ cid: client?.cid, role: 'admin' }],
      activationTokenExpiresAt: dayjs().add(2, 'hour').toDate(),
    }) as IUserDocument;
  };

  getPlainUserObject = async () => {
    return {
      individual: await this.default(),
      enterpriseInfo: await this.defaultCompany(),
    };
  };

  private default = async () => {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();

    return {
      lastName,
      firstName,
      deletedAt: '',
      password: 'password',
      enterpriseInfo: {},
      accountType: 'individual',
      phoneNumber: faker.phone.number(),
      location: faker.address.cityName(),
      email: `${firstName + '_' + lastName}@yopmail.com`,
    };
  };

  private defaultCompany = async () => {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const entityName = faker.company.name();
    const accountName = faker.finance.accountName();

    return {
      companyName: accountName,
      legaEntityName: entityName,
      contactInfo: {
        email: `${firstName}@example.com`,
        address: faker.address.streetAddress(),
        phoneNumber: faker.phone.number(),
        contactPerson: `${firstName} ${lastName}`,
      },
      accountType: IAccountType.enterprise,
      businessRegistrationNumber: faker.finance.account(),
    };
  };
}

export default new UserFactory();
