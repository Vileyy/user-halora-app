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

## 📋 Table of Contents

- [📖 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📱 Screenshots](#-screenshots)
- [🚀 Getting Started](#-getting-started)
- [📂 Project Structure](#-project-structure)
- [🔧 Configuration](#-configuration)
- [🧠 AI Integration](#-ai-integration)
- [💳 Payment Integration](#-payment-integration)
- [📊 State Management](#-state-management)
- [🔐 Authentication](#-authentication)
- [📝 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)

---

## 📖 Overview

**Halora Cosmetic** is a full-featured mobile e-commerce application designed specifically for the beauty and skincare industry. Built with modern technologies and best practices, this app delivers a seamless shopping experience with intelligent product recommendations powered by AI.

### 🎯 Project Goals

- Provide an intuitive and visually appealing shopping experience
- Leverage AI technology for personalized product recommendations
- Ensure secure and seamless payment processing
- Deliver real-time order tracking and management
- Support multiple authentication methods for user convenience

---

## ✨ Key Features

### 🛒 Shopping Experience
| Feature | Description |
|---------|-------------|
| **Smart Search** | Real-time search with autocomplete and filtering |
| **Category Navigation** | Organized product browsing by categories |
| **Product Details** | Rich product pages with images, variants, and reviews |
| **Shopping Cart** | Full cart management with variant selection |
| **Wishlist** | Save favorite products for later |

### 🤖 AI-Powered Features
| Feature | Description |
|---------|-------------|
| **AI Chatbot** | Intelligent beauty consultant powered by GPT-4/OpenRouter |
| **Product Recognition** | Image-based product identification using Vision AI |
| **Smart Recommendations** | Personalized suggestions based on user behavior |
| **Skin Analysis** | AI-driven skin type assessment and product matching |
| **Voice Input** | Speech-to-text for hands-free interaction |

### 💰 Payment & Checkout
| Feature | Description |
|---------|-------------|
| **Stripe Integration** | Secure credit/debit card payments |
| **COD Support** | Cash on delivery option |
| **Voucher System** | Discount codes and promotional vouchers |
| **Address Management** | Multiple shipping addresses with selection |

### 📦 Order Management
| Feature | Description |
|---------|-------------|
| **Order Tracking** | Real-time order status updates |
| **Order History** | Complete purchase history |
| **Order Cancellation** | Cancel pending/processing orders |
| **Multi-Product Reviews** | Rate and review purchased items |

### 👤 User Features
| Feature | Description |
|---------|-------------|
| **Profile Management** | Edit personal information and avatar |
| **Google Sign-In** | One-tap authentication with Google |
| **Email Authentication** | Traditional email/password login |
| **Notification Center** | Order updates and promotions |

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
│  │   (Slices)  │  │             │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Firebase   │  │ AsyncStorage│  │  External   │              │
│  │  Realtime   │  │   (Local)   │  │    APIs     │              │
│  │  Database   │  │             │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                        EXTERNAL SERVICES                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Stripe    │  │  OpenRouter │  │ Cloudinary  │              │
│  │  Payments   │  │    (AI)     │  │   (Media)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Design Patterns Used

- **🏛️ Flux Architecture**: Unidirectional data flow with Redux
- **🧩 Component-Based**: Reusable UI components
- **🔌 Service Layer**: Abstracted API calls and business logic
- **📦 Feature-Based Structure**: Organized by features/screens
- **🎣 Custom Hooks**: Shared stateful logic

---

## 🛠️ Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.79.5 | Cross-platform mobile development |
| **Expo** | 53.0 | Development platform & tooling |
| **TypeScript** | 5.8 | Type-safe JavaScript |
| **React** | 19.0.0 | UI library |

### State Management & Data

| Technology | Version | Purpose |
|------------|---------|---------|
| **Redux Toolkit** | 2.8.2 | Global state management |
| **React Redux** | 9.2.0 | React bindings for Redux |
| **Redux Persist** | 6.0.0 | State persistence |
| **AsyncStorage** | 1.24.0 | Local data storage |

### Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **Firebase** | 12.0.0 | Authentication & Realtime Database |
| **Cloudinary** | - | Image upload & management |
| **Axios** | 1.11.0 | HTTP client |

### Navigation

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Navigation** | 7.x | Screen navigation |
| **Bottom Tabs** | 7.4.5 | Tab navigation |
| **Native Stack** | 7.3.24 | Stack navigation |

### UI & UX

| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo Vector Icons** | 14.1.0 | Icon library |
| **Expo Linear Gradient** | 14.1.5 | Gradient effects |
| **Expo Blur** | 15.0.7 | Blur effects |
| **React Native Reanimated** | 3.19.1 | Animations |
| **Expo Haptics** | 13.0.1 | Haptic feedback |

### Forms & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Hook Form** | 7.62.0 | Form management |
| **Yup** | 1.7.0 | Schema validation |
| **@hookform/resolvers** | 5.2.1 | Validation resolvers |

### Payment & Authentication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Stripe React Native** | 0.53.1 | Payment processing |
| **Google Sign-In** | 15.0.0 | OAuth authentication |
| **crypto-js** | 4.2.0 | Encryption utilities |

### Media & Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo Image Picker** | 16.1.4 | Image selection |
| **Expo AV** | 15.1.7 | Audio/Video playback |
| **Expo Speech** | 13.1.7 | Text-to-speech |

---

## 📱 Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Home Screen</b></td>
      <td align="center"><b>Product Details</b></td>
      <td align="center"><b>Shopping Cart</b></td>
    </tr>
    <tr>
      <td><img src="docs/screenshots/home.png" width="200"/></td>
      <td><img src="docs/screenshots/product.png" width="200"/></td>
      <td><img src="docs/screenshots/cart.png" width="200"/></td>
    </tr>
    <tr>
      <td align="center"><b>AI Chatbot</b></td>
      <td align="center"><b>Order Status</b></td>
      <td align="center"><b>Profile</b></td>
    </tr>
    <tr>
      <td><img src="docs/screenshots/chatbot.png" width="200"/></td>
      <td><img src="docs/screenshots/orders.png" width="200"/></td>
      <td><img src="docs/screenshots/profile.png" width="200"/></td>
    </tr>
  </table>
</div>

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Git**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/user-halora-app.git
   cd user-halora-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   ```

4. **Start the development server**
   ```bash
   # With Expo Go
   npx expo start
   
   # With development client (recommended for full features)
   npx expo start --dev-client
   ```

5. **Run on device/emulator**
   ```bash
   # Android
   npx expo start --android
   
   # iOS
   npx expo start --ios
   ```

### Building for Production

```bash
# Build Android APK
eas build --platform android --profile preview

# Build iOS IPA
eas build --platform ios --profile preview

# Build both platforms
eas build --platform all
```

---

## 📂 Project Structure

```
user-halora-app/
├── 📁 assets/                    # Static assets (images, fonts)
│   ├── halora-icon-logo.png
│   ├── halora-splash.png
│   └── ...
├── 📁 src/
│   ├── 📁 assets/               # App-specific assets
│   │   ├── 📁 image/
│   │   └── 📁 logo/
│   ├── 📁 components/           # Reusable UI components
│   │   ├── AddToCartButton.tsx
│   │   ├── AddressSelector.tsx
│   │   ├── Banner.tsx
│   │   ├── CartBadge.tsx
│   │   ├── Categories.tsx
│   │   ├── ChatBot.tsx          # AI Chatbot component
│   │   ├── FlashDeals.tsx
│   │   ├── FloatingChatButton.tsx
│   │   ├── Header.tsx
│   │   ├── NewProducts.tsx
│   │   ├── ProductReviews.tsx
│   │   ├── SearchDropdown.tsx
│   │   ├── SmartRecommendations.tsx
│   │   ├── VariantSelector.tsx
│   │   ├── VoucherCard.tsx
│   │   └── ...
│   ├── 📁 hooks/                # Custom React hooks
│   │   └── useDebounce.ts
│   ├── 📁 navigation/           # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   └── types.ts
│   ├── 📁 redux/                # State management
│   │   ├── 📁 reducers/
│   │   │   └── rootReducer.ts
│   │   └── 📁 slices/
│   │       ├── authSlice.ts
│   │       ├── cartSlice.ts
│   │       ├── favoritesSlice.ts
│   │       ├── notifySlice.ts
│   │       └── orderSlice.ts
│   ├── 📁 screens/              # App screens
│   │   ├── 📁 ai/               # AI Assistant screen
│   │   ├── 📁 auth/             # Login/Register screens
│   │   ├── 📁 cart/             # Shopping cart
│   │   ├── 📁 checkout/         # Checkout process
│   │   ├── 📁 contact/          # Contact/Support
│   │   ├── 📁 home/             # Home screen
│   │   ├── 📁 notify/           # Notifications
│   │   ├── 📁 order/            # Order management
│   │   ├── 📁 payment/          # Payment screens
│   │   ├── 📁 product/          # Product details
│   │   ├── 📁 profile/          # User profile
│   │   ├── 📁 review/           # Product reviews
│   │   ├── 📁 search/           # Search screen
│   │   ├── 📁 viewall/          # Product listings
│   │   └── 📁 voucher/          # Vouchers
│   ├── 📁 services/             # API services
│   │   ├── addressService.ts
│   │   ├── aiService.ts         # AI integration
│   │   ├── cloudinaryService.ts
│   │   ├── firebase.ts
│   │   ├── orderService.ts
│   │   ├── reviewService.ts
│   │   ├── speechService.ts
│   │   ├── stripeService.ts
│   │   └── voucherService.ts
│   ├── 📁 types/                # TypeScript types
│   │   ├── ai.ts
│   │   └── navigation.ts
│   └── 📁 utils/                # Utility functions
│       ├── constants.ts
│       ├── formatters.ts
│       └── validators.ts
├── 📄 app.json                  # Expo configuration
├── 📄 App.tsx                   # Root component
├── 📄 babel.config.js           # Babel configuration
├── 📄 index.ts                  # Entry point
├── 📄 package.json              # Dependencies
├── 📄 tsconfig.json             # TypeScript configuration
└── 📄 README.md                 # This file
```

---

## 🔧 Configuration

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Email/Password and Google Sign-In)
3. Create a **Realtime Database**
4. Configure security rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "products": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "reviews": {
      ".read": true,
      ".write": "auth != null"
    },
    "orders": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()",
        ".write": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()"
      }
    }
  }
}
```

### Google Sign-In Configuration

1. Configure OAuth 2.0 in Google Cloud Console
2. Add SHA-1 fingerprint for Android
3. Update `app.json` with your client IDs:

```json
{
  "expo": {
    "plugins": ["@react-native-google-signin/google-signin"],
    "extra": {
      "googleSignIn": {
        "androidClientId": "YOUR_ANDROID_CLIENT_ID"
      }
    }
  }
}
```

---

## 🧠 AI Integration

### Overview

The app features a sophisticated AI system powered by OpenRouter API, which provides access to multiple AI models including GPT-4, Claude, and more.

### AI Features

#### 1. Beauty Consultant Chatbot
```typescript
// AI Service usage example
const response = await aiService.getCosmeticAdvice(
  "What products are good for oily skin?",
  { skinType: "oily", age: 25, concerns: ["acne"] },
  availableProducts
);
```

#### 2. Product Image Recognition
```typescript
// Recognize products from camera/gallery images
const result = await aiService.recognizeProductFromImage(
  imageUri,
  availableProducts
);
```

#### 3. Smart Recommendations
```typescript
// Get personalized product recommendations
const recommendations = await aiService.getSmartRecommendations(
  userId,
  products,
  {
    viewedProducts: ["prod1", "prod2"],
    purchaseHistory: ["prod3"],
    skinType: "combination"
  }
);
```

### AI Configuration

Configure your AI provider in the environment:

```env
# OpenRouter API (Recommended - access to multiple models)
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key

# Or direct OpenAI API
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
```

---

## 💳 Payment Integration

### Stripe Integration

The app uses Stripe for secure payment processing.

#### Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your publishable key from the Dashboard
3. Set up a backend server for creating Payment Intents

#### Payment Flow

```typescript
// Initialize payment
await stripeService.initializePayment(amount, currency);

// Process payment
const result = await stripeService.processPayment({
  orderId,
  amount,
  customerEmail,
  customerName
});
```

#### Supported Payment Methods

- ✅ Credit/Debit Cards
- ✅ Apple Pay (iOS)
- ✅ Google Pay (Android)
- ✅ Cash on Delivery (COD)

---

## 📊 State Management

### Redux Store Structure

```typescript
interface RootState {
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
  };
  cart: {
    items: CartItem[];
    total: number;
    itemCount: number;
  };
  favorites: {
    items: string[];
  };
  orders: {
    currentOrder: Order | null;
    orderHistory: Order[];
    loading: boolean;
  };
  notify: {
    notifications: Notification[];
    unreadCount: number;
  };
}
```

### Slice Example

```typescript
// cartSlice.ts
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      // Add item logic
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      // Remove item logic
    },
    updateQuantity: (state, action: PayloadAction<{id: string, quantity: number}>) => {
      // Update quantity logic
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    }
  }
});
```

---

## 🔐 Authentication

### Supported Auth Methods

| Method | Status | Description |
|--------|--------|-------------|
| Email/Password | ✅ | Traditional authentication |
| Google Sign-In | ✅ | OAuth 2.0 with Google |
| Apple Sign-In | 🔜 | Coming soon |
| Phone Number | 🔜 | Coming soon |

### Authentication Flow

```typescript
// Email/Password Sign Up
await createUserWithEmailAndPassword(auth, email, password);

// Google Sign-In
const { idToken } = await GoogleSignin.signIn();
const googleCredential = GoogleAuthProvider.credential(idToken);
await signInWithCredential(auth, googleCredential);
```

---

## 📝 API Documentation

### Firebase Realtime Database Schema

```typescript
{
  "users": {
    "[userId]": {
      "profile": { /* user profile data */ },
      "addresses": { /* saved addresses */ },
      "orders": { /* order history */ }
    }
  },
  "products": {
    "[productId]": {
      "name": "string",
      "description": "string",
      "price": "number",
      "images": ["string"],
      "category": "string",
      "variants": [/* variant options */],
      "reviewSummary": { /* aggregated reviews */ }
    }
  },
  "reviews": {
    "[reviewId]": {
      "userId": "string",
      "productId": "string",
      "rating": "number",
      "comment": "string",
      "createdAt": "timestamp"
    }
  },
  "vouchers": {
    "[voucherId]": {
      "code": "string",
      "discount": "number",
      "type": "percentage | fixed",
      "minOrder": "number",
      "expiresAt": "timestamp"
    }
  }
}
```

---

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Testing Strategy

- **Unit Tests**: Service functions, utility functions
- **Component Tests**: React component rendering and behavior
- **Integration Tests**: Screen flows and navigation
- **E2E Tests**: Full user journey testing

---

## 🚢 Deployment

### Expo Application Services (EAS)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Build for stores**
   ```bash
   # Production build
   eas build --platform all --profile production
   
   # Submit to stores
   eas submit --platform android
   eas submit --platform ios
   ```

### Environment Profiles

| Profile | Use Case |
|---------|----------|
| `development` | Local development with debugging |
| `preview` | Internal testing and QA |
| `production` | App store release |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- Follow the existing code style
- Use TypeScript for all new files
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation when needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Halora Cosmetic

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Author

<div align="center">
  
### **Viley**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/viley)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/viley)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:viley@example.com)

</div>

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - Amazing development platform
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [OpenRouter](https://openrouter.ai/) - AI API gateway
- [Stripe](https://stripe.com/) - Payment processing
- [React Native Community](https://github.com/react-native-community) - Awesome libraries

---

<div align="center">
  
  **⭐ Star this repository if you find it helpful!**
  
  Made with ❤️ and ☕ by Viley
  
</div>
