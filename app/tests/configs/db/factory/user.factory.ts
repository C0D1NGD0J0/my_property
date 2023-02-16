import { faker } from '@faker-js/faker';
import { IAccountType, ISignupAccountType } from '@interfaces/user.interface';
import { Company, PropertyManager } from '@models/index';
import { ISignupData } from '@services/user/auth.service';
import { hashGenerator } from '@utils/helperFN';

class UserFactory {
  create = async (data: ISignupData, type?: string) => {
    if (type == 'business') {
      return await Company.create({
        ...(await this.defaultCompany()),
        ...data,
        uuid: '1234-acde',
        activationToken: hashGenerator(),
        activationTokenExpires: new Date(Date.now() + 3600000),
      });
    } else {
      return await PropertyManager.create({
        ...(await this.default()),
        ...data,
        uuid: '1234-acde',
        activationToken: hashGenerator(),
        activationTokenExpiresAt: new Date(Date.now() + 3600000),
      });
    }
  };

  build = async (data: ISignupData, type?: string) => {
    if (type == 'business') {
      return new Company({
        ...(await this.default()),
        ...data,
      });
    } else {
      return new PropertyManager({
        ...(await this.default()),
        ...data,
      });
    }
  };

  getPlainUserObject = async () => {
    return {
      individual: await this.default(),
      company: await this.defaultCompany(),
    };
  };

  private default = async () => {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();

    return {
      lastName,
      firstName,
      password: 'password',
      location: faker.address.cityName(),
      phoneNumber: faker.phone.number(),
      email: `${firstName}@yopmail.com`,
      accountType: IAccountType.individual,
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
      password: 'password',
      email: `${firstName.trim()}@example.com`,
      accountType: IAccountType.business,
      businessRegistrationNumber: faker.finance.account(),
    };
  };
}

export default new UserFactory();
