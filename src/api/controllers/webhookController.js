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
    const transaction = await TransactionModel.findOne({
      'paymentGateway.transactionId': reference,
    })

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
        const user = await User.findById(transaction.user)

        // Use the pre-calculated expiry date from the transaction
        let expiryDate = new Date(transaction.subscriptionPeriod.endDate)

        // If user has active subscription of same plan, extend it
        if (
          user.subscriptionStatus === 'active' &&
          user.subscriptionPlanId?.toString() === transaction.referenceId.toString() &&
          user.subscriptionExpiryDate > new Date()
        ) {
          try {
            const currentExpiryDate = new Date(user.subscriptionExpiryDate)

            // Get duration from transaction's subscription period
            const durationInDays = parseInt(transaction.subscriptionPeriod?.durationInDays)
            if (isNaN(durationInDays)) {
              throw new Error('Invalid duration')
            }

            // Create new date for extension
            expiryDate = new Date(currentExpiryDate)
            // Add days using UTC to avoid timezone issues
            expiryDate.setUTCDate(expiryDate.getUTCDate() + durationInDays)
          } catch (err) {
            // Fallback to the original transaction end date
            expiryDate = new Date(transaction.subscriptionPeriod.endDate)
          }
        }

        await User.findByIdAndUpdate(transaction.user, {
          subscriptionStatus: 'active',
          subscriptionPlanId: transaction.referenceId,
          subscriptionExpiryDate: expiryDate.toISOString(),
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
