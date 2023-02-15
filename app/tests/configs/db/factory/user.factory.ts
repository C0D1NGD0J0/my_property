import { faker } from '@faker-js/faker';
import { ISignupAccountType } from '@interfaces/user.interface';
import { Company, PropertyManager } from '@models/index';
import { ISignupData } from '@services/user/auth.service';

class UserFactory {
  create = async (data: ISignupData) => {
    if (data.accountType == 'business') {
      return await Company.create({
        ...(await this.defaultCompany()),
        ...data,
      });
    } else {
      return await PropertyManager.create({
        ...(await this.default()),
        ...data,
      });
    }
  };

  build = async (data: ISignupData) => {
    if (data.accountType == 'business') {
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
      accountType: ISignupAccountType.individual,
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
      accountType: ISignupAccountType.business,
      businessRegistrationNumber: faker.finance.account(),
    };
  };
}

export default new UserFactory();
