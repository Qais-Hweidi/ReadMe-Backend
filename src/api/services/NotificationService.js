import admin from 'firebase-admin'
import { config } from '../../config/config.js'

// Initialize Firebase Admin SDK with service account
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
    }),
  })
  console.log('Firebase Admin SDK initialized successfully')
} catch (error) {
  console.error('Firebase initialization error:', error)
}

class NotificationService {
  static async sendToTopic(topic, { title, body, imageUrl = null, data = {} }) {
    try {
      // Convert all data values to strings
      const stringifiedData = {}
      Object.keys(data).forEach(key => {
        stringifiedData[key] = String(data[key])
      })

      const message = {
        topic,
        notification: {
          title,
          body,
        },
        android: {
          notification: {
            imageUrl,
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              'mutable-content': 1,
              'content-available': 1,
            },
            fcm_options: {
              image: imageUrl,
            },
          },
        },
        data: stringifiedData, // Use the stringified data object
      }

      const response = await admin.messaging().send(message)
      console.log('Successfully sent topic message:', response)
      return response
    } catch (error) {
      console.error('Error sending topic message:', error)
      throw error
    }
  }

  static async sendToDevices(tokens, { title, body, imageUrl = null, data = {} }) {
    try {
      const message = {
        tokens: Array.isArray(tokens) ? tokens : [tokens],
        notification: {
          title,
          body,
        },
        android: {
          notification: {
            imageUrl,
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              'mutable-content': 1,
              'content-available': 1,
            },
            fcm_options: {
              image: imageUrl,
            },
          },
        },
        data: typeof data === 'object' ? JSON.stringify(data) : data,
      }

      const response = await admin.messaging().sendMulticast(message)
      console.log('Successfully sent message:', response)

      if (response.failureCount > 0) {
        const failedTokens = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx])
          }
        })
        console.log('List of tokens that caused failures:', failedTokens)
        return { response, failedTokens }
      }

      return { response, failedTokens: [] }
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Topic subscription methods
  static async subscribeToTopic(tokens, topic) {
    try {
      const response = await admin
        .messaging()
        .subscribeToTopic(Array.isArray(tokens) ? tokens : [tokens], topic)
      console.log(`Successfully subscribed to ${topic}:`, response)
      return response
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error)
      throw error
    }
  }

  static async unsubscribeFromTopic(tokens, topic) {
    try {
      const response = await admin
        .messaging()
        .unsubscribeFromTopic(Array.isArray(tokens) ? tokens : [tokens], topic)
      console.log(`Successfully unsubscribed from ${topic}:`, response)
      return response
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error)
      throw error
    }
  }

  // Convenience methods
  static async sendToAllUsers(title, body, data = {}, imageUrl = null) {
    return this.sendToTopic('all_users', { title, body, imageUrl, data })
  }

  static async sendToFreeUsers(title, body, data = {}, imageUrl = null) {
    return this.sendToTopic('free_users', { title, body, imageUrl, data })
  }

  static async sendToSubscribedUsers(title, body, data = {}, imageUrl = null) {
    return this.sendToTopic('subscribed_users', { title, body, imageUrl, data })
  }

  static async sendToSpecificUser(fcmTokens, title, body, data = {}, imageUrl = null) {
    return this.sendToDevices(fcmTokens, { title, body, imageUrl, data })
  }
}

export default NotificationService
