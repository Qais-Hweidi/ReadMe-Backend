export const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? [
          'http://localhost',
          // Add Flutter app URL here when deployed
        ]
      : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
