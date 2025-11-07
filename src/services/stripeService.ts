import { StripeProvider, useStripe } from "@stripe/stripe-react-native";

// Stripe configuration
export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_BACKEND_URL =
  "https://halora-stripe-server.vercel.app/create-payment-intent";

// Exchange rate: 1 USD = 26,000 VNĐ
const USD_TO_VND_RATE = 26000;

// Stripe maximum amount: $999,999.99 = 99,999,999 cents
const STRIPE_MAX_AMOUNT_USD = 999999.99;
const STRIPE_MAX_AMOUNT_CENTS = 99999999;

// Stripe service functions
export const stripeService = {
  // Convert VNĐ to USD
  convertVNDToUSD(vndAmount: number): number {
    return vndAmount / USD_TO_VND_RATE;
  },

  // Validate amount before creating payment intent
  validateAmount(vndAmount: number): { isValid: boolean; error?: string } {
    if (vndAmount <= 0) {
      return {
        isValid: false,
        error: "Số tiền phải lớn hơn 0",
      };
    }

    const usdAmount = this.convertVNDToUSD(vndAmount);
    if (usdAmount > STRIPE_MAX_AMOUNT_USD) {
      return {
        isValid: false,
        error: `Số tiền quá lớn. Stripe chỉ hỗ trợ tối đa $${STRIPE_MAX_AMOUNT_USD.toLocaleString()} USD (khoảng ${(
          STRIPE_MAX_AMOUNT_USD * USD_TO_VND_RATE
        ).toLocaleString()}₫)`,
      };
    }

    return { isValid: true };
  },

  // Tạo PaymentIntent từ backend
  async createPaymentIntent(amount: number): Promise<string> {
    const TIMEOUT_MS = 30000; // 30 seconds timeout

    try {
      // Validate amount first
      const validation = this.validateAmount(amount);
      if (!validation.isValid) {
        throw new Error(validation.error || "Số tiền không hợp lệ");
      }

      // Convert VNĐ to USD, then to cents
      const usdAmount = this.convertVNDToUSD(amount);
      const amountInCents = Math.round(usdAmount * 100);

      // Double check: ensure amount doesn't exceed Stripe limit
      if (amountInCents > STRIPE_MAX_AMOUNT_CENTS) {
        throw new Error(
          `Số tiền vượt quá giới hạn của Stripe. Tối đa: $${STRIPE_MAX_AMOUNT_USD.toLocaleString()} USD`
        );
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${STRIPE_BACKEND_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInCents, // Amount in cents (USD)
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to create payment intent";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }

      const data = await response.json();

      if (!data.clientSecret) {
        throw new Error("Invalid response from server: missing clientSecret");
      }

      return data.clientSecret;
    } catch (error: any) {
      // Handle different types of errors
      if (error.name === "AbortError" || error.message?.includes("timeout")) {
        throw new Error(
          "Kết nối quá lâu. Vui lòng kiểm tra kết nối mạng và thử lại."
        );
      } else if (error.message?.includes("Network request failed")) {
        throw new Error(
          "Không có kết nối mạng. Vui lòng kiểm tra kết nối internet."
        );
      } else if (error.message?.includes("Failed to connect")) {
        throw new Error("Không thể kết nối đến server. Vui lòng thử lại sau.");
      } else {
        // If error already has a message, use it; otherwise use generic message
        throw error.message
          ? error
          : new Error("Không thể tạo payment intent. Vui lòng thử lại.");
      }
    }
  },

  // Xử lý thanh toán
  async processPayment(clientSecret: string): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      return false;
    }
  },
};

export default stripeService;
