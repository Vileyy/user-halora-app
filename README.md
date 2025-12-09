# 🌸 Halora Cosmetic - E-Commerce Mobile App

<div align="center">
  <img src="assets/halora-icon-logo.png" alt="Halora Cosmetic Logo" width="120" height="120">
  
  <h3>Premium Cosmetic Shopping Experience with AI-Powered Recommendations</h3>
  
  <p>
    <strong>A modern, feature-rich e-commerce mobile application for cosmetics and skincare products</strong>
  </p>

![React Native](https://img.shields.io/badge/React_Native-0.79.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-53.0-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2.8-764ABC?style=for-the-badge&logo=redux&logoColor=white)

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey?style=for-the-badge)

</div>

---

## ✨ Key Features

### 🛒 Shopping Experience

- **Smart Search** - Real-time search with autocomplete and filtering
- **Product Details** - Rich product pages with images, variants, and reviews
- **Shopping Cart** - Full cart management with variant selection
- **Wishlist** - Save favorite products for later

### 🤖 AI-Powered Features

- **AI Chatbot** - Intelligent beauty consultant powered by GPT-4/OpenRouter
- **Product Recognition** - Image-based product identification using Vision AI
- **Smart Recommendations** - Personalized suggestions based on user behavior
- **Voice Input** - Speech-to-text for hands-free interaction

### 💰 Payment & Checkout

- **Stripe Integration** - Secure credit/debit card payments
- **COD Support** - Cash on delivery option
- **Voucher System** - Discount codes and promotional vouchers
- **Address Management** - Multiple shipping addresses

### 📦 Order Management

- **Order Tracking** - Real-time order status updates
- **Order History** - Complete purchase history
- **Multi-Product Reviews** - Rate and review purchased items

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Screens   │  │ Components  │  │ Navigation  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                        BUSINESS LOGIC LAYER                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Redux Store │  │   Hooks     │  │  Services   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Firebase   │  │ AsyncStorage│  │  External   │              │
│  │  Realtime   │  │   (Local)   │  │    APIs     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                        EXTERNAL SERVICES                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Stripe    │  │  OpenRouter │  │ Cloudinary  │              │
│  │  Payments   │  │    (AI)     │  │   (Media)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Category       | Technologies                                   |
| -------------- | ---------------------------------------------- |
| **Core**       | React Native 0.79.5, Expo 53.0, TypeScript 5.8 |
| **State**      | Redux Toolkit, Redux Persist, AsyncStorage     |
| **Backend**    | Firebase (Auth & Realtime DB), Cloudinary      |
| **Navigation** | React Navigation 7.x (Stack, Bottom Tabs)      |
| **UI/UX**      | Reanimated, Expo Vector Icons, Linear Gradient |
| **Forms**      | React Hook Form, Yup validation                |
| **Payment**    | Stripe React Native                            |
| **AI**         | OpenRouter API (GPT-4, Claude)                 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18.0+
- npm or yarn
- Expo CLI
- Android Studio / Xcode

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/user-halora-app.git
cd user-halora-app

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npx expo start --dev-client
```

### Environment Variables

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

---

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatBot.tsx      # AI Chatbot
│   ├── ProductReviews.tsx
│   ├── SmartRecommendations.tsx
│   └── ...
├── screens/             # App screens
│   ├── auth/            # Login/Register
│   ├── home/            # Home screen
│   ├── product/         # Product details
│   ├── cart/            # Shopping cart
│   ├── order/           # Order management
│   └── ...
├── services/            # API services
│   ├── aiService.ts     # AI integration
│   ├── orderService.ts
│   ├── stripeService.ts
│   └── ...
├── redux/               # State management
│   └── slices/          # Redux slices
├── navigation/          # Navigation config
├── hooks/               # Custom React hooks
├── types/               # TypeScript types
└── utils/               # Utility functions
```

---

## 🧠 AI Integration

The app features a sophisticated AI system powered by OpenRouter API:

```typescript
// Beauty Consultant Chatbot
const response = await aiService.getCosmeticAdvice(
  "What products are good for oily skin?",
  { skinType: "oily", age: 25, concerns: ["acne"] },
  availableProducts
);

// Product Image Recognition
const result = await aiService.recognizeProductFromImage(
  imageUri,
  availableProducts
);

// Smart Recommendations
const recommendations = await aiService.getSmartRecommendations(
  userId,
  products,
  { viewedProducts, purchaseHistory, skinType }
);
```

---

## 💳 Payment Integration

### Supported Payment Methods

- ✅ Credit/Debit Cards (Stripe)
- ✅ Apple Pay (iOS)
- ✅ Google Pay (Android)
- ✅ Cash on Delivery (COD)

---

## 🔐 Authentication

| Method         | Status |
| -------------- | ------ |
| Email/Password | ✅     |
| Google Sign-In | ✅     |
| Apple Sign-In  | 🔜     |

---

## 🚢 Deployment

```bash
# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

<div align="center">

### **Viley**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/viley)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/viley)

---

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by Viley

</div>
