import { StatusCodes } from 'http-status-codes'
import NotificationService from '../services/NotificationService.js'
import User from '../models/UserModel.js'

// Register FCM token for a user
export const registerFcmToken = async (req, res) => {
  try {
    const { fcmToken, device } = req.body
    const userId = req.user._id

    const user = await User.findById(userId)
    await user.addFcmToken(fcmToken, device)

    // Subscribe to appropriate topics based on subscription status
    await NotificationService.subscribeToTopic(fcmToken, 'all_users')
    if (user.subscriptionStatus === 'active' && user.subscriptionExpiryDate > new Date()) {
      await NotificationService.subscribeToTopic(fcmToken, 'subscribed_users')
      await NotificationService.unsubscribeFromTopic(fcmToken, 'free_users')
    } else {
      await NotificationService.subscribeToTopic(fcmToken, 'free_users')
      await NotificationService.unsubscribeFromTopic(fcmToken, 'subscribed_users')
    }

    res.status(StatusCodes.OK).json({
      message: 'FCM token registered successfully',
    })
  } catch (error) {
    console.error('Error registering FCM token:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error registering FCM token',
      error: error.message,
    })
  }
}

// Unregister FCM token
export const unregisterFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body
    const userId = req.user._id

    const user = await User.findById(userId)
    await user.removeFcmToken(fcmToken)

    // Unsubscribe from all topics
    await NotificationService.unsubscribeFromTopic(fcmToken, 'all_users')
    await NotificationService.unsubscribeFromTopic(fcmToken, 'free_users')
    await NotificationService.unsubscribeFromTopic(fcmToken, 'subscribed_users')

    res.status(StatusCodes.OK).json({
      message: 'FCM token unregistered successfully',
    })
  } catch (error) {
    console.error('Error unregistering FCM token:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error unregistering FCM token',
      error: error.message,
    })
  }
}

// Send notification to all users (Admin only)
export const sendNotificationToAll = async (req, res) => {
  try {
    const { title, body, data, imageUrl } = req.body

    await NotificationService.sendToAllUsers(title, body, data, imageUrl)

    res.status(StatusCodes.OK).json({
      message: 'Notification sent successfully to all users',
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error sending notification',
      error: error.message,
    })
  }
}

// Send notification to free users (Admin only)
export const sendNotificationToFreeUsers = async (req, res) => {
  try {
    const { title, body, data, imageUrl } = req.body

    await NotificationService.sendToFreeUsers(title, body, data, imageUrl)

    res.status(StatusCodes.OK).json({
      message: 'Notification sent successfully to free users',
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error sending notification',
      error: error.message,
    })
  }
}

// Send notification to subscribed users (Admin only)
export const sendNotificationToSubscribedUsers = async (req, res) => {
  try {
    const { title, body, data, imageUrl } = req.body

    await NotificationService.sendToSubscribedUsers(title, body, data, imageUrl)

    res.status(StatusCodes.OK).json({
      message: 'Notification sent successfully to subscribed users',
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error sending notification',
      error: error.message,
    })
  }
}

// Send notification to a specific user (Admin only)
export const sendNotificationToUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { title, body, data, imageUrl } = req.body

    const user = await User.findById(userId)
    if (!user || !user.fcmTokens.length) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'User not found or has no registered devices',
      })
    }

    // Get all FCM tokens for the user
    const fcmTokens = user.fcmTokens.map(t => t.token)
    
    // Send to all user's devices
    const { response, failedTokens } = await NotificationService.sendToSpecificUser(
      fcmTokens,
      title,
      body,
      data,
      imageUrl
    )

    // If some tokens failed, remove them from the user's devices
    if (failedTokens.length > 0) {
      for (const token of failedTokens) {
        await user.removeFcmToken(token)
      }
      await user.save()
    }

    res.status(StatusCodes.OK).json({
      message: 'Notification sent successfully to user',
      failedTokensCount: failedTokens.length,
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error sending notification',
      error: error.message,
    })
  }
} 