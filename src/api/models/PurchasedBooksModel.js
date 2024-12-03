import mongoose from 'mongoose'

const purchasedBooksSchema = new mongoose.Schema(
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
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index to ensure a user can only purchase a book once
purchasedBooksSchema.index({ user: 1, book: 1 }, { unique: true })

export default mongoose.model('PurchasedBooks', purchasedBooksSchema) 