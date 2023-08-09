import { body } from 'express-validator';
import { Lease, Subscription } from '@models/index';
import ErrorResponse from '@utils/errorResponse';
import { errorTypes, httpStatusCodes } from '@utils/constants';
import { UtilsValidations } from '.';
import { SubscriptionService } from '@services/subscription';

// Validate the fields in the subscribe route
const subscribeToPlan = () => {
  return [
    ...UtilsValidations.validatePropertyParams,
    body('priceId')
      .exists()
      .withMessage('Price ID is required.')
      .bail()
      .custom(async (id) => {
        const resp = await new SubscriptionService().validatePriceId(id);
        if (!resp.success) {
          throw new ErrorResponse(
            `Invalid pricing info provided..`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
    body('customerId')
      .optional()
      .notEmpty()
      .bail()
      .custom(async (customerId) => {
        const customer = await Subscription.findOne({
          stripeCustomerId: customerId,
        });
        if (!customer) {
          throw new ErrorResponse(
            `Invalid stripe customer identifier provided.`,
            errorTypes.NO_RESOURCE_ERROR,
            httpStatusCodes.NOT_FOUND
          );
        }
      }),
  ];
};

export default {
  subscribe: subscribeToPlan(),
};
