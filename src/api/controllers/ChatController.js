import { StatusCodes } from 'http-status-codes'
import ChatService from '../services/ChatService.js'

// Send a message (can be used by both user and admin)
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body
    const isAdmin = req.user.isAdmin
    const userEmail = isAdmin ? req.body.userEmail : req.user.email

    await ChatService.sendMessage(userEmail, message, isAdmin)

    res.status(StatusCodes.OK).json({
      message: 'Message sent successfully',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to send message',
      error: error.message,
    })
  }
}

// Get messages for a specific chat
export const getMessages = async (req, res) => {
  try {
    const isAdmin = req.user.isAdmin
    const userEmail = isAdmin ? req.params.userEmail : req.user.email

    const messages = await ChatService.getMessages(userEmail)

    // Mark messages as read based on who is viewing them
    if (isAdmin) {
      await ChatService.markChatAsReadByAdmin(userEmail)
    } else {
      await ChatService.markChatAsReadByUser(userEmail)
    }

    res.status(StatusCodes.OK).json({
      messages,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get messages',
      error: error.message,
    })
  }
}

// Get all chats (admin only)
export const getAllChats = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Only admin can access all chats',
      })
    }

    const chats = await ChatService.getAllChats()
    res.status(StatusCodes.OK).json({
      chats,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get chats',
      error: error.message,
    })
  }
}
