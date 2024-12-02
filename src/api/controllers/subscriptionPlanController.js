import SubscriptionPlan from '../models/SubscriptionPlanModel.js'
import { StatusCodes } from 'http-status-codes'

// Create a new subscription plan
export const createSubscriptionPlan = async (req, res) => {
  try {
    const { planName, price, durationInDays, isVisible } = req.body
    const plan = await SubscriptionPlan.create({
      planName,
      price,
      durationInDays,
      isVisible,
    })
    res.status(StatusCodes.CREATED).json({ plan })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Plan name already exists' })
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error creating subscription plan', error: error.message })
  }
}

// Get all visible subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isVisible: true })
    res.status(StatusCodes.OK).json({ plans })
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error fetching subscription plans', error: error.message })
  }
}

// Get all subscription plans (including invisible ones) - Admin only
export const getAllSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({})
    res.status(StatusCodes.OK).json({ plans })
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error fetching subscription plans', error: error.message })
  }
}

// Update a subscription plan
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!plan) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Subscription plan not found' })
    }
    res.status(StatusCodes.OK).json({ plan })
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error updating subscription plan', error: error.message })
  }
}

// Delete a subscription plan
export const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params
    const plan = await SubscriptionPlan.findByIdAndDelete(id)
    if (!plan) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Subscription plan not found' })
    }
    res.status(StatusCodes.OK).json({ message: 'Subscription plan deleted' })
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Error deleting subscription plan', error: error.message })
  }
}
