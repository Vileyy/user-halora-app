import { StripeProvider, useStripe } from "@stripe/stripe-react-native";

// Stripe configuration
export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_BACKEND_URL = "https://halora-stripe-server.vercel.app/create-payment-intent"; 

// Stripe service functions
export const stripeService = {
  // Tạo PaymentIntent từ backend
  async createPaymentIntent(amount: number): Promise<string> {
    try {
      const response = await fetch(
        `${STRIPE_BACKEND_URL}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const data = await response.json();
      return data.clientSecret;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  },

  // Xử lý thanh toán
  async processPayment(clientSecret: string): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error("Error processing payment:", error);
      return false;
    }
  },
};

export default stripeService;
