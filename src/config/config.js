import dotenv from 'dotenv'
dotenv.config()

export const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  baseUrl:
    process.env.NODE_ENV === 'production'
      ? 'https://readme-backend-zdiq.onrender.com'
      : 'http://localhost:3000',
  clientUrl:
    process.env.NODE_ENV === 'production'
      ? 'https://readme-backend-zdiq.onrender.com'
      : 'http://localhost:3000',
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
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
}
