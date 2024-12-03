import { StatusCodes } from 'http-status-codes'
import User from '../models/UserModel.js'

export const requireActiveSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('subscriptionStatus subscriptionExpiryDate')
      .populate('subscriptionPlanId')

    if (!user.subscriptionPlanId || 
        user.subscriptionStatus !== 'active' || 
        user.subscriptionExpiryDate < new Date()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'This feature requires an active subscription',
      })
    }

    next()
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error checking subscription status',
      error: error.message,
    })
  }
} 