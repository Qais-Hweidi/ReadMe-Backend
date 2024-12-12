import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      select: true,
    },
    fullName: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    profilePicture: {
      type: String,
      default: '',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive',
    },
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
    },
    subscriptionExpiryDate: {
      type: Date,
    },
    fcmTokens: [{
      token: {
        type: String,
        required: true,
      },
      device: {
        type: String,
        required: true,
      },
      lastUsed: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.hasActiveSubscription = function () {
  return this.subscriptionStatus === 'active' && this.subscriptionExpiryDate > new Date()
}

userSchema.methods.addFcmToken = async function (token, device) {
  const tokenExists = this.fcmTokens.find(t => t.token === token)
  if (tokenExists) {
    tokenExists.lastUsed = new Date()
  } else {
    this.fcmTokens.push({ token, device })
  }
  await this.save()
}

userSchema.methods.removeFcmToken = async function (token) {
  this.fcmTokens = this.fcmTokens.filter(t => t.token !== token)
  await this.save()
}

export default mongoose.model('User', userSchema)
