import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV,
  db: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  sendGrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    sender: process.env.SENDGRID_VERIFIED_SENDER,
  },
  cloudinary: {
    cloudName: 'dblnmsmks',
    apiKey: '961427695445425',
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
}
