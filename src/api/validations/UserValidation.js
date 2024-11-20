import Joi from 'joi'

export const updateProfileValidation = Joi.object({
  fullName: Joi.string(),
  phoneNumber: Joi.string(),
  gender: Joi.string().valid('male', 'female'),
}).min(1) // At least one field should be provided for update
