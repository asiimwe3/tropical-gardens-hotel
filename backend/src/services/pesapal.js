import { config } from "../config.js";

function ensurePesapalConfig() {
  const missing = [];
  if (!config.pesapal.consumerKey) missing.push("PESAPAL_CONSUMER_KEY");
  if (!config.pesapal.consumerSecret) missing.push("PESAPAL_CONSUMER_SECRET");
  if (!config.pesapal.ipnId) missing.push("PESAPAL_IPN_ID");
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
  ensurePesapalConfig();
  const data = await pesapalRequest("/api/Auth/RequestToken", {
    method: "POST",
    body: JSON.stringify({
      consumer_key: config.pesapal.consumerKey,
      consumer_secret: config.pesapal.consumerSecret
    })
  });
  return data.token;
}

export async function submitPesapalOrder(order) {
  const token = await getPesapalToken();
  return pesapalRequest("/api/Transactions/SubmitOrderRequest", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(order)
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
