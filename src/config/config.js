import dotenv from 'dotenv'
dotenv.config()

export const config = {
  sendGrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    sender: process.env.SENDGRID_VERIFIED_SENDER
  },
  jwt: {
    secret: process.env.JWT_SECRET
  },
  db: {
    uri: process.env.MONGODB_URI
  },
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3000
} 