import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index to ensure a user can only review a book once
reviewSchema.index({ user: 1, book: 1 }, { unique: true })

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function (bookId) {
  const stats = await this.aggregate([
    {
      $match: { book: bookId },
    },
    {
      $group: {
        _id: '$book',
        averageRating: { $avg: '$rating' },
        numberOfReviews: { $sum: 1 },
      },
    },
  ])

  if (stats.length > 0) {
    await mongoose.model('Book').findByIdAndUpdate(bookId, {
      rating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
    })
  }
}

// Call calculateAverageRating after save
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.book)
})

// Call calculateAverageRating after remove
reviewSchema.post('remove', function () {
  this.constructor.calculateAverageRating(this.book)
})

export default mongoose.model('Review', reviewSchema)
