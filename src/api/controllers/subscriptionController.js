import User from '../models/UserModel.js'
import SubscriptionPlan from '../models/SubscriptionPlanModel.js'
import Transaction from '../models/TransactionModel.js'
import LahzaService from '../services/LahzaService.js'
import { config } from '../../config/config.js'
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

    const now = new Date()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + plan.durationInDays)

    // Create a pending transaction
    const transaction = await Transaction.create({
      user: userId,
      type: 'SUBSCRIPTION',
      referenceId: planId,
      referenceModel: 'SubscriptionPlan',
      amount: plan.price,
      currency: 'USD',
      paymentMethod: 'CREDIT_CARD',
      status: 'PENDING',
      subscriptionPeriod: {
        startDate: now,
        endDate: expiryDate,
        durationInDays: plan.durationInDays
      },
      paymentGateway: {
        transactionId: `sub_${Date.now()}`, // Will be used as Lahza reference
        receiptUrl: null,
        gatewayResponse: null,
      },
    })

    // Initialize Lahza payment
    const paymentInit = await LahzaService.initializeTransaction({
      amount: plan.price,
      email: req.user.email,
      reference: transaction.paymentGateway.transactionId,
      callback_url: `${config.baseUrl}/api/v1/transactions/callback?redirect=true`,
      metadata: {
        transactionId: transaction._id.toString(),
        type: 'SUBSCRIPTION',
        planId: planId,
        durationInDays: plan.durationInDays
      }
    })

    res.status(StatusCodes.OK).json({
      message: 'Payment initiated',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
      },
      payment: {
        authorization_url: paymentInit.authorization_url
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error processing subscription',
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
