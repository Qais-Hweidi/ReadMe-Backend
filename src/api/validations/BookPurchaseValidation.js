import Joi from 'joi'
import { objectId } from './customValidation.js'

export const purchaseBookValidation = Joi.object({})

export const bookIdParamValidation = Joi.object({
  bookId: Joi.string().required().custom(objectId).messages({
    'string.empty': 'Book ID is required',
    'any.required': 'Book ID is required',
    'string.pattern.name': 'Invalid book ID format',
  }),
})
