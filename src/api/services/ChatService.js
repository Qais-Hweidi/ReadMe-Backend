import admin from 'firebase-admin'

class ChatService {
  constructor() {
    // Initialize Firestore
    this.db = admin.firestore()
    this.customerSupport = this.db.collection('customerSupport')
  }

  // Get chat reference for a specific user
  getChatRef(userEmail) {
    return this.customerSupport.doc(userEmail)
  }

  // Get messages subcollection reference
  getMessagesRef(userEmail) {
    return this.customerSupport.doc(userEmail).collection('messages')
  }

  // Send a new message
  async sendMessage(userEmail, message, isFromAdmin) {
    try {
      const chatRef = this.getChatRef(userEmail)
      const messagesRef = this.getMessagesRef(userEmail)

      // Create message document
      const messageData = {
        body: message,
        sentBy: isFromAdmin ? 'admin' : 'user',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }

      // Add message to messages subcollection
      await messagesRef.add(messageData)

      // Update chat document with last message and set appropriate unread flag
      await chatRef.set(
        {
          lastMessage: message,
          lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
          unreadByUser: isFromAdmin, // True if admin sent message
          unreadByAdmin: !isFromAdmin, // True if user sent message
        },
        { merge: true }
      )

      return true
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Get all messages for a user
  async getMessages(userEmail, limit = 50) {
    try {
      const messagesRef = this.getMessagesRef(userEmail)
      const snapshot = await messagesRef.orderBy('timestamp', 'desc').limit(limit).get()

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error('Error getting messages:', error)
      throw error
    }
  }

  // Get all user chats (for admin)
  async getAllChats() {
    try {
      const snapshot = await this.customerSupport.get()
      return snapshot.docs.map(doc => ({
        userEmail: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error('Error getting all chats:', error)
      throw error
    }
  }

  // Mark chat as read by admin
  async markChatAsReadByAdmin(userEmail) {
    try {
      const chatRef = this.getChatRef(userEmail)
      await chatRef.update({
        unreadByAdmin: false,
      })
      return true
    } catch (error) {
      console.error('Error marking chat as read by admin:', error)
      throw error
    }
  }

  // Mark chat as read by user
  async markChatAsReadByUser(userEmail) {
    try {
      const chatRef = this.getChatRef(userEmail)
      await chatRef.update({
        unreadByUser: false,
      })
      return true
    } catch (error) {
      console.error('Error marking chat as read by user:', error)
      throw error
    }
  }
}

export default new ChatService()
