# Stripe backend guide

Your app calls an HTTP endpoint to create a PaymentIntent. If this endpoint fails (non-2xx), the app shows "Failed to create payment intent".

This project now reads the endpoint from `EXPO_PUBLIC_STRIPE_BACKEND_URL` and sends:

- amount: number (minor units for most currencies, but major units for zero-decimal like VND)
- currency: string (defaults from `EXPO_PUBLIC_STRIPE_CURRENCY`)

The client has logic to handle zero-decimal currencies (including VND), so you can safely keep amounts in VND without multiplying by 100.

## Minimal Node/Express endpoint

Install `stripe` with your STRIPE_SECRET_KEY set in server env. Example:

```ts
import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency } = req.body; // amount already in correct units from client
    if (!amount || !currency) {
      return res.status(400).json({ error: "Missing amount or currency" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      // optional: metadata, automatic_payment_methods, etc.
      automatic_payment_methods: { enabled: true },
    });

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (e: any) {
    console.error("Stripe PI error:", e?.message || e);
    return res.status(500).send(e?.message || "Server error");
  }
});

export default app;
```

For Vercel, export a default handler from `api/create-payment-intent.ts` with the same logic. Ensure you set `STRIPE_SECRET_KEY` in the platform environment variables.

## Common pitfalls

- Wrong amount units: backend multiplies by 100 while client already sent minor units. Fix by trusting the client units or negotiate a single source of truth.
- Missing currency: Stripe requires a currency. The client now sends `currency` in the body.
- CORS or wrong path: Confirm `EXPO_PUBLIC_STRIPE_BACKEND_URL` matches your deployed route.
- Using PaymentSheet with customerId without ephemeral key: remove `customerId` unless backend returns ephemeral keys.

## Env in this app

- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_STRIPE_BACKEND_URL`
- `EXPO_PUBLIC_STRIPE_CURRENCY` (default `usd`, set to `vnd` for Vietnam)

After changing `.env`, restart Expo for variables to take effect.
