import { body, param } from 'express-validator';
import { Report, Property, Lease } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import { UtilsValidations } from '.';

// Validate the fields in the maintenance report schema
const createReport = () => {
  return [
    ...UtilsValidations.validatePropertyParams,
    body('lease')
      .exists()
      .withMessage('Lease ID is required.')
      .bail()
      .custom(async (id) => {
        const lease = await Lease.findById(id);
        if (!lease) {
          throw new ErrorResponse(
            `No Lease available with the identifier provided.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
    body('category')
      .exists()
      .notEmpty()
      .withMessage('Category is required')
      .isIn([
        'Plumbing',
        'Electrical',
        'HVAC',
        'Appliances',
        'Structural',
        'Pest Control',
        'Landscaping',
        'Security',
        'General Maintenance',
      ])
      .withMessage('Invalid category provided'),
    body('cid').notEmpty().withMessage('CID is required'),
    body('priority')
      .exists()
      .withMessage('Priority is required')
      .isIn(['Urgent', 'Normal', 'Low'])
      .withMessage('Invalid priority value provided.'),
    body('description')
      .exists()
      .withMessage('Description is required')
      .isLength({ max: 1500 })
      .withMessage('Description cannot exceed 700 characters'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['Open', 'In-Progress', 'Resolved', 'Closed'])
      .withMessage('Invalid status value provided.'),
    body('assignedTo')
      .optional()
      .notEmpty()
      .withMessage('AssignedTo is required'),
  ];
};

const updateStatus = () => {
  return [
    ...UtilsValidations.reportParams,
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['Open', 'In-Progress', 'Resolved', 'Closed'])
      .withMessage('Invalid status value provided.'),
  ];
};

export default {
  updateStatus: updateStatus(),
  createReport: createReport(),
};
