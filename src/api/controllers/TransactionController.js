import { StatusCodes } from 'http-status-codes'
import TransactionModel from '../models/TransactionModel.js'
import { config } from '../../config/config.js'
import User from '../models/UserModel.js'
import PurchasedBooks from '../models/PurchasedBooksModel.js'

// Create a new transaction
export const createTransaction = async (req, res) => {
  try {
    const transaction = await TransactionModel.create({
      user: req.user._id,
      ...req.body,
    })

    const populatedTransaction = await TransactionModel.findById(transaction._id)
      .populate('user', 'fullName email')
      .populate('referenceId')

    res.status(StatusCodes.CREATED).json({
      message: 'Transaction created successfully',
      transaction: populatedTransaction,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error creating transaction',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

// Get user's transactions with filtering and pagination
export const getUserTransactions = async (req, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      limit = 10,
      page = 1,
    } = req.query

    const query = { user: req.user._id }

    // Add filters if provided
    if (type) query.type = type
    if (status) query.status = status
    if (startDate || endDate) {
      query.paymentDate = {}
      if (startDate) query.paymentDate.$gte = new Date(startDate)
      if (endDate) query.paymentDate.$lte = new Date(endDate)
    }

    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      TransactionModel.find(query)
        .populate('user', 'fullName email')
        .populate('referenceId')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit),
      TransactionModel.countDocuments(query),
    ])

    res.status(StatusCodes.OK).json({
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error fetching transactions',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

// Get transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await TransactionModel.findOne({
      _id: req.params.transactionId,
      user: req.user._id,
    })
      .populate('user', 'fullName email')
      .populate('referenceId')

    if (!transaction) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Transaction not found',
      })
    }

    res.status(StatusCodes.OK).json({
      transaction,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error fetching transaction',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

// Update transaction status (Admin only)
export const updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params
    const { status, paymentGateway } = req.body

    const transaction = await TransactionModel.findById(transactionId)
    if (!transaction) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Transaction not found',
      })
    }

    // Only allow status update if current status is PENDING
    if (transaction.status !== 'PENDING') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Cannot update status of non-pending transaction',
      })
    }

    transaction.status = status
    if (paymentGateway) {
      transaction.paymentGateway = paymentGateway
    }

    // If transaction is completed, process the subscription or book purchase
    if (status === 'COMPLETED') {
      if (transaction.type === 'SUBSCRIPTION') {
        // Activate subscription
        const user = await User.findById(transaction.user)
        const now = new Date()
        let expiryDate = transaction.subscriptionPeriod.endDate

        // If user has active subscription of same plan, extend it
        if (user.subscriptionStatus === 'active' && 
            user.subscriptionPlanId?.toString() === transaction.referenceId.toString() &&
            user.subscriptionExpiryDate > now) {
          expiryDate = new Date(user.subscriptionExpiryDate)
          expiryDate.setDate(expiryDate.getDate() + transaction.subscriptionPeriod.durationInDays)
        }

        await User.findByIdAndUpdate(transaction.user, {
          subscriptionStatus: 'active',
          subscriptionPlanId: transaction.referenceId,
          subscriptionExpiryDate: expiryDate,
        })
      } else if (transaction.type === 'BOOK_PURCHASE') {
        // Add book to user's purchased books
        await PurchasedBooks.create({
          user: transaction.user,
          book: transaction.referenceId,
          purchasePrice: transaction.amount,
        })
      }
    }

    await transaction.save()

    res.status(StatusCodes.OK).json({
      message: 'Transaction status updated successfully',
      transaction: {
        id: transaction._id,
        status: transaction.status,
        type: transaction.type,
        amount: transaction.amount,
        paymentGateway: transaction.paymentGateway,
      },
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error updating transaction status',
      error: error.message,
    })
  }
}

// Get all transactions (Admin only)
export const getAllTransactions = async (req, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      limit = 10,
      page = 1,
    } = req.query

    const query = {}

    // Add filters if provided
    if (type) query.type = type
    if (status) query.status = status
    if (startDate || endDate) {
      query.paymentDate = {}
      if (startDate) query.paymentDate.$gte = new Date(startDate)
      if (endDate) query.paymentDate.$lte = new Date(endDate)
    }

    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      TransactionModel.find(query)
        .populate('user', 'fullName email')
        .populate('referenceId')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit),
      TransactionModel.countDocuments(query),
    ])

    res.status(StatusCodes.OK).json({
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error fetching transactions',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
} 