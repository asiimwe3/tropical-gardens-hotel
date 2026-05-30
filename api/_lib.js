const { Pool } = require("pg");

const config = {
  supabaseUrl: process.env.TGH_SUPABASE_URL || "https://eiyexnuhqdscomilwpqg.supabase.co",
  supabaseAnonKey: process.env.TGH_SUPABASE_ANON_KEY || "sb_publishable_S1u_aPqq2USyJcKpeisOlQ_TMzbHxtX",
  databaseUrl: process.env.DATABASE_URL,
  pesapalBaseUrl: process.env.PESAPAL_BASE_URL || "https://pay.pesapal.com/v3",
  pesapalConsumerKey: process.env.PESAPAL_CONSUMER_KEY,
  pesapalConsumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  pesapalIpnId: process.env.PESAPAL_IPN_ID,
  pesapalIpnUrl: process.env.PESAPAL_IPN_URL || "https://tropicalgardenshotelkyenjojo.com/api/payments/pesapal/ipn",
  pesapalCallbackUrl: process.env.PESAPAL_CALLBACK_URL || "https://tropicalgardenshotelkyenjojo.com/api/payments/pesapal/callback",
  pesapalCancellationUrl: process.env.PESAPAL_CANCELLATION_URL || "https://tropicalgardenshotelkyenjojo.com/payment-cancelled.html",
  paymentSuccessUrl: process.env.PAYMENT_SUCCESS_URL || "https://tropicalgardenshotelkyenjojo.com/payment-success.html"
};

let pool;
let pesapalToken;
let pesapalIpnIdCache;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function method(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    res.setHeader("Allow", allowed.join(", "));
    send(res, 405, { error: "Method not allowed" });
    return false;
  }
  return true;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function db() {
  if (!config.databaseUrl) throw new Error("DATABASE_URL is not configured");
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 1
    });
  }
  return pool;
}

async function query(sql, params = []) {
  return db().query(sql, params);
}

async function supabaseRequest(resource, options = {}) {
  const response = await fetch(`${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/${resource}`, {
    method: options.method || "GET",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=minimal"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || "Supabase request failed");
  return data;
}

function merchantReference() {
  return `TGH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function pesapalRequest(path, options = {}) {
  const response = await fetch(`${config.pesapalBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data?.error?.message || data?.message || "Pesapal request failed");
  return data;
}

async function getPesapalToken() {
  if (!config.pesapalConsumerKey || !config.pesapalConsumerSecret) {
    throw new Error("Pesapal credentials are not configured");
  }
  if (pesapalToken && pesapalToken.expiresAt > Date.now() + 30000) return pesapalToken.token;
  const data = await pesapalRequest("/api/Auth/RequestToken", {
    method: "POST",
    body: JSON.stringify({
      consumer_key: config.pesapalConsumerKey,
      consumer_secret: config.pesapalConsumerSecret
    })
  });
  const expiresAt = data.expiryDate ? new Date(data.expiryDate).getTime() : Date.now() + 240000;
  pesapalToken = { token: data.token, expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 240000 };
  return pesapalToken.token;
}

async function getPesapalIpnId() {
  if (config.pesapalIpnId) return config.pesapalIpnId;
  if (pesapalIpnIdCache) return pesapalIpnIdCache;
  const token = await getPesapalToken();
  const data = await pesapalRequest("/api/URLSetup/RegisterIPN", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      url: config.pesapalIpnUrl,
      ipn_notification_type: "POST"
    })
  });
  pesapalIpnIdCache = data.ipn_id;
  return pesapalIpnIdCache;
}

async function submitPesapalOrder(order) {
  const token = await getPesapalToken();
  const notificationId = order.notification_id || await getPesapalIpnId();
  return pesapalRequest("/api/Transactions/SubmitOrderRequest", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...order, notification_id: notificationId })
  });
}

async function getPesapalTransactionStatus(orderTrackingId) {
  const token = await getPesapalToken();
  const qs = new URLSearchParams({ orderTrackingId });
  return pesapalRequest(`/api/Transactions/GetTransactionStatus?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function syncPayment(orderTrackingId, merchantReferenceValue) {
  const status = await getPesapalTransactionStatus(orderTrackingId);
  const paymentStatus = String(status.payment_status_description || status.status || "UNKNOWN").toUpperCase();
  const paid = ["COMPLETED", "PAID"].includes(paymentStatus);
  const result = await query(
    `update payments
     set status = $1,
         payment_method = $2,
         payment_account = $3,
         confirmation_code = $4,
         raw_status = $5::jsonb,
         paid_at = case when $6 then coalesce(paid_at, now()) else paid_at end,
         updated_at = now()
     where provider_tracking_id = $7 or merchant_reference = $8
     returning *`,
    [
      paymentStatus,
      status.payment_method || null,
      status.payment_account || null,
      status.confirmation_code || null,
      JSON.stringify(status),
      paid,
      orderTrackingId,
      merchantReferenceValue
    ]
  );
  const payment = result.rows[0];
  if (payment?.reservation_id && paid) {
    await query(
      `update reservations
       set payment_status = 'Paid', amount_paid = $1, payment_reference = $2, updated_at = now()
       where id = $3`,
      [payment.amount, payment.confirmation_code || payment.provider_tracking_id, payment.reservation_id]
    );
  }
  return { payment, status };
}

module.exports = {
  config,
  send,
  method,
  readBody,
  query,
  supabaseRequest,
  merchantReference,
  submitPesapalOrder,
  syncPayment
};
