import dotenv from "dotenv";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  corsOrigins: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  pesapal: {
    baseUrl: process.env.PESAPAL_BASE_URL || "https://pay.pesapal.com/v3",
    consumerKey: process.env.PESAPAL_CONSUMER_KEY,
    consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
    ipnId: process.env.PESAPAL_IPN_ID,
    ipnUrl: process.env.PESAPAL_IPN_URL,
    callbackUrl: process.env.PESAPAL_CALLBACK_URL,
    cancellationUrl: process.env.PESAPAL_CANCELLATION_URL
  },
  paymentSuccessUrl: process.env.PAYMENT_SUCCESS_URL
};

if (!config.databaseUrl) throw new Error("DATABASE_URL is required");
if (!config.jwtSecret) throw new Error("JWT_SECRET is required");
