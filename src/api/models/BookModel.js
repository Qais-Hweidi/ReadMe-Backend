import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    free: {
      type: Boolean,
      required: true,
      default: true,
    },
    bookLink: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    numberOfViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    numberOfDownloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    numberOfReadings: {
      type: Number,
      default: 0,
      min: 0,
    },
    numberOfFavourites: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('Book', bookSchema)
