import Joi from 'joi'

export const createSubscriptionPlanValidation = Joi.object({
  planName: Joi.string().required().min(3).max(50).messages({
    'string.empty': 'Plan name is required',
    'string.min': 'Plan name must be at least 3 characters long',
    'string.max': 'Plan name cannot exceed 50 characters',
    'any.required': 'Plan name is required',
  }),
  price: Joi.number().required().min(0).precision(1).messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'number.precision': 'Price can only have up to 2 decimal places',
    'any.required': 'Price is required',
  }),
  durationInDays: Joi.number().required().integer().min(1).max(365).messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be a whole number',
    'number.min': 'Duration must be at least 1 day',
    'number.max': 'Duration cannot exceed 365 days',
    'any.required': 'Duration is required',
  }),
  isVisible: Joi.boolean().default(true).messages({
    'boolean.base': 'Visibility must be true or false',
  }),
})

export const updateSubscriptionPlanValidation = Joi.object({
  planName: Joi.string().min(3).max(50).messages({
    'string.min': 'Plan name must be at least 3 characters long',
    'string.max': 'Plan name cannot exceed 50 characters',
  }),
  price: Joi.number().min(0).precision(1).messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'number.precision': 'Price can only have up to 2 decimal places',
  }),
  durationInDays: Joi.number().integer().min(1).max(365).messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be a whole number',
    'number.min': 'Duration must be at least 1 day',
    'number.max': 'Duration cannot exceed 365 days',
  }),
  isVisible: Joi.boolean().messages({
    'boolean.base': 'Visibility must be true or false',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  })
