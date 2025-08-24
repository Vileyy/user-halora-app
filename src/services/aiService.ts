import axios from "axios";

// Interface cho AI responses
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  category: string;
  reason: string; // Lý do được đề xuất
  confidence: number; // Độ tin cậy (0-1)
}

export interface BeautyAdviceResponse {
  advice: string;
  recommendedProducts?: ProductRecommendation[];
  skinType?: string;
  concerns?: string[];
}

// Cấu hình AI API - có thể dùng OpenAI hoặc Gemini
const AI_API_CONFIG = {
  // Sử dụng OpenAI API
  openai: {
    baseURL: "https://api.openai.com/v1",
    model: "gpt-3.5-turbo",
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  },
  // Hoặc sử dụng Gemini API
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-1.5-flash",
    apiKey:
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      "AIzaSyBcd8kxN9w_reBKovGp77VQQJWDnTif3a0",
  },
};

class AIService {
  private currentProvider: "openai" | "gemini" = "gemini";
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000; // 2 seconds between requests (reduced for new API key)

  /**
   * Wait for rate limit cooldown
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limit: waiting ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Gọi API để lấy tư vấn mỹ phẩm
   */
  async getCosmeticAdvice(
    userMessage: string,
    userInfo?: {
      skinType?: string;
      age?: number;
      concerns?: string[];
      currentProducts?: string[];
    },
    availableProducts?: any[]
  ): Promise<BeautyAdviceResponse> {
    try {
      // Wait for rate limit
      await this.waitForRateLimit();

      const prompt = this.buildCosmeticAdvicePrompt(
        userMessage,
        userInfo,
        availableProducts
      );

      if (this.currentProvider === "openai") {
        const response = await this.callOpenAI(prompt);
        return {
          ...response,
          recommendedProducts: this.findMatchingProducts(
            userMessage,
            availableProducts || []
          ),
        };
      } else {
        const response = await this.callGemini(prompt);
        if (response) {
          return {
            ...response,
            recommendedProducts: this.findMatchingProducts(
              userMessage,
              availableProducts || []
            ),
          };
        } else {
          // API failed, use offline advice
          throw new Error("API failed, using offline advice");
        }
      }
    } catch (error) {
      console.error("AI Service Error:", error);

      // Fallback: trả về response cơ bản
      return {
        advice: this.getOfflineAdvice(userMessage),
        recommendedProducts: this.findMatchingProducts(
          userMessage,
          availableProducts || []
        ),
      };
    }
  }

  /**
   * Offline advice khi AI không hoạt động
   */
  private getOfflineAdvice(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("tẩy trang")) {
      return `🧴 **Tư vấn về tẩy trang:**

Để chọn sản phẩm tẩy trang phù hợp:

• **Da dầu**: Gel tẩy trang hoặc micellar water
• **Da khô**: Oil cleanser hoặc sữa tẩy trang
• **Da nhạy cảm**: Sản phẩm không cồn, pH cân bằng

**Cách sử dụng:**
1. Massage nhẹ nhàng 30 giây
2. Rửa sạch với nước ấm
3. Thoa kem dưỡng ẩm sau

Bạn có thể tham khảo các sản phẩm tẩy trang phù hợp trong cửa hàng của chúng tôi! 💫`;
    }

    if (lowerMessage.includes("serum")) {
      return `✨ **Tư vấn về serum:**

Serum là bước quan trọng trong routine skincare:

• **Vitamin C**: Chống oxy hóa, dùng buổi sáng
• **Niacinamide**: Thu nhỏ lỗ chân lông, kiểm soát dầu
• **Hyaluronic Acid**: Cấp ẩm sâu
• **Retinol**: Chống lão hóa, dùng buổi tối

**Thứ tự sử dụng:** Toner → Serum → Kem dưỡng

Hãy xem các sản phẩm serum chất lượng trong shop nhé! 🌟`;
    }

    if (
      lowerMessage.includes("kem dưỡng") ||
      lowerMessage.includes("dưỡng ẩm")
    ) {
      return `💧 **Tư vấn về kem dưỡng ẩm:**

Chọn kem dưỡng theo loại da:

• **Da dầu**: Kem dưỡng gel, texture nhẹ
• **Da khô**: Kem dưỡng giàu ceramide, shea butter  
• **Da hỗn hợp**: Kem dưỡng cân bằng
• **Da nhạy cảm**: Không mùi, không cồn

**Tips:** Thoa kem khi da còn ẩm để lock moisture tốt hơn!

Khám phá bộ sưu tập kem dưỡng đa dạng của chúng tôi! 🧴`;
    }

    // Default response
    return `👋 **Xin chào!**

Cảm ơn bạn đã liên hệ với trợ lý tư vấn mỹ phẩm Halora! 

Hiện tại hệ thống AI đang bảo trì (do rate limit), nhưng bạn vẫn có thể:

🛍️ **Xem sản phẩm** được gợi ý dưới đây
🔍 **Tìm kiếm** sản phẩm theo danh mục  
💬 **Liên hệ** nhân viên tư vấn qua hotline
📖 **Đọc** reviews từ khách hàng khác

Vui lòng đợi 5-10 phút để hệ thống AI hoạt động trở lại! ✨`;
  }

  /**
   * Lấy gợi ý sản phẩm thông minh dựa trên lịch sử và preferences
   */
  async getSmartRecommendations(
    userId: string,
    currentProducts: any[],
    userBehavior: {
      viewedProducts?: string[];
      purchaseHistory?: string[];
      favorites?: string[];
      searchHistory?: string[];
    }
  ): Promise<ProductRecommendation[]> {
    try {
      // Wait for rate limit
      await this.waitForRateLimit();

      const prompt = this.buildRecommendationPrompt(
        currentProducts,
        userBehavior
      );

      if (this.currentProvider === "openai") {
        const response = await this.callOpenAI(prompt);
        return this.parseRecommendations(response.advice, currentProducts);
      } else {
        const response = await this.callGemini(prompt);
        if (response) {
          return this.parseRecommendations(response.advice, currentProducts);
        } else {
          // API failed, use fallback
          throw new Error("API failed, using fallback");
        }
      }
    } catch (error) {
      console.error("Smart Recommendations Error:", error);
      // Fallback: trả về recommendations đơn giản dựa trên category
      return this.getFallbackRecommendations(currentProducts);
    }
  }

  /**
   * Gọi OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<BeautyAdviceResponse> {
    const config = AI_API_CONFIG.openai;

    const response = await axios.post(
      `${config.baseURL}/chat/completions`,
      {
        model: config.model,
        messages: [
          {
            role: "system",
            content:
              "Bạn là chuyên gia tư vấn mỹ phẩm chuyên nghiệp. Hãy đưa ra lời khuyên hữu ích, an toàn và phù hợp với từng loại da.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      advice: response.data.choices[0].message.content,
      skinType: this.extractSkinType(response.data.choices[0].message.content),
      concerns: this.extractConcerns(response.data.choices[0].message.content),
    };
  }

  /**
   * Gọi Gemini API với fallback endpoints
   */
  private async callGemini(prompt: string): Promise<BeautyAdviceResponse> {
    const config = AI_API_CONFIG.gemini;

    // Debug logs
    console.log("🔧 Gemini API Config:", {
      apiKey: config.apiKey.substring(0, 10) + "...",
      model: config.model,
      baseURL: config.baseURL,
    });

    // Sử dụng endpoint ổn định nhất
    const endpoints = [
      {
        baseURL: "https://generativelanguage.googleapis.com/v1beta",
        model: "gemini-1.5-flash",
      },
    ];

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Bạn là chuyên gia tư vấn mỹ phẩm chuyên nghiệp. Hãy đưa ra lời khuyên hữu ích, an toàn và phù hợp với từng loại da. ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        topK: 40,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    // Thử từng endpoint cho đến khi thành công
    for (const endpoint of endpoints) {
      try {
        const url = `${endpoint.baseURL}/models/${endpoint.model}:generateContent?key=${config.apiKey}`;
        console.log("🔗 Trying URL:", url);

        const response = await axios.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });

        const advice = response.data.candidates[0].content.parts[0].text;
        console.log("✅ Gemini API Success with:", endpoint.model);

        return {
          advice,
          skinType: this.extractSkinType(advice),
          concerns: this.extractConcerns(advice),
        };
      } catch (error: any) {
        const status = error.response?.status;
        console.log(
          `❌ Failed with ${endpoint.model}:`,
          status || error.message
        );

        if (status === 429) {
          console.log("⚠️ Rate limit exceeded, will use offline advice");
          break; // Break để return offline advice
        } else if (status === 403) {
          console.log("⚠️ API key invalid, will use offline advice");
          break;
        } else if (status === 404) {
          console.log("❌ Endpoint không tồn tại, thử endpoint khác...");
          continue;
        }

        console.log(`⚠️ API Error ${status}, will use offline advice`);
        break;
      }
    }

    // Nếu tất cả endpoints đều fail, return null để trigger fallback
    return null as any;
  }

  /**
   * Xây dựng prompt cho tư vấn mỹ phẩm
   */
  private buildCosmeticAdvicePrompt(
    userMessage: string,
    userInfo?: {
      skinType?: string;
      age?: number;
      concerns?: string[];
      currentProducts?: string[];
    },
    availableProducts?: any[]
  ): string {
    let prompt = `Người dùng hỏi: "${userMessage}"\n\n`;

    if (userInfo) {
      if (userInfo.skinType) {
        prompt += `Loại da: ${userInfo.skinType}\n`;
      }
      if (userInfo.age) {
        prompt += `Tuổi: ${userInfo.age}\n`;
      }
      if (userInfo.concerns?.length) {
        prompt += `Vấn đề da: ${userInfo.concerns.join(", ")}\n`;
      }
      if (userInfo.currentProducts?.length) {
        prompt += `Sản phẩm đang dùng: ${userInfo.currentProducts.join(
          ", "
        )}\n`;
      }
    }

    // Thêm thông tin sản phẩm có sẵn nếu user hỏi về sản phẩm cụ thể
    if (availableProducts && availableProducts.length > 0) {
      const productKeywords = this.extractProductKeywords(userMessage);
      const relevantProducts = availableProducts
        .filter((product) =>
          productKeywords.some(
            (keyword) =>
              product.name?.toLowerCase().includes(keyword.toLowerCase()) ||
              product.category?.toLowerCase().includes(keyword.toLowerCase()) ||
              product.description?.toLowerCase().includes(keyword.toLowerCase())
          )
        )
        .slice(0, 5);

      if (relevantProducts.length > 0) {
        prompt += `\nSản phẩm có sẵn trong cửa hàng:\n`;
        relevantProducts.forEach((product, index) => {
          prompt += `${index + 1}. ${product.name} - ${product.price} VNĐ\n`;
          prompt += `   Mô tả: ${product.description || "Không có mô tả"}\n`;
        });
        prompt += `\nHãy đề xuất sản phẩm phù hợp từ danh sách trên nếu có.\n`;
      }
    }

    prompt += `\nHãy đưa ra lời khuyên chi tiết, an toàn và phù hợp. Tập trung vào:
1. Phân tích vấn đề và nhu cầu
2. Đề xuất giải pháp cụ thể
3. Thành phần nên tìm kiếm
4. Lưu ý khi sử dụng
5. Routine chăm sóc da phù hợp
6. Gợi ý sản phẩm cụ thể từ cửa hàng (nếu có)

Trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ thông tin.`;

    return prompt;
  }

  /**
   * Xây dựng prompt cho recommendations
   */
  private buildRecommendationPrompt(
    currentProducts: any[],
    userBehavior: any
  ): string {
    const productCategories = [
      ...new Set(currentProducts.map((p) => p.category)),
    ];
    const viewedCategories = userBehavior.viewedProducts || [];

    return `Dựa trên hành vi người dùng:
- Danh mục sản phẩm hiện có: ${productCategories.join(", ")}
- Sản phẩm đã xem: ${viewedCategories.slice(0, 5).join(", ")}
- Lịch sử tìm kiếm: ${
      userBehavior.searchHistory?.slice(0, 3).join(", ") || "không có"
    }

Hãy gợi ý 3-5 sản phẩm mỹ phẩm phù hợp nhất với format:
[TÊN SẢN PHẨM] - [LÝ DO ĐỀ XUẤT] - [ĐỘ TIN CẬY 0-1]

Ví dụ:
Kem dưỡng ẩm Vitamin C - Phù hợp với da khô, bổ sung vitamin - 0.9`;
  }

  /**
   * Parse recommendations từ AI response
   */
  private parseRecommendations(
    aiResponse: string,
    availableProducts: any[]
  ): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = [];

    // Logic đơn giản để match AI response với products có sẵn
    // Trong thực tế, cần AI response có format structured hơn
    const lines = aiResponse.split("\n").filter((line) => line.includes("-"));

    lines.forEach((line, index) => {
      if (index >= 5) return; // Tối đa 5 recommendations

      const parts = line.split("-");
      if (parts.length >= 2) {
        // Tìm product phù hợp trong database
        const matchedProduct = this.findSimilarProduct(
          parts[0].trim(),
          availableProducts
        );

        if (matchedProduct) {
          recommendations.push({
            ...matchedProduct,
            reason: parts[1]?.trim() || "Được AI đề xuất",
            confidence: parseFloat(parts[2]?.trim()) || 0.8,
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Tìm sản phẩm tương tự trong database
   */
  private findSimilarProduct(searchTerm: string, products: any[]): any | null {
    const normalized = searchTerm.toLowerCase();

    // Tìm theo tên chính xác
    let found = products.find((p) => p.name.toLowerCase().includes(normalized));

    // Tìm theo category nếu không có tên
    if (!found) {
      const categories = ["serum", "cream", "kem", "sữa", "toner", "mask"];
      const matchedCategory = categories.find((cat) =>
        normalized.includes(cat)
      );

      if (matchedCategory) {
        const categoryProducts = products.filter(
          (p) =>
            p.category?.toLowerCase().includes(matchedCategory) ||
            p.name.toLowerCase().includes(matchedCategory)
        );
        found =
          categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
      }
    }

    return found || null;
  }

  /**
   * Fallback recommendations khi AI không khả dụng
   */
  private getFallbackRecommendations(products: any[]): ProductRecommendation[] {
    const shuffled = [...products].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, 5).map((product) => ({
      ...product,
      reason: "Sản phẩm phổ biến",
      confidence: 0.6,
    }));
  }

  /**
   * Trích xuất skin type từ AI response
   */
  private extractSkinType(text: string): string | undefined {
    const skinTypes = [
      "da khô",
      "da dầu",
      "da hỗn hợp",
      "da nhạy cảm",
      "da thường",
    ];
    return skinTypes.find((type) => text.toLowerCase().includes(type));
  }

  /**
   * Trích xuất concerns từ AI response
   */
  private extractConcerns(text: string): string[] {
    const concerns = [
      "mụn",
      "nám",
      "thâm",
      "nhăn",
      "lão hóa",
      "khô ráp",
      "dầu thừa",
    ];
    return concerns.filter((concern) => text.toLowerCase().includes(concern));
  }

  /**
   * Trích xuất keywords sản phẩm từ user message
   */
  private extractProductKeywords(message: string): string[] {
    const productKeywords = [
      // Skincare
      "tẩy trang",
      "cleanser",
      "sữa rửa mặt",
      "gel rửa mặt",
      "toner",
      "nước hoa hồng",
      "serum",
      "tinh chất",
      "kem dưỡng",
      "moisturizer",
      "kem chống nắng",
      "sunscreen",
      "mask",
      "mặt nạ",
      "kem mắt",
      "eye cream",
      "kem trị mụn",
      "acne cream",
      "kem trắng da",
      "whitening cream",

      // Makeup
      "kem nền",
      "foundation",
      "concealer",
      "che khuyết điểm",
      "phấn phủ",
      "powder",
      "má hồng",
      "blush",
      "son môi",
      "lipstick",
      "son bóng",
      "lip gloss",
      "mascara",
      "eyeliner",
      "kẻ mắt",
      "phấn mắt",
      "eyeshadow",

      // Haircare
      "dầu gội",
      "shampoo",
      "dầu xả",
      "conditioner",
      "kem ủ tóc",
      "hair mask",
      "serum tóc",
      "hair serum",

      // Body care
      "sữa tắm",
      "body wash",
      "kem body",
      "body lotion",
      "dưỡng thể",
      "body cream",
    ];

    const lowerMessage = message.toLowerCase();
    return productKeywords.filter((keyword) =>
      lowerMessage.includes(keyword.toLowerCase())
    );
  }

  /**
   * Tìm sản phẩm phù hợp từ user message
   */
  private findMatchingProducts(
    message: string,
    availableProducts: any[]
  ): ProductRecommendation[] {
    if (!availableProducts || availableProducts.length === 0) {
      return [];
    }

    const keywords = this.extractProductKeywords(message);
    const lowerMessage = message.toLowerCase();

    // Tìm sản phẩm match với keywords
    const matchedProducts = availableProducts.filter((product) => {
      const productName = product.name?.toLowerCase() || "";
      const productDesc = product.description?.toLowerCase() || "";
      const productCategory = product.category?.toLowerCase() || "";

      // Check exact keyword match
      const keywordMatch = keywords.some(
        (keyword) =>
          productName.includes(keyword.toLowerCase()) ||
          productDesc.includes(keyword.toLowerCase()) ||
          productCategory.includes(keyword.toLowerCase())
      );

      // Check semantic match
      const semanticMatch =
        (lowerMessage.includes("tẩy trang") &&
          (productName.includes("tẩy") ||
            productName.includes("làm sạch") ||
            productCategory.includes("cleanser"))) ||
        (lowerMessage.includes("dưỡng ẩm") &&
          (productName.includes("dưỡng") ||
            productName.includes("kem") ||
            productCategory.includes("moisturizer"))) ||
        (lowerMessage.includes("chống nắng") &&
          (productName.includes("chống nắng") ||
            productName.includes("spf") ||
            productCategory.includes("sunscreen"))) ||
        (lowerMessage.includes("trị mụn") &&
          (productName.includes("mụn") ||
            productName.includes("acne") ||
            productDesc.includes("mụn"))) ||
        (lowerMessage.includes("toner") &&
          (productName.includes("toner") ||
            productName.includes("nước hoa hồng"))) ||
        (lowerMessage.includes("serum") && productName.includes("serum"));

      return keywordMatch || semanticMatch;
    });

    // Convert to ProductRecommendation format
    return matchedProducts.slice(0, 3).map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price?.toString() || "0",
      image: product.image || "",
      description: product.description || "",
      category: product.category || "",
      reason: "Sản phẩm phù hợp với yêu cầu của bạn",
      confidence: 0.9,
    }));
  }

  /**
   * Reset rate limit timer (for new API key)
   */
  resetRateLimit() {
    this.lastRequestTime = 0;
    console.log("🔄 Rate limit timer reset for new API key");
  }

  /**
   * Đổi AI provider
   */
  switchProvider(provider: "openai" | "gemini") {
    this.currentProvider = provider;
  }
}

const aiServiceInstance = new AIService();
// Reset rate limit for new API key
aiServiceInstance.resetRateLimit();

export const aiService = aiServiceInstance;
