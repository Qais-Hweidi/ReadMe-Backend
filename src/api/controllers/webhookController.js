import { StatusCodes } from 'http-status-codes'
import LahzaService from '../services/LahzaService.js'
import TransactionModel from '../models/TransactionModel.js'
import User from '../models/UserModel.js'
import PurchasedBooks from '../models/PurchasedBooksModel.js'

export const handleLahzaWebhook = async (req, res) => {
  try {
    const signature = req.headers['lahza-signature']
    const payload = req.body

    // Verify webhook signature
    const isValid = LahzaService.verifyWebhookSignature(payload, signature)
    if (!isValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid signature' })
    }

    const { reference, status } = payload
    const transaction = await TransactionModel.findOne({ 'paymentGateway.transactionId': reference })

    if (!transaction) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Transaction not found' })
    }

    // Update transaction status
    transaction.status = status === 'success' ? 'COMPLETED' : 'FAILED'
    transaction.paymentGateway.gatewayResponse = payload
    await transaction.save()

    // If payment successful, process the purchase/subscription
    if (status === 'success') {
      if (transaction.type === 'SUBSCRIPTION') {
        // Activate subscription
        const now = new Date()
        const expiryDate = transaction.subscriptionPeriod.endDate

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

    res.status(StatusCodes.OK).json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Webhook Error:', error)
    // Always return 200 for webhooks to prevent retries
    res.status(StatusCodes.OK).json({ message: 'Webhook received' })
  }
} 