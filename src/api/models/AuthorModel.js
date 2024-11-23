import mongoose from 'mongoose'

const authorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    socialLinks: {
      facebook: {
        type: String,
        trim: true,
      },
      instagram: {
        type: String,
        trim: true,
      },
      linkedin: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('Author', authorSchema) 