import { config } from "../config.js";

let tokenCache = null;
let ipnIdCache = null;

function ensurePesapalConfig({ requireIpn = true } = {}) {
  const missing = [];
  if (!config.pesapal.consumerKey) missing.push("PESAPAL_CONSUMER_KEY");
  if (!config.pesapal.consumerSecret) missing.push("PESAPAL_CONSUMER_SECRET");
  if (requireIpn && !config.pesapal.ipnId && !config.pesapal.ipnUrl) missing.push("PESAPAL_IPN_ID or PESAPAL_IPN_URL");
  if (!config.pesapal.callbackUrl) missing.push("PESAPAL_CALLBACK_URL");
  if (missing.length) {
    throw new Error(`Missing Pesapal configuration: ${missing.join(", ")}`);
  }
}

async function pesapalRequest(path, options = {}) {
  const response = await fetch(`${config.pesapal.baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data?.error?.message || data?.message || "Pesapal request failed");
  }
  return data;
}

export async function getPesapalToken() {
  ensurePesapalConfig({ requireIpn: false });
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token;

  const data = await pesapalRequest("/api/Auth/RequestToken", {
    method: "POST",
    body: JSON.stringify({
      consumer_key: config.pesapal.consumerKey,
      consumer_secret: config.pesapal.consumerSecret
    })
  });
  const expiryDate = data.expiryDate ? new Date(data.expiryDate).getTime() : Date.now() + 4 * 60_000;
  tokenCache = { token: data.token, expiresAt: Number.isFinite(expiryDate) ? expiryDate : Date.now() + 4 * 60_000 };
  return data.token;
}

export async function registerPesapalIpn() {
  if (config.pesapal.ipnId) return config.pesapal.ipnId;
  if (ipnIdCache) return ipnIdCache;
  if (!config.pesapal.ipnUrl) {
    throw new Error("PESAPAL_IPN_URL is required when PESAPAL_IPN_ID is not set");
  }

  const token = await getPesapalToken();
  const data = await pesapalRequest("/api/URLSetup/RegisterIPN", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      url: config.pesapal.ipnUrl,
      ipn_notification_type: "POST"
    })
  });
  ipnIdCache = data.ipn_id;
  return ipnIdCache;
}

export async function submitPesapalOrder(order) {
  ensurePesapalConfig();
  const token = await getPesapalToken();
  const notificationId = order.notification_id || await registerPesapalIpn();
  return pesapalRequest("/api/Transactions/SubmitOrderRequest", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...order, notification_id: notificationId })
  });
}

export async function getPesapalTransactionStatus(orderTrackingId) {
  const token = await getPesapalToken();
  const query = new URLSearchParams({ orderTrackingId });
  return pesapalRequest(`/api/Transactions/GetTransactionStatus?${query.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
}
