import Joi from 'joi'
import { objectId } from './customValidation.js'

export const purchaseBookValidation = Joi.object({
  expectedPrice: Joi.number().min(0).precision(2).messages({
    'number.base': 'Expected price must be a number',
    'number.min': 'Expected price cannot be negative',
    'number.precision': 'Expected price can only have up to 2 decimal places',
  }),
})

export const bookIdParamValidation = Joi.object({
  bookId: Joi.string().required().custom(objectId).messages({
    'string.empty': 'Book ID is required',
    'any.required': 'Book ID is required',
    'string.pattern.name': 'Invalid book ID format',
  }),
})
