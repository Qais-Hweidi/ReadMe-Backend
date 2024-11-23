import Joi from 'joi'

export const createReportValidation = Joi.object({
  description: Joi.string().min(10).max(500).required().messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description cannot exceed 500 characters',
    'any.required': 'Description is required',
  }),
})

export const updateReportStatusValidation = Joi.object({
  status: Joi.string().valid('pending', 'reviewed', 'resolved').required().messages({
    'any.only': 'Status must be one of: pending, reviewed, resolved',
    'any.required': 'Status is required',
  }),
})
