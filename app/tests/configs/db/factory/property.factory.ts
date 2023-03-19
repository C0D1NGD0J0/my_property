import { faker } from '@faker-js/faker';
import { HydratedDocument } from 'mongoose';

import { Property } from '@models/index';
import {
  IProperty,
  PropertyCategoryEnum,
  PropertyTypeEnum,
} from '@interfaces/property.interface';

class PropertyFactory {
  constructor() {
    this.create = this.create.bind(this);
  }

  create = async (data?: Partial<IProperty>) => {
    const _temp = await this.default();

    return (await Property.create({
      ..._temp,
      ...data,
    })) as HydratedDocument<IProperty>;
  };

  build = async (data?: Partial<IProperty>) => {
    const _temp = await this.default();

    return new Property({ ..._temp, ...data }) as HydratedDocument<IProperty>;
  };

  getPlainPropertyObject = async () => {
    return await this.default();
  };

  private default = async () => {
    return {
      features: {
        floors: 1,
        bedroom: 3,
        bathroom: 2,
        maxCapacity: 5,
        availableParking: 2,
      },
      extras: {
        has_tv: false,
        has_ac: false,
        has_gym: false,
        has_parking: true,
        has_laundry: false,
        petsAllowed: false,
        has_kitchen: false,
        has_heating: false,
        has_internet: false,
        has_swimmingpool: false,
      },
      description: faker.lorem.lines(1),
      address: faker.address.streetAddress(true),
      propertyType: PropertyTypeEnum.singleFamily,
      category: PropertyCategoryEnum.commercial,
      baseRentalPrice: {
        amount: '2000',
        currency: 'USD',
      },
      photos: [],
    };
  };
}

export default new PropertyFactory();
