import { body, param } from 'express-validator';
import { Property } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import { validateResourceID } from '@utils/helperFN';
import {
  IProperty,
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
    // Validate features based on the property type
    body('features.bedroom')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 10 }) // Adjust max as per IProperty constraints
      .withMessage(
        'Bedrooms for a single-family property must be between 0 and 10'
      ),

    body('features.bathroom')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 10 }) // Adjust max as per IProperty constraints
      .withMessage(
        'Bathrooms for a single-family property must be between 0 and 10'
      ),

    body('features.floors')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 5 }) // Adjust max as per IProperty constraints
      .withMessage(
        'Floors for a single-family property must be between 0 and 5'
      ),

    body('features.parking')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 5 }) // Adjust max as per IProperty constraints
      .withMessage(
        'Parking spaces for a single-family property must be between 0 and 5'
      ),

    body('features.maxCapacity')
      .if(body('propertyType').equals(IPropertyTypeEnum.singleFamily))
      .optional()
      .isInt({ min: 0, max: 20 }) // Adjust max as per IProperty constraints
      .withMessage('Max capacity for a single-family house is 20'),

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

    // Validate address
    body('address')
      .exists({ checkFalsy: true })
      .withMessage('Valid property address is required')
      .trim()
      .escape(),

    // Validate propertyType
    body('propertyType', 'Please select a valid property type')
      .exists()
      .isIn(Object.values(IPropertyTypeEnum)),

    // Validate category
    body('category', 'Please select a valid property category')
      .exists()
      .isIn(Object.values(IPropertyCategoryEnum)),

    // Validate description
    body(
      'description.text',
      'Please provide a text description for the property'
    )
      .if(body('propertyType').equals(IPropertyTypeEnum.others))
      .exists()
      .isLength({ min: 5, max: 500 })
      .trim()
      .escape(),
    body(
      'leaseType',
      'Please provide a value for rental type for this property.'
    )
      .exists()
      .isIn(['short-term', 'long-term', 'daily']),
    // Validate fees and currency
    body('fees.currency', 'Please provide a currency for fees')
      .exists()
      .isIn(['USD', 'CAD', 'EUR', 'GBP']),
    body('fees.rentalAmount', 'Invalid rental amount provided.')
      .optional()
      .isNumeric(),
    body('fees.managementFees', 'Invalid management fee provided.')
      .optional()
      .isNumeric(),
    body('fees.includeTax')
      .optional()
      .isBoolean()
      .withMessage('includeTax must be a boolean')
      .custom((value) => {
        // Convert the string 'true' or 'false' to a boolean
        const boolValue = value === 'true';
        // Check if the boolean value is true
        return boolValue === true;
      })
      .withMessage('includeTax must be true'),

    // Validate totalUnits
    body('totalUnits', 'Value for total units in the building is missing')
      .if(body('propertyType').not().equals(IPropertyTypeEnum.singleFamily))
      .exists()
      .isInt({ min: 1 }),

    // Validate status
    body('status', 'Please provide the current status of the property.')
      .exists()
      .isIn(Object.values(IPropertyStatusEnum)),

    // Validate property size
    body('propertySize', 'Property size is required').exists().isNumeric(),
  ];
};

const createProperties = () => {
  return [
    // Validate features based on the property type
    body('properties.*.features.bedroom')
      .if(
        body('properties.*.propertyType').equals(IPropertyTypeEnum.singleFamily)
      )
      .optional()
      .isInt({ min: 0, max: 10 }) // Adjust max as per IProperty constraints
      .withMessage(
        'Bedrooms for a single-family property must be between 0 and 10'
      ),

    body('properties.*.features.bathroom')
      .if(
        body('properties.*.propertyType').equals(IPropertyTypeEnum.singleFamily)
      )
      .optional()
      .isInt({ min: 0, max: 10 }) // Adjust max as per IProperty constraints
      .withMessage(
        'Bathrooms for a single-family property must be between 0 and 10'
      ),

    body('properties.*.features.floors')
      .if(
        body('properties.*.propertyType').equals(IPropertyTypeEnum.singleFamily)
      )
      .optional()
      .isInt({ min: 0, max: 5 }) // Adjust max as per IProperty constraints
      .withMessage(
        'Floors for a single-family property must be between 0 and 5'
      ),

    body('properties.*.features.parking')
      .if(
        body('properties.*.propertyType').equals(IPropertyTypeEnum.singleFamily)
      )
      .optional()
      .isInt({ min: 0, max: 5 }) // Adjust max as per IProperty constraints
      .withMessage(
        'Parking spaces for a single-family property must be between 0 and 5'
      ),

    body('properties.*.features.maxCapacity')
      .if(
        body('properties.*.propertyType').equals(IPropertyTypeEnum.singleFamily)
      )
      .optional()
      .isInt({ min: 0, max: 20 }) // Adjust max as per IProperty constraints
      .withMessage('Max capacity for a single-family house is 20'),

    body('properties.*.extras.has_tv').optional().isBoolean().toBoolean(),
    body('properties.*.extras.has_ac').optional().isBoolean().toBoolean(),
    body('properties.*.extras.has_gym').optional().isBoolean().toBoolean(),
    body('properties.*.extras.has_heating').optional().isBoolean().toBoolean(),
    body('properties.*.extras.has_laundry').optional().isBoolean().toBoolean(),
    body('properties.*.extras.has_kitchen').optional().isBoolean().toBoolean(),
    body('properties.*.extras.has_parking').optional().isBoolean().toBoolean(),
    body('properties.*.extras.petsAllowed').optional().isBoolean().toBoolean(),
    body('properties.*.extras.has_internet').optional().isBoolean().toBoolean(),
    body('properties.*.extras.has_swimmingpool')
      .optional()
      .isBoolean()
      .toBoolean(),

    // Validate address
    body('properties.*.address')
      .exists({ checkFalsy: true })
      .withMessage('Valid property address is required')
      .trim()
      .escape(),

    // Validate propertyType
    body('properties.*.propertyType', 'Please select a valid property type')
      .exists()
      .isIn(Object.values(IPropertyTypeEnum)),

    // Validate category
    body('properties.*.category', 'Please select a valid property category')
      .exists()
      .isIn(Object.values(IPropertyCategoryEnum)),

    // Validate description
    body(
      'description.text',
      'Please provide a text description for the property'
    )
      .if(body('properties.*.propertyType').equals(IPropertyTypeEnum.others))
      .exists()
      .isLength({ min: 5, max: 500 })
      .trim()
      .escape(),
    body(
      'leaseType',
      'Please provide a value for rental type for this property.'
    )
      .exists()
      .isIn(['short-term', 'long-term', 'daily']),
    // Validate fees and currency
    body('properties.*.fees.currency', 'Please provide a currency for fees')
      .exists()
      .isIn(['USD', 'CAD', 'EUR', 'GBP']),
    body('properties.*.fees.rentalAmount', 'Invalid rental amount provided.')
      .optional()
      .isNumeric(),
    body('properties.*.fees.managementFees', 'Invalid management fee provided.')
      .optional()
      .isNumeric(),
    body('properties.*.fees.includeTax')
      .optional()
      .isBoolean()
      .withMessage('includeTax must be a boolean')
      .custom((value) => {
        // Convert the string 'true' or 'false' to a boolean
        const boolValue = value === 'true';
        // Check if the boolean value is true
        return boolValue === true;
      })
      .withMessage('includeTax must be true'),

    // Validate totalUnits
    body(
      'properties.*.totalUnits',
      'Value for total units in the building is missing'
    )
      .if(
        body('properties.*.propertyType')
          .not()
          .equals(IPropertyTypeEnum.singleFamily)
      )
      .exists()
      .isInt({ min: 1 }),

    // Validate status
    body(
      'properties.*.status',
      'Please provide the current status of the property.'
    )
      .exists()
      .isIn(Object.values(IPropertyStatusEnum)),

    // Validate property size
    body('properties.*.propertySize', 'Property size is required')
      .exists()
      .isNumeric(),
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
  createProperties: createProperties(),
};
