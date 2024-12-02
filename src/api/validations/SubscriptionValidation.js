import Joi from 'joi'
import { objectId } from './customValidation.js'

export const subscribeValidation = Joi.object({
  planId: Joi.string().required().custom(objectId).messages({
    'string.empty': 'Subscription plan ID is required',
    'any.required': 'Subscription plan ID is required',
    'string.pattern.name': 'Invalid subscription plan ID format',
  }),
}) 