import Joi from 'joi'

export const sendMessageValidation = Joi.object({
  message: Joi.string().required().min(1).max(1000),
  userEmail: Joi.string().email().optional(), // Optional: only needed when admin sends message
})

export const userEmailParamValidation = Joi.object({
  userEmail: Joi.string().email().required(),
}) 