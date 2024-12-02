import User from '../models/UserModel.js'
import SubscriptionPlan from '../models/SubscriptionPlanModel.js'
import { StatusCodes } from 'http-status-codes'

// Subscribe user to a plan
export const subscribeToPlan = async (req, res) => {
  try {
    const { planId } = req.body
    const userId = req.user._id // from auth middleware

    // Find the subscription plan
    const plan = await SubscriptionPlan.findById(planId)
    if (!plan || !plan.isVisible) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Subscription plan not found',
      })
    }

    // Calculate expiry date
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + plan.durationInDays)

    // Update user's subscription
    const user = await User.findByIdAndUpdate(
      userId,
      {
        subscriptionStatus: 'active',
        subscriptionPlanId: planId,
        subscriptionExpiryDate: expiryDate,
      },
      { new: true }
    ).select('-password')

    res.status(StatusCodes.OK).json({
      message: 'Successfully subscribed to plan',
      subscription: {
        status: user.subscriptionStatus,
        plan: plan.planName,
        expiryDate: user.subscriptionExpiryDate,
      },
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error subscribing to plan',
      error: error.message,
    })
  }
}

// Get current user's subscription details
export const getSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.user._id // from auth middleware

    const user = await User.findById(userId)
      .select('subscriptionStatus subscriptionExpiryDate')
      .populate('subscriptionPlanId', 'planName price durationInDays')

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'User not found',
      })
    }

    res.status(StatusCodes.OK).json({
      subscription: {
        status: user.subscriptionStatus,
        plan: user.subscriptionPlanId,
        expiryDate: user.subscriptionExpiryDate,
      },
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error fetching subscription details',
      error: error.message,
    })
  }
}

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id // from auth middleware

    const user = await User.findByIdAndUpdate(
      userId,
      {
        subscriptionStatus: 'inactive',
        subscriptionExpiryDate: new Date(), // Expires immediately
      },
      { new: true }
    ).select('-password')

    res.status(StatusCodes.OK).json({
      message: 'Subscription cancelled successfully',
      subscription: {
        status: user.subscriptionStatus,
        expiryDate: user.subscriptionExpiryDate,
      },
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error cancelling subscription',
      error: error.message,
    })
  }
} 