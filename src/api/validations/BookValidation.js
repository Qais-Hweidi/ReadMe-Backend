import Joi from 'joi'

export const createBookValidation = Joi.object({
  title: Joi.string().required(),
  author: Joi.string().required(),
  price: Joi.number().min(0).when('free', {
    is: true,
    then: Joi.forbidden(),
    otherwise: Joi.required(),
  }),
  free: Joi.boolean(),
  bookLink: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
})

export const updateBookValidation = Joi.object({
  title: Joi.string(),
  author: Joi.string(),
  price: Joi.number().min(0),
  free: Joi.boolean(),
  bookLink: Joi.string(),
  description: Joi.string(),
  category: Joi.string(),
}).min(1) // At least one field should be provided for update
