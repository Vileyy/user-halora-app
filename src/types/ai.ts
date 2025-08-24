// Types cho AI chatbot và recommendations

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  recommendedProducts?: ProductRecommendation[];
}

export interface UserProfile {
  id: string;
  skinType?: "da-kho" | "da-dau" | "da-hon-hop" | "da-nhay-cam" | "da-thuong";
  age?: number;
  concerns: string[];
  allergies?: string[];
  currentProducts: string[];
  preferences: {
    priceRange?: [number, number];
    preferredBrands?: string[];
    preferredIngredients?: string[];
    avoidIngredients?: string[];
  };
}

export interface ProductRecommendation {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  category: string;
  reason: string; // Lý do AI đề xuất
  confidence: number; // Độ tin cậy từ 0-1
  tags?: string[];
  suitableFor?: string[];
}

export interface BeautyAdvice {
  id: string;
  question: string;
  answer: string;
  category: "skincare" | "makeup" | "haircare" | "general";
  timestamp: Date;
  helpful?: boolean;
  recommendedProducts?: ProductRecommendation[];
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  startTime: Date;
  lastUpdateTime: Date;
  category?: string;
  resolved?: boolean;
}

export interface SmartRecommendationContext {
  userId: string;
  currentProduct?: any; // Product đang xem
  recentlyViewed: string[]; // IDs của products đã xem
  purchaseHistory: string[]; // IDs của products đã mua
  searchHistory: string[]; // Từ khóa tìm kiếm gần đây
  favorites: string[]; // IDs của products yêu thích
  cartItems: string[]; // IDs của products trong giỏ
  sessionBehavior: {
    timeSpent: { [productId: string]: number }; // Thời gian xem từng product
    interactions: { [productId: string]: number }; // Số lần tương tác
  };
}

export interface RecommendationResponse {
  recommendations: ProductRecommendation[];
  reasoning: string;
  confidence: number;
  type: "collaborative" | "content-based" | "hybrid" | "ai-generated";
}

export interface ChatbotState {
  isOpen: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  currentConversationId?: string;
  quickReplies?: string[];
  suggestedQuestions?: string[];
}

export interface BeautyQuizResult {
  skinType: string;
  concerns: string[];
  recommendedRoutine: {
    morning: string[];
    evening: string[];
  };
  productRecommendations: ProductRecommendation[];
  score: number;
  advice: string;
}

// AI Provider configurations
export interface AIProviderConfig {
  provider: "openai" | "gemini" | "claude";
  apiKey: string;
  model: string;
  baseURL: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIServiceConfig {
  primaryProvider: AIProviderConfig;
  fallbackProvider?: AIProviderConfig;
  enableFallback: boolean;
  cacheResponses: boolean;
  rateLimiting: {
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
  };
}

// Error types
export interface AIError {
  code:
    | "NETWORK_ERROR"
    | "API_ERROR"
    | "RATE_LIMITED"
    | "INVALID_RESPONSE"
    | "AUTH_ERROR";
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

// Analytics types
export interface AIUsageAnalytics {
  userId: string;
  sessionId: string;
  action:
    | "chat_message"
    | "get_recommendations"
    | "view_recommendation"
    | "purchase_recommended";
  timestamp: Date;
  metadata?: {
    messageLength?: number;
    responseTime?: number;
    recommendationClicked?: string;
    conversationLength?: number;
  };
}
