import mongoose from 'mongoose'

const readingHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index to ensure a user has unique entries per book
readingHistorySchema.index({ user: 1, book: 1 }, { unique: true })

export default mongoose.model('ReadingHistory', readingHistorySchema) 