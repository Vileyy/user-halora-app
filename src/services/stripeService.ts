import { StripeProvider, useStripe } from "@stripe/stripe-react-native";

// Stripe configuration
export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_BACKEND_URL =
  process.env.EXPO_PUBLIC_STRIPE_BACKEND_URL ||
  "https://halora-stripe-server.vercel.app/create-payment-intent";

const STRIPE_CURRENCY = (
  process.env.EXPO_PUBLIC_STRIPE_CURRENCY || "usd"
).toLowerCase();

// Zero-decimal currencies list based on Stripe docs
// https://stripe.com/docs/currencies#zero-decimal
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

function toStripeAmount(amount: number, currency: string): number {
  // amount is in major units from UI (e.g., 10.00 USD, 100,000 VND)
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100); // convert to minor units
}

// Stripe service functions
export const stripeService = {
  // Tạo PaymentIntent từ backend
  async createPaymentIntent(amount: number): Promise<string> {
    try {
      const payload = {
        amount: toStripeAmount(amount, STRIPE_CURRENCY),
        currency: STRIPE_CURRENCY,
      } as const;

      const response = await fetch(`${STRIPE_BACKEND_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to surface server error details to help debugging
        let serverMessage = "";
        try {
          const text = await response.text();
          serverMessage = text;
        } catch {}
        const msg = `Failed to create payment intent (status ${
          response.status
        })${serverMessage ? `: ${serverMessage}` : ""}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const clientSecret = data?.clientSecret || data?.client_secret;
      if (!clientSecret) {
        throw new Error(
          "Payment intent created but clientSecret missing in response"
        );
      }
      return clientSecret as string;
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
