import User from '../models/UserModel.js'
import SubscriptionPlan from '../models/SubscriptionPlanModel.js'
import { StatusCodes } from 'http-status-codes'

// Subscribe user to a plan
export const subscribeToPlan = async (req, res) => {
  try {
    const { planId } = req.body
    const userId = req.user._id

    // Find the subscription plan
    const plan = await SubscriptionPlan.findById(planId)
    if (!plan || !plan.isVisible) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Subscription plan not found',
      })
    }

    // Check if user has an active subscription
    const user = await User.findById(userId)
    const now = new Date()
    let expiryDate = new Date()

    if (user.subscriptionStatus === 'active' && user.subscriptionExpiryDate > now) {
      // If renewing the same plan, extend the current expiry date
      if (user.subscriptionPlanId?.toString() === planId) {
        expiryDate = new Date(user.subscriptionExpiryDate)
      }
    }

    // Calculate new expiry date
    expiryDate.setDate(expiryDate.getDate() + plan.durationInDays)

    // Update user's subscription
    const updatedUser = await User.findByIdAndUpdate(
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
        status: updatedUser.subscriptionStatus,
        plan: plan.planName,
        expiryDate: updatedUser.subscriptionExpiryDate,
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
    const userId = req.user._id

    const user = await User.findById(userId)
      .select('subscriptionStatus subscriptionExpiryDate')
      .populate('subscriptionPlanId', 'planName price durationInDays')

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'User not found',
      })
    }

    // Check if subscription has expired
    if (user.subscriptionStatus === 'active' && user.subscriptionExpiryDate < new Date()) {
      user.subscriptionStatus = 'expired'
      await user.save()
    }

    res.status(StatusCodes.OK).json({
      subscription: {
        status: user.subscriptionStatus,
        plan: user.subscriptionPlanId,
        expiryDate: user.subscriptionExpiryDate,
        isExpired: user.subscriptionExpiryDate < new Date(),
        daysLeft: user.subscriptionExpiryDate > new Date() 
          ? Math.ceil((user.subscriptionExpiryDate - new Date()) / (1000 * 60 * 60 * 24))
          : 0
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
    const userId = req.user._id

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
