import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['SUBSCRIPTION', 'BOOK_PURCHASE'],
      required: true,
    },
    // Reference to either the subscription plan or book
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // This can reference either SubscriptionPlan or Book
      refPath: 'referenceModel',
    },
    referenceModel: {
      type: String,
      required: true,
      enum: ['SubscriptionPlan', 'Book'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH'],
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    // For subscriptions
    subscriptionPeriod: {
      startDate: Date,
      endDate: Date,
      durationInDays: Number,
    },
    // Payment gateway specific fields
    paymentGateway: {
      transactionId: String,
      receiptUrl: String,
      gatewayResponse: mongoose.Schema.Types.Mixed,
    },
    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
transactionSchema.index({ user: 1, createdAt: -1 })
transactionSchema.index({ type: 1, status: 1 })
transactionSchema.index({ 'paymentGateway.transactionId': 1 }, { sparse: true })

export default mongoose.model('Transaction', transactionSchema)
