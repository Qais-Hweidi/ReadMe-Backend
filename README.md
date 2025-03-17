# ReadMe - Advanced Digital Reading Platform

ReadMe is an advanced digital reading platform that combines modern technology with an easy-to-use interface to enhance the reading experience. For detailed documentation and screenshots, check out our [comprehensive project report](https://drive.google.com/file/d/1KVjPKfwl--7eXSHzYwsiK2b_SgcVMvmN/view?usp=sharing).

## Features

- 📚 Multi-format book support
- 🤖 AI-powered book summarization
- 🎧 Text-to-Speech capabilities
- 💳 Flexible subscription plans
- 📱 Cross-platform compatibility
- 🔍 Advanced search functionality
- 📖 Offline reading support
- 💬 AI-powered book discussions
- 📊 Reading progress tracking
- ⭐ Review and rating system

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, Firebase Admin
- **File Storage**: Cloudinary
- **AI Services**: Claude AI (Anthropic), ElevenLabs
- **Payment Processing**: Custom Lahza integration
- **Email Service**: SendGrid
- **Push Notifications**: Firebase Cloud Messaging
- **Hosting**: Render

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Firebase account
- Cloudinary account
- SendGrid account
- Anthropic API access
- ElevenLabs API access

## Installation

1. Clone the repository:
   git clone https://github.com/yourusername/readme-backend.git
   cd readme-backend

2. Install dependencies:
   npm install

3. Set up environment variables:
   cp .env.example .env

4. Configure your environment variables in `.env` file

5. Start the development server:
   npm run dev

## Project Structure

```bash
src/
├── api/
│   ├── controllers/    # Request handlers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── validations/   # Request validation
│   └── middlewares/   # Custom middlewares
├── config/           # Configuration files
├── utils/            # Utility functions
└── index.js         # Application entry point
```

Postman:

![Image](https://github.com/user-attachments/assets/d5e3d20b-44db-4ed1-83cc-c009b2f8d33d)
![Image](https://github.com/user-attachments/assets/831a18f4-c2c3-4a05-b5fe-62f7024e1110)

## Environment Variables

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_VERIFIED_SENDER=your_verified_email
CLOUDINARY_API_SECRET=your_cloudinary_secret
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
ANTHROPIC_API_KEY=your_anthropic_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## Database Models

- User
- Book
- Author
- Category
- Review
- SubscriptionPlan
- Transaction
- PurchasedBooks
- Report

![Image](https://github.com/user-attachments/assets/1065550e-c031-4ad7-9152-93321966a5d4)
![Image](https://github.com/user-attachments/assets/14b1561d-b3b8-43ec-ab1a-bc71807a9dab)

## External Services Integration

- **Cloudinary**: Image and PDF storage
- **SendGrid**: Email notifications
- **Firebase**: Push notifications and authentication
- **Claude AI**: Book summarization and chat
- **ElevenLabs**: Text-to-speech conversion
- **Lahza**: Payment processing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
