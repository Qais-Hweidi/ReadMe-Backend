import Joi from 'joi'
import { objectId } from './customValidation.js'

export const createReviewValidation = {
  body: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    review: Joi.string().allow('', null),
  }),
  params: Joi.object({
    bookId: Joi.string().required().custom(objectId),
  }),
}

export const updateReviewValidation = {
  body: Joi.object({
    rating: Joi.number().min(1).max(5),
    review: Joi.string().allow('', null),
  }).min(1),
  params: Joi.object({
    bookId: Joi.string().required().custom(objectId),
    reviewId: Joi.string().required().custom(objectId),
  }),
}
