import { body, param } from 'express-validator';
// import { isValidObjectId } from 'mongoose';

// import { User, Property } from '@models/index';
// import { httpStatusCodes } from '@utils/helperFN';
// import ErrorResponse from '@utils/errorResponse';
import { Property } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import { validateResourceID } from '@utils/helperFN';
import {
  IPropertyTypeEnum,
  IPropertyCategoryEnum,
  IPropertyStatusEnum,
} from '@interfaces/property.interface';

const validateParams = () => {
  return [
    param('puid', 'Property resource identifier missing.')
      .exists()
      .bail()
      .custom(async (puid) => {
        const { isValid, type } = validateResourceID(puid);
        if (!isValid) {
          throw new ErrorResponse(
            `Invalid resource identifier provided <${puid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }

        const property = await Property.findOne({ puid });
        if (!property) {
          throw new ErrorResponse(
            `No Property resource available with the identifier provided <${puid}>.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};

const create = () => {
  return [
    body('features.bedroom')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 6 }),
    body('features.bathroom')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 6 }),
    body('features.floors')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 6 }),
    body('features.parking')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 6 }),
    body('features.maxCapacity')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 10 })
      .withMessage('Max capacity for a single family house is 10'),
    body('features.availableParking')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
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
      .isIn(Object.values(IPropertyTypeEnum)),
    body('category', 'Please select a valid property category')
      .exists()
      .isIn(Object.values(IPropertyCategoryEnum)),
    body('description', 'Please provide a description of the property type')
      .if(body('propertyType').equals(IPropertyTypeEnum.others))
      .exists()
      .isLength({ min: 5, max: 200 })
      .trim()
      .escape(),
    body('managementFees.amount', 'Invalid amount provided.')
      .exists()
      .isCurrency({ allow_negatives: false, allow_decimal: false })
      .escape(),
    body(
      'managementFees.currency',
      'Please provide a currency for collecting payments.'
    )
      .if(body('managementFees.amount').exists())
      .exists()
      .isIn(['USD', 'CAD', 'EUR', 'GBP'])
      .withMessage('Invalid currency provided.'),
    body('totalUnits', 'Value for total units in the building is missing')
      .if(body('propertyType').not().equals(IPropertyTypeEnum.singleFamily))
      .exists()
      .isInt({ min: 1, max: 150 })
      .withMessage('Max amount of units for an apartment is 150.'),
    body('status', 'Please provide the current status of the property.')
      .exists()
      .isIn(Object.values(IPropertyStatusEnum)),
  ];
};

const createApartment = () => {
  return [
    ...validateParams(),
    body('features.bedroom')
      .exists()
      .if(body('propertyType').isIn(['others', 'officeUnits', 'apartments']))
      .withMessage(
        'Unable to add apartment units to the this type of property.'
      )
      .isInt({ min: 0, max: 5 })
      .withMessage('Max bedroom for an apartment is 6.'),
    body('features.bathroom')
      .isInt({ min: 0, max: 5 })
      .withMessage('Max bathroom for an apartment is 6.'),
    body('unitNumber')
      .exists()
      .withMessage('Provide a unit number for this apartment.'),
    body('features.maxCapacity')
      .exists()
      .withMessage('Max capacity for an apartment is 7.')
      .isInt({ min: 1, max: 8 }),
    body('features.hasParking').exists().isBoolean().toBoolean(),

    body('rentalPrice.amount', 'Invalid amount provided.')
      .exists()
      .isCurrency({ allow_negatives: false, allow_decimal: false })
      .escape(),
    body(
      'rentalPrice.currency',
      'Please provide a currency for collecting payments.'
    )
      .if(body('rentalPrice.amount').exists())
      .exists()
      .isIn(['USD', 'CAD', 'EUR', 'GBP'])
      .withMessage('Invalid currency provided.'),
  ];
};

const updateDetails = () => {
  return [...validateParams(), ...create()];
};

export default {
  createProperty: create(),
  updateDetails: updateDetails(),
  validateParams: validateParams(),
  createApartment: createApartment(),
};
