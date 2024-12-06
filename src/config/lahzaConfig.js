export const lahzaConfig = {
  publicKey: process.env.LAHZA_PUBLIC_KEY,
  secretKey: process.env.LAHZA_SECRET_KEY,
  apiUrl: process.env.LAHZA_API_URL || 'https://api.lahza.io',
  isProduction: process.env.NODE_ENV === 'production',
} 