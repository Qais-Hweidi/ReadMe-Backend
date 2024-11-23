import Joi from 'joi'

export const createAuthorValidation = Joi.object({
  fullName: Joi.string().required().messages({
    'string.empty': 'Full name is required',
    'any.required': 'Full name is required',
  }),
  bio: Joi.string().min(10).max(1000).required().messages({
    'string.min': 'Bio must be at least 10 characters long',
    'string.max': 'Bio cannot exceed 1000 characters',
    'any.required': 'Bio is required',
  }),
  facebook: Joi.string().uri().allow('').messages({
    'string.uri': 'Please provide a valid Facebook URL',
  }),
  instagram: Joi.string().uri().allow('').messages({
    'string.uri': 'Please provide a valid Instagram URL',
  }),
  linkedin: Joi.string().uri().allow('').messages({
    'string.uri': 'Please provide a valid LinkedIn URL',
  }),
  website: Joi.string().uri().allow('').messages({
    'string.uri': 'Please provide a valid website URL',
  }),
})

export const updateAuthorValidation = Joi.object({
  fullName: Joi.string(),
  bio: Joi.string().min(10).max(1000),
  facebook: Joi.string().uri().allow(''),
  instagram: Joi.string().uri().allow(''),
  linkedin: Joi.string().uri().allow(''),
  website: Joi.string().uri().allow(''),
}).min(1)
