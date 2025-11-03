import axios from "axios";

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
  reason: string;
  confidence: number;
}

export interface BeautyAdviceResponse {
  advice: string;
  recommendedProducts?: ProductRecommendation[];
  skinType?: string;
  concerns?: string[];
}

// AI API configuration
const AI_API_CONFIG = {
  // OpenAI API
  openai: {
    baseURL: "https://api.openai.com/v1",
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  },
  // Gemini API (Direct)
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.5-flash",
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  },
  // OpenRouter API
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
    model: "openai/gpt-3.5-turbo",
  },
};

class AIService {
  private currentProvider: "openrouter" = "openrouter";
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000;

  /**
   * Wait for rate limit cooldown
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      // console.log(`⏳ Rate limit: waiting ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Call API to get cosmetic advice
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

      // Thử OpenRouter trước
      let response = await this.callOpenRouter(prompt);

      // Nếu OpenRouter thất bại, thử Gemini API trực tiếp
      if (!response) {
        // console.log("🔄 OpenRouter failed, trying Gemini API directly...");
        response = await this.callGemini(prompt);
      }

      if (response) {
        return {
          ...response,
          recommendedProducts: this.findMatchingProducts(
            userMessage,
            availableProducts || []
          ),
        };
      } else {
        // Không throw error, chỉ return offline advice với products
        // Tìm sản phẩm phù hợp trước
        const matchingProducts = this.findMatchingProducts(
          userMessage,
          availableProducts || []
        );

        // Nếu có sản phẩm phù hợp, dùng smart offline advice (không log error)
        if (matchingProducts.length > 0) {
          // console.log("ℹ️ AI APIs unavailable, using smart offline recommendations with products");
          return {
            advice: this.getSmartOfflineAdvice(userMessage, matchingProducts),
            recommendedProducts: matchingProducts,
          };
        }

        // Chỉ log warning khi không có products
        console.warn("⚠️ AI APIs unavailable and no matching products found");
        return {
          advice: this.getOfflineAdvice(userMessage),
          recommendedProducts: matchingProducts,
        };
      }
    } catch (error) {
      // Chỉ log error khi có exception thực sự (network error, etc.)
      // Nhưng vẫn cố gắng trả về products nếu có
      console.error("AI Service Error:", error);

      const matchingProducts = this.findMatchingProducts(
        userMessage,
        availableProducts || []
      );

      // Nếu có sản phẩm phù hợp, vẫn trả về smart offline advice
      if (matchingProducts.length > 0) {
        return {
          advice: this.getSmartOfflineAdvice(userMessage, matchingProducts),
          recommendedProducts: matchingProducts,
        };
      }

      return {
        advice: this.getOfflineAdvice(userMessage),
        recommendedProducts: matchingProducts,
      };
    }
  }

  /**
   * Smart offline advice khi có sản phẩm phù hợp
   */
  private getSmartOfflineAdvice(
    userMessage: string,
    matchingProducts: ProductRecommendation[]
  ): string {
    const lowerMessage = userMessage.toLowerCase();
    const productNames = matchingProducts
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ");

    // Tư vấn dựa trên nhu cầu cụ thể
    if (lowerMessage.includes("da dầu") || lowerMessage.includes("da nhờn")) {
      return `✨ **Tư vấn cho da dầu:**

Tôi đã tìm thấy những sản phẩm phù hợp với da dầu của bạn! Các sản phẩm được gợi ý đã được lựa chọn dựa trên công thức giúp kiểm soát dầu, thu nhỏ lỗ chân lông và giữ cho da sạch sẽ.

**Gợi ý routine:**
• Sáng: Sữa rửa mặt → Toner → Serum → Kem dưỡng (texture nhẹ) → Chống nắng
• Tối: Tẩy trang → Sữa rửa mặt → Toner → Serum → Kem dưỡng

Hãy xem các sản phẩm phù hợp bên dưới nhé! 💫`;
    }

    if (lowerMessage.includes("da khô")) {
      return `💧 **Tư vấn cho da khô:**

Tôi đã chọn những sản phẩm giàu dưỡng ẩm cho da khô của bạn! Các sản phẩm này sẽ giúp cung cấp độ ẩm và khóa ẩm hiệu quả.

**Gợi ý routine:**
• Sáng: Sữa rửa mặt dịu nhẹ → Toner → Serum cấp ẩm → Kem dưỡng giàu ceramide → Chống nắng
• Tối: Tẩy trang dầu → Sữa rửa mặt → Toner → Serum → Kem dưỡng dưỡng ẩm đậm đặc

Xem ngay các sản phẩm được gợi ý! 🌟`;
    }

    if (lowerMessage.includes("mụn") || lowerMessage.includes("acne")) {
      return `🎯 **Tư vấn trị mụn:**

Tôi đã tìm thấy các sản phẩm hỗ trợ điều trị mụn hiệu quả! Các sản phẩm này chứa các thành phần như salicylic acid, benzoyl peroxide, hoặc tea tree oil.

**Lưu ý:**
• Sử dụng nhẹ nhàng, không chà xát mạnh
• Kết hợp với kem dưỡng ẩm để tránh khô da
• Luôn dùng chống nắng ban ngày
• Kiên nhẫn, kết quả thường thấy sau 4-6 tuần

Các sản phẩm được đề xuất phù hợp với nhu cầu của bạn! ✨`;
    }

    // Default smart advice
    return `💡 **Tư vấn chuyên biệt:**

Dựa trên yêu cầu của bạn, tôi đã tìm thấy những sản phẩm phù hợp! Mặc dù hệ thống AI đang tạm thời không khả dụng, nhưng các sản phẩm được gợi ý đã được lựa chọn thông minh dựa trên:

✅ Nhu cầu cụ thể của bạn
✅ Loại da và mối quan tâm về da
✅ Đánh giá từ khách hàng khác
✅ Công thức và thành phần sản phẩm

Hãy xem ngay các sản phẩm được đề xuất bên dưới để tìm được sản phẩm phù hợp nhất! 🌟`;
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

Hiện tại hệ thống AI đang bảo trì (do rate limit hoặc lỗi kết nối), nhưng bạn vẫn có thể:

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
      skinType?: string;
      age?: number;
      concerns?: string[];
    },
    existingRecommendations: string[] = [] // IDs của sản phẩm đã được đề xuất
  ): Promise<ProductRecommendation[]> {
    try {
      // Wait for rate limit
      await this.waitForRateLimit();

      // Lọc bỏ sản phẩm đã được đề xuất và đã mua
      const excludedIds = new Set([
        ...existingRecommendations,
        ...(userBehavior.purchaseHistory || []),
        ...(userBehavior.viewedProducts || []).slice(0, 3), // Loại bỏ 3 sản phẩm vừa xem gần nhất
      ]);

      const availableProducts = currentProducts.filter(
        (product) => !excludedIds.has(product.id)
      );

      // console.log("🔍 Generating smart recommendations:", {
      //   totalProducts: currentProducts.length,
      //   availableAfterFilter: availableProducts.length,
      //   excludedCount: excludedIds.size,
      //   userSkinType: userBehavior.skinType,
      //   userConcerns: userBehavior.concerns,
      //   purchaseHistory: userBehavior.purchaseHistory?.slice(0, 3),
      // });

      let recommendations: ProductRecommendation[] = [];

      // 1. Recommendations dựa trên profile người dùng (skin type, concerns)
      if (userBehavior.skinType || userBehavior.concerns) {
        const profileBasedRecs = this.getRecommendationsBasedOnProfile(
          availableProducts,
          userBehavior.skinType,
          userBehavior.concerns,
          userBehavior.age
        );
        recommendations = [...recommendations, ...profileBasedRecs];
        // console.log(
        //   `👤 Profile-based recommendations: ${profileBasedRecs.length}`
        // );
      }

      // 2. Recommendations dựa trên lịch sử mua hàng
      const purchaseBasedRecs = this.getRecommendationsBasedOnPurchaseHistory(
        availableProducts,
        userBehavior.purchaseHistory || []
      );
      recommendations = [...recommendations, ...purchaseBasedRecs];
      // console.log(
      //   `🛒 Purchase-based recommendations: ${purchaseBasedRecs.length}`
      // );

      // 3. Recommendations dựa trên sản phẩm đã xem
      if (recommendations.length < 5) {
        const viewedBasedRecs = this.getRecommendationsBasedOnViewed(
          availableProducts,
          userBehavior.viewedProducts || [],
          recommendations.map((r) => r.id)
        );
        recommendations = [...recommendations, ...viewedBasedRecs];
        // console.log(
        //   `👀 Viewed-based recommendations: ${viewedBasedRecs.length}`
        // );
      }

      // 4. Recommendations dựa trên search history
      if (recommendations.length < 5 && userBehavior.searchHistory?.length) {
        const searchBasedRecs = this.getRecommendationsBasedOnSearchHistory(
          availableProducts,
          userBehavior.searchHistory,
          recommendations.map((r) => r.id)
        );
        recommendations = [...recommendations, ...searchBasedRecs];
        // console.log(
        //   `🔍 Search-based recommendations: ${searchBasedRecs.length}`
        // );
      }

      // 5. AI-powered recommendations nếu vẫn chưa đủ
      if (recommendations.length < 5) {
        const prompt = this.buildAdvancedRecommendationPrompt(
          availableProducts,
          userBehavior,
          recommendations.map((r) => r.id)
        );

        // Thử OpenRouter trước
        let response = await this.callOpenRouter(prompt);

        // Nếu OpenRouter thất bại, thử Gemini API trực tiếp
        if (!response) {
          // console.log(
          //   "🔄 OpenRouter failed in recommendations, trying Gemini API directly..."
          // );
          response = await this.callGemini(prompt);
        }

        if (response) {
          const aiRecs = this.parseRecommendations(
            response.advice,
            availableProducts
          );
          recommendations = [...recommendations, ...aiRecs];
          // console.log(`🤖 AI-powered recommendations: ${aiRecs.length}`);
        }
      }

      // 6. Fallback recommendations nếu vẫn chưa đủ
      if (recommendations.length < 5) {
        const fallbackRecs = this.getFallbackRecommendations(availableProducts);
        recommendations = [...recommendations, ...fallbackRecs];
        // console.log(`🔄 Fallback recommendations: ${fallbackRecs.length}`);
      }

      // 7. Popular recommendations cho user mới hoàn toàn
      if (recommendations.length === 0 && availableProducts.length > 0) {
        // console.log(
        //   "🆕 New user detected, generating popular product recommendations"
        // );
        recommendations =
          this.getPopularProductRecommendations(availableProducts);
      }

      // Loại bỏ duplicate và giới hạn số lượng
      const uniqueRecommendations =
        this.removeDuplicateRecommendations(recommendations);
      const finalRecommendations = uniqueRecommendations.slice(0, 5);

      // console.log(
      //   `✅ Final smart recommendations: ${finalRecommendations.length}`,
      //   finalRecommendations.map(
      //     (r) => `${r.name} (${r.confidence.toFixed(2)})`
      //   )
      // );

      return finalRecommendations;
    } catch (error) {
      console.error("Smart Recommendations Error:", error);
      const availableProducts = currentProducts.filter(
        (product) => !existingRecommendations.includes(product.id)
      );
      return this.getFallbackRecommendations(availableProducts);
    }
  }

  /**
   * Gọi OpenAI API
   */
  /**
   * Gọi OpenRouter API với ChatGPT model
   */
  private async callOpenRouter(prompt: string): Promise<BeautyAdviceResponse> {
    const config = AI_API_CONFIG.openrouter;

    // Debug logs
    // console.log("🔧 OpenRouter API Config:", {
    //   apiKey: config.apiKey.substring(0, 10) + "...",
    //   model: config.model,
    //   baseURL: config.baseURL,
    // });

    // Thử các model khác nhau nếu gặp lỗi
    const models = [
      "openai/gpt-3.5-turbo",
      "openai/gpt-4o-mini",
      "anthropic/claude-3-haiku",
      "google/gemini-pro",
    ];

    for (const model of models) {
      const payload = {
        model: model,
        messages: [
          {
            role: "system",
            content:
              "Bạn là chuyên gia tư vấn mỹ phẩm chuyên nghiệp. Hãy đưa ra lời khuyên hữu ích, an toàn và phù hợp với từng loại da. Trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ thông tin.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.95,
      };

      try {
        // console.log(`🔄 Trying model: ${model}`);

        const response = await axios.post(
          `${config.baseURL}/chat/completions`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://halora-cosmetic.com",
              "X-Title": "Halora Cosmetic App",
            },
            timeout: 20000,
          }
        );

        const advice = response.data.choices[0].message.content;
        // console.log(`✅ OpenRouter API Success with model: ${model}`);

        return {
          advice,
          skinType: this.extractSkinType(advice),
          concerns: this.extractConcerns(advice),
        };
      } catch (error: any) {
        const status = error.response?.status;
        // console.log(`❌ Model ${model} failed:`, status || error.message);

        if (status === 429) {
          // console.log("⚠️ Rate limit exceeded, trying next model...");
          continue;
        } else if (status === 401) {
          // console.log("⚠️ API key invalid, trying next model...");
          continue;
        } else if (status === 402) {
          // console.log("⚠️ Payment required, trying next model...");
          continue;
        } else if (status === 400) {
          // console.log(
          //   "⚠️ Bad request (model not available), trying next model..."
          // );
          continue;
        }

        // Nếu không phải lỗi model-specific, thử model tiếp theo
        continue;
      }
    }

    // console.log(
    //   "❌ All OpenRouter models failed, falling back to offline advice"
    // );
    return null as any;
  }

  /**
   * Gọi Gemini API với fallback endpoints (backup method)
   */
  private async callGemini(prompt: string): Promise<BeautyAdviceResponse> {
    const config = AI_API_CONFIG.gemini;

    // Debug logs
    // console.log("🔧 Gemini API Config:", {
    //   apiKey: config.apiKey.substring(0, 10) + "...",
    //   model: config.model,
    //   baseURL: config.baseURL,
    // });

    // use the most stable endpoint
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

    // try each endpoint until success
    for (const endpoint of endpoints) {
      try {
        const url = `${endpoint.baseURL}/models/${endpoint.model}:generateContent?key=${config.apiKey}`;
        // console.log("🔗 Trying URL:", url);

        const response = await axios.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });

        const advice = response.data.candidates[0].content.parts[0].text;
        // console.log("✅ Gemini API Success with:", endpoint.model);

        return {
          advice,
          skinType: this.extractSkinType(advice),
          concerns: this.extractConcerns(advice),
        };
      } catch (error: any) {
        const status = error.response?.status;
        // console.log(
        //   `❌ Failed with ${endpoint.model}:`,
        //   status || error.message
        // );

        if (status === 429) {
          // console.log("⚠️ Rate limit exceeded, will use offline advice");
          break;
        } else if (status === 403) {
          // console.log("⚠️ API key invalid, will use offline advice");
          break;
        } else if (status === 404) {
          // console.log("❌ Endpoint không tồn tại, thử endpoint khác...");
          continue;
        }

        // console.log(`⚠️ API Error ${status}, will use offline advice`);
        break;
      }
    }
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
          prompt += `${index + 1}. ${
            product.name
          } - ${this.getFirstVariantPrice(product)} VNĐ\n`;
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
   * Recommendations dựa trên profile người dùng
   */
  private getRecommendationsBasedOnProfile(
    availableProducts: any[],
    skinType?: string,
    concerns?: string[],
    age?: number
  ): ProductRecommendation[] {
    if (!skinType && !concerns?.length) return [];

    const recommendations: ProductRecommendation[] = [];

    // Tìm sản phẩm phù hợp với skin type
    if (skinType) {
      const skinCompatibleProducts = availableProducts.filter((product) => {
        const score = this.checkSkinTypeCompatibility(product, skinType);
        return score > 0.3; // Chỉ lấy sản phẩm có compatibility > 30%
      });

      skinCompatibleProducts.slice(0, 2).forEach((product) => {
        recommendations.push({
          id: product.id,
          name: product.name,
          price: this.getFirstVariantPrice(product),
          image: this.getValidImageUrl(product),
          description: product.description || "",
          category: product.category || "",
          reason: `Phù hợp với ${skinType}`,
          confidence: 0.85,
        });
      });
    }

    // Tìm sản phẩm giải quyết concerns
    if (concerns?.length) {
      const concernProducts = availableProducts.filter((product) => {
        const productDesc = product.description?.toLowerCase() || "";
        const productName = product.name?.toLowerCase() || "";
        return concerns.some(
          (concern) =>
            productDesc.includes(concern.toLowerCase()) ||
            productName.includes(concern.toLowerCase())
        );
      });

      concernProducts.slice(0, 2).forEach((product) => {
        const matchedConcerns = concerns.filter(
          (concern) =>
            product.description
              ?.toLowerCase()
              .includes(concern.toLowerCase()) ||
            product.name?.toLowerCase().includes(concern.toLowerCase())
        );

        recommendations.push({
          id: product.id,
          name: product.name,
          price: this.getFirstVariantPrice(product),
          image: this.getValidImageUrl(product),
          description: product.description || "",
          category: product.category || "",
          reason: `Giải quyết vấn đề: ${matchedConcerns.join(", ")}`,
          confidence: 0.8,
        });
      });
    }

    return recommendations;
  }

  /**
   * Recommendations dựa trên search history
   */
  private getRecommendationsBasedOnSearchHistory(
    availableProducts: any[],
    searchHistory: string[],
    excludeIds: string[]
  ): ProductRecommendation[] {
    if (!searchHistory.length) return [];

    const recommendations: ProductRecommendation[] = [];
    const recentSearches = searchHistory.slice(0, 3);

    for (const searchTerm of recentSearches) {
      const matchingProducts = availableProducts.filter((product) => {
        if (excludeIds.includes(product.id)) return false;

        const productName = product.name?.toLowerCase() || "";
        const productDesc = product.description?.toLowerCase() || "";
        const productCategory = product.category?.toLowerCase() || "";

        return (
          productName.includes(searchTerm.toLowerCase()) ||
          productDesc.includes(searchTerm.toLowerCase()) ||
          productCategory.includes(searchTerm.toLowerCase())
        );
      });

      if (matchingProducts.length > 0) {
        const selectedProduct = matchingProducts[0];
        recommendations.push({
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: this.getFirstVariantPrice(selectedProduct),
          image: this.getValidImageUrl(selectedProduct),
          description: selectedProduct.description || "",
          category: selectedProduct.category || "",
          reason: `Dựa trên tìm kiếm: "${searchTerm}"`,
          confidence: 0.75,
        });

        if (recommendations.length >= 2) break;
      }
    }

    return recommendations;
  }

  /**
   * Xây dựng prompt nâng cao cho recommendations
   */
  private buildAdvancedRecommendationPrompt(
    currentProducts: any[],
    userBehavior: any,
    excludeIds: string[]
  ): string {
    const productCategories = [
      ...new Set(currentProducts.map((p) => p.category)),
    ];
    const availableProducts = currentProducts.filter(
      (p) => !excludeIds.includes(p.id)
    );

    let prompt = `Dựa trên thông tin người dùng và sản phẩm có sẵn, hãy gợi ý sản phẩm phù hợp:

**Thông tin người dùng:**
- Loại da: ${userBehavior.skinType || "chưa xác định"}
- Tuổi: ${userBehavior.age || "không rõ"}
- Vấn đề da: ${userBehavior.concerns?.join(", ") || "không có"}
- Sản phẩm đã xem: ${
      userBehavior.viewedProducts?.slice(0, 3).join(", ") || "không có"
    }
- Lịch sử tìm kiếm: ${
      userBehavior.searchHistory?.slice(0, 3).join(", ") || "không có"
    }
- Sản phẩm đã mua: ${
      userBehavior.purchaseHistory?.slice(0, 3).join(", ") || "không có"
    }

**Sản phẩm có sẵn:**`;

    // Thêm thông tin sản phẩm có sẵn
    availableProducts.slice(0, 10).forEach((product, index) => {
      prompt += `\n${index + 1}. ${product.name} - ${
        product.category
      } - ${this.getFirstVariantPrice(product)} VNĐ`;
    });

    prompt += `\n\nHãy gợi ý 3-5 sản phẩm phù hợp nhất với format:
[TÊN SẢN PHẨM] - [LÝ DO ĐỀ XUẤT] - [ĐỘ TIN CẬY 0-1]

Ưu tiên:
1. Phù hợp với loại da và vấn đề da
2. Bổ sung cho routine hiện tại
3. Sản phẩm chất lượng, giá hợp lý`;

    return prompt;
  }

  /**
   * Xây dựng prompt cho recommendations (legacy)
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
    const lines = aiResponse.split("\n").filter((line) => line.includes("-"));

    lines.forEach((line, index) => {
      if (index >= 5) return;

      const parts = line.split("-");
      if (parts.length >= 2) {
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
    const normalized = searchTerm?.toLowerCase() || "";
    let found = products.find((p) =>
      p.name?.toLowerCase()?.includes(normalized)
    );
    if (!found) {
      const categories = ["serum", "cream", "kem", "sữa", "toner", "mask"];
      const matchedCategory = categories.find((cat) =>
        normalized.includes(cat)
      );

      if (matchedCategory) {
        const categoryProducts = products.filter(
          (p) =>
            p.category?.toLowerCase()?.includes(matchedCategory) ||
            p.name?.toLowerCase()?.includes(matchedCategory)
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
   * Tạo gợi ý cho user mới dựa trên sản phẩm phổ biến và đa dạng category
   */
  private getPopularProductRecommendations(
    products: any[]
  ): ProductRecommendation[] {
    if (!products || products.length === 0) return [];

    // console.log("🌟 Creating popular product recommendations for new user");

    // Phân loại sản phẩm theo category
    const productsByCategory = products.reduce((acc: any, product: any) => {
      const category = product.category?.toLowerCase() || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});

    const recommendations: ProductRecommendation[] = [];

    // Ưu tiên các category phổ biến
    const popularCategories = [
      "skincare",
      "tẩy trang",
      "serum",
      "kem dưỡng",
      "toner",
      "makeup",
      "son môi",
      "kem nền",
      "phấn",
      "chăm sóc tóc",
      "dầu gội",
      "dầu xả",
    ];

    // Lấy 1-2 sản phẩm từ mỗi category phổ biến
    for (const category of popularCategories) {
      const categoryProducts = productsByCategory[category];
      if (categoryProducts && categoryProducts.length > 0) {
        // Sắp xếp theo giá (trung bình trước) để phù hợp với nhiều user
        const sortedProducts = categoryProducts.sort((a: any, b: any) => {
          const priceA = parseInt(
            a.price?.toString().replace(/\D/g, "") || "0"
          );
          const priceB = parseInt(
            b.price?.toString().replace(/\D/g, "") || "0"
          );
          return priceA - priceB; // Giá thấp trước
        });

        // Lấy 1 sản phẩm từ category này
        const selectedProduct = sortedProducts[0];
        recommendations.push({
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: this.getFirstVariantPrice(selectedProduct),
          image: this.getValidImageUrl(selectedProduct),
          description: selectedProduct.description || "",
          category: selectedProduct.category || "",
          reason: this.generateNewUserReason(category),
          confidence: 0.7,
        });

        if (recommendations.length >= 5) break;
      }
    }

    // Nếu vẫn chưa đủ 5, lấy random từ các sản phẩm còn lại
    if (recommendations.length < 5) {
      const usedIds = new Set(recommendations.map((r) => r.id));
      const remainingProducts = products.filter((p) => !usedIds.has(p.id));
      const shuffled = remainingProducts.sort(() => 0.5 - Math.random());

      for (const product of shuffled.slice(0, 5 - recommendations.length)) {
        recommendations.push({
          id: product.id,
          name: product.name,
          price: this.getFirstVariantPrice(product),
          image: this.getValidImageUrl(product),
          description: product.description || "",
          category: product.category || "",
          reason: "Sản phẩm được yêu thích",
          confidence: 0.65,
        });
      }
    }

    // console.log(
    //   `🌟 Generated ${recommendations.length} popular recommendations`
    // );
    return recommendations;
  }

  /**
   * Tạo lý do đề xuất cho user mới theo category
   */
  private generateNewUserReason(category: string): string {
    const reasonMap: { [key: string]: string } = {
      skincare: "Sản phẩm chăm sóc da cơ bản",
      "tẩy trang": "Bước đầu tiên trong skincare routine",
      serum: "Tinh chất dưỡng da hiệu quả",
      "kem dưỡng": "Cần thiết cho mọi loại da",
      toner: "Cân bằng độ pH cho da",
      makeup: "Trang điểm tự nhiên hàng ngày",
      "son môi": "Điểm nhấn cho đôi môi",
      "kem nền": "Nền trang điểm hoàn hảo",
      phấn: "Hoàn thiện lớp trang điểm",
      "chăm sóc tóc": "Chăm sóc tóc khỏe mạnh",
      "dầu gội": "Làm sạch tóc hiệu quả",
      "dầu xả": "Dưỡng tóc mềm mượt",
      other: "Sản phẩm chất lượng được ưa chuộng",
    };

    return reasonMap[category] || "Sản phẩm chất lượng được ưa chuộng";
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
    return skinTypes.find((type) => text?.toLowerCase()?.includes(type));
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
    return concerns.filter((concern) => text?.toLowerCase()?.includes(concern));
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

    const lowerMessage = message?.toLowerCase() || "";
    return productKeywords.filter((keyword) =>
      lowerMessage.includes(keyword?.toLowerCase() || "")
    );
  }

  /**
   * Lấy giá từ variant đầu tiên của sản phẩm
   */
  private getFirstVariantPrice(product: any): string {
    if (
      !product.variants ||
      !Array.isArray(product.variants) ||
      product.variants.length === 0
    ) {
      return "0";
    }

    const firstVariant = product.variants[0];
    if (!firstVariant || !firstVariant.price || firstVariant.price <= 0) {
      return "0";
    }

    return firstVariant.price.toString();
  }

  /**
   * Tìm sản phẩm phù hợp từ user message với AI thông minh
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

    // Phân tích loại da và nhu cầu từ message
    const skinType = this.extractSkinTypeFromMessage(message);
    const concerns = this.extractConcernsFromMessage(message);
    const productType = this.extractProductTypeFromMessage(message);

    // console.log("🔍 Product matching analysis:", {
    //   keywords,
    //   skinType,
    //   concerns,
    //   productType,
    //   message: message.substring(0, 50) + "...",
    // });

    // Tìm sản phẩm với scoring system thông minh
    const scoredProducts = availableProducts.map((product) => {
      const score = this.calculateProductMatchScore(
        product,
        message,
        keywords,
        skinType,
        concerns,
        productType
      );
      return { product, score };
    });

    // Sắp xếp theo điểm số và lấy top products
    const topProducts = scoredProducts
      .filter(({ score }) => score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ product, score }) => ({
        id: product.id,
        name: product.name,
        price: this.getFirstVariantPrice(product),
        image: this.getValidImageUrl(product),
        description: product.description || "",
        category: product.category || "",
        reason: this.generateSmartReasonForProduct(
          product,
          message,
          skinType,
          concerns
        ),
        confidence: Math.min(score, 0.95), // Giới hạn confidence tối đa 0.95
      }));

    // console.log(
    //   `✅ Found ${topProducts.length} matching products with scores:`,
    //   topProducts.map((p) => `${p.name}: ${p.confidence.toFixed(2)}`)
    // );

    return topProducts;
  }

  /**
   * Tính điểm phù hợp của sản phẩm với nhu cầu người dùng
   */
  private calculateProductMatchScore(
    product: any,
    message: string,
    keywords: string[],
    skinType?: string,
    concerns?: string[],
    productType?: string
  ): number {
    let score = 0;
    const productName = product.name?.toLowerCase() || "";
    const productDesc = product.description?.toLowerCase() || "";
    const productCategory = product.category?.toLowerCase() || "";
    const lowerMessage = message.toLowerCase();

    // 1. Keyword matching (40% trọng số)
    const keywordMatches = keywords.filter(
      (keyword) =>
        productName.includes(keyword.toLowerCase()) ||
        productDesc.includes(keyword.toLowerCase()) ||
        productCategory.includes(keyword.toLowerCase())
    );
    score += (keywordMatches.length / keywords.length) * 0.4;

    // 2. Product type matching (30% trọng số)
    if (productType) {
      const typeKeywords = this.getProductTypeKeywords(productType);
      const typeMatch = typeKeywords.some(
        (keyword) =>
          productName.includes(keyword) || productCategory.includes(keyword)
      );
      if (typeMatch) score += 0.3;
    }

    // 3. Skin type compatibility (20% trọng số)
    if (skinType) {
      const skinCompatibility = this.checkSkinTypeCompatibility(
        product,
        skinType
      );
      score += skinCompatibility * 0.2;
    }

    // 4. Concerns addressing (10% trọng số)
    if (concerns && concerns.length > 0) {
      const concernsAddressed = concerns.filter(
        (concern) =>
          productDesc.includes(concern.toLowerCase()) ||
          productName.includes(concern.toLowerCase())
      );
      score += (concernsAddressed.length / concerns.length) * 0.1;
    }

    // Bonus points cho semantic matching
    const semanticBonus = this.calculateSemanticBonus(product, lowerMessage);
    score += semanticBonus;

    return Math.min(score, 1.0); // Giới hạn điểm tối đa là 1.0
  }

  /**
   * Kiểm tra tương thích với loại da
   */
  private checkSkinTypeCompatibility(product: any, skinType: string): number {
    const productName = product.name?.toLowerCase() || "";
    const productDesc = product.description?.toLowerCase() || "";

    const compatibilityMap: { [key: string]: string[] } = {
      "da dầu": ["gel", "toner", "kiểm soát dầu", "sebum", "matte", "oil-free"],
      "da khô": ["dưỡng ẩm", "moisturizer", "hydrating", "nourishing", "cream"],
      "da nhạy cảm": [
        "dịu nhẹ",
        "gentle",
        "sensitive",
        "không cồn",
        "hypoallergenic",
      ],
      "da hỗn hợp": ["cân bằng", "balancing", "combination", "đa năng"],
    };

    const compatibleKeywords = compatibilityMap[skinType] || [];
    const matchCount = compatibleKeywords.filter(
      (keyword) =>
        productName.includes(keyword) || productDesc.includes(keyword)
    ).length;

    return matchCount / compatibleKeywords.length;
  }

  /**
   * Tính bonus điểm cho semantic matching
   */
  private calculateSemanticBonus(product: any, message: string): number {
    const productName = product.name?.toLowerCase() || "";
    const productCategory = product.category?.toLowerCase() || "";

    const semanticRules = [
      {
        pattern: /tẩy trang|cleanser|rửa mặt/,
        keywords: ["tẩy", "cleanser", "rửa", "làm sạch"],
        weight: 0.15,
      },
      {
        pattern: /dưỡng ẩm|moisturizer|kem dưỡng/,
        keywords: ["dưỡng", "moisturizer", "kem", "cream"],
        weight: 0.15,
      },
      {
        pattern: /chống nắng|sunscreen|spf/,
        keywords: ["chống nắng", "sunscreen", "spf", "uv"],
        weight: 0.15,
      },
      {
        pattern: /serum|tinh chất/,
        keywords: ["serum", "tinh chất", "essence"],
        weight: 0.15,
      },
      {
        pattern: /trị mụn|acne/,
        keywords: ["mụn", "acne", "trị mụn", "anti-acne"],
        weight: 0.15,
      },
    ];

    for (const rule of semanticRules) {
      if (rule.pattern.test(message)) {
        const hasKeyword = rule.keywords.some(
          (keyword) =>
            productName.includes(keyword) || productCategory.includes(keyword)
        );
        if (hasKeyword) return rule.weight;
      }
    }

    return 0;
  }

  /**
   * Trích xuất loại da từ message
   */
  private extractSkinTypeFromMessage(message: string): string | undefined {
    const skinTypes = [
      "da dầu",
      "da khô",
      "da hỗn hợp",
      "da nhạy cảm",
      "da thường",
    ];
    const lowerMessage = message?.toLowerCase() || "";
    return skinTypes.find((type) => lowerMessage.includes(type));
  }

  /**
   * Trích xuất concerns từ message
   */
  private extractConcernsFromMessage(message: string): string[] {
    const concerns = [
      "mụn",
      "nám",
      "thâm",
      "nhăn",
      "lão hóa",
      "khô ráp",
      "dầu thừa",
      "lỗ chân lông",
      "sạm da",
      "không đều màu",
      "viêm",
      "kích ứng",
    ];
    const lowerMessage = message?.toLowerCase() || "";
    return concerns.filter((concern) => lowerMessage.includes(concern));
  }

  /**
   * Trích xuất loại sản phẩm từ message
   */
  private extractProductTypeFromMessage(message: string): string | undefined {
    const productTypes = [
      "tẩy trang",
      "cleanser",
      "toner",
      "serum",
      "kem dưỡng",
      "moisturizer",
      "chống nắng",
      "sunscreen",
      "mask",
      "mặt nạ",
      "kem mắt",
      "eye cream",
    ];
    const lowerMessage = message?.toLowerCase() || "";
    return productTypes.find((type) => lowerMessage.includes(type));
  }

  /**
   * Lấy keywords cho loại sản phẩm
   */
  private getProductTypeKeywords(productType: string): string[] {
    const typeKeywordMap: { [key: string]: string[] } = {
      "tẩy trang": ["tẩy", "cleanser", "rửa", "làm sạch"],
      cleanser: ["tẩy", "cleanser", "rửa", "làm sạch"],
      toner: ["toner", "nước hoa hồng", "cân bằng"],
      serum: ["serum", "tinh chất", "essence"],
      "kem dưỡng": ["kem", "dưỡng", "moisturizer", "cream"],
      moisturizer: ["kem", "dưỡng", "moisturizer", "cream"],
      "chống nắng": ["chống nắng", "sunscreen", "spf", "uv"],
      sunscreen: ["chống nắng", "sunscreen", "spf", "uv"],
      mask: ["mask", "mặt nạ", "treatment"],
      "mặt nạ": ["mask", "mặt nạ", "treatment"],
      "kem mắt": ["kem mắt", "eye cream", "eye"],
      "eye cream": ["kem mắt", "eye cream", "eye"],
    };
    return typeKeywordMap[productType] || [];
  }

  /**
   * Tạo lý do thông minh cho sản phẩm được đề xuất
   */
  private generateSmartReasonForProduct(
    product: any,
    message: string,
    skinType?: string,
    concerns?: string[]
  ): string {
    const productName = product?.name?.toLowerCase() || "";
    const lowerMessage = message?.toLowerCase() || "";

    // Lý do dựa trên loại da
    if (skinType) {
      if (
        skinType === "da dầu" &&
        (productName.includes("gel") || productName.includes("toner"))
      ) {
        return "Phù hợp cho da dầu, kiểm soát bã nhờn hiệu quả";
      }
      if (
        skinType === "da khô" &&
        (productName.includes("dưỡng") || productName.includes("cream"))
      ) {
        return "Cung cấp độ ẩm sâu cho da khô";
      }
      if (
        skinType === "da nhạy cảm" &&
        (productName.includes("dịu nhẹ") || productName.includes("gentle"))
      ) {
        return "Dịu nhẹ, an toàn cho da nhạy cảm";
      }
    }

    // Lý do dựa trên concerns
    if (concerns) {
      if (concerns.includes("mụn") && productName.includes("mụn")) {
        return "Hiệu quả trong việc điều trị và ngăn ngừa mụn";
      }
      if (
        concerns.includes("lão hóa") &&
        (productName.includes("anti-aging") || productName.includes("retinol"))
      ) {
        return "Chống lão hóa, làm trẻ hóa da";
      }
      if (
        concerns.includes("nám") &&
        (productName.includes("whitening") ||
          productName.includes("brightening"))
      ) {
        return "Làm sáng da, giảm nám hiệu quả";
      }
    }

    // Lý do dựa trên loại sản phẩm
    if (lowerMessage.includes("tẩy trang") && productName.includes("tẩy")) {
      return "Làm sạch sâu, loại bỏ makeup và bụi bẩn";
    }
    if (lowerMessage.includes("chống nắng") && productName.includes("spf")) {
      return "Bảo vệ da khỏi tia UV có hại";
    }
    if (lowerMessage.includes("serum") && productName.includes("serum")) {
      return "Cung cấp dưỡng chất tập trung, thẩm thấu nhanh";
    }
    if (lowerMessage.includes("dưỡng ẩm") && productName.includes("dưỡng")) {
      return "Cấp ẩm và nuôi dưỡng da suốt ngày";
    }

    // Lý do mặc định thông minh
    const category = product.category?.toLowerCase() || "";
    if (category.includes("skincare")) {
      return "Sản phẩm chăm sóc da chất lượng cao";
    } else if (category.includes("makeup")) {
      return "Trang điểm tự nhiên, bền màu";
    }

    return "Được nhiều khách hàng tin dùng và đánh giá cao";
  }

  /**
   * Tạo recommendations dựa trên lịch sử mua hàng
   */
  private getRecommendationsBasedOnPurchaseHistory(
    availableProducts: any[],
    purchaseHistory: string[]
  ): ProductRecommendation[] {
    if (!purchaseHistory.length) return [];

    const recommendations: ProductRecommendation[] = [];

    // Lấy thông tin các sản phẩm đã mua
    const purchasedProducts = purchaseHistory
      .map((id) => availableProducts.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 3); // Chỉ xem 3 sản phẩm gần nhất

    // console.log(
    //   "📦 Purchased products for analysis:",
    //   purchasedProducts.map((p) => p?.name)
    // );

    for (const purchasedProduct of purchasedProducts) {
      if (!purchasedProduct) continue;

      // Tìm sản phẩm cùng category hoặc tương tự
      const similarProducts = this.findSimilarProductsByCategory(
        availableProducts,
        purchasedProduct,
        recommendations.map((r) => r.id)
      );

      recommendations.push(...similarProducts);

      if (recommendations.length >= 5) break;
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Tìm sản phẩm tương tự dựa trên category và features
   */
  private findSimilarProductsByCategory(
    availableProducts: any[],
    referenceProduct: any,
    excludeIds: string[]
  ): ProductRecommendation[] {
    const category = referenceProduct.category?.toLowerCase() || "";
    const name = referenceProduct.name?.toLowerCase() || "";
    const recommendations: ProductRecommendation[] = [];

    // Phân loại sản phẩm để tìm tương tự
    const categoryKeywords = this.extractCategoryKeywords(name, category);

    const similarProducts = availableProducts.filter((product) => {
      if (
        excludeIds.includes(product.id) ||
        product.id === referenceProduct.id
      ) {
        return false;
      }

      const productName = product.name?.toLowerCase() || "";
      const productCategory = product.category?.toLowerCase() || "";

      // Kiểm tra cùng category chính xác
      if (productCategory === category) return true;

      // Kiểm tra keywords tương tự
      return categoryKeywords.some(
        (keyword) =>
          productName.includes(keyword) || productCategory.includes(keyword)
      );
    });

    // Sort theo mức độ tương tự và chọn top 2
    const scored = similarProducts
      .map((product) => ({
        product,
        score: this.calculateSimilarityScore(referenceProduct, product),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    for (const { product } of scored) {
      recommendations.push({
        id: product.id,
        name: product.name,
        price: this.getFirstVariantPrice(product),
        image: this.getValidImageUrl(product),
        description: product.description || "",
        category: product.category || "",
        reason: this.generatePurchaseBasedReason(referenceProduct, product),
        confidence: 0.85,
      });
    }

    return recommendations;
  }

  /**
   * Tạo recommendations dựa trên sản phẩm đã xem
   */
  private getRecommendationsBasedOnViewed(
    availableProducts: any[],
    viewedProducts: string[],
    excludeIds: string[]
  ): ProductRecommendation[] {
    if (!viewedProducts.length) return [];

    const recommendations: ProductRecommendation[] = [];
    const recentViewed = viewedProducts.slice(0, 2); // 2 sản phẩm xem gần nhất

    for (const viewedId of recentViewed) {
      const viewedProduct = availableProducts.find((p) => p.id === viewedId);
      if (!viewedProduct) continue;

      const similar = this.findSimilarProductsByCategory(
        availableProducts,
        viewedProduct,
        [...excludeIds, ...recommendations.map((r) => r.id)]
      );

      // Cập nhật reason cho viewed-based recommendations
      similar.forEach((rec) => {
        rec.reason = `Vì bạn đã xem ${viewedProduct.name}`;
        rec.confidence = 0.75;
      });

      recommendations.push(...similar);
      if (recommendations.length >= 3) break;
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Loại bỏ recommendations trùng lặp
   */
  private removeDuplicateRecommendations(
    recommendations: ProductRecommendation[]
  ): ProductRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter((rec) => {
      if (seen.has(rec.id)) return false;
      seen.add(rec.id);
      return true;
    });
  }

  /**
   * Trích xuất category keywords để tìm sản phẩm tương tự
   */
  private extractCategoryKeywords(name: string, category: string): string[] {
    const keywords = new Set<string>();

    // Thêm category chính
    if (category) keywords.add(category);

    // Phân tích tên sản phẩm để tìm keywords
    const nameWords = name?.split(/\s+/)?.map((w) => w?.toLowerCase()) || [];

    // Skincare keywords
    const skincareKeywords = [
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
    ];

    // Makeup keywords
    const makeupKeywords = [
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
    ];

    // Haircare keywords
    const haircareKeywords = [
      "dầu gội",
      "shampoo",
      "dầu xả",
      "conditioner",
      "kem ủ tóc",
      "hair mask",
      "serum tóc",
      "hair serum",
    ];

    const allKeywords = [
      ...skincareKeywords,
      ...makeupKeywords,
      ...haircareKeywords,
    ];

    for (const keyword of allKeywords) {
      if (name.includes(keyword)) {
        keywords.add(keyword);
        // Thêm từ đồng nghĩa
        if (keyword === "tẩy trang") keywords.add("cleanser");
        if (keyword === "kem dưỡng") keywords.add("moisturizer");
        if (keyword === "chống nắng") keywords.add("sunscreen");
      }
    }

    return Array.from(keywords);
  }

  /**
   * Tính điểm tương đồng giữa 2 sản phẩm
   */
  private calculateSimilarityScore(product1: any, product2: any): number {
    let score = 0;

    // Cùng category: +0.5
    if (product1.category === product2.category) score += 0.5;

    // Tên có từ khóa chung: +0.3
    const name1Words = product1.name?.toLowerCase()?.split(/\s+/) || [];
    const name2Words = product2.name?.toLowerCase()?.split(/\s+/) || [];
    const commonWords = name1Words.filter((word: string) =>
      name2Words.includes(word)
    );
    if (commonWords.length > 0) score += 0.3;

    // Giá cả tương đương (trong vòng 50%): +0.2
    const price1 = parseInt(
      product1.price?.toString().replace(/\D/g, "") || "0"
    );
    const price2 = parseInt(
      product2.price?.toString().replace(/\D/g, "") || "0"
    );
    if (price1 > 0 && price2 > 0) {
      const priceDiff = Math.abs(price1 - price2) / Math.max(price1, price2);
      if (priceDiff <= 0.5) score += 0.2;
    }

    return score;
  }

  /**
   * Tạo lý do đề xuất dựa trên sản phẩm đã mua
   */
  private generatePurchaseBasedReason(
    purchasedProduct: any,
    recommendedProduct: any
  ): string {
    const purchasedName = purchasedProduct?.name?.toLowerCase() || "";
    const recommendedName = recommendedProduct?.name?.toLowerCase() || "";

    // Cùng loại sản phẩm
    if (
      purchasedName.includes("tẩy trang") &&
      recommendedName.includes("tẩy trang")
    ) {
      return `Tẩy trang khác phù hợp với routine của bạn`;
    }

    if (purchasedName.includes("serum") && recommendedName.includes("serum")) {
      return `Serum bổ sung cho skincare routine`;
    }

    if (
      purchasedName.includes("kem dưỡng") &&
      recommendedName.includes("kem dưỡng")
    ) {
      return `Kem dưỡng thay thế hoặc dùng luân phiên`;
    }

    if (purchasedName.includes("son") && recommendedName.includes("son")) {
      return `Màu son mới để thay đổi phong cách`;
    }

    // Sản phẩm bổ sung
    if (
      purchasedName.includes("tẩy trang") &&
      recommendedName.includes("toner")
    ) {
      return `Toner bổ sung sau bước tẩy trang`;
    }

    if (purchasedName.includes("toner") && recommendedName.includes("serum")) {
      return `Serum sử dụng sau toner để tăng hiệu quả`;
    }

    if (purchasedProduct.category === recommendedProduct.category) {
      return `Cùng danh mục với sản phẩm bạn đã mua`;
    }

    return `Phù hợp với sở thích của bạn`;
  }

  /**
   * Tạo placeholder image thông minh
   */
  private generatePlaceholderImage(productName: string): string {
    const initials = productName?.substring(0, 2).toUpperCase() || "SP";
    return `https://via.placeholder.com/300x300/FF99CC/FFFFFF?text=${encodeURIComponent(
      initials
    )}`;
  }

  /**
   * Lấy URL hình ảnh hợp lệ từ sản phẩm
   * Đảm bảo luôn trả về string hợp lệ, không phải null/undefined
   */
  private getValidImageUrl(product: any): string {
    if (
      product?.image &&
      typeof product.image === "string" &&
      product.image !== "null" &&
      product.image.trim() !== ""
    ) {
      return product.image;
    }
    if (
      product?.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      const firstImage = product.images[0];
      if (
        typeof firstImage === "string" &&
        firstImage !== "null" &&
        firstImage.trim() !== ""
      ) {
        return firstImage;
      }
    }
    return this.generatePlaceholderImage(product?.name || "Product");
  }

  /**
   * Public method để tìm sản phẩm phù hợp (sử dụng trong ChatBot)
   */
  public findMatchingProductsPublic(
    message: string,
    availableProducts: any[]
  ): ProductRecommendation[] {
    return this.findMatchingProducts(message, availableProducts);
  }

  /**
   * Tạo lý do đề xuất sản phẩm thông minh
   */
  private generateReasonForProduct(product: any, userMessage: string): string {
    const lowerMessage = userMessage?.toLowerCase() || "";
    const productName = product.name?.toLowerCase() || "";
    const productCategory = product.category?.toLowerCase() || "";

    // Lý do dựa trên loại sản phẩm và nhu cầu người dùng
    if (
      lowerMessage.includes("da dầu") &&
      (productName.includes("toner") || productName.includes("gel"))
    ) {
      return "Phù hợp cho da dầu, kiểm soát bã nhờn";
    }

    if (
      lowerMessage.includes("da khô") &&
      (productName.includes("kem") || productName.includes("dưỡng"))
    ) {
      return "Cung cấp độ ẩm cho da khô";
    }

    if (
      lowerMessage.includes("mụn") &&
      (productName.includes("trị mụn") || productName.includes("acne"))
    ) {
      return "Hiệu quả trong việc điều trị mụn";
    }

    if (lowerMessage.includes("chống nắng") && productName.includes("spf")) {
      return "Bảo vệ da khỏi tia UV có hại";
    }

    if (lowerMessage.includes("tẩy trang") && productName.includes("tẩy")) {
      return "Làm sạch sâu, loại bỏ makeup hiệu quả";
    }

    if (lowerMessage.includes("serum") && productName.includes("serum")) {
      return "Cung cấp dưỡng chất tập trung";
    }

    if (lowerMessage.includes("dưỡng ẩm") && productName.includes("dưỡng")) {
      return "Cấp ẩm và nuôi dưỡng da";
    }

    // Lý do mặc định dựa trên category
    if (productCategory.includes("skincare")) {
      return "Sản phẩm chăm sóc da chất lượng";
    } else if (productCategory.includes("makeup")) {
      return "Trang điểm tự nhiên, bền màu";
    } else if (productCategory.includes("serum")) {
      return "Tinh chất dưỡng da hiệu quả";
    }

    return "Được nhiều khách hàng tin dùng";
  }

  /**
   * Reset rate limit timer (for new API key)
   */
  resetRateLimit() {
    this.lastRequestTime = 0;
    // console.log("🔄 Rate limit timer reset for new API key");
  }
}

const aiServiceInstance = new AIService();
// Reset rate limit for new API key
aiServiceInstance.resetRateLimit();

export const aiService = aiServiceInstance;
