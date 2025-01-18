export const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? [
          'https://localhost',
          'https://readme-backend-zdiq.onrender.com',
          // Add Flutter app URL here when deployed
        ]
      : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
