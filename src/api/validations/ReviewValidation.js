import Joi from 'joi'

export const createReviewValidation = Joi.object({
  rating: Joi.number().required().min(1).max(5),
  review: Joi.string().allow('', null),
})

export const updateReviewValidation = Joi.object({
  rating: Joi.number().min(1).max(5),
  review: Joi.string().allow('', null),
}).min(1)
