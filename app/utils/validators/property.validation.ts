import { body, param } from 'express-validator';
// import { isValidObjectId } from 'mongoose';

// import { User, Property } from '@models/index';
// import { httpStatusCodes } from '@utils/helperFN';
// import ErrorResponse from '@utils/errorResponse';
import {
  PropertyTypeEnum,
  PropertyCategoryEnum,
} from '@interfaces/property.interface';

const create = () => {
  return [
    body('features.bedroom').optional().isInt({ min: 0, max: 6 }),
    body('features.bathroom').optional().isInt({ min: 0, max: 6 }),
    body('features.floors').optional().isInt({ min: 0, max: 6 }),
    body('features.parking').optional().isInt({ min: 0, max: 6 }),
    body('features.maxCapacity').optional().isInt({ min: 0, max: 7 }),
    body('features.availableParking')
      .optional()
      .if(body('extras.has_parking').equals('true'))
      .isInt({ min: 0, max: 6 })
      .withMessage('Value missing for parking availability'),

    body('extras.has_tv').optional().isBoolean().toBoolean(),
    body('extras.has_ac').optional().isBoolean().toBoolean(),
    body('extras.has_gym').optional().isBoolean().toBoolean(),
    body('extras.has_heating').optional().isBoolean().toBoolean(),
    body('extras.has_laundry').optional().isBoolean().toBoolean(),
    body('extras.has_kitchen').optional().isBoolean().toBoolean(),
    body('extras.has_parking').optional().isBoolean().toBoolean(),
    body('extras.petsAllowed').optional().isBoolean().toBoolean(),
    body('extras.has_internet').optional().isBoolean().toBoolean(),
    body('extras.has_swimmingpool').optional().isBoolean().toBoolean(),

    body('address')
      .exists({ checkFalsy: true })
      .withMessage('Valid property address is required')
      .trim()
      .escape(),
    body('propertyType', 'Please select a valid property type')
      .exists()
      .isIn(Object.values(PropertyTypeEnum)),
    body('category', 'Please select a valid property category')
      .exists()
      .isIn(Object.values(PropertyCategoryEnum)),
    body('description', 'Please provide a description of the property type')
      .if(body('propertyType').equals(PropertyTypeEnum.others))
      .exists()
      .isLength({ min: 5, max: 45 })
      .trim()
      .escape(),
    body('baseRentalPrice.amount', 'Invalid amount provided.')
      .exists()
      .isCurrency({ allow_negatives: false, allow_decimal: false })
      .escape(),
    body(
      'baseRentalPrice.currency',
      'Please provide a currency for collecting payments.'
    )
      .if(body('rentalPrice.amount').exists())
      .exists()
      .isIn(['USD', 'CAD', 'EUR', 'GBP'])
      .withMessage('Invalid currency provided.'),
    body('totalUnits', 'Value for total units in the building is missing')
      .if(body('propertyType').equals(PropertyTypeEnum.apartments))
      .exists()
      .isInt({ min: 1, max: 25 })
      .withMessage('Max amount of units for an apartment is 25.'),
    body('floors')
      .if(body('propertyType').equals(PropertyTypeEnum.apartments))
      .exists()
      .isInt({ min: 1, max: 25 })
      .withMessage('Max amount of levels for an apartment building is 25.'),
    body('managementFees', 'Invalid amount entered')
      .if(body('propertyType').equals(PropertyTypeEnum.apartments))
      .exists()
      .isCurrency({ allow_negatives: false, allow_decimal: false })
      .escape(),
  ];
};

export default {
  createProperty: create(),
};
