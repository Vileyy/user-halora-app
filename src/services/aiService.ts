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
  openai: {
    baseURL: "https://api.openai.com/v1",
    model: "gpt-3.5-turbo",
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  },
  // Gemini API
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
          throw new Error("API failed, using offline advice");
        }
      }
    } catch (error) {
      console.error("AI Service Error:", error);
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
    },
    existingRecommendations: string[] = []
  ): Promise<ProductRecommendation[]> {
    try {
      // Wait for rate limit
      await this.waitForRateLimit();

      // Lọc bỏ sản phẩm đã được đề xuất và đã mua
      const excludedIds = new Set([
        ...existingRecommendations,
        ...(userBehavior.purchaseHistory || []),
        ...(userBehavior.viewedProducts || []).slice(0, 3), 
      ]);

      const availableProducts = currentProducts.filter(
        (product) => !excludedIds.has(product.id)
      );

      // console.log("🔍 Generating recommendations:", {
      //   totalProducts: currentProducts.length,
      //   availableAfterFilter: availableProducts.length,
      //   excludedCount: excludedIds.size,
      //   purchaseHistory: userBehavior.purchaseHistory?.slice(0, 3),
      // });

      // Tạo recommendations dựa trên lịch sử mua hàng
      let recommendations = this.getRecommendationsBasedOnPurchaseHistory(
        availableProducts,
        userBehavior.purchaseHistory || []
      );

      // Nếu không đủ từ purchase history, thêm từ viewed products
      if (recommendations.length < 5) {
        const viewedBasedRecs = this.getRecommendationsBasedOnViewed(
          availableProducts,
          userBehavior.viewedProducts || [],
          recommendations.map((r) => r.id)
        );
        recommendations = [...recommendations, ...viewedBasedRecs];
      }

      // Nếu vẫn không đủ, dùng AI hoặc fallback
      if (recommendations.length < 5) {
        const prompt = this.buildRecommendationPrompt(
          availableProducts,
          userBehavior
        );

        if (this.currentProvider === "openai") {
          const response = await this.callOpenAI(prompt);
          const aiRecs = this.parseRecommendations(
            response.advice,
            availableProducts
          );
          recommendations = [...recommendations, ...aiRecs];
        } else {
          const response = await this.callGemini(prompt);
          if (response) {
            const aiRecs = this.parseRecommendations(
              response.advice,
              availableProducts
            );
            recommendations = [...recommendations, ...aiRecs];
          } else {
            const fallbackRecs =
              this.getFallbackRecommendations(availableProducts);
            recommendations = [...recommendations, ...fallbackRecs];
          }
        }
      }

      // Nếu vẫn chưa có gì (user mới hoàn toàn), tạo popular recommendations
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
      return uniqueRecommendations.slice(0, 5);
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
    const normalized = searchTerm.toLowerCase();
    let found = products.find((p) => p.name.toLowerCase().includes(normalized));
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
          image:
            selectedProduct.image ||
            selectedProduct.images?.[0] ||
            this.generatePlaceholderImage(selectedProduct.name),
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
          image:
            product.image ||
            product.images?.[0] ||
            this.generatePlaceholderImage(product.name),
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
      price: this.getFirstVariantPrice(product),
      image:
        product.image ||
        product.images?.[0] ||
        `https://via.placeholder.com/300x300/FF99CC/FFFFFF?text=${encodeURIComponent(
          product.name?.substring(0, 2) || "SP"
        )}`,
      description: product.description || "",
      category: product.category || "",
      reason: this.generateReasonForProduct(product, message),
      confidence: 0.9,
    }));
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
        image:
          product.image ||
          product.images?.[0] ||
          this.generatePlaceholderImage(product.name),
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
    const nameWords = name.split(/\s+/).map((w) => w.toLowerCase());

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
    const name1Words = product1.name?.toLowerCase().split(/\s+/) || [];
    const name2Words = product2.name?.toLowerCase().split(/\s+/) || [];
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
    const purchasedName = purchasedProduct.name?.toLowerCase() || "";
    const recommendedName = recommendedProduct.name?.toLowerCase() || "";

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
   * Tạo lý do đề xuất sản phẩm thông minh
   */
  private generateReasonForProduct(product: any, userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
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
