import Joi from 'joi'
import { objectId } from './customValidation.js'

export const createTransactionValidation = Joi.object({
  type: Joi.string().valid('SUBSCRIPTION', 'BOOK_PURCHASE').required().messages({
    'any.required': 'Transaction type is required',
    'any.only': 'Transaction type must be either SUBSCRIPTION or BOOK_PURCHASE',
  }),
  referenceId: Joi.string().required().custom(objectId).messages({
    'string.empty': 'Reference ID is required',
    'any.required': 'Reference ID is required',
    'string.pattern.name': 'Invalid reference ID format',
  }),
  referenceModel: Joi.string().valid('SubscriptionPlan', 'Book').required().messages({
    'any.required': 'Reference model is required',
    'any.only': 'Reference model must be either SubscriptionPlan or Book',
  }),
  amount: Joi.number().min(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount cannot be negative',
    'any.required': 'Amount is required',
  }),
  currency: Joi.string().default('USD').messages({
    'string.base': 'Currency must be a string',
  }),
  paymentMethod: Joi.string()
    .valid('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH')
    .required()
    .messages({
      'any.required': 'Payment method is required',
      'any.only': 'Invalid payment method',
    }),
})

export const updateTransactionValidation = Joi.object({
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED').required().messages({
    'any.required': 'Status is required',
    'any.only': 'Invalid status',
  }),
  paymentGateway: Joi.object({
    transactionId: Joi.string().required(),
    receiptUrl: Joi.string().uri(),
    gatewayResponse: Joi.object(),
  }),
})

export const getTransactionsQueryValidation = Joi.object({
  type: Joi.string().valid('SUBSCRIPTION', 'BOOK_PURCHASE'),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  limit: Joi.number().integer().min(1).max(100).default(10),
  page: Joi.number().integer().min(1).default(1),
}) 